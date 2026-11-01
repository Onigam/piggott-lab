# QA: the picture of kit 0.5.1 (review before the owner)

- **Date**: 2026-11-01
- **Commit reviewed**: `1feeffe` (local, not pushed), kit v0.5.1. « Before » = a scratch copy at `8aa88a2` (kit 0.4.0), same machine, same camera.
- **Reviewer**: not the builder of this lab. Only `docs/qa.md` was written in the repo; nothing else was touched (no commit, no `public/lab.json`, no audio generated).
- **Shots and scripts**: `R` = `/Users/magino/.cache/lab-review/piggott-lab/2026-11-01-1feeffe/` (outside every repo, 1 499 PNG, scripts in `R/scripts/`).

## What was walked

| What                                                                                                                                                                                                                                                                                                                                                                                                    | How                                                                                    | Where                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Every world, every part at 3 distances (setting, close, mid), exploded, x-ray, cut, every label, isolated, every mode                                                                                                                                                                                                                                                                                   | kit `walk.mjs` at 1280 × 800, FR and EN, SwiftShader: 179 shots each, 0 console errors | `R/1280-fr/`, `R/1280-en/`                         |
| Worlds, display modes and every mode (no part close-ups)                                                                                                                                                                                                                                                                                                                                                | `walk.mjs` `PARTS=0`: 71 shots per run, 0 console errors                               | `R/768-fr/`, `R/768-en/`, `R/390-fr/`, `R/390-en/` |
| Same walk of the lab before the change at 768 (blades, site, turbine)                                                                                                                                                                                                                                                                                                                                   | 19 shots                                                                               | `R/before-768/`                                    |
| Same camera, before / after, side by side: 5 overviews, 8 site views of the grass (2, 6, 20 m, grazing, horizon, house, trees, technical room), 5 far views, 10 hours of the day plus 6 horizons, 25 close-ups of the paper worlds, floors, cut, wires, nacelle                                                                                                                                         | `R/scripts/ab.mjs`, Metal GL, 1280 × 720, sim reset then paused                        | `R/ab-*/cmp-*.png`                                 |
| Stability: kit `flicker.mjs` in 5 worlds, both builds, at 1280 × 720 and at 390 × 844 @2; per-pixel heat maps (second difference accumulated per pixel, 3 thresholds); the same with the sim paused; close-ups of the alternator and the nacelle; slow dollies from 300 m to 3 m and bands of 20 % at 400, 300, 200, 150, 100, 60, 30, 8 m on both builds and both viewports; a 24 h day-cycle at ×3600 | `R/scripts/flicker2.mjs`, `heat.mjs`, `dollybands.mjs`, `daycycle.mjs`                 | `R/flicker-*`, `R/heat*/`, `R/dolly*/`, `R/*.log`  |
| Spoken guide: introduction and the turbine world, FR and EN, played in Chrome with autoplay allowed, sampled every 0.5 s                                                                                                                                                                                                                                                                                | `R/scripts/narr2.mjs`                                                                  | `R/narr-fr/`, `R/narr-en/`                         |
| Part sheets in EN and FR, 4 tabs, 48 sheet states at 3 widths (overflow measured in the DOM), 144 panels × 2 languages scanned for French in EN and for « (K22) »-type references                                                                                                                                                                                                                       | `R/scripts/specs.mjs`, `enscan.mjs`, `refscan.mjs`                                     | `R/specs/`, `R/specs390/`                          |
| Camera pivot: drag around the selected part, 14 parts in 5 worlds                                                                                                                                                                                                                                                                                                                                       | `R/scripts/pivot4.mjs`                                                                 | `R/pivot3-after/`                                  |

## Gates

| Gate                   | Result                                                   |
| ---------------------- | -------------------------------------------------------- |
| `npm run typecheck`    | pass                                                     |
| `npm run format:check` | pass (before `docs/qa.md` was added)                     |
| `npm test`             | **pass, 19 files, 468 tests**, none skipped or todo      |
| `npm run build`        | pass (narration check, `tsc`, `vite build`, 1 242 kB JS) |

**The standard's shortfalls**: none printed. This lab has no `src/standard.ts` and `public/lab.json` has no `status` field, so `npm test` has nothing to report as todo. Counts read from the repo: 5 worlds, 36 part ids (8 + 8 + 10 + 4 + 6), 8 drawing sheets (PL-01 to PL-08), spoken guide of 42 segments in FR and in EN, README in English first and French at the end.

The figures in the commit message were reproduced to the third decimal with the kit tool (my run, both builds): they are exact.

## Rule by rule (`docs/lab-quality.md`)

| §   | Rule                                             | Result                                                                                                                                                                                                                                                                                                                          |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Every moving part attached at a visible point    | ✓ close-ups of the tail hinge, boom, vane, wire loop, yaw bearing, nacelle in the walk; nothing in this commit moves a joint. One pre-existing note: D10                                                                                                                                                                        |
| 1   | Nothing floats, nothing sinks                    | ✓ measured on the 4 paper worlds: lowest point of the mast block, alternator stand, balancing post, blank, templates, shed frame = 0.5 mm above the paper floor (the floor sits 0.5 mm under its support); mast piece about 50 mm sunk in its 151 mm block as designed (53 mm measured); contact shadows 0.8 mm above the floor |
| 1   | Things turn the right way, speed the eye reads   | not re-checked: the commit does not touch the rotor's turn (visual cap 2.5 turns/s and blur disc, `src/sim/engine.ts`); the turbine and alternator views were seen turning with the blur disc                                                                                                                                   |
| 1   | A part sits where it acts                        | ✓ unchanged                                                                                                                                                                                                                                                                                                                     |
| 1   | The maker's dimensions before the model          | ✓ unchanged (`dims.ts`, 468 tests)                                                                                                                                                                                                                                                                                              |
| 2   | One machine, the same everywhere                 | ✓ same builders; but see D2: the technical room reads as another material on the site than in its own world                                                                                                                                                                                                                     |
| 2   | Every system has a place to look at it           | ✓ the technical room has its own world (shed)                                                                                                                                                                                                                                                                                   |
| 2   | A tool that teaches nothing is left out          | ✓ no cut in the shed and blades (`cutaway: false`); cut kept where it shows something                                                                                                                                                                                                                                           |
| 3   | Every prop reads as what it is                   | **D2** (technical room wall on the site), D4, D13; trees, house, mast, sock read well at 3 distances                                                                                                                                                                                                                            |
| 3   | The setting has had its polish pass              | partly: the grass is a clear gain at 6 to 20 m; D5, D6                                                                                                                                                                                                                                                                          |
| 3   | The water follows the physics                    | not applicable (no water)                                                                                                                                                                                                                                                                                                       |
| 3   | The device can be found in its setting           | ✓ unchanged: overview shows mast, house and room; selecting `wind-turbine` frames it at 9.6 m                                                                                                                                                                                                                                   |
| 3   | A warm, full, stable picture                     | **D1** (far meadow shimmers), **D3** (floor grid gone), D4, D5, D6, D7, D8, D9. Warm: yes. Full: better near, still empty beyond 40 m. Stable: steady at the default distances, not between 120 and 300 m                                                                                                                       |
| 4   | The camera turns around what you look at         | ✓ a 240 px drag around the selected part on 14 parts of the 5 worlds: the pivot lands on the part where the pointer is, the part stays within 0.21 of the screen centre (normalised), the camera distance changes by at most 1.7 m                                                                                              |
| 4   | Nothing is crushed at any width                  | ✓ no overflow measured in 48 sheet states (1280, 768, 390; FR, EN); at 390 the sheet opens by a tap on its grip and the specs read. Pre-existing: D11                                                                                                                                                                           |
| 4   | The spoken guide is the way in                   | ✓ the invitation shows on a first visit at the three widths (`R/sheets/first-visits.png`, `first-390.png`); see D11 for its place at 390                                                                                                                                                                                        |
| 5   | As much detail per device as Pelton              | not re-checked (content untouched by this commit)                                                                                                                                                                                                                                                                               |
| 5   | Title and description in both languages          | ✓ tagline in FR and EN, EN panels have no French (144 panels scanned, 0 hits). The static `<meta name="description">` of `index.html` is English only                                                                                                                                                                           |
| 5   | README English first, French at the end          | ✓ `## Français` at line 66                                                                                                                                                                                                                                                                                                      |
| 6   | The simulation is never tuned                    | not re-checked (untouched)                                                                                                                                                                                                                                                                                                      |
| 6   | Warnings said once; no « (K22) » for the visitor | ✓ 288 panel states scanned in FR and EN, 0 reference; manifests: 0                                                                                                                                                                                                                                                              |
| 7   | Spoken guide                                     | ✓ played in both languages, see below                                                                                                                                                                                                                                                                                           |
| 8   | The owner's past finds                           | see « The owner's test set » below                                                                                                                                                                                                                                                                                              |

## Defects, most severe first

No blocker. **3 major, 10 minor.** Verdict: **not ready for the owner's checkpoint** (D1 to D3 below).

### D1 (major): the new grass shimmers from afar, 8 to 30 times the previous picture, and 2.4 times on a phone at the default overview

- **What**: between 120 and 300 m from the ground, a slow zoom makes the meadow crawl in fine speckle. The kit's tool does not see it because it measures from the overview only (about 45 m away), where the grass improves (site dolly 0.985 → 0.869 %).
- **Measured** (share of pixels whose second difference exceeds 12/255; a slow dolly of 20 % over 150 frames, same path on both builds, sim not involved):

| Distance of the camera | 1280 × 720 before | 1280 × 720 after | 390 × 844 @2 before | 390 × 844 @2 after |
| ---------------------- | ----------------: | ---------------: | ------------------: | -----------------: |
| 400 to 320 m           |           0.241 % |          0.290 % |             0.276 % |            0.844 % |
| 300 to 240 m           |           0.272 % |      **2.224 %** |             0.400 % |        **7.334 %** |
| 200 to 160 m           |           0.125 % |      **3.753 %** |             0.272 % |        **6.089 %** |
| 150 to 120 m           |           0.206 % |      **2.103 %** |             0.350 % |        **2.772 %** |
| 100 to 80 m            |           0.472 % |          0.593 % |             0.564 % |            0.759 % |
| 60 to 48 m             |           0.807 % |          0.705 % |             0.235 % |            0.263 % |
| 30 to 24 m             |           1.681 % |          1.668 % |             0.221 % |            0.179 % |
| 8 to 6.4 m             |           1.869 % |          1.321 % |             1.060 % |            0.663 % |

- A slow orbit at 165 m: 0.032 → 0.113 % (1280), 0.079 → 0.220 % (390 @2).
- The kit tool on a phone (390 × 844 @2, overview): site dolly **0.277 → 0.666 %** (2.4 times), site orbit 0.113 → 0.092 %. The heat map shows the excess over the whole far half of the meadow (`R/heat390-site-dolly.png`: left after, middle before, right after with the bump off).
- **Cause, verified by a shader probe** (the lab's own file, not edited: I patched the compiled material in the page): with the normal perturbation of `grassDetail` switched off, 200 → 160 m falls to 0.129 % (1280) and 0.237 % (390 @2), i.e. the previous picture (0.125 and 0.272). With the bump off, 240 → 300 m: 0.293 % and 0.380 %. The colour tufts are not the cause. In `src/three/detail.ts` the `normal_fragment_maps` block (line 69 to 82) fades the whole bump with `dtKeep(… * 1.6)` only (line 73), although it also sums the 4.3 cells/m octave (finite difference `e = 0.08` m): between about 0.2 and 0.5 m per pixel (120 to 300 m at a grazing angle) that octave is under two pixels and is not faded. The header comment promises « each fading before it is under two pixels ». Replacing the fade by the highest octave's (`* 4.3`) cut the 1280 case to 0.293 % but left 2.3 % on the phone, so my guess is that the 1.6 octave also needs an earlier fade (or no bump past about 60 m).
- **Where**: site, from 120 m to 300 m, both languages, any width; worst on 390 × 844 @2.
- **Shots**: `R/dollyshots/after-far-d2.png` (red = shimmering pixels, one frame at 245 m), `R/dollyshots/after-far-speckle.png` (after frame 60, after frame 61, before frame 60: the speckle changes from one frame to the next, the before is smooth), `R/ab-site-far/cmp-20-far-300m.png`, `R/heat390-site-dolly.png`. Logs: `R/dolly-slow.log`, `R/dolly-slow2.log`, `R/dollyprobe/`.
- **Also**: `detail.ts` is shared with Pelton, Mill and the ram pump (docs/picture.md: « the same code »): their far meadows very likely have the same defect (not checked there).
- **No pop**: the local spike (frame difference over the median of its 16 neighbours) stays at 1.00 to 1.05 in every band above; the 4.5 seen at 6.5 m in a 300 → 3 m dolly is the same on the before build (5.5): the camera passing close to the anchors, not a fade.

### D2 (major): the technical room's plywood reads as grey-khaki on the site, and as peach-cream in its own world

- **What**: the recolour of `TIMBER.osb` / `woodDark` was tuned on the paper worlds. On the site (Neutral at 1.2, blue hemisphere light, green ground) the room's back wall goes from brown plywood `#6a5c3a` (red minus blue = +48) to `#5a5b4d` (+13) at 08:00: a grey slab. In full sun it is a pale beige box (14:00 to 19:30), at night a grey box. It reads like concrete or plaster, and does not look like the plywood room of the Local world (`#f3d1a1`). The house's window frames went from brown to grey-green in the same way; the cable post (dark brown) and the trees' trunks are fine.
- **Where**: site, part `technical-room`, any hour, any width.
- **Shots**: `R/ab-site-grass/cmp-15-tech-room.png`, `R/sheets/zoom-techroom.png`, `R/ab-overview/cmp-01-site-overview.png`, `R/ab-hours/sheetB.png`, `R/ab-site-grass/cmp-16-house.png`.
- **Likely**: `src/three/timber.ts` (one colour for two lights), `src/three/shed/room.ts`. A site-specific osb tone (warmer, about 25 % more red) would do.

### D3 (major): the paper floor lost its grid in the four paper worlds

- **What**: the « drafting table » floor (`paperFloor`, a paper with a metric grid) is now a flat cream plane. The floor's red channel is at 250 to 255 on 100 % of its pixels (0 % before), so the grid lines, drawn in the albedo at 16 %, are clipped away. Spread of the floor's pixels (1st to 99th percentile, levels of 255, R / G / B): turbine overview 8 / 9 / 11 → 2 / 3 / 7; blades overview 4 / 3 / 4 → 1 / 1 / 4. In the close-ups the grid was clearly visible before and is not after. Also, the floor no longer gives the scale or the sense of the horizon in the grazing views.
- **Where**: turbine, alternator, blades, shed; both languages; every width.
- **Shots**: `R/sheets/zoom-wear-blade.png` (left before: grid; right after: none), `R/ab-floor/cmp-52-floor-grazing.png`, `R/ab-floor/cmp-53-floor-topdown-post.png`, `R/ab-nac/cmp-93-alt-close-paused.png`.
- **Likely**: `paperFloor` in `src/three/common.ts`: its albedo `239 / 230 / 211` lit by the studio's light and exposure 1.2 comes out at the ceiling. Lower the floor's albedo by a few percent (or raise the grid's strength) so that R stays under about 245.

### D4 (minor): pale parts on the cream floor have less contrast

Colour distance (ΔE 76) between a part and the floor, same camera, sim paused (`R/contrast/`, `R/scripts/contrast.mjs`):

| Part                                |      Before |           After |
| ----------------------------------- | ----------: | --------------: |
| blade blank (overview / from above) | 16.8 / 17.3 | **11.5 / 11.0** |
| hub disc                            | 15.3 / 16.5 | **10.5 / 10.9** |
| alternator moulds                   |        16.1 |        **12.0** |
| blade (lit wood)                    | 32.0 / 35.1 |     21.9 / 22.7 |
| rotor (turbine overview)            |        50.1 |            32.2 |
| tail vane                           |        17.3 |   20.8 (better) |
| station templates                   | 29.9 / 47.8 |     30.4 / 28.1 |

Everything stays above 10 and the blank is still seen as a plank, but blank, hub disc and moulds are now soft pastel on pastel. The blade is still recognisably wooden (`#f8d49e` lit, mottled by the wear). Shots: `R/ab-paper/cmp-41-blades-blade-blank-close.png`, `R/ab-paper/cmp-41-blades-blade-close.png`, `R/ab-overview/cmp-04-blades-overview.png`.

### D5 (minor): the grass smears into streaks along the view direction below 3 m

At 6 and 20 m it reads as a meadow with dry and green patches (a gain on the smooth plane). At 1.2 m eye height and at 0.45 m it is a soft mottled smear stretched away from the camera, with no blade, tuft or stalk shape; the lower right of the default overview shows the same streaks. Shots: `R/ab-site-grass/cmp-10-grass-2m.png`, `cmp-14-grazing.png`, `cmp-11-grass-6m.png`, `cmp-12-grass-20m.png`, `R/sheets/zoom-grass-fg.png`.

### D6 (minor): the plain is still empty beyond 40 m, and it ends on a hard square edge

Nothing new here, but § 3 asks that a view never feels empty. Beyond the cluster (mast, trees, house, room, sock) the meadow is a 360 m square with a straight edge against the sky: from 100 m up the tabletop shows. There is no fog seam (the fog is 3 % at 360 m, so the sky's pale horizon and the fog colour never meet); the hard line is the ground's edge. What I would add: a far tree line and low hills or hedgerows at the edge to hide the square; a dozen scattered shrubs and rocks; a fence or dry-stone wall along the house; a track between the house, the room and the mast; flowers by the same shader (specks of colour); a second, smaller group of trees. Shots: `R/ab-site-far/cmp-20-far-300m.png`, `cmp-22-edge-of-world.png`.

### D7 (minor): sunrise and sunset skies are a saturated rainbow

At 07:00 (and 19:30 to 20:30) the Preetham sky under Neutral shows teal, then mint and yellow, then a salmon band with a hard upper edge (the band exists before, paler). The middle of the day (blue overhead, pale at the horizon) and the night (navy with stars, lit windows) are good. Shots: `R/ab-hours/cmp-30-hour-07.0-overview.png`, `R/ab-hours/sheetA.png`, `sheetB.png`, `sheetC.png`, `sheetD.png`.

### D8 (minor): close-ups of the alternator shimmer about 70 % more than before (not the wear), and the shed's edges on a phone

Alternator rim close-up, sim paused, 150 frames: orbit 0.147 → 0.248 %, dolly 0.554 → 0.675 %; in cut mode orbit 0.145 → 0.240 %, dolly 0.683 → 0.863 %; pixels flickering in over a quarter of the frames 245 → 463 and 114 → 263. The nacelle close-up is unchanged (0.542 → 0.527 %, 1.463 → 1.369 %). Wear is not the cause: with the wear stripped from the 32 worn materials the figures are identical (0.248 and 0.675 %). The heat sits on the chamfers of the nuts and rods and the rotor's rim, so it is the new studio's reflections and soft shadow edge on small metal parts. The alternator's figures stay under 0.9 %. On a phone (390 × 844 @2) the shed shimmers more too: orbit 0.046 → 0.090 %, dolly 0.579 → 0.878 % (pixels flickering in over a quarter of the frames 418 → 879, the wall's edges and the post). Shots: `R/heat-close-rim.png`, `R/zoom-stud-frames.png`.

### D9 (minor): the contact shadow has a pale rim at the foot

The darkening starts about 2.4 cm out from the foot (it rises over the first fifth of the fall-off), so between the plate and the shadow there is a lighter line (levels 246 to 252, then 238 at the darkest, on a 253 floor), 3 % at most. Visible at normal contrast as a faint glow round the balancing post's plate (`R/ab-floor/cmp-51-floor-shadow-blades.png`), clear when stretched (`R/zoom-post-base-after.png`). No hard line, no z-fighting: a dolly from 14 m to 1.2 m at a grazing angle over the mast block gives 0.708 % against 0.609 % before, no spike (1.04). The shadow under the mast block, stand and post sits well (`R/ab-paper/cmp-40-turbine-block-ground.png`).

### D10 (minor, pre-existing): exploded alternator, the air-gap gauge floats alone above the machine

At full explode the small gauge (« entrefer ») rises and hangs in the air with nothing to measure. Same on the before build. `R/ab-cut/cmp-76-alt-exploded.png`.

### D11 (minor, pre-existing): « Labels: All » overlap at 768 and 390; the invitation bubble covers the world switch at 390

Turbine, alternator, blades and shed: several labels sit on top of each other and « DISQUE DE MOYEU / EXTRADOS » is cut at the panel's edge. Same at 768 on the before build (`R/sheets/blades768.png`). `R/390-fr/033-alternator-labels.png`, `047-blades-labels.png`. On a first visit at 390 the kit's invitation bubble (« Commencer par la visite guidée · 1:50 ») sits over the second row of the world switch (« Local », « Tech room »): `R/sheets/first-390.png` (kit feature of 0.4.0, dismissable).

### D12 (minor): the stator resin and the cut faces went from straw to saturated orange

Alternator overview, stator resin `#f3db9c` → `#f8b070`; the turbine's alternator part `#b0a15d` → `#df9e47`; the cut caps in cut mode follow (`R/ab-cut/cmp-71-alt-cut-close.png`, `cmp-72-alt-cut-front.png`). It reads as amber polyester resin and not as timber, so it is plausible, but it was not in the plan (only the timber was recoloured). The charge controller's blue is also stronger (`#9acbef` → `#3d9af1`) and the battery darker (`#6f757a` → `#53524d`): they read as what they are.

### D13 (minor, pre-existing): the page's static description is English only

`index.html` `<meta name="description">` is « Interactive 3D lab of a homemade Piggott wind turbine » whatever the language; the title is the name « Piggott Lab » and the tagline shown in the app is translated.

## Answers to the lead's questions

### Is the high figure of the turbine and alternator the turning rotor?

**Yes, you are right.** With the sim paused (`engine.set({ running: false })`, rotor at rest) and the same 150-frame moves:

| World / move     | Before, turning | Before, paused | After, turning | After, paused |
| ---------------- | --------------: | -------------: | -------------: | ------------: |
| turbine orbit    |         1.391 % |        0.021 % |        1.324 % |   **0.026 %** |
| turbine dolly    |         1.942 % |        0.108 % |        1.849 % |   **0.113 %** |
| alternator orbit |         1.109 % |        0.117 % |        1.136 % |   **0.156 %** |
| alternator dolly |         1.703 % |        0.461 % |        1.773 % |   **0.506 %** |

The per-pixel heat map shows it too: with the rotor turning, the whole swept disc of the blades is red in the turbine world and the four long rotor rods and the bell in the alternator world; with the rotor at rest only edges are marked (`R/heat-turbine-orbit.png`, `R/heat-alt-dolly.png`, `R/heat-alt-orbit-paused.png`). So 98 % of the turbine's figure is the intended rotation. By eye, the turbine and alternator are steady: the blur disc fades in as designed, and at 30 frames a second the turn is about 29° a frame, no wagon-wheel. The alternator's dolly at rest (0.506 %) is the highest static figure: thin rods and nut edges; it was already 0.461 % before. Spikes stay under 1.6 everywhere (largest 1.51, shed orbit).

### Does each colour read as what it is? Before / after, same camera

- **Timber in the paper worlds**: the orange is gone and the pine stays: shed back wall `#f0e1c3` → `#f3d1a1`, post `#ad815d` → `#aa8352`, blade (blades overview) `#e3be8e` → `#f8d49e`, mast block front `#ad8260` → `#edc08b` (a touch pale), alternator stand top `#ac805c` → `#edbf89`. Shed side wall `#d5b585` → `#eacfa2`. Measured values match `docs/picture.md`. At close range the wear gives a streaky, wood-like mottling on the blades (`R/sheets/zoom-wear-blade.png`): better than the flat tint.
- **Pale parts on the floor**: D4 (the table lists them with their ΔE).
- **Site**: D2 for the wall; sky and trees good; the house's slate and windows are the same as before (lit windows read as warm lamps at night); concrete bases are a little bluer; guy wires still black.
- **Batteries, cables, controllers**: see D12; the cables (red and black) are unchanged and read.

### The site: sky, hours, night

- Sky: blue overhead, pale and warm at the horizon, no burnt white (before: white from 30° up). Fog and sky never meet in a seam (D6): the horizon line is the meadow's edge.
- Hours checked on both builds (05, 06, 07, 12, 14, 18, 19.5, 20.5, 22, 02 h): good by day and night; D7 at dawn and dusk; the moon and stars, lit windows are fine. I set the hour with `engine.state.hour` (the engine starts at 08:00, `START_HOUR = 8`, so `simTime = (hour − 8) × 3600`, not `(hour − 12) × 3600`), sim paused. A 24 h run at ×3600 (779 frames): the only local jump over 2 is at 06:30, 2.19 now and 2.09 before (a sky change that is on both builds, not introduced by this change). Day-cycle logs: `R/daycycle-after.json`, `R/daycycle-before.json`.
- Mast and guy wires: they stay clean thin lines at 30 m; at 100 m they merge into the mast's dark tripod, and nothing breaks up or flickers (heat map of the site dolly: the marks on the mast and wires are the camera's motion, the same as before). `R/ab-wires/wires-crops.png`.
- Trees, house, room: no regression in shape; D2.

### The paper worlds: contact shadows and wear

- **Contact shadows**: under the mast block, the alternator's stand and the post. Soft, no hard line, no z-fight (D9 for the pale rim). They add the weight the floor lacked.
- **Wear**: on the blades, the hub disc and the nacelle, a slow mottling; at 1.35 m it reads as wood grain / patina, on the steel it is invisible (0.05 on colour, 0.1 on roughness). No smudge at any distance up to the overview.

### Stability, summarised

Kit tool, 1280 × 720, Metal (all spikes under 1.6; the lab's own figures reproduced):

| World      | Move  |   0.4.0 |     now |
| ---------- | ----- | ------: | ------: |
| site       | orbit | 0.289 % | 0.239 % |
| site       | dolly | 0.985 % | 0.869 % |
| turbine    | orbit | 1.391 % | 1.324 % |
| turbine    | dolly | 1.942 % | 1.849 % |
| alternator | orbit | 1.109 % | 1.136 % |
| alternator | dolly | 1.703 % | 1.773 % |
| blades     | orbit | 0.098 % | 0.074 % |
| blades     | dolly | 0.477 % | 0.438 % |
| shed       | orbit | 0.081 % | 0.090 % |
| shed       | dolly | 0.967 % | 0.914 % |

At 390 × 844, device pixel ratio 2:

| World      | Move  |   0.4.0 |              now |
| ---------- | ----- | ------: | ---------------: |
| site       | orbit | 0.113 % |          0.092 % |
| site       | dolly | 0.277 % | **0.666 %** (D1) |
| turbine    | orbit | 2.482 % |          2.366 % |
| turbine    | dolly | 3.418 % |          3.274 % |
| alternator | orbit | 1.010 % |          0.988 % |
| alternator | dolly | 1.535 % |          1.509 % |
| blades     | orbit | 0.043 % |          0.037 % |
| blades     | dolly | 0.180 % |          0.149 % |
| shed       | orbit | 0.046 % |          0.090 % |
| shed       | dolly | 0.579 % |          0.878 % |

(Shed on the phone: both small, the dolly's pixels flickering in over a quarter of the frames go from 418 to 879, the edges of the wall and the post.) No pop and no z-fighting patch found: the stator, rotor, coils, the section caps in cut mode and the nacelle's covers show only edge marks in the heat maps (`R/heat-close-rim.png`), the same places as before; the contact shadows give no spike. At 1280 × 720 @2 the site improves (dolly 1.010 → 0.880 %, orbit 0.295 → 0.222 %).

### Nothing else regressed

Cut (section planes and caps), x-ray, explode, isolate, labels, every mode: looked at in all five worlds at 1280 (FR and EN), at 768 and at 390 (FR and EN); the console stayed clean in the 6 walks (0 error each), the guide's 2 runs, the specs and the pivot runs. Cut in the alternator keeps its planes and caps; x-ray, isolate and explode behave as before.

### The spoken guide (no audio generated, no credit spent)

- **FR**: the introduction ran to its end (110.2 s), then the turbine world (34.8 s). **EN**: 112.2 s and 40 s. Subtitles visible in every sample (65 of 65 and 6 of 6 in FR; 65 of 65 and 14 of 14 in EN), the « Voix de synthèse » / « Synthetic voice » label shown, one playing sample with an empty caption in the EN introduction (a segment boundary), 0 request failed, 0 console error.
- The 3D followed the voice in both languages: the worlds changed at the cues (blades, turbine, alternator, shed, then the site; some intermediate worlds fell between two samples), then the assembly, installation, simulation, lessons and plans modes in turn and the site again; the turbine's section turned on at 23.1 s (FR) and 24.3 s (EN) and off at the end. Under SwiftShader each first visit to a world froze the page for 7 to 9 s (shader compile and world build), so the samples are sparse there; not representative of a GPU.
- Not judged: the voice itself.

### The owner's test set (§ 8)

| Past find                             | This lab, this change                                                                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The spring in the void                | No spring. Joints (tail hinge, boom, vane, wire loop, yaw bearing) are attached in the close-ups. D10: the exploded air-gap gauge floats alone (pre-existing) |
| The wheel turning backwards           | Not touched by the commit; the rotor turns with a blur disc, cap 2.5 turns/s; direction not re-measured                                                       |
| The crushed specs                     | ✓ no overflow at 1280, 768, 390 in FR and EN (48 states)                                                                                                      |
| The untranslated title                | ✓ EN panels contain no French (144 panels); title and tagline in both languages (D13 on the static meta)                                                      |
| The fixed camera pivot                | ✓ the drag turns around the selected part (14 parts)                                                                                                          |
| The missing equipment room            | ✓ the shed world exists, with the six devices in the order of the current                                                                                     |
| The chain not attached                | n/a; the cables reach their devices (shed close-ups); the cable run reaches the room                                                                          |
| The jellyfish tree                    | ✓ trees read as trees at 3 distances; the colour of the trunks is fine                                                                                        |
| The sunk generator                    | ✓ measured: nothing floats or sinks on the paper floors (0.5 mm), the mast sits 53 mm in its block by design. The contact shadows hide nothing                |
| A lab called finished with two worlds | ✓ five worlds, 36 parts, 8 sheets; I did not call it finished                                                                                                 |

## Not checked

- Real phones (iPhone, Android), Safari, Firefox: this review ran in Google Chrome headless on macOS, Metal for the stability figures and SwiftShader for the walks. The phone figures are Chrome emulating 390 × 844 at ×2 with the kit's « full picture » for automated browsers (MSAA 4, pixel ratio 2): a real phone may adapt its pixel ratio down and show less or more of D1.
- The voice itself (how it sounds, the pace), the lip-sync of the subtitles to the audio, the rest of the 42 segments.
- Whether the kit's governor lowers the quality on a slow device with this lab's new shaders (the wear and grass programs are extra shader variants; compile time on a real GPU).
- The direction and speed of the rotor against the wind (not touched).
- Pelton, Mill and the ram pump: D1 very likely applies there (same `detail.ts`), not checked.
- The simulation numbers, the lessons, the drawings, the narration scripts (untouched by this commit).
- Part sheets at 390: the specs were checked for one part in FR and EN (readable); the other 35 only for overflow by script.

## After the review: what was fixed, and what was not (lead; the reviewer wrote this report for `1feeffe`)

The fixes are in the commit that follows `1feeffe`, checked by the lead, not yet re-walked by the reviewer.

| Defect                                                     | Status            | What was done                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 the grass shimmers from afar                            | **Fixed**         | The bump's two octaves fade each with their own size on screen; the patterns' fade is tighter; tufts and bump weaker (`detail.ts`). 200 → 160 m, 1280 × 720: 3.753 → 0.129 % (0.4.0: 0.125 %); 390 × 844 at ratio 2: 6.089 → 0.596 % (0.272 %), 300 → 240 m 7.334 → 0.473 % (0.400 %). Phone, default overview, site orbit / dolly: 0.113 / 0.277 (0.4.0) → 0.095 / 0.218 %. |
| D2 the room's plywood reads grey on the site               | **Fixed**         | The site's shed (`buildShed(true)`), house and cable post use the kit's own timber, the paper worlds the recoloured one.                                                                                                                                                                                                                                                     |
| D3 the floors lost their grid                              | **For the owner** | The ram pump's floor is the same.                                                                                                                                                                                                                                                                                                                                            |
| D4 pale parts less contrasted against the cream            | **For the owner** | Not changed.                                                                                                                                                                                                                                                                                                                                                                 |
| D5 grass smears into streaks below 3 m                     | **Softer**        | Tufts and bump weaker; the streaks at grazing angles remain faintly.                                                                                                                                                                                                                                                                                                         |
| D6 the plain is empty beyond 40 m                          | **Open**          | A far tree line, scattered shrubs, a track and a fence would fill it: a content decision.                                                                                                                                                                                                                                                                                    |
| D7 dawn and dusk skies are a saturated rainbow             | **Open**          | Under Neutral at 1.2; not changed.                                                                                                                                                                                                                                                                                                                                           |
| D8 shimmer on small metal parts and on the shed on a phone | **Open**          | Not the wear (the reviewer stripped it: identical). Shed on a phone, orbit / dolly: 0.046 / 0.579 → 0.090 / 0.878 %.                                                                                                                                                                                                                                                         |
| D9 the contact shadow has a pale rim at the foot           | **Open**          | The shadow darkens nothing inside the footprint, by design. The shadows are no longer fogged.                                                                                                                                                                                                                                                                                |
| D12 the stator resin turned saturated orange               | **Fixed**         | `#c98f3d` → `#c8a063`.                                                                                                                                                                                                                                                                                                                                                       |
| D10, D11, D13                                              | **Not touched**   | Pre-existing.                                                                                                                                                                                                                                                                                                                                                                |

### Measurements after the fixes (`flicker.mjs`, 1280 × 720, 150 frames a move, Metal)

| World      | Move  |   0.4.0 | `1feeffe` |     now |
| ---------- | ----- | ------: | --------: | ------: |
| site       | orbit | 0.289 % |   0.239 % | 0.245 % |
| site       | dolly | 0.985 % |   0.869 % | 0.879 % |
| turbine    | orbit | 1.391 % |   1.324 % | 1.329 % |
| turbine    | dolly | 1.942 % |   1.849 % | 1.856 % |
| alternator | orbit | 1.109 % |   1.136 % | 1.140 % |
| alternator | dolly | 1.703 % |   1.773 % | 1.778 % |
| blades     | orbit | 0.098 % |   0.074 % | 0.074 % |
| blades     | dolly | 0.477 % |   0.438 % | 0.441 % |
| shed       | orbit | 0.081 % |   0.090 % | 0.090 % |
| shed       | dolly | 0.967 % |   0.914 % | 0.914 % |

No spike over 1.55. `npm test`: 468 tests pass; `npm run format:check` passes.
