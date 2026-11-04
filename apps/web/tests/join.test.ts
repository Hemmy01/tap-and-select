import { describe, expect, it } from "vitest";
import { newDeviceId, parseJoinResult, parseJoinStatus } from "@/lib/join";

describe("parseJoinResult", () => {
  it("reads a new ticket and an existing one", () => {
    expect(parseJoinResult({ status: "created", code: "R2-015", destination: "REM", position: 3 })).toEqual({
      status: "created",
      code: "R2-015",
      destination: "REM",
      position: 3,
    });
    expect(parseJoinResult({ status: "duplicate", code: "R2-015", destination: "REM" })).toEqual({
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
    expect(parseJoinStatus(null)).toEqual({ open: false, joined: 0 });
    expect(parseJoinStatus({ open: true, joined: 12 })).toEqual({ open: true, joined: 12 });
  });
});

describe("newDeviceId", () => {
  it("is letters and digits only, as the database expects", () => {
    expect(newDeviceId()).toMatch(/^[A-Za-z0-9]{8,40}$/);
    expect(newDeviceId()).not.toBe(newDeviceId());
  });
});
