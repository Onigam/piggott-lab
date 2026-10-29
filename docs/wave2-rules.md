# Wave 2 rules (3D role ‖ data role)

Read `BRIEF.md`, `docs/research.md` (§2 figures, §3 dimensions, §4 worlds, §7 safety) and `docs/physics.md` (§7 findings) first.
Two agents work **at the same time in the same checkout**, each on its own files. Nothing here overrides `BRIEF.md`.

## The contract: `src/part-ids.ts`

36 ids in 4 worlds (`site`, `turbine`, `alternator`, `blades`), frozen. A world's `registry.add(id, …)` registers exactly the
ids of `partIds(world)`, no more, no fewer; the catalogue has one entry per id with the same `scene` and `category`. An id you
think is missing or wrong: say so in your report, never add one, never edit `src/part-ids.ts`.

Links between worlds (the lead wires them in `src/lab.ts`): `wind-turbine` (site) opens `turbine`; `rotor` opens `blades`;
`alternator` (turbine) opens `alternator`. A parent part is ONE registered part that contains its children as meshes (like the
ram lab's `waste-valve`); the detailed world builds the same pieces again, with the same geometry builders, so both agree.

## Who edits what

| Role     | Owns                                                                                                        | Reads only                                  |
| -------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **3D**   | `src/three/**` (`dims.ts` first), `docs/3d.md`, new entries at the end of `docs/kit-requests.md`            | everything else                             |
| **Data** | `src/data/**` except `lessons.ts`, `src/i18n/ui.ts` (add keys, never change existing ones), `docs/data.md`  | `src/three/dims.ts`, `src/sim/**`, the docs |
| **Lead** | `src/lab.ts`, `src/main.ts`, `src/part-ids.ts`, `README.md`, `public/lab.json`, `docs/research.md`, commits | —                                           |

Never touch `src/sim/**`, `src/panels/**`, `src/drawings/**`, `src/data/lessons.ts` (wave 3), `package.json`, `vite.config.ts`.
**Do not commit, do not push, do not delete `src/three/device.ts`** (`src/lab.ts` and the old `src/data/parts.ts` still import it
until the lead rewires them). The data role replaces `src/data/parts.ts` and `src/data/guide.ts` by the new modules and stops
importing `device.ts`; the lead removes the placeholder at integration.

## Running checks while the other agent works

The other role is editing files you do not own, so `npm run typecheck` or `npm test` may show errors there, even
transient ones. **Do not fix files you do not own**: re-run later, and judge your work by your own files
(`npx vitest run src/three` or `npx vitest run src/data`; `npx tsc --noEmit -p . 2>&1 | grep '^src/three'` or `'^src/data'`).
Run `npx prettier --write` on your own files before reporting (CI checks `src/**/*.{ts,css}`, `*.md`, `docs/*.md`). Do not run
`npm run build` (the lead does) and do not start a dev server.

## Single source of numbers

- Physical constants (rotor diameter, blade count, magnets, coils, turns, wire, offset, hinge angles, tail mass, inertia…) are in
  `src/sim/machine.ts`, tagged `reported` / `derived` / `estimate` / `calibrated`. `src/three/dims.ts` **imports** them from
  there when they exist and only adds what is geometry (stations, plate sizes, mast, house…). Never redeclare a number that
  `machine.ts` has; a test checks the agreement.
- `src/three/dims.ts` is written **first** by the 3D role (metres, every constant tagged), within the first part of its work, and
  its exported names are then kept stable. The data role takes lengths from `dims.ts` (and `machine.ts`), never retypes a
  dimension, and uses the figures of `docs/research.md` §2–§3 and the model's own results (`docs/physics.md` §7) for the rest. Until
  `dims.ts` exists (`ls src/three/dims.ts`), start with the work that does not need it.
- A number in a text is a reported figure (untagged, with its source in `docs/research.md`) or carries a tag in both languages:
  derived, model result, calibrated, assumption, estimate (the ram lab's `src/data/part-helpers.ts` is the model).
- Honesty about the power: the label says 200 W (nominal, the wind speed is not given, K2/K19); the model finds about 60 W at
  12 m/s for 1.2 m and does not tune to the label (`docs/physics.md` §7). A text that quotes the rating says which it is.

## Texts

- Every text is bilingual `l(fr, en)`, written together, same detail, no placeholder. French with proper typographic apostrophes
  (’), non-breaking spaces before `: ; ? !` and in numbers are not required but be consistent with `src/i18n/ui.ts`.
- The tone is the series': a curious, concrete explanation for a curious adult; no jargon without a definition; short paragraphs.
- Credits and rights (`docs/research.md` §7): independent educational reconstruction; no text, drawing or image copied from a
  source (figures and facts are fine); never quote the private transcript (`docs/transcript.md` is git-ignored: use it for
  timestamps and structure, not for numbers, the captions garble them).
- Safety is prominent where it matters (neodymium magnets, raising the mast, spinning blades, 12 V currents and batteries,
  resin and wood dust, the mast legal limit in France). Publish no dimension beyond what the maker publishes (S4).

## What each role delivers

See the two briefs; both end with a short report (what is done, what is not, numbers of tests, anything for the lead, any kit
request) and notes in `docs/3d.md` / `docs/data.md`. Keep the notes short and factual: what a reader of the code needs.
