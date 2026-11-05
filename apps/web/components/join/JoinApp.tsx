"use client";

import clsx from "clsx";
import { BusFront, CheckCircle2, Clock3, MapPin, Volume2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { HomeLink } from "@/components/HomeLink";
import { KigaliClock } from "@/components/KigaliClock";
import { RouteBadge } from "@/components/RouteBadge";
import { boardingAnnouncement, ticketAnnouncement } from "@/lib/announce";
import { DESTINATIONS, getDestination } from "@/lib/destinations";
import {
  deviceId,
  JOIN_REFUSED,
  parseCancelResult,
  parseJoinResult,
  parseJoinStatus,
  matchTicket,
  phoneJourney,
  readSavedTicket,
  saveTicket,
  type JoinStatus,
  type SavedTicket,
} from "@/lib/join";
import { queuePosition, ticketStatus, type TicketStatus } from "@/lib/queue";
import { BusTracker, CHANGE_STOP_REASON, LeaveLine, LineInfo } from "./JourneyPanels";
import { getSupabase, SUPABASE_CONFIG_ERROR } from "@/lib/supabase";
import { useLiveBoard } from "@/lib/use-live-board";

const STATUS_REFRESH_MS = 5_000;

/** Speaks with the phone's built-in voice; silently does nothing where that isn't available. */
function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

/** Phones only let a page talk after a tap: an empty line during the tap unlocks the voice. */
function unlockSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
  }
}

/** Open or closed, how many joined, and the leave reasons; refreshed every few seconds. */
function useJoinStatus(active: boolean): {
  status: JoinStatus | null;
  error: string | null;
} {
  const [state, setState] = useState<{
    status: JoinStatus | null;
    error: string | null;
  }>({
    status: null,
    error: SUPABASE_CONFIG_ERROR,
  });

  useEffect(() => {
    if (!active || SUPABASE_CONFIG_ERROR) return;
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      const { data, error } = await getSupabase().rpc("join_status");
      if (!live) return;
      setState(error ? (s) => ({ ...s, error: error.message }) : { status: parseJoinStatus(data), error: null });
      timer = setTimeout(load, STATUS_REFRESH_MS);
    };
    void load();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [active]);

  return state;
}

/** Audience page: pick where you're going, get a real ticket in the kiosk's line. No sign-in. */
export function JoinApp() {
  const [ticket, setTicket] = useState<SavedTicket | null>(null);
  const [restored, setRestored] = useState(false);
  const [position, setPosition] = useState<number | undefined>(undefined);
  const [pending, setPending] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [left, setLeft] = useState<string | null>(null);
  const { status, error } = useJoinStatus(restored);

  useEffect(() => {
    const restore = () => {
      setTicket(readSavedTicket());
      setRestored(true);
    };
    restore();
  }, []);

  const join = async (code: string) => {
    if (pending) return;
    unlockSpeech();
    setPending(code);
    setRefusal(null);
    setLeft(null);
    const { data, error: err } = await getSupabase().rpc("join_from_phone", {
      p_dest: code,
      p_device: deviceId(),
    });
    setPending(null);
    if (err) {
      setRefusal(err.message);
      return;
    }
    const result = parseJoinResult(data);
    if (result.status === "created" || result.status === "duplicate") {
      const saved = { code: result.code, destination: result.destination };
      saveTicket(saved);
      setTicket(saved);
      setPosition(result.status === "created" ? result.position : undefined);
      speak(ticketAnnouncement(result.code, getDestination(result.destination)?.name ?? result.destination));
    } else {
      setRefusal(result.status === "error" ? result.message : JOIN_REFUSED[result.status]);
    }
  };

  const startOver = () => {
    saveTicket(null);
    setTicket(null);
    setPosition(undefined);
  };

  /** Gives up the place; returns an error message, or null when done. */
  const leave = async (reason: string): Promise<string | null> => {
    if (!ticket) return null;
    const { data, error: err } = await getSupabase().rpc("cancel_from_phone", {
      p_device: deviceId(),
      p_reason: reason,
    });
    if (err) return err.message;
    const result = parseCancelResult(data);
    if (result.status === "error") return result.message;
    startOver();
    setLeft(
      result.status !== "cancelled"
        ? `${ticket.code} is no longer in the line.`
        : reason === CHANGE_STOP_REASON
          ? `${ticket.code} is cancelled. Pick your new stop.`
          : `You left the line. ${ticket.code} is cancelled.`,
    );
    return null;
  };

  /** Remember when the ticket was made, the first time it shows on the board (see matchTicket). */
  const pin = useCallback(
    (createdAt: string) => {
      if (!ticket || ticket.createdAt) return;
      const pinned = { ...ticket, createdAt };
      saveTicket(pinned);
      setTicket(pinned);
    },
    [ticket],
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-10">
      <header className="flex h-16 items-center justify-between border-b border-line">
        <HomeLink />
        <KigaliClock className="text-xl font-medium" />
      </header>

      <main className="flex-1 pt-6">
        {error ? (
          <Banner tone="danger" title="Can't reach Tap&Select" className="mb-4">
            {error}
          </Banner>
        ) : null}

        {!restored ? null : ticket ? (
          <PhoneTicket
            ticket={ticket}
            position={position}
            reasons={status?.cancelReasons ?? []}
            rule={status}
            onLeave={leave}
            onPin={pin}
            onStartOver={startOver}
          />
        ) : (
          <>
            <h1 className="text-[32px] leading-tight">Join the line</h1>
            <p className="mt-2 text-lg text-muted">
              Where are you going? Tap a stop and you&apos;ll get a real ticket at Kiosk 1. Watch the big screen.
            </p>

            {left ? (
              <Banner tone="info" title={left} className="mt-5">
                Changed your mind? Pick a stop to join again.
              </Banner>
            ) : null}
            {status && !status.open ? (
              <Banner tone="info" title="Joining is closed right now" className="mt-5">
                It opens during the demo. This page updates by itself.
              </Banner>
            ) : null}
            {refusal ? (
              <p role="alert" className="mt-4 font-semibold text-danger">
                {refusal}
              </p>
            ) : null}

            <ul className="mt-5 grid gap-3">
              {DESTINATIONS.map((d) => (
                <li key={d.code}>
                  <button
                    type="button"
                    onClick={() => void join(d.code)}
                    disabled={!status?.open || pending !== null}
                    aria-busy={pending === d.code}
                    className="flex min-h-[72px] w-full items-center gap-4 rounded-card border border-line bg-surface px-4 text-left transition-colors duration-200 ease-out hover:border-ink disabled:opacity-50"
                  >
                    <RouteBadge code={d.code} size="md" />
                    <span className="flex-1 font-display text-[24px] font-semibold">{d.name}</span>
                    {pending === d.code ? <span className="text-sm font-semibold text-muted">Joining…</span> : null}
                  </button>
                </li>
              ))}
            </ul>

            {status ? (
              <p className="mt-5 text-muted">
                <span className="num font-semibold text-ink">{status.joined}</span>{" "}
                {status.joined === 1 ? "person has" : "people have"} joined from their phones today.
              </p>
            ) : null}
            <p className="mt-6 text-sm text-muted">
              No sign-in. One ticket per phone. Just want to watch?{" "}
              <Link href="/live" className="font-semibold text-ink underline underline-offset-4">
                Live board
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}

const STATUS_ICON = {
  waiting: Clock3,
  on_the_way: BusFront,
  called: MapPin,
  not_called: Clock3,
  done: CheckCircle2,
} as const;

/** The phone's ticket, following the public board every few seconds. */
function PhoneTicket({
  ticket,
  position: joinedPosition,
  reasons,
  rule,
  onLeave,
  onPin,
  onStartOver,
}: {
  ticket: SavedTicket;
  position: number | undefined;
  reasons: readonly { code: string; label: string }[];
  rule: JoinStatus | null;
  onLeave: (reason: string) => Promise<string | null>;
  onPin: (createdAt: string) => void;
  onStartOver: () => void;
}) {
  const { board } = useLiveBoard();
  const dest = getDestination(ticket.destination);
  const destName = dest?.name ?? ticket.destination;
  const row = board ? matchTicket(board.tokens, ticket) : undefined;
  const position = row ? queuePosition(board?.tokens ?? [], row) : null;
  const status: TicketStatus = ticketStatus(row, ticket.destination, board?.buses ?? [], position);
  const journey = phoneJourney(ticket, board);

  // Not on the board: the trip ended, the ticket was cancelled, or HQ reset the demo. The first
  // board load comes after the ticket was made, so a fresh ticket is always on it.
  const gone = board !== null && !row;
  const createdAt = row?.created_at ?? null;
  useEffect(() => {
    if (createdAt) onPin(createdAt);
  }, [createdAt, onPin]);

  // The bus is here: vibrate and say so, once per bus.
  const announced = useRef<string | null>(null);
  const calledBus = status.kind === "called" ? status.busId : null;
  useEffect(() => {
    if (!calledBus || announced.current === calledBus) return;
    announced.current = calledBus;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([300, 150, 300]);
    speak(boardingAnnouncement(calledBus, destName, ticket.code, ticket.code));
  }, [calledBus, destName, ticket.code]);

  const hear = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    speak(
      calledBus
        ? boardingAnnouncement(calledBus, destName, ticket.code, ticket.code)
        : ticketAnnouncement(ticket.code, destName),
    );
  }, [calledBus, destName, ticket.code]);

  const Icon = STATUS_ICON[status.kind];
  const shownPosition = position ?? joinedPosition;

  return (
    <>
      {calledBus ? (
        <div role="alert" className="mb-4 rounded-card bg-accent p-5 text-white">
          <p className="font-display text-[32px] font-bold leading-tight">Your bus is here</p>
          <p className="num mt-1 text-xl">Bus {calledBus} · please board</p>
        </div>
      ) : null}

      <article
        aria-label={`Ticket ${ticket.code} to ${destName}`}
        className="overflow-hidden rounded-card border border-line bg-surface"
      >
        <div aria-hidden className="h-4" style={{ backgroundColor: dest?.color ?? "var(--ink)" }} />
        <div className="px-6 py-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Your number</p>
          <p className="num mt-1 text-[64px] font-bold leading-none tracking-tight">{ticket.code}</p>
          <div className="mt-4 flex items-center gap-3">
            <RouteBadge code={ticket.destination} size="md" />
            <div>
              <p className="font-display text-[24px] font-semibold leading-tight">{destName}</p>
              {shownPosition && !gone && status.kind !== "called" ? (
                <p className="text-muted">
                  No. <span className="num font-medium text-ink">{shownPosition}</span> in the line
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Perforation: a dashed rule with a notch cut from each side. */}
        <div aria-hidden className="relative h-0 border-t-2 border-dashed border-line">
          <span className="absolute -top-4 -left-4 h-8 w-8 rounded-full border border-line bg-paper" />
          <span className="absolute -top-4 -right-4 h-8 w-8 rounded-full border border-line bg-paper" />
        </div>

        <div className="px-6 py-5" aria-live="polite">
          {gone ? (
            <p className="font-display text-[22px] font-semibold leading-tight">This ticket is no longer in the line</p>
          ) : (
            <div className="flex items-start gap-3">
              <Icon
                aria-hidden
                className={clsx(
                  "mt-0.5 h-7 w-7 shrink-0",
                  status.kind === "on_the_way" || status.kind === "called" ? "text-accent" : "text-muted",
                )}
              />
              <p
                key={status.line}
                className={clsx(
                  "animate-tick font-display text-[22px] font-semibold leading-tight",
                  status.kind === "called" && "text-accent",
                )}
              >
                {status.line}
              </p>
            </div>
          )}
          <p className="mt-2 text-sm text-muted">Updates by itself every few seconds.</p>
        </div>
      </article>

      {!gone && status.kind !== "called" ? (
        <div className="mt-4 space-y-4">
          <BusTracker journey={journey} color={dest?.color ?? "var(--ink)"} />
          <LineInfo journey={journey} destName={destName} rule={rule} />
        </div>
      ) : null}

      <Button size="lg" className="mt-4 w-full" onClick={hear} icon={<Volume2 aria-hidden className="h-5 w-5" />}>
        Hear it
      </Button>
      <p className="mt-2 text-center text-sm text-muted">Keep this page open to hear when your bus arrives.</p>

      {!gone && journey.ahead !== null && reasons.length > 0 ? <LeaveLine reasons={reasons} onLeave={onLeave} /> : null}

      {gone ? (
        <Button variant="primary" size="lg" className="mt-6 w-full" onClick={onStartOver}>
          Join again
        </Button>
      ) : null}
    </>
  );
}
