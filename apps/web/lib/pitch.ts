// Numbers on the /pitch results slide. Edit content/pitch.json; a null value
// shows as "—" on the slide until it is measured. Never fill one with a guess.
// gestureBefore/After: ml/results/gesture-trials.md (31/80 taps, 73/80 swipes).

import raw from "@/content/pitch.json";

export interface PitchNumbers {
  /** Percent, 0–100. */
  voiceAccuracy: number | null;
  voiceSamples: number | null;
  voiceSpeakers: number | null;
  modelRamKb: number | null;
  modelFlashKb: number | null;
  /** Percent of gesture tries correct, 0–100. */
  gestureBefore: number | null;
  gestureAfter: number | null;
  surveyRespondents: number | null;
  /** Percent, 0–100. */
  surveyGaveUpPct: number | null;
  audienceJoined: number | null;
}

export const PITCH_NUMBERS: PitchNumbers = raw;

/** 1100 → "1,100"; with a unit, 95.8 → "95.8%"; null → "—". */
export function pitchValue(value: number | null, unit = ""): string {
  return value === null ? "—" : `${value.toLocaleString("en-US")}${unit}`;
}
