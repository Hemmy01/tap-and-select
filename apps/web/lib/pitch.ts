// Numbers on the /pitch results slide. Edit content/pitch.json; a null value
// shows as "—" on the slide until it is measured. Never fill one with a guess.
// The voice model's accuracy is not here: it comes from content/models.json.
// swipeCorrect/swipeTries: ml/results/gesture-trials.md (fw 0.3.1 swipes).
// survey*: our commuter survey, 1–4 Nov 2026 (n = 71). Long waits / unsure when: "What stops
// you from taking the bus more often?"; to a bus park: "What do you do to be sure you catch a bus?"
// (walk to a big park, or a moto to a bus park).

import raw from "@/content/pitch.json";

export interface PitchNumbers {
  voiceSamples: number | null;
  voiceSpeakers: number | null;
  modelRamKb: number | null;
  swipeCorrect: number | null;
  swipeTries: number | null;
  surveyRespondents: number | null;
  /** Ticked "Long waits" as what stops them taking the bus more often. */
  surveyLongWaits: number | null;
  /** Ticked "Unsure when it will arrive" as what stops them taking the bus more often. */
  surveyUnsureWhen: number | null;
  /** To be sure of a bus, walk to a big bus park or take a moto to one. */
  surveyToBusPark: number | null;
  /** To be sure of a bus, take a moto to a bus park (ticked, or wrote "moto"). */
  surveyMoto: number | null;
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
