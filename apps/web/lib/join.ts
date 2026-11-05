// Audience join (/join): people in the room join the kiosk's line from their phones,
// without signing in. Pure, except the localStorage helpers. The rules live in Postgres
// (join_from_phone): open/closed, one waiting ticket per phone, a daily cap.

import type { Json } from "./database.types";
import { departureStatus, type Bus } from "./departures";
import { getDestination } from "./destinations";
import type { LiveBoard } from "./live-board";
import { freeLabel } from "./occupancy";
import { findTicket, queuePosition, type QueueToken } from "./queue";
import { busProgress, busProgressLine, routeFor, type BusProgress, type Route } from "./routes";

export type JoinResult =
  | { status: "created"; code: string; destination: string; position: number }
  | { status: "duplicate"; code: string; destination: string }
  | { status: "closed" | "full" | "invalid" }
  | { status: "error"; message: string };

export interface JoinStatus {
  open: boolean;
  joined: number;
  /** When HQ releases a bus: this full (% of a bus), or someone waited this long. */
  releaseLoadPct: number;
  maxWaitMinutes: number;
  /** Why someone leaves the line (the kiosk's cancel_reasons), in order. */
  cancelReasons: { code: string; label: string }[];
}

type Obj = { [key: string]: Json | undefined };

const obj = (v: Json | null): Obj | null => (v !== null && typeof v === "object" && !Array.isArray(v) ? v : null);
const str = (o: Obj, k: string): string | null => (typeof o[k] === "string" ? (o[k] as string) : null);

export function parseJoinResult(data: Json | null): JoinResult {
  const o = obj(data);
  const status = o && str(o, "status");
  const code = o && str(o, "code");
  const destination = o && str(o, "destination");
  if (status === "created" && code && destination) {
    return {
      status,
      code,
      destination,
      position: typeof o?.position === "number" ? o.position : 1,
    };
  }
  if (status === "duplicate" && code && destination) return { status, code, destination };
  if (status === "closed" || status === "full" || status === "invalid") return { status };
  return {
    status: "error",
    message: (o && str(o, "message")) ?? "Unexpected response from the server",
  };
}

export function parseJoinStatus(data: Json | null): JoinStatus {
  const o = obj(data);
  const reasons = Array.isArray(o?.cancel_reasons) ? o.cancel_reasons : [];
  return {
    open: o?.open === true,
    joined: typeof o?.joined === "number" ? o.joined : 0,
    releaseLoadPct: typeof o?.release_load_pct === "number" ? o.release_load_pct : 70,
    maxWaitMinutes: typeof o?.max_wait_minutes === "number" ? o.max_wait_minutes : 15,
    cancelReasons: reasons.flatMap((r) => {
      const ro = obj(r);
      const code = ro && str(ro, "code");
      const label = ro && str(ro, "label");
      return code && label ? [{ code, label }] : [];
    }),
  };
}

export type CancelResult = { status: "cancelled" } | { status: "not_found" } | { status: "error"; message: string };

/** cancel_from_phone: "not_found" means the ticket already left the line (boarded or cancelled). */
export function parseCancelResult(data: Json | null): CancelResult {
  const o = obj(data);
  const status = o && str(o, "status");
  if (status === "cancelled" || status === "not_found") return { status };
  return {
    status: "error",
    message: (o && str(o, "message")) ?? "Unexpected response from the server",
  };
}

/** Everything the phone shows about its ticket's journey, from the public board. */
export interface PhoneJourney {
  /** People before you in your route's line here; null once you're not waiting. */
  ahead: number | null;
  /** Everyone waiting for your route at this stop, you included. */
  waitingHere: number;
  /** The bus coming for your route (on the way), or standing at the stop (boarding). */
  bus: Bus | null;
  boarding: boolean;
  /** "32 seats + 38 standing free" on that bus. */
  places: string | null;
  /** Its route and progress, when it is on the way with GPS. */
  route: Route | null;
  progress: BusProgress | null;
  /** "Bus R2-01 · passed Kiyovu · 1 stop away · about 6 min" */
  line: string | null;
}

/**
 * This phone's ticket on the board. Codes restart at 001 after Reset demo (and every day), so
 * once the ticket has been seen its creation time is kept and must match too: a new R2-001
 * belonging to someone else is not ours.
 */
export function matchTicket(tokens: readonly QueueToken[], saved: SavedTicket): QueueToken | undefined {
  if (!saved.createdAt) return findTicket(tokens, saved.code);
  return tokens.find((t) => t.code === saved.code && t.created_at === saved.createdAt);
}

export function phoneJourney(saved: SavedTicket, board: LiveBoard | null): PhoneJourney {
  const { destination } = saved;
  const tokens = board?.tokens ?? [];
  const buses = board?.buses ?? [];
  const row = matchTicket(tokens, saved);
  const position = row ? queuePosition(tokens, row) : null;
  const waitingHere = tokens.filter((t) => t.status === "waiting" && t.destination === destination).length;
  const status = departureStatus(destination, buses);
  const bus = status.kind === "waiting" ? null : (buses.find((b) => b.id === status.busId) ?? null);
  const route = bus ? (routeFor(board?.routes ?? [], getDestination(destination)?.route) ?? null) : null;
  const progress = bus && route && status.kind === "on_the_way" ? busProgress(bus, route) : null;
  const tracked = progress && progress.stripFraction !== null ? progress : null;
  return {
    ahead: position === null ? null : position - 1,
    waitingHere,
    bus,
    boarding: status.kind === "boarding",
    places: bus ? freeLabel(bus) : null,
    route: tracked ? route : null,
    progress: tracked,
    line: bus && tracked ? busProgressLine(bus, tracked) : null,
  };
}

/** What the phone says when a join doesn't give a ticket. */
export const JOIN_REFUSED: Record<"closed" | "full" | "invalid", string> = {
  closed: "Joining is closed right now. It opens during the demo.",
  full: "The line is full for today. Watch it on the live board instead.",
  invalid: "That didn't work. Reload the page and try again.",
};

/** A random id for this phone: letters and digits only, as join_from_phone expects. */
export function newDeviceId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

const DEVICE_KEY = "tapselect.join.device";
const TICKET_KEY = "tapselect.join.ticket";

export interface SavedTicket {
  code: string;
  destination: string;
  /** created_at of the ticket, kept the first time it is seen on the board (see matchTicket). */
  createdAt?: string;
}

/** This phone's id, made once and kept (so a reload doesn't make a second passenger). */
export function deviceId(): string {
  try {
    const saved = window.localStorage.getItem(DEVICE_KEY);
    if (saved && /^[A-Za-z0-9]{8,40}$/.test(saved)) return saved;
    const id = newDeviceId();
    window.localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    // Private mode: a new id per visit. join_from_phone still returns the same ticket while it waits.
    return newDeviceId();
  }
}

export function readSavedTicket(): SavedTicket | null {
  try {
    const raw = window.localStorage.getItem(TICKET_KEY);
    const v: unknown = raw ? JSON.parse(raw) : null;
    if (v && typeof v === "object" && "code" in v && "destination" in v) {
      const { code, destination, createdAt } = v as Record<string, unknown>;
      if (typeof code === "string" && typeof destination === "string") {
        return typeof createdAt === "string" ? { code, destination, createdAt } : { code, destination };
      }
    }
  } catch {
    // Unreadable: start over.
  }
  return null;
}

export function saveTicket(ticket: SavedTicket | null) {
  try {
    if (ticket) window.localStorage.setItem(TICKET_KEY, JSON.stringify(ticket));
    else window.localStorage.removeItem(TICKET_KEY);
  } catch {
    // Private mode: the ticket just isn't remembered after a reload.
  }
}
