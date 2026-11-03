// Numbers on the /pitch results slide. Edit content/pitch.json; a null value
// shows as "—" on the slide until it is measured. Never fill one with a guess.
// The voice model's accuracy is not here: it comes from content/models.json.
// swipeCorrect/swipeTries: ml/results/gesture-trials.md (fw 0.3.1 swipes).

import raw from "@/content/pitch.json";

export interface PitchNumbers {
  voiceSamples: number | null;
  voiceSpeakers: number | null;
  modelRamKb: number | null;
  swipeCorrect: number | null;
  swipeTries: number | null;
  surveyRespondents: number | null;
  /** Percent, 0–100. */
  surveyGaveUpPct: number | null;
  audienceJoined: number | null;
}

export const PITCH_NUMBERS: PitchNumbers = raw;

/** 1100 → "1,100"; with a unit, 20.4 → "20.4 KB"; null → "—". */
export function pitchValue(value: number | null, unit = ""): string {
  return value === null ? "—" : `${value.toLocaleString("en-US")}${unit}`;
}

/** 73 of 80 → "91%"; "—" if either is missing. */
export function pitchPercent(part: number | null, whole: number | null): string {
  return part === null || !whole ? "—" : `${Math.round((part / whole) * 100)}%`;
}
