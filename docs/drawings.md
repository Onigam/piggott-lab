# Drawings of the Piggott lab (wave 3, drawings role)

Eight A3 sheets of the "Plans" mode, all generated from `src/three/dims.ts` and `src/sim/machine.ts` (metres, tagged), never typed. Each is a kit `DrawingSheet` exported in reading
order by `SHEETS` in `src/drawings/index.ts` (the mode shows as soon as the lead passes them to `plans`). 66 tests in `src/drawings/drawings.test.ts` (both languages).

## The sheets

| No    | Id                     | Group         | "See in 3D" world | Items (`parts`)                                                                                             | What it shows                                                                                                                                                                                                            |
| ----- | ---------------------- | ------------- | ----------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PL-01 | `general-arrangement`  | `machine`     | `turbine`         | the 8 parts of the world                                                                                    | side and front views at 1:10: rotor Ø1 200, offset 41, angle iron 206, boom 500, vane 450 × 300 †, yaw axis, items 1–8                                                                                                   |
| PL-02 | `blade-carving`        | `machine`     | `blades`          | `blade`, `blade-blank`, `station-templates`, `hub-disc`                                                     | plan of the blade at 1:2 with its six stations (S4 p. 43), the six sections (the outline of each template), the 120° root at 1:5, the station table (width, drop, thickness, pitch †)                                    |
| PL-03 | `furling-geometry`     | `machine`     | `turbine`         | `yaw-bearing`, `tail-hinge`, `tail-boom`, `tail-vane`, `nacelle-frame`                                      | plan at 1:5 (offset 41, hinge 55° in plan, boom 10° off the axle), the hinge in its own plane at 1:2 (20°), the tail from its stop to 95° at 1:10 with the model's yaw at 10 / 12 / 16 / 25 m/s                          |
| PL-04 | `alternator-section`   | `alternator`  | `alternator`      | `magnet-rotor`, `magnets`, `bearing-hub`, `shaft`, `stator`, `coils`, `studs`, `air-gap`                    | half section through the axis at 1:1 (turning parts in blue, fixed in black), parts list tied to the ids with fixed / turns and the dimensions, detail of the 1 mm gap at 2:1                                            |
| PL-05 | `stator-winding`       | `alternator`  | `alternator`      | `stator`, `coils`, `star-wiring`, `magnets`                                                                 | the stator seen from the rotor at 1:2 (6 coils at 60°, phases A / C / B / A / C / B, rods, rim hoops, rear wires dashed), one coil at 1:1, the star schematic, 8 magnets against 6 coils unrolled with electrical angles |
| PL-06 | `tower-guys`           | `site`        | `site`            | `tower`, `guy-wires`, `tower-base`, `wind-turbine`                                                          | the 12 m mast at 1:100 with its guy levels (4, 8, 11.5 m), anchors at 1:200, the hinged foot at 1:10, the principle of the lift (fall zone, nobody under the machine)                                                    |
| PL-07 | `electrical-schematic` | `site`        | `site`            | `cable-run`, `brake-switch`, `rectifier`, `fuse`, `charge-controller`, `dump-load`, `battery-bank`, `house` | alternator, three phases A / B / C, link cable (≈ 15 m\*, 10 mm²\*), 2-pole brake, three-phase bridge, fuse on the + wire, battery, dump load, controller, house; cable losses of S4; the model's figures                |
| PL-08 | `power-by-size`        | `performance` | `site`            | `wind-turbine`                                                                                              | MODEL RESULT: battery power against wind for 1.0 … 4.2 m, the label scaled with the area as marks on a second scale, bars label / model at 12 m/s, the figures, what the sources publish (2, 2.4, 4 m)                   |

Numbering follows the order of the groups so that the panel's list reads PL-01 … PL-08 (the brief's order put the furling sheet fifth; it is third here, with the machine).

## For the lead: `plans` in `src/lab.ts`

```ts
import { SHEETS } from './drawings';
plans: {
  sheets: SHEETS,
  groups: [
    { id: 'machine', label: l('La machine', 'The machine') },
    { id: 'alternator', label: l('L’alternateur', 'The alternator') },
    { id: 'site', label: l('Site et électricité', 'Site and electricity') },
    { id: 'performance', label: l('Puissance', 'Power') },
  ],
  intro: l(
    'Huit plans A3 générés à partir des cotes du modèle 3D : la machine, la pale, le repliement, l’alternateur, le bobinage, le mât, le schéma électrique et la puissance selon la taille. Reconstitution pédagogique, pas un plan de construction.',
    'Eight A3 drawings generated from the 3D model’s dimensions: the machine, the blade, furling, the alternator, the winding, the tower, the electrical schematic and power by size. Educational reconstruction, not a construction plan.',
  ),
},
```

`configureDrawings({ project })` is already in `lab.ts`; the title-block disclaimer stays the kit's. The sheets add nothing to `src/i18n/ui.ts`.

## Conventions

- **Marks after a dimension**: none = given by a published source (S3, S4), `†` = derived from published figures only, `*` = estimate of the 3D model or assumption of the model (`dims.ts` says which). `src/drawings/geom.ts` holds the table (`STATUS`)
  of the constants that are not estimates; the test reads the JSDoc of `dims.ts` and fails if a sheet marks a dimension higher than the comment does. Every sheet carries the legend of the marks and the notice "educational
  reconstruction, not a construction plan".
- **Colours**: DC + red, DC − black (the kit's), the three phases brown (A), blue (B), violet (C) on paper (the 3D uses red / yellow / blue sleeves: said on PL-05), blue outline = turns, black = fixed (PL-04), copper = the swept tail or the copper wire.
- **Line types** are the four of the panel's legend (thick, thin, dash-dot centre, dashed hidden) plus the long-dash-double-dot phantom for swept shapes.
- **Part ids**: items of a sheet are numbered in the order of its parts list and tied to the ids of the catalogue (`PARTS`: the names come from there); the 3D "see in 3D" button opens the world and the first part of `parts`.
- **Model results** are tagged "résultat du modèle / model result" and recomputed by the tests (the yaw of PL-03, the 5 A and the cable losses of PL-07, the whole of PL-08).

## Files

| File                              | What                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                        | `SHEETS`                                                                                                                                                                              |
| `pl01-general.ts … pl08-sizes.ts` | the eight sheets, one file each                                                                                                                                                       |
| `geom.ts`                         | millimetres from `dims.ts`, the status of each constant, bilingual labels with their marks                                                                                            |
| `head.ts`                         | the head in the head frame (positions along the axle, tail pose by Rodrigues rotation about the hinge axis, blade planform and side silhouette from the 3D builder's own `sectionAt`) |
| `draw.ts`, `chart.ts`             | helpers (ported from the ram lab, see `docs/kit-requests.md` 13–15)                                                                                                                   |
| `sizes-model.ts`                  | the seven sweeps of PL-08, computed once on first use (about 0.1 s), cached; `modelPower` for 2.0 and 4.0 m                                                                           |
| `test-dom.ts`                     | a fake DOM for the kit's `Drawing` (Node tests), with `textBoxes` / `textExtent`                                                                                                      |
| `drawings.test.ts`                | the tests                                                                                                                                                                             |

## Tests

Contract (ids, numbers, groups, worlds, parts exist in `part-ids.ts` and belong to the world, 2–4 sentences), a render in both languages without NaN / empty text / straight apostrophe, every text inside the frame and
outside the title block, no text on text (estimated boxes), decimal comma / point, same level of detail in FR and EN, the numbers of every sheet against `dims.ts`, `machine.ts`, `figures.ts` and the simulation (grep-like
assertions on the rendered texts), marks against the JSDoc, and PL-08: the seven curves equal `powerCurve` of `src/sim`, the rendered polylines sit at the data coordinates of the chart, and **42, 60, 135, 242, 382, 558
and 773 W at 12 m/s** (labels 139 to 2 450 W) are asserted, so a recalibration of the model fails loudly.

## Weak or doubtful

- **Legibility at 1280 × 800** relies on the kit's zoom: the A3 shows at about 800 px, notes at 1.8 mm cap height are small. Text sizes are 1.8 to 2.4 (font 2.5 to 3.4 mm); they read at "+" ×2 and on paper.
- **PL-03 C**: the three poses overlap near the yaw axis by nature; the two ends (stop, folded) are drawn in full, the model's three intermediate yaws as rotor lines and tails only. The tail's swing is tied to the yaw as the engine does (`tailSwing = 95° × folded`).
- **PL-05**: the links (rim hoops, neutral ring, three leads) are the 3D model's drawing aid, not the real cast-in links; the winding sense is not drawn (the wiki says all coils the same way).
- **PL-06**: guy anchors, the pad, the lugs and the pin are 3D-model estimates (the sources give none); the lift is a principle, not a procedure (rope attachment, winch and anchors are not published).
- **PL-07**: the rectifier is a three-phase bridge (the model); the plans give two single-phase bridges. The brake is drawn as two contacts that join A–B and B–C (2 poles, as the plans say).
- **PL-08**: labels other than 200 W are our scaling by area; the maker's range is 200 to 2 000 W for the family (S6), so 2 450 W for 4.2 m is above it. The published 2, 2.4 and 4 m figures are shown beside the model's.
- Checked in headless Chrome (software GL) at 1280 × 800, 768 × 1024 and 390 × 844, French and English, through a temporary page that mounts the lab with `plans`; the real `lab.ts` wiring is the lead's.
