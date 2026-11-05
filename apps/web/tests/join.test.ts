import { describe, expect, it } from "vitest";
import type { Bus } from "@/lib/departures";
import {
  matchTicket,
  newDeviceId,
  parseCancelResult,
  parseJoinResult,
  parseJoinStatus,
  phoneJourney,
} from "@/lib/join";
import type { LiveBoard } from "@/lib/live-board";
import type { QueueToken } from "@/lib/queue";

describe("parseJoinResult", () => {
  it("reads a new ticket and an existing one", () => {
    expect(
      parseJoinResult({
        status: "created",
        code: "R2-015",
        destination: "REM",
        position: 3,
      }),
    ).toEqual({
      status: "created",
      code: "R2-015",
      destination: "REM",
      position: 3,
    });
    expect(
      parseJoinResult({
        status: "duplicate",
        code: "R2-015",
        destination: "REM",
      }),
    ).toEqual({
      status: "duplicate",
      code: "R2-015",
      destination: "REM",
    });
  });

  it("passes on closed, full and invalid", () => {
    for (const status of ["closed", "full", "invalid"] as const) {
      expect(parseJoinResult({ status })).toEqual({ status });
    }
  });

  it("treats anything else as an error", () => {
    expect(parseJoinResult(null).status).toBe("error");
    expect(parseJoinResult({ status: "created" }).status).toBe("error");
  });
});

describe("parseJoinStatus", () => {
  it("defaults to closed with nobody joined", () => {
    expect(parseJoinStatus(null)).toEqual({
      open: false,
      joined: 0,
      releaseLoadPct: 70,
      maxWaitMinutes: 15,
      cancelReasons: [],
    });
    expect(
      parseJoinStatus({
        open: true,
        joined: 12,
        release_load_pct: 60,
        max_wait_minutes: 10,
        cancel_reasons: [{ code: "other", label: "Other" }, { code: 1 }],
      }),
    ).toEqual({
      open: true,
      joined: 12,
      releaseLoadPct: 60,
      maxWaitMinutes: 10,
      cancelReasons: [{ code: "other", label: "Other" }],
    });
  });
});

describe("newDeviceId", () => {
  it("is letters and digits only, as the database expects", () => {
    expect(newDeviceId()).toMatch(/^[A-Za-z0-9]{8,40}$/);
    expect(newDeviceId()).not.toBe(newDeviceId());
  });
});

describe("parseCancelResult", () => {
  it("reads cancelled, already gone, and errors", () => {
    expect(parseCancelResult({ status: "cancelled", code: "R2-001" })).toEqual({
      status: "cancelled",
    });
    expect(parseCancelResult({ status: "not_found", message: "x" })).toEqual({
      status: "not_found",
    });
    expect(parseCancelResult({ status: "error", message: "Unknown reason" })).toEqual({
      status: "error",
      message: "Unknown reason",
    });
  });
});

describe("phoneJourney", () => {
  const route = {
    route: "R2",
    terminalRadiusM: 150,
    stops: [
      {
        id: "STOP-03",
        name: "Giporoso (Remera)",
        lat: -1.96,
        lng: 30.1,
        distanceM: 0,
      },
      {
        id: "STOP-10",
        name: "Kimihurura",
        lat: -1.95,
        lng: 30.08,
        distanceM: 3000,
      },
      {
        id: "STOP-11",
        name: "Kiyovu",
        lat: -1.947,
        lng: 30.07,
        distanceM: 4700,
      },
      {
        id: "STOP-01",
        name: "Kiosk 1 (Demo)",
        lat: -1.944,
        lng: 30.06,
        distanceM: 5700,
      },
    ],
  };
  const token = (id: number, code: string, destination = "REM"): QueueToken => ({
    id,
    code,
    destination,
    status: "waiting",
    bus_id: null,
    created_at: `2026-11-04T10:0${id}:00Z`,
  });
  const bus = (over: Partial<Bus> = {}): Bus => ({
    id: "R2-01",
    destination: "REM",
    status: "at_terminal",
    eta_minutes: null,
    lat: null,
    lng: null,
    location_updated_at: null,
    released_at: null,
    departed_at: null,
    last_stop_id: null,
    next_stop_id: null,
    stops_remaining: null,
    distance_remaining_m: null,
    seats: 40,
    standing: 30,
    occupancy: 8,
    ...over,
  });
  const board = (buses: Bus[]): LiveBoard => ({
    stop: { id: "STOP-01", name: "Kiosk 1 (Demo)" },
    buses,
    tokens: [token(1, "R2-001"), token(2, "R2-002"), token(3, "R3-001", "KIM"), token(4, "R2-003")],
    networkWaiting: {},
    routes: [route],
    updatedAt: null,
  });

  it("counts who is ahead and waiting for the route, with no bus yet", () => {
    const j = phoneJourney({ code: "R2-003", destination: "REM" }, board([bus()]));
    expect(j).toMatchObject({
      ahead: 2,
      waitingHere: 3,
      bus: null,
      places: null,
      progress: null,
    });
  });

  it("follows the bus on the way, with its free places", () => {
    const moving = bus({
      status: "on_the_way",
      eta_minutes: 4,
      last_stop_id: "STOP-10",
      next_stop_id: "STOP-11",
      stops_remaining: 2,
      distance_remaining_m: 2000,
    });
    const j = phoneJourney({ code: "R2-001", destination: "REM" }, board([moving]));
    expect(j.ahead).toBe(0);
    expect(j.bus?.id).toBe("R2-01");
    expect(j.places).toBe("32 seats + 30 standing free");
    expect(j.progress?.lastIndex).toBe(1);
    expect(j.line).toBe("Bus R2-01 · passed Kimihurura · 2 stops away · about 4 min");
  });

  it("knows the bus is boarding, and stops counting once you're not waiting", () => {
    const j = phoneJourney({ code: "R9-999", destination: "REM" }, board([bus({ status: "arrived", last_stop_id: "STOP-01" })]));
    expect(j).toMatchObject({ ahead: null, boarding: true, progress: null });
  });
});

describe("matchTicket", () => {
  const t = (code: string, created_at: string): QueueToken => ({
    id: 1,
    code,
    destination: "REM",
    status: "waiting",
    bus_id: null,
    created_at,
  });

  it("finds the ticket by code until its creation time is known", () => {
    expect(matchTicket([t("R2-001", "2026-11-05T09:00:00Z")], { code: "R2-001", destination: "REM" })?.created_at).toBe(
      "2026-11-05T09:00:00Z",
    );
  });

  it("does not take someone else's R2-001 after Reset demo", () => {
    const saved = { code: "R2-001", destination: "REM", createdAt: "2026-11-05T09:00:00Z" };
    expect(matchTicket([t("R2-001", "2026-11-05T09:30:00Z")], saved)).toBeUndefined();
    expect(matchTicket([t("R2-001", "2026-11-05T09:00:00Z")], saved)).toBeDefined();
  });
});
