import { describe, expect, it } from "vitest";
import { haversineMeters } from "@/lib/eta";
import { DRIVE_STEP_MS, DRIVE_STEPS, driveEtaMinutes, drivePath } from "@/lib/simulate-drive";

const terminal = { lat: -1.95, lng: 30.1 };
const middle = { lat: -1.95, lng: 30.08 }; // ~2.2 km from the terminal
const kiosk = { lat: -1.9441, lng: 30.0619 }; // ~2.1 km further

describe("drivePath", () => {
  it("starts at the terminal, ends at the kiosk and passes every stop exactly", () => {
    const path = drivePath([terminal, middle, kiosk], 40);
    expect(path[0]).toEqual(terminal);
    expect(path.at(-1)).toEqual(kiosk);
    expect(path).toContainEqual(middle);
  });

  it("spreads about the requested number of steps by distance", () => {
    const path = drivePath([terminal, middle, kiosk], 40);
    expect(path.length).toBeGreaterThanOrEqual(40);
    expect(path.length).toBeLessThanOrEqual(42);
    const hops = path.slice(1).map((p, i) => haversineMeters(path[i], p));
    // Even spacing: no hop much longer than another.
    expect(Math.max(...hops) / Math.min(...hops)).toBeLessThan(1.3);
  });

  it("gives a very short leg at least one step, and handles tiny routes", () => {
    const near = { lat: terminal.lat + 0.00001, lng: terminal.lng };
    expect(drivePath([terminal, near, kiosk], 10)).toContainEqual(near);
    expect(drivePath([kiosk], 10)).toEqual([kiosk]);
    expect(drivePath([], 10)).toEqual([]);
  });
});

describe("driveEtaMinutes", () => {
  it("is a quick drive: about 15 seconds, so the ETA never says more than a minute", () => {
    expect(DRIVE_STEPS * DRIVE_STEP_MS).toBeLessThanOrEqual(20_000);
    expect(driveEtaMinutes(0, 16)).toBe(1);
    expect(driveEtaMinutes(15, 16)).toBe(1);
  });

  it("counts the minutes left in a longer drive, at least 1", () => {
    expect(driveEtaMinutes(0, 181, 1_000)).toBe(3);
    expect(driveEtaMinutes(120, 181, 1_000)).toBe(1);
    expect(driveEtaMinutes(200, 181, 1_000)).toBe(1);
  });
});
