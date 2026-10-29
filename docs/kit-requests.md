# Requests to the lab kit

Things the Piggott lab would like from `@onigam/lab-kit` (BRIEF.md §2: a missing building block becomes a change of the kit
for all labs, never a local workaround). Written by the physics role, wave 1. The lab wrote the first four locally, in `src/sim`,
and would drop its copy when the kit has them.

## 1. Lead-acid battery, three-phase bridge, dump load and low-voltage disconnect in `sim/electric`

`sim/electric` has `CU_RHO`, `cableResistance` and a 15S LiFePO4 `ocv`. The research said the electrical side "reuses the kit (rectifier, battery,
cable, dump load)": it does not. The lab wrote (and tested) in `electrical.ts` and `alternator.ts`:

- a 12 V lead-acid resting-voltage curve against state of charge, with an internal resistance and a charge polarisation that makes a
  full battery refuse the current (scaled by 2 or 4 for 24 and 48 V banks);
- the three-phase diode bridge with its equivalent DC resistance `2·R_ph + (3/π)·p·ω·L` and the air-gap power `I·(V_oc − R_x·I)`, which keeps the
  books closed;
- a shunt dump load that holds the bus at a set voltage up to a current limit, and a low-voltage disconnect with hysteresis;
- the cable loss share of a power at a voltage (`cableLossShare`), the arithmetic of the K21 table.

- **What**: `leadAcidOcv(soc, cells)`, `batteryResistance`, `bridgeDc(...)`, `shuntRegulate(...)`, `lvd(...)`, `cableLossShare(...)`, with the same
  conventions as the existing `ocv` and `cableResistance`.
- **Why**: any lab with a battery bank (Pelton on 48 V, the mass heater, the bioclimatic house, a PV lab) rewrites the same four functions.
- **Needed by**: Piggott lab (done locally), Pelton lab (has its own 48 V version in `engine.ts`).

## 2. Wind and statistics helpers in `sim`

`weibullScale`, `weibullPdf`, `weibullCdf`, `weibullQuantile`, `gamma`, `normalCdf`, `normalQuantile`, a seeded generator (mulberry32 + Box-Muller) and an
Ornstein-Uhlenbeck process read on a fixed time grid, so that a stochastic run is identical at any frame rate (`wind.ts`, `physics.ts`).

- **What**: put them in `@onigam/lab-kit/sim/stats` (no DOM).
- **Why**: every lab with a variable resource needs a seeded, frame-rate independent noise (wind, sun and clouds, a water source, a demand profile)
  and a distribution for the yearly view; the Pelton and ram labs have none.
- **Needed by**: Piggott lab; the solar and wind labs of the roadmap.

## 3. `LineChart`: a clipped plot area and options that can change

`LineChart` draws the series with `ctx.stroke()` and no clip, so a series that goes above `yMax` is drawn outside the plot, over the title and the
legend. The power curve needs the lines of the wind power and of the Betz limit, which grow with the cube of the speed, to leave the chart through
the top while the rotor and battery curves stay readable; the lab replaces the points above `yMax` by `NaN` (the pen lifts) and the line stops short of the edge.
And `yMax` is given once, at construction: the lab keeps a reference to the options object and changes it before `draw()`, which works because the chart stores
the object, but is not an interface.

- **What**: clip the plot rectangle (`ctx.save(); ctx.rect(...); ctx.clip()`) when `yMax`/`yMin` are given, and add `setOptions({ yMin, yMax })` (or accept
  `yMax: () => number`).
- **Why**: any chart that compares a fast-growing reference (power in the wind, available head, the theoretical limit) with a real curve.
- **Needed by**: Piggott lab (the power curve and the Betz limit); the Pelton lab would use it for the hydraulic power.

## 4. A loss-bar helper

Pelton's panel builds the "from the resource to the battery" bar by hand (a `loss-bar` flex row of coloured `span`s and a `loss-legend`), with colours written inline.
The Piggott panel does the same with the kit's CSS variables (`--water`, `--copper`, `--sun`, `--violet`, `--ink-4`). The CSS classes exist in the kit, the builder does not.

- **What**: `lossBar(rows: { label: string; watts: number; colour?: string }[])` returning the bar and its legend, with the kit palette as default.
- **Why**: the same chain of losses is shown by every energy lab, and the colours should not be chosen lab by lab.
- **Needed by**: Piggott lab, Pelton lab, any lab with a chain of conversions.

## 5. Importing the kit under Node without configuration

`dist/**/*.js` imports its siblings without extensions (`./lang`), which Node's ES module resolution cannot follow: a test that renders a panel (which imports
`@onigam/lab-kit/i18n` and `/ui`) fails with "Cannot find module …/dist/i18n/lang". Each lab needs `test.server.deps.inline: ['@onigam/lab-kit']` in its
`vite.config.ts` (the Piggott lab added that one line; the ram lab has it too).

- **What**: emit `.js` extensions in the compiled imports of the kit (or an `exports` map that Node can follow).
- **Why**: a panel smoke test should not need a bundler's help, and the kit is imported by the Node tests of `src/sim` only through `sim/*` today.
- **Needed by**: every lab that tests its panel (ram, Piggott).

## 6. A fake DOM for panel tests

`src/panels/test-dom.ts` (a small stand-in for `document`, the canvas context and `ResizeObserver`, with `find`, `querySelector`, `click`, `dispatch`) is copied from lab
to lab. It belongs in the kit as `@onigam/lab-kit/testing`, with `installFakeDom()`.

- **What**: publish it with its small API.
- **Why**: one copy to maintain; the labs' panel tests stay short.
- **Needed by**: ram lab, Piggott lab.

## 7. Following a scripted change: `slider` and `toggle` handles

A scenario can move a slider (the wind of the storm) or flip a switch (the brake, the battery) while the panel is open, and the kit does not re-render a panel in
simulation mode. `slider()` and `toggle()` return a bare `label`, so the lab finds the `input` and the `output` with `querySelector` to follow the simulation.

- **What**: return `{ el, set(value) }` (or put a `data-key` on the element and offer `syncControls(root, values)`).
- **Why**: every lab with scripted scenarios (ram: the stroke nut; Piggott: the wind ramp, the brake, the battery) has the same problem.
- **Needed by**: Piggott lab (done with `querySelector` in `followScript`), ram lab.

## 8. Seconding the ram lab's requests

`StripAlarm` with an action (here: close the brake switch, reconnect the battery from the strip) and a `title` on `StripValue` (for the definition of λ or Cp). The
panel of the Piggott lab would use both. A `CurveChart` with its own units (ram lab's request 1) would serve the power curve and the Cp(λ) chart, which use `LineChart` with markers.

## 9. The ram lab's 3D helpers, in the kit (3D role, wave 2)

The Piggott worlds needed `mergeStatic` / `dynamic()` (one mesh per material, colours in the vertices), the section tool `CutKit` (clipping plane, flat caps drawn from the 2D
section of each part, now with a tint per cap), `lathe` / `hexNut` / `paperFloor` / `FlowDots`, and the widened thin line with its picking (`minWidthMaterial`, `pickAlong`: a 60 mm mast or a 4 mm guy
is invisible from 40 m). All of it was ported from the ram lab (`src/three/merge.ts`, `cut.ts`, `common.ts`, `site/pipes.ts`) with small changes and is now in a third repository.

- **What**: `@onigam/lab-kit/three/extras` (or merged into `three`): `mergeStatic`, `dynamic`, `CutKit`, `lathe`, `hexNut`, `paperFloor`, `FlowDots`, `minWidthMaterial`, `pickAlong`, plus the sky of the site worlds (`createSky`: Preetham sky,
  sun by the hour, night, shadow aimed at a point).
- **Why**: three labs carry the same 700 lines; a fix of the merge (the mirrored meshes, the clipped materials) must reach all of them.
- **Needed by**: ram lab, Piggott lab; Pelton and the next labs with a landscape.

## 10. A way to attach an overlay to a part without making it a part's mesh

The blur disc of the rotor (a translucent sheet that must never be picked, ghosted or hidden by isolate) and the section caps are kept out of `PartEntry.meshes` by setting
`mesh.userData.ownerPart` before `registry.add` (the registry skips meshes that already have an owner), and the world hides them itself when the part is ghosted or hidden. It works but depends on that detail.

- **What**: `registry.overlay(partId, object)`: the object follows the part (explode), is excluded from `meshes` and `pickables()`, and is hidden by the registry when the part is `hidden`, `ghost` or `wire`.
- **Why**: same need for flow dots, sections, blur sheets and water in every lab.
- **Needed by**: Piggott (blur disc, caps), ram (water, caps), Pelton (jets).

## 11. `registry.bounds` and instanced meshes

`PartRegistry.bounds(id)` uses `Box3.setFromObject(object, true)`, which for an `InstancedMesh` reads a bounding box that three computes once; a world that changes the instance matrices (the trees of the site follow
`obstacleHeight`) must call `computeBoundingBox()` itself, otherwise `frameParts` frames the old size.

- **What**: have `bounds` call `computeBoundingBox()` on instanced meshes (or document it).
- **Needed by**: Piggott (trees), ram (forest tiles).

## 12. Guide steps with a part that moves along a curve or turns

Some insertion paths are not a straight offset: the tail sleeve slides up an inclined pipe and the rods turn into their nuts. `registry.add(..., explode, custom)` covers the straight ones (and a `custom(f)` that moves
sub-groups, as the blades world does for the plywood triangle); an `explode` that is a function of `f` returning a position and a rotation would let the guide show a part that screws in.

- **Needed by**: Piggott (nuts, rods, sleeve), the ram lab (the stroke nut).

## 13. An SVG chart helper for the sheets (drawings role, wave 3)

`PL-08` plots seven curves, a rating scale and bars in paper space; the kit has `LineChart` for the live canvas panels and nothing for an A3 SVG. `src/drawings/chart.ts` (ported from the
ram lab's `hydraulic/chart.ts`, second copy) draws the frame, the grid, the ticks with their labels, the axis titles, polylines, markers and text at data coordinates.

- **What**: `Chart` in `@onigam/lab-kit/drawings` (axes with `min`, `max`, `step`, `label`, `fmt`; `X`, `Y`, `frame`, `line`, `hline`, `vline`, `marker`, `text`).
- **Why**: two labs carry the same 150 lines; a fix of the label placement should reach every sheet.
- **Needed by**: ram lab (D09), Piggott (PL-08); every lab with a performance sheet.

## 14. Text and table helpers for the sheets

`View.text` does not wrap and `Drawing.table` does not wrap either, so every lab rewrote the same helpers: `wrap` (greedy, by estimated width), `note`, `heading`, `grid` (a table with wrapped cells and a
height that follows its content), `box` (a framed note with a title), `marksLegend`, `balloon`, `dimH` / `dimV` (a dimension line placed at a model coordinate instead of a paper offset) and `tube2d`.
`src/drawings/draw.ts` is the third copy.

- **What**: the same functions in `@onigam/lab-kit/drawings`, with the kit's own text-width estimate (the one that `estW` guesses).
- **Why**: the three copies already differ in small ways; the sheets' tests of "no text on text" rely on the same estimate.
- **Needed by**: ram lab, Pelton, Piggott.

## 15. What the title block takes, and a few details of the frame

`Drawing.frame` draws a title block of 178 × 38 mm at the bottom right and, left of it, the projection symbol (x from 210); a sheet has to know that rectangle to stay clear of it, and every lab copies the
numbers 232 / 249. Also: `scale` is a plain string of at most about 12 characters (a sheet with several scales writes `1:2·1:5·1:10`), `HatchKind` has no `resin` or `concrete` (the sheets use `plastic`
and `earth`), and `View.polyline` cannot draw a hole (a plate with its cut-out is drawn as a plate and a paper-coloured shape on top).

- **What**: export `TITLE_BLOCK = { x0, y0, w, h }` (and the projection symbol's box) from the kit; add `resin` and `concrete` hatches; accept a hole (`holes: Pt[][]`, even-odd) in `View.polyline`; an angle dimension
  `View.angle(centre, radius, a0, a1, label)` (the sheets draw an arc and a text by hand four times).
- **Why**: layout checks in the tests (nothing under the title block) and legible sections without tricks.
- **Needed by**: Piggott (PL-03, PL-04, PL-05), the ram lab (chamber section).
