import { describe, expect, it } from "vitest";
import { PITCH_NUMBERS, pitchPercent, pitchValue } from "@/lib/pitch";
import { PITCH_REFERENCES, referenceYear } from "@/components/pitch/content";

describe("content/pitch.json", () => {
  it("holds only numbers or null, with sensible ranges", () => {
    for (const value of Object.values(PITCH_NUMBERS)) {
      expect(value === null || Number.isFinite(value)).toBe(true);
    }
    const { swipeCorrect, swipeTries, surveyGaveUpPct } = PITCH_NUMBERS;
    if (swipeCorrect !== null && swipeTries !== null) expect(swipeCorrect).toBeLessThanOrEqual(swipeTries);
    if (surveyGaveUpPct !== null) {
      expect(surveyGaveUpPct).toBeGreaterThanOrEqual(0);
      expect(surveyGaveUpPct).toBeLessThanOrEqual(100);
    }
  });

  it("shows a dash for a missing value, never a guess", () => {
    expect(pitchValue(null)).toBe("—");
    expect(pitchValue(null, " KB")).toBe("—");
    expect(pitchValue(20.4, " KB")).toBe("20.4 KB");
    expect(pitchValue(1100)).toBe("1,100");
    expect(pitchPercent(73, 80)).toBe("91%");
    expect(pitchPercent(null, 80)).toBe("—");
    expect(pitchPercent(3, 0)).toBe("—");
  });
});

describe("pitch references", () => {
  it("are numbered 1..n in order, each with a year", () => {
    expect(PITCH_REFERENCES.map((r) => r.n)).toEqual(PITCH_REFERENCES.map((_, i) => i + 1));
    for (const r of PITCH_REFERENCES) expect(referenceYear(r)).toMatch(/^\d{4}$/);
  });
});
