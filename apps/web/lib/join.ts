// Audience join (/join): people in the room join the kiosk's line from their phones,
// without signing in. Pure, except the localStorage helpers. The rules live in Postgres
// (join_from_phone): open/closed, one waiting ticket per phone, a daily cap.

import type { Json } from "./database.types";

export type JoinResult =
  | { status: "created"; code: string; destination: string; position: number }
  | { status: "duplicate"; code: string; destination: string }
  | { status: "closed" | "full" | "invalid" }
  | { status: "error"; message: string };

export interface JoinStatus {
  open: boolean;
  joined: number;
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
    return { status, code, destination, position: typeof o?.position === "number" ? o.position : 1 };
  }
  if (status === "duplicate" && code && destination) return { status, code, destination };
  if (status === "closed" || status === "full" || status === "invalid") return { status };
  return { status: "error", message: (o && str(o, "message")) ?? "Unexpected response from the server" };
}

export function parseJoinStatus(data: Json | null): JoinStatus {
  const o = obj(data);
  return { open: o?.open === true, joined: typeof o?.joined === "number" ? o.joined : 0 };
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
      const { code, destination } = v as Record<string, unknown>;
      if (typeof code === "string" && typeof destination === "string") return { code, destination };
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
