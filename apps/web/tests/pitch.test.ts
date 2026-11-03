import { describe, expect, it } from "vitest";
import { PITCH_NUMBERS, pitchValue } from "@/lib/pitch";
import { PITCH_REFERENCES, referenceYear } from "@/components/pitch/content";

describe("content/pitch.json", () => {
  it("holds only numbers or null, with percents in 0–100", () => {
    for (const value of Object.values(PITCH_NUMBERS)) {
      expect(value === null || Number.isFinite(value)).toBe(true);
    }
    for (const key of ["voiceAccuracy", "gestureBefore", "gestureAfter", "surveyGaveUpPct"] as const) {
      const value = PITCH_NUMBERS[key];
      if (value === null) continue;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("shows a dash for a missing value, never a guess", () => {
    expect(pitchValue(null)).toBe("—");
    expect(pitchValue(null, "%")).toBe("—");
    expect(pitchValue(95.8, "%")).toBe("95.8%");
    expect(pitchValue(1100)).toBe("1,100");
  });
});

describe("pitch references", () => {
  it("are numbered 1..n in order, each with a year", () => {
    expect(PITCH_REFERENCES.map((r) => r.n)).toEqual(PITCH_REFERENCES.map((_, i) => i + 1));
    for (const r of PITCH_REFERENCES) expect(referenceYear(r)).toMatch(/^\d{4}$/);
  });
});
