# Data of the Piggott lab (wave 2, data role)

Content only: the 36 part sheets, the two guides, the chapters of the video, the overviews and the interface strings. Facts and figures,
no text copied from a source. Sources are named in the texts in words (the video, the wiki, the plans, Tripalium, Service-public,
the model), never by research code. Tests: `src/data/data.test.ts` (57 pass, 5 `todo` that record known disagreements with `dims.ts`);
the strings test of `src/panels` is unchanged and passes.

## Files

| File                                                    | What                                                                                                                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parts.ts`, `parts/{site,turbine,alternator,blades}.ts` | `PARTS: PartInfo[]`, 35 entries in the catalogue order of `src/part-ids.ts` (13 + 8 + 10 + 4), same `scene` and `category`.                                                                                                                                       |
| `assembly.ts`                                           | `ASSEMBLY`: 24 steps, `scene` set on every step: blades 1–4, alternator 5–14, turbine 15–24. Two steps install nothing: `bench-test` (one turn per second, 1.9 V) and `balance`.                                                                                  |
| `install.ts`                                            | `INSTALL`: 12 steps, all in `site`, ending with `check` (installs nothing). `wind-turbine` is installed by the step `raise`.                                                                                                                                      |
| `chapters.ts`                                           | `CHAPTERS`: 10 rows `[timestamp, fr, en]` of the 8:49 video, in our own words.                                                                                                                                                                                    |
| `overviews.ts`                                          | `OVERVIEWS: Record<WorldId, { title, text }>`.                                                                                                                                                                                                                    |
| `figures.ts`                                            | `MODEL` (results of `src/sim` quoted in the texts) and `FIG` (every number written by `{placeholder}`). The only place where such a number lives.                                                                                                                 |
| `part-helpers.ts`, `units.ts`                           | `sp`, `tf`, `lf`, `maint`, tags; number formatting (7,5 / 7.5). Ported from the ram lab.                                                                                                                                                                          |
| `src/i18n/ui.ts`                                        | Added at the end of `LAB`: `sceneSite/Turbine/Alternator/Blades`, `goSite/Turbine/Alternator/Blades`, `safety`, `legal`, `chapters`. Nothing existing was changed. The new texts only use numbers allowed by `src/panels/strings.test.ts` (12 for the mast rule). |
| `guide.ts`, `lessons.ts`                                | Old stubs, untouched (`lessons.ts` is wave 3; `guide.ts` goes when the lead rewires `src/lab.ts`).                                                                                                                                                                |

## Conventions

- **Status of a figure.** No tag = reported by a named source. Tagged in both languages: `dérivé / derived` (computed from reported
  figures), `résultat du modèle / model result` (an output of `src/sim`), `calibré sur la vidéo / calibrated on the video` (the tail
  weight, furling at 10 m/s), `hypothèse du modèle / model assumption` (a constant of `machine.ts` that no source gives), `estimation /
estimate` (a dimension of the 3D model that no source gives). `lf` and `tf` refuse at import time a text that uses a model result or a
  derived figure without saying so in both languages.
- **Power.** Whenever a text says 200 W it says that it is the label (nominal, wind speed not given); the model finds about 60 W at
  12 m/s (63 W at best, at 14.5 m/s), not tuned. The model explains it: the alternator holds the rotor in the stall (λ ≈ 2.6 instead of 7).
- **Maintenance** is three paragraphs (typical failure, how to check, maintenance) on every sheet but the timber and the templates.
- **Texts:** step text ≤ 80 words (tested), tip ≤ 35, warning ≤ 60 (safety is never shortened below what it must say). Durations are
  rough estimates written `≈ 4 h (est.)` (the wiki says "20 days", a course gathers 10 to 20 people). No torque (no source gives one).
- **Resin:** the proportions of resin, catalyst and talc are NOT published (the wiki gives them; the plans warn that the catalyst is
  hazardous and must never meet the cobalt): the stator step says "follow the datasheet or a course".
- **Numbers:** every number of a text is in `FIG` or in the allow-list of `data.test.ts` with its source (a test fails on any other,
  and on an allow-listed number that no text uses). The model results are recomputed from `src/sim` by the tests: a recalibration
  cannot go unnoticed. The lengths that `dims.ts` also holds (discs, magnets, stator, shaft, frame, pivot, tail, blade stations, mast)
  are tested against it; the blade numbers of the prose come from `dims.ts` through `FIG`.

## What the lead must wire in `src/lab.ts`

- `parts: PARTS`; `scenes`: ids `site`, `turbine`, `alternator`, `blades` with `label: strL('sceneSite')` … and
  `overview: { ...OVERVIEWS.site, actions: [{ label: strL('goTurbine'), scene: 'turbine', primary: true }, …] }`.
- `guides: { assembly: { scene: 'blades', steps: ASSEMBLY }, install: { scene: 'site', steps: INSTALL } }` (every assembly step also
  carries its own `scene`).
- Links: `wind-turbine` → `turbine` (`goTurbine`), `rotor` → `blades` (`goBlades`), `alternator` → `alternator` (`goAlternator`).
- Sources panel: `t('safety')`, `t('legal')` (callouts), `t('chapters')` and `CHAPTERS` (`ctx.videoUrl(ts)`), credits and links of
  S1–S7 (the lab quotes no footage), `t('disclaimer')`.
- Remove `src/data/guide.ts` and the placeholder `device.ts`; `groupDevice` / `sceneDevice` of `ui.ts` are then unused.

## Kinematics of the alternator (the wiki prevails; research K6 was wrong)

The lab reconstructs the **video's machine**, so the Low-tech Lab wiki (S3) prevails over the 2003 plans (S4, an older revision) wherever
they differ (lead's decision). `docs/research.md` K6 said two magnet discs; that was wrong for the 1.2 m machine: the wiki (steps 17–26),
the video and the plans' small-machine pages show **one magnet rotor of 8 magnets**; two rotors and 24 magnets are the 2.4 m machine's
(said in the `magnet-rotor` and `magnets` sheets as a fact of the plans). `src/part-ids.ts` now has one `magnet-rotor` (35 ids; alternator
10). From the wiki (steps 8, 9, 15, 16, 24, 26):

- **Fixed:** the nacelle's angle iron with the **cradle** (steel disc 140 × 8 mm, 12 mm holes) welded at its end; the car hub's **stub axle**
  (« fusée », not a hollow shaft) screwed on the cradle; the **stator**, a resin casting of the six coils with **three slotted M12 × 70 mm
  rods** cast in, screwed on the cradle and nutted; the **air gap** of about 1 mm is set with the stator nuts.
- **Rotating:** the **hub bell** on its bearings on the stub axle; the 230 × 6 mm **rotor disc** (8 magnets) bolted to the bell by **four
  M12 × 140 mm rods** and 16 nuts; the blades and the 9 mm plywood hub disc on the same rods.
- **Id partition** (agreed with the 3D role): `studs` = the three stator rods (qty 3); `bearing-hub` = hub bell, bearings and the four long
  rods; `shaft` = the stub axle with its cradle (« Fusée et berceau » / "Stub axle and cradle"); `nacelle-frame` carries the cradle.
- The **2003 plans' variant** (a hollow shaft with the stator cast onto it, a spacer of about 45 mm, a sleeve clamping the shaft) is one line
  in the `shaft` and `stator` sheets and nowhere else.

The assembly follows the wiki: parts at the bench (moulds, coils, star wiring, the three rods, the stator cast with them, the magnet disc,
the magnets: steps 5–11), then the frame with its cradle and the pivot (12–13, `turbine` world), then the generator assembly (stub axle and
stator on the cradle, hub bell and rotor on the four rods, air gap: 14–16, back in the `alternator` world), then the alternator checked on the
frame, the bench test, the rotor, the balancing, the tail and the wire loop (17–24). The worlds therefore alternate
(blades, alternator, turbine, alternator, turbine): the lead sets the guide's default world and each step carries its own.

## Disagreements between the sources and `src/three/dims.ts` (to settle; the sheets follow the sources)

1. **Hub disc.** The sheet says 9 mm plywood (wiki step 6); the wiki gives no diameter and the plans draw 200 mm (tagged « estimation »).
   140 × 8 mm is the steel **cradle** (step 8), not the hub disc.
2. **Yaw pipe** 200 mm in `dims.ts` (estimate), 100 mm in the wiki (step 24). **Tail vane** 12 mm thick in `dims.ts` (estimate), 6 mm
   plywood in the wiki and the plans. **Stator rods** M6 in `dims.ts` (estimate), 12 mm × 70 mm in the wiki (step 9).
3. **Battery:** `dims.ts` draws two 100 Ah batteries in parallel, the simulation default is 100 Ah (one).
4. **Rectifier.** The plans put it at the battery (the lab follows them); the wiki puts a three-phase rectifier in a sealed box on the machine.
5. **Bench test.** The video shows it near its end (07:11), the wiki before the blades and the tail (step 27): the guide follows the wiki and says so.

## Open questions for the owner

- The furling speed "about 10 m/s" (video 06:16–06:41) and the first reading at 08:09 are not verified on the video (captions garbled): the
  sheets say 10 m/s as the video's, the tail weight is calibrated on it.
- The wiki's resin batches (grams, millilitres) are not reproduced; say if the lab should publish them (the brief says no more than the maker's plans).
- The family of sizes (1.0 to 4.2 m) is quoted as Tripalium's, never as another machine.

## Not done, doubtful

- No kit request. `duration` is still one language (hence `≈ 4 h (est.)`).
- The Service-public rule (12 m, permit; set-back of half the height, 3 m at least) was re-read on 2026-10-29 (page verified by the site on
  14 September 2026): the texts say "check with the mairie". The 3 m set-back is only in the installation step, not in the interface string (the strings test allows no 3).
- The part sheets quote the wiki's and the plans' lengths; where they differ (tail boom 700 or 500 mm, vane about 0.1 m² or 18 × 12 in) both are given.
