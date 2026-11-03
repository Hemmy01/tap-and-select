# Voice model results

Edge Impulse project: **tap-and-select-voice** (project id 1150179) · Export: Arduino library v1.0.1,
deploy version 1 (`ml/exports/ei-tap-and-select-voice-arduino-1.0.1-impulse-#1.zip`) · Date: 2026-10-28

## Dataset

| Label | Selects | Samples | Total length |
|---|---|---|---|
| remera | REM | | |
| nyabugogo | NYA | | |
| kimironko | KIM | | |
| downtown | DTN | | |
| noise | nothing | | |
| unknown | nothing | | |

Speakers: 4 (Emmanuel, Samira, Kevin, Kenny). Train / test split: _80 / 20_

## Impulse settings

| Setting | Value |
|---|---|
| Window size | 1000 ms (16,000 samples) |
| Frequency | 16000 Hz |
| Processing block | MFCC |
| Quantization / EON | int8 / on |
| On-device estimate (Edge Impulse) | ~419 ms DSP + NN per window, 20.4 KB RAM, 31.3 KB flash |
| Firmware (`kiosk_node`, voice + rule taps) | 183,456 B flash (18%), 48,704 B static RAM (18%) |
| Continuous mode | 4 slices per window (one result every 250 ms) |

## Accuracy

| | Value |
|---|---|
| Validation accuracy | **92%**: Edge Impulse → Classifier, held-out clips from the 3 training voices |
| Test accuracy | **59%**: Edge Impulse → Model testing, a 4th team member's voice the model never heard |
| Confusion matrix | `ml/results/voice-confusion.png` |

Recorded in `apps/web/content/models.json` (`validationAccuracy` 0.92, `testAccuracy` 0.59).

The gap is the finding: the model knows the voices it learned, but one new voice is right only about
6 times in 10. The test is one speaker, so treat 59% as a first estimate. Next: many more voices and
accents. Until then the kiosk always asks to confirm, and a swipe or a tap on the screen also works.

## On the board (10 tries each, firmware/README.md "Testing the voice build")

Said once from 30–50 cm after tapping a demo card. Pending.

| Stop | Said | Hits /10 | Avg confidence | Notes |
|---|---|---|---|---|
| REM | "Remera" | | | |
| DTN | "Downtown" | | | |
| NYA | "Nyabugogo" | | | |
| KIM | "Kimironko" | | | |
| (none) | other words, 20 s silence | false selects: | | |

## Thresholds used

`VOICE_THRESHOLD` = 0.80 · `VOICE_CONSECUTIVE` = 2 · `VOICE_SLICES_PER_WINDOW` = 4 · _why changed, if changed_
