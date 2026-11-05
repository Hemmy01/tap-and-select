// "Simulate drive": the path a released bus follows from its terminal to the kiosk, and the
// ETA it reports on the way (the drive is far quicker than a real bus). Pure.
// Every stop is on the path exactly, so boarding along the route and arrival at the kiosk
// happen just as with real GPS.

import { haversineMeters, type LatLng } from "./eta";

/** Steps for a whole route, one a second: about 20 s with each step's round trip, quick enough for a pitch. */
export const DRIVE_STEPS = 15;
export const DRIVE_STEP_MS = 1_000;

/** The ETA a drive reports at step i (0-based) of n: whole minutes left, at least 1. */
export function driveEtaMinutes(i: number, n: number, stepMs = DRIVE_STEP_MS): number {
  const msLeft = Math.max(n - 1 - i, 0) * stepMs;
  return Math.max(Math.ceil(msLeft / 60_000), 1);
}

/**
 * Points from the first stop (terminal) to the last (kiosk). Segments get steps in proportion
 * to their length (at least one), and each stop is included exactly once.
 */
export function drivePath(stops: readonly LatLng[], steps = DRIVE_STEPS): LatLng[] {
  if (stops.length === 0) return [];
  const legs = stops.slice(1).map((to, i) => ({ from: stops[i], to, m: haversineMeters(stops[i], to) }));
  const total = legs.reduce((sum, leg) => sum + leg.m, 0);
  const path: LatLng[] = [{ lat: stops[0].lat, lng: stops[0].lng }];
  for (const leg of legs) {
    const n = Math.max(1, total > 0 ? Math.round((steps * leg.m) / total) : 1);
    for (let j = 1; j <= n; j++) {
      const t = j / n;
      path.push({ lat: leg.from.lat + (leg.to.lat - leg.from.lat) * t, lng: leg.from.lng + (leg.to.lng - leg.from.lng) * t });
    }
  }
  return path;
}
