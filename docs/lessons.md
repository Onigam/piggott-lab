# Lessons of the Piggott lab (wave 3, lessons role)

Six lessons with their quizzes, and the Sizes section of the simulation panel. Content only: facts and figures, no text copied from a
source, sources named in words in the texts (the video, the wiki, Hugh Piggott's plans, Tripalium, Service-public, the model), never
by research code. Tests: `src/data/lessons.test.ts` (46), `src/panels/sizes.test.ts` (18); `src/panels/strings.test.ts` and
`src/panels/sim.test.ts` stay green (two assertions of `sim.test.ts` were updated, see below).

## Files

| File                       | What                                                                                                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/lessons.ts`      | `LESSONS: Lesson[]`, six lessons.                                                                                                                                                                           |
| `src/data/lessons-fig.ts`  | `LESSON_FIG` (the figures that `figures.ts` does not hold, each tagged `reported`, `derived` or `model`), `lx` (a text with `{placeholders}`), `chip`, `rawOf` (the template behind a text, for the tests). |
| `src/data/lessons.test.ts` | Shape, parity, focus, quiz, every number, the model results recomputed, what each scenario does.                                                                                                            |
| `src/panels/model.ts`      | Added at the end: `SIZE_DIAMETERS`, `sizeParams`, `sizeCurve` (cached), `pendingSizes`, `sizesChartData`, `sizesTable`.                                                                                     |
| `src/panels/sizes.ts`      | `SizesSection`: the collapsible section, closed at first, one curve computed per frame once opened.                                                                                                         |
| `src/panels/sizes.test.ts` | The sizes data and the section in the fake DOM.                                                                                                                                                             |
| `src/panels/sim.ts`        | Three lines: the section is built in `render()` after the power curve, `tick()` calls `sizes.tick()`.                                                                                                       |
| `src/i18n/ui.ts`           | New keys at the end of `LAB`: `secSizes`, `sizesHint`, `seriesRatedSize`, `sizesSet`, `sizesModel`, `sizesRated`, `lessonsIntroPiggott`. Nothing existing changed.                                          |
| `src/panels/sim.test.ts`   | Two assertions only: the panel now has four `details.sim-section` (the last, Sizes, closed) and seven canvases.                                                                                             |

## The six lessons

Every lesson opens `preset: 'hamlet'` (the site the figures are for), a world, a part and a scenario (run by the kit's "Lancer le
scénario" button; the preset is applied when the lesson opens). 3 or 4 paragraphs of at most 85 words, a formula or key figures where useful,
2 or 3 quiz questions (15 in all; the right answer is at index 0, 1, 2 for 4, 5, 6 of them; the test lets the right choice be the longest in at most a third of the text questions, in each language).

| #   | id              | Title (FR)                                       | Opens                                             | Video | What it teaches                                                                                                                                                                                                                      |
| --- | --------------- | ------------------------------------------------ | ------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `wind-cube`     | Pourquoi la vitesse du vent compte tant          | `site` / `tower` / scenario `wind-sweep`          | 00:45 | Power in the wind goes as a cube (87 W at 5 m/s, 696 W at 10 m/s); shear, hub, mast height (3.4 to 5.5 m/s, 4.4 times the wind power), turbulence; **the honest point**: the battery gets 13 W then 50 W, near four times, not eight |
| 2   | `betz-blades`   | Betz et les pales : trois pales fines et rapides | `blades` / `blade` / scenario `runaway`           | 01:22 | Betz 16/27, Cp 0.25 to 0.35, tip speed ratio about 7 (334 rpm at 3 m/s), the stall: 417 rpm and Cp 0.11 at 10 m/s in the model, and the runaway when the battery is disconnected                                                     |
| 3   | `volts`         | De la rotation aux volts                         | `alternator` / `coils` / scenario `few-turns`     | 02:17 | Induction, 8 magnets for 6 coils, three phases, turns and the 12 V choice, the bench test (1.9 V at one turn per second), the rectifier and a worked cut-in (12.4 + 1.5 V, 10.3 V AC, 325 rpm), the trade-off of the turns           |
| 4   | `battery`       | Le seuil de charge et la batterie                | `site` / `battery-bank` / scenario `battery-full` | —     | Cut-in (about 3 m/s by calculation, 2.6 m/s in the model), 11.5 V and 14 V, the dump load, the cable (the plans' 38 % and 13 %, the model's 11 % and 1 %)                                                                            |
| 5   | `storm`         | Survivre à la tempête                            | `turbine` / `tail-hinge` / scenario `storm`       | 06:16 | Thrust, the 41 mm offset, the inclined hinge, furling at about 10 m/s (calibrated), 41 N against 373 N at 25 m/s with the tail locked, a heavier tail folds later, the brake switch is for servicing, never short the battery        |
| 6   | `siting-sizing` | Le site et la taille                             | `site` / `obstacles` / scenario `low-mast`        | 01:03 | Mast and trees, the French 12 m rule, kWh and the yearly yield (17 / 45 / 74 kWh for 6 / 12 / 18 m in the calm valley, 132 kWh at the hamlet), the seven sizes (42 to 773 W at 12 m/s), the label against the model, capacity factor |

Lesson 4 has no timestamp: the video says nothing of the battery. The timestamps are the starts of the chapters of `src/data/chapters.ts`.

## Where a number comes from

A number in a lesson is one of four things (`src/data/lessons-fig.ts` explains it; `lessons.test.ts` enforces it):

- **reported**, typed in the text, with its source in the allow-list `TYPED` of the test (an entry no text uses fails the test);
- **derived**, a placeholder tagged `derived` (87 W, 1 114 rpm, 1.35, 13.9 V, 10.3 V, 42 A, 14 A, 150 W): the paragraph says "calcul / calculation";
- **model result**, a placeholder tagged `model` (from `figures.ts` or `LESSON_FIG`): the paragraph says "modèle / model". The test recomputes
  every `LESSON_FIG` model figure from `src/sim` and fails loudly if the model is recalibrated; the `MODEL` figures of `figures.ts` are
  recomputed by `data.test.ts`;
- **the label**: 200 W wherever it appears, said to be the label (nominal, no wind speed given).

What the lessons say about what happens when the visitor presses the scenario button is run by the engine in the test (the runaway goes from about 400 to
over 1 000 rpm in ten seconds and is brought under 100 rpm by the brake; 38 turns at 4 m/s charge nothing; the dump load holds 14 V; the storm folds the tail beyond 55 degrees).

## The two honest points

1. **The cube is the wind's, not the battery's.** Lessons 1 and 2: the power in the wind is 8 times larger for twice the wind, the battery of this machine receives
   13 W at 5 m/s and 50 W at 10 m/s, near four times, a nearly straight line from the cut-in to the furling (`docs/physics.md` §7.2, §7.6). The quiz of lesson 1
   has the cube as a wrong choice (104 W) and proportionality as the other (26 W).
2. **The 200 W label.** Lesson 6 and its quiz: the label gives no wind speed; the model, not tuned to it, finds about 60 W at 12 m/s (30 to 40 % of the labels of 200 W and
   2 000 W); depending on the unpublished shape of the stall the result varies by a factor of two (`docs/physics.md` §7.4, **a sensitivity study that is not a test**:
   the variants were run by editing a constant); the winding arithmetic (200 W at 14 V is about 14 A, 150 W of heat in two phases of 0.37 Ω) is in the explanation of the quiz.
   Lesson 3 adds that a stator wound with half the turns would, in the model, harvest more energy over the year (216 against 132 kWh at the hamlet, guarded by a test),
   "an observation, not advice" (`docs/physics.md` §7.5).

## The Sizes section (Simulation panel)

A collapsible `details` (kit `section`), **closed at first**, after the power curve. Nothing is computed until it is opened (`pendingSizes` lists what is
missing, the section computes one curve per frame, about 12 ms each, then draws once; it draws again only if the set diameter or the language changes; no allocation per frame).

- **Data** (`src/panels/model.ts`): the battery power against the wind at the hub (0 to 25 m/s, steps of 0.5) of the reference machine at each of the seven diameters of Tripalium
  (1.0, 1.2, 1.8, 2.4, 3.0, 3.6, 4.2 m): the machine of the video on the hamlet preset, the model's own scaling of the alternator and of the tail, and **the cable section in proportion to the swept area**
  (10 mm² at 1.2 m, 40 mm² at 2.4 m) so that the cable costs the same share at every size. The 1.2 m curve is exactly `PiggottSim.getCurve()` (tested).
- **At 12 m/s**: 42, 60, 135, 242, 382, 558 and 773 W (a test fails if the model moves), about 0.30 of the **label scaled with the swept area** (`nameplate(D)` = 200 W × (D/1.2)²: 139, 200, 450, 800, 1 250, 1 800, 2 450 W).
  The power per m² of rotor is the same to 5 % at every size: size changes how much, not how well.
- **Chart**: seven curves from light blue (1.0 m) to dark blue (4.2 m); the set size (the diameter slider) in copper and bold, with its label as a dashed copper line when it fits under the axis (a multiple of 300 W
  above the 4.2 m curve, fixed, so the chart does not move); a set size outside the family (1.5 m) gets its own copper curve; a vertical mark at 12 m/s; under it the summary line of the set size and one cell per size, "model / rated" in W.
- **Words**: "annoncée / rated" in the panel (as the power curve's legend says), "étiquette / label" in the lessons.

## What the lead must wire in `src/lab.ts`

```ts
import { LESSONS } from './data/lessons';
// …in the LabDefinition:
lessons: { intro: strL('lessonsIntroPiggott'), items: LESSONS },
```

The Lessons mode appears by itself (the rail shows "Leçons" between Simulation and Pièces). The old key `lessonsIntro` ("Leçons courtes liées à la 3D.") is no longer needed. Nothing to wire for the
Sizes section. The "Sources" panel is the lead's: Hugh Piggott's plans, Tripalium, Engineering for Change and Windside are cited in words in the lessons, with their links already in `about()`.

## Open questions and weak points

- **Density.** The lessons are 240 to 300 French words each (Pelton's mean is 217), paragraphs of 60 to 85 words: the caps in the test (85 words, 36 per sentence, 330 per lesson) can be lowered if the owner finds them dense; the numbers
  are the first thing to cut (the chips already carry the main ones).
- **The model's own labels.** The dashed "label" of the chart is 200 W scaled with the swept area, not Tripalium's per-size labels (only 200 W for 1.2 m and the 2 000 W of the largest are published in our sources: the area rule gives 2 450 W at 4.2 m).
  The lessons compare with the reported 200 W and 2 000 W.
- **Unverified on the video** (nobody has watched it): the furling "about 10 m/s" and the first reading at 08:09. Lesson 5 says "vers 10 m/s" as the video's figure and says the tail weight of the model is tuned to it.
- **The wind sweep takes five minutes** at the speed of the clock. At ×60 the clock runs the sweep in five seconds, but the rotor shown in the strip follows in real time and lags (0 W at 14 m/s): the lesson does not suggest it.
- **Not tested**: the statement that the result "varies by a factor of two with the shape of the stall" (physics §7.4 variants), and the claims about the video and the plans (their numbers are in the allow-list with their source, not checked against the documents).
- **`focus.preset`** is applied each time a lesson opens (kit behaviour): it resets the visitor's machine to the hamlet defaults; the scenario starts only on the button.
