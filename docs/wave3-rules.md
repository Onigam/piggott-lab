# Wave 3 rules (drawings role ‖ lessons role)

Read `BRIEF.md`, `docs/wave2-rules.md` (still applies: contract, single source of numbers, texts, honesty about the 200 W label),
`docs/research.md` (§2 figures, §4 drawings and lessons outline, §7 safety, §8 decisions, §9 sizes), `docs/physics.md` (§7
findings), `docs/3d.md` and `docs/data.md`. Two agents work **at the same time in the same checkout**, each on its own files.

## Who edits what

| Role         | Owns                                                                                                                                                                                                                               | Reads only                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Drawings** | `src/drawings/**` (sheets, helpers, tests), `docs/drawings.md`, new entries at the end of `docs/kit-requests.md`                                                                                                                   | everything else                            |
| **Lessons**  | `src/data/lessons.ts` (and files it splits into, `src/data/lessons*.test.ts`), the sizes chart: `src/panels/sizes.ts`, `src/panels/model.ts`, a small hook in `src/panels/sim.ts`, new keys in `src/i18n/ui.ts`, `docs/lessons.md` | everything else, `src/sim/**` is read-only |
| **Lead**     | `src/lab.ts`, `src/part-ids.ts`, `README.md`, `public/lab.json`, `docs/research.md`, commits                                                                                                                                       | —                                          |

Never touch `src/sim/**` (a missing quantity: say so in your report), `src/three/**`, `src/data/parts/**`, `src/data/assembly.ts`,
`src/data/install.ts`, `src/part-ids.ts`, `src/lab.ts`, `package.json`, `vite.config.ts`. **Do not commit, push, stash or reset.**
The drawings role adds nothing to `src/i18n/ui.ts` (every text of a sheet is bilingual `l(fr, en)` in its own file).

## Checks while the other agent works

Same as wave 2: judge your work by your own files (`npx vitest run src/drawings` or `npx vitest run src/data/lessons src/panels`;
`npx tsc --noEmit -p . 2>&1 | grep '^src/drawings'` or `'^src/data/lessons\|^src/panels'`). Another role's transient errors are not
yours. `npx prettier --write` on your own files before the report (CI checks `src/**/*.{ts,css}` and `docs/*.md`). Do not run
`npm run build`.

## Looking at the result (both roles)

Headless Chrome with puppeteer-core is the reliable way to see the app (copy the scripts, do not edit the originals):
`/private/tmp/claude-501/-Users-magino-Dev-mrcarve-m1-pro-macos/39e81513-2a30-42b9-ad5b-fe1e506a4552/scratchpad/shots/` has
`worlds.mjs`, `modes.mjs` and `install.mjs` (run with `NODE_PATH=<that folder>/node_modules node <script>`; they target
http://localhost:5173, change the port). **Start your own dev server on your own port** (drawings: `npx vite --port 5601`,
lessons: `npx vite --port 5602`) in the background and stop it at the end. `window.__lab` exposes `stage`, `store`, `engine`;
`store.set({ mode: 'plans' | 'lessons' | 'simulation', … })`. The rail buttons are in order Explorer, Montage, Installation,
Simulation, Plans, Leçons, Pièces, Sources once the modes exist (read them from `.rail button`). Wait 6–9 s after a load or a
world change (software GL is slow). Look at 1280×800, 768×1024 and 390×844, in French and in English. Read the PNGs with the Read tool.

## Content rules

- A number in a text is a reported figure (untagged, source in `docs/research.md`), a value read from `dims.ts` / `machine.ts`,
  or a **model result** tagged as such and recomputed from `src/sim` by a test (the figures move if the model is ever recalibrated:
  the test must fail loudly, as `src/data/data.test.ts` does).
- Honesty: the label says 200 W (nominal, the wind speed is not given); the model finds about 60 W at 12 m/s for 1.2 m and does
  not tune to the label. Say which one a number is. The power curve of this machine is **nearly linear in the wind speed** once
  the alternator holds the rotor in the stall (`docs/physics.md` §7.6), the power _in the wind_ is what goes as a cube.
- Sizes (1.0 to 4.2 m) are a parameter of the model, not other machines: at 12 m/s the model gives about 42, 60, 135, 242, 382,
  558 and 773 W for 1.0, 1.2, 1.8, 2.4, 3.0, 3.6 and 4.2 m (hamlet, cable scaled with the area), about 0.3 of the labels scaled
  from 200 W; recompute them from the model, do not copy them.
- No resin batch amounts, no dimension beyond what the maker publishes (S4); the maker, the wiki and the video are credited in the
  app's Sources panel (lead). Safety stays prominent where it matters.
- No text copied from a source; no quotation of the private transcript.

## Final report (≤ 350 words)

What you delivered (files, counts, tests), what you could not verify, every estimate or unknown that matters, what the lead must
wire in `src/lab.ts`, what looks weakest, kit requests added.
