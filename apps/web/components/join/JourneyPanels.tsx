"use client";

import clsx from "clsx";
import { Armchair, ArrowLeftRight, BusFront, LogOut, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/Button";
import type { PhoneJourney } from "@/lib/join";

/** Who is ahead, how many wait for the route, and when HQ sends a bus. */
export function LineInfo({
  journey,
  destName,
  rule,
}: {
  journey: PhoneJourney;
  destName: string;
  /** The dispatch thresholds, from join_status. */
  rule: { releaseLoadPct: number; maxWaitMinutes: number } | null;
}) {
  if (journey.ahead === null) return null;
  return (
    <section aria-labelledby="line-title" className="rounded-card border border-line bg-surface p-5">
      <h2 id="line-title" className="flex items-center gap-2 text-lg">
        <Users aria-hidden className="h-5 w-5 text-muted" />
        The line here
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-muted">Ahead of you</dt>
          <dd className="num text-[32px] font-bold leading-tight">{journey.ahead}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Waiting for {destName}</dt>
          <dd className="num text-[32px] font-bold leading-tight">{journey.waitingHere}</dd>
        </div>
      </dl>
      {!journey.bus && rule ? (
        <p className="mt-3 text-sm text-muted">
          HQ sends a bus when the line fills <span className="num">{rule.releaseLoadPct}%</span> of one, or when someone
          has waited <span className="num">{rule.maxWaitMinutes}</span>{" "}
          {rule.maxWaitMinutes === 1 ? "minute" : "minutes"}.
        </p>
      ) : null}
    </section>
  );
}

/**
 * The route as a list, terminal at the top and this stop at the bottom, with the bus
 * between the last stop it passed and the next one.
 */
export function BusTracker({ journey, color }: { journey: PhoneJourney; color: string }) {
  const { bus, route, progress } = journey;
  if (!bus) return null;
  const stops = route?.stops ?? [];
  const last = progress?.lastIndex ?? null;

  return (
    <section aria-labelledby="tracker-title" className="rounded-card border border-line bg-surface p-5">
      <h2 id="tracker-title" className="flex items-center gap-2 text-lg">
        <BusFront aria-hidden className="h-5 w-5 text-muted" />
        Your bus
      </h2>
      <p key={journey.line ?? bus.id} className="animate-tick mt-2 font-semibold" aria-live="polite">
        {journey.boarding ? `Bus ${bus.id} is at the stop` : (journey.line ?? `Bus ${bus.id} is on the way`)}
      </p>
      {journey.places ? (
        <p className="mt-1 flex items-center gap-2 text-muted">
          <Armchair aria-hidden className="h-4 w-4" />
          {journey.places}
        </p>
      ) : null}

      {stops.length > 0 ? (
        <ol className="mt-4" aria-label="Stops on the route">
          {stops.map((stop, i) => {
            const passed = last !== null && i <= last;
            const here = i === stops.length - 1;
            return (
              <li key={stop.id}>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={clsx("h-4 w-4 shrink-0 rounded-full border-[3px]", here && "h-5 w-5 border-ink")}
                    style={{
                      borderColor: here ? undefined : color,
                      backgroundColor: passed && !here ? color : undefined,
                    }}
                  />
                  <span className={clsx("py-1", here ? "font-semibold" : passed ? "text-muted" : undefined)}>
                    {here ? `You · ${stop.name}` : stop.name}
                  </span>
                </div>
                {/* The bus sits on the leg after the last stop it passed. */}
                {i === last && !here ? (
                  <div
                    className="ml-[5px] flex items-center gap-3 border-l-[3px] py-1.5 pl-4"
                    style={{ borderColor: color }}
                  >
                    <span
                      className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-sm font-semibold text-white"
                      style={{ backgroundColor: color }}
                    >
                      <BusFront aria-hidden className="h-4 w-4" />
                      <span className="num">{bus.id}</span>
                    </span>
                  </div>
                ) : i < stops.length - 1 ? (
                  <div
                    aria-hidden
                    className="ml-[5px] h-3 border-l-[3px]"
                    style={{ borderColor: passed ? color : "var(--line)" }}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}

/** The cancel reason for "Change my stop" (one of the kiosk's cancel_reasons). */
export const CHANGE_STOP_REASON = "changed_destination";

/** "Change my stop" (one tap), or "Leave the line" with a reason; either gives up the place. */
export function LeaveLine({
  reasons,
  onLeave,
}: {
  reasons: readonly { code: string; label: string }[];
  onLeave: (reason: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    const canChange = reasons.some((r) => r.code === CHANGE_STOP_REASON);
    return (
      <div className="mt-2 grid gap-1">
        {canChange ? (
          <Button
            variant="quiet"
            size="lg"
            className="w-full"
            pending={pending === CHANGE_STOP_REASON}
            pendingLabel="Changing…"
            onClick={async () => {
              setPending(CHANGE_STOP_REASON);
              setError(null);
              const message = await onLeave(CHANGE_STOP_REASON);
              setPending(null);
              if (message) setError(message);
            }}
            icon={<ArrowLeftRight aria-hidden className="h-5 w-5" />}
          >
            Change my stop
          </Button>
        ) : null}
        <Button
          variant="quiet"
          size="lg"
          className="w-full"
          disabled={pending !== null}
          onClick={() => setOpen(true)}
          icon={<LogOut aria-hidden className="h-5 w-5" />}
        >
          Leave the line
        </Button>
        {error ? (
          <p role="alert" className="font-semibold text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section aria-labelledby="leave-title" className="mt-4 rounded-card border border-line bg-surface p-5">
      <h2 id="leave-title" className="text-lg">
        Why are you leaving?
      </h2>
      <p className="mt-1 text-sm text-muted">It helps HQ see why people give up waiting.</p>
      <ul className="mt-3 grid gap-2">
        {reasons.map((r) => (
          <li key={r.code}>
            <button
              type="button"
              disabled={pending !== null}
              aria-busy={pending === r.code}
              onClick={async () => {
                setPending(r.code);
                setError(null);
                const message = await onLeave(r.code);
                setPending(null);
                if (message) setError(message);
              }}
              className="flex min-h-14 w-full items-center justify-between rounded-card border border-line px-4 text-left transition-colors duration-200 ease-out hover:border-ink disabled:opacity-60"
            >
              {r.label}
              {pending === r.code ? <span className="text-sm text-muted">Leaving…</span> : null}
            </button>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="mt-2 font-semibold text-danger">
          {error}
        </p>
      ) : null}
      <Button
        variant="secondary"
        size="lg"
        className="mt-3 w-full"
        onClick={() => setOpen(false)}
        disabled={pending !== null}
      >
        Keep my place
      </Button>
    </section>
  );
}
