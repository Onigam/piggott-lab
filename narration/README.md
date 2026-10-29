# Narration scripts (French and English)

`fr.json` and `en.json` follow `lab-kit/docs/narration.md`: 42 segments each (`intro`, 5 worlds, 36 parts: site 8, turbine 8, alternator 10,
blades 4, shed 6), no lesson segments. **No audio has been generated and no credit spent**: the lab does not declare `narration` yet
(`src/lab.ts`) and `public/audio` does not exist. That waits for the owner's yes, then the kit bump to v0.4.0 (speaker button, first-visit
invitation).

Check the cost without spending anything:
`node <lab-kit>/tools/narration/generate.mjs --src narration/fr.json --out /tmp/piggott-audio --dry-run`.

## Budget (spoken characters, cues removed)

- French **16 301** (intro 1 834, worlds 2 242, parts 12 225), English **15 455** (intro 1 707, worlds 2 309, parts 11 439). About 31 800 credits
  for the two languages; the owner's ceiling is 30 000 per language (`src/narration.test.ts`).
- Ordinary part 250 to 330 characters; the biggest are `magnets` (431 in French) and `star-wiring` (387 in English).

## Register

Pelton Lab's tone (`lab-kit/docs/narration-style.md`): a warm storyteller, « vous » / « you », short sentences, a question now and then, rare
exclamations. The character to follow is **a gust of wind**: valley, mast, blades, alternator, cable, technical room, battery, a lamp that comes on.
`node <lab-kit>/tools/narration/tone-stats.mjs narration/fr.json`: average sentence 65 (Pelton 79), one sentence over 120 characters,
exclamations 0.7 per 1 000 (Pelton 0.8), questions 0.5 (Pelton 0.3), no « tu », no symbol.

- Anonymous: no person, channel, company or brand in a text or a title (a test refuses the names of the sources and of the lab): « la vidéo », « les plans ».
  Car models are not named either.
- Disclaimers said once: the reconstruction notice only in the intro (with « the figures come from the simulation unless I quote the video »);
  the **200 W label** only in `part-wind-turbine` (the label says two hundred watts without a wind speed, the simulation finds about sixty at twelve metres per
  second and was not tuned to it); « dans le modèle » never.
- Safety lines, once each (a test counts them): magnets crush fingers (`magnets`), resin fumes (`moulds`), wood dust (`blade`), never under the machine during the
  lift (`tower-base`), battery gas and tools across the terminals (`battery-bank`), close the brake before climbing or touching (`brake-switch`). The French rule on mast
  height is said in `tower` (French) and made general in the English script (« check with your local authority »).
- Facts come from the part sheets: nothing the sheets flag as estimate or assumption is stated as reported (the loop of cable, the size of the shed, the capacity of the
  battery are not quoted); « la vidéo » only where a sheet says so (blank wood, obstacles, tail vane, coil turns, house).

## Cues (95 in each language, the same in both)

- Totals: home 12, frame 30, scene 6, mode 6, select 1, flows 12, cutaway 8, explode 12, xray 8.
- Intro: a gust follows the whole path (`scene` hops blades, turbine, alternator, shed, site), then `mode` hops through assembly, install, sim, lessons, plans, explore.
- Worlds: `home`, one `frame` per element named; `flows` in the site and the shed, `cutaway` and `explode` in the turbine and the alternator, `explode` in the shed.
- Parts (a part starts framed and selected): `flows` on cable-run, rectifier, dump-load, battery-bank; `cutaway` on alternator and air-gap; `xray` on magnets, stator,
  coils, star-wiring (alternator world: the magnet disc and the stator go see-through); `explode` on tail-hinge, bearing-hub, studs. Each is switched off before the end.
- Spacing: camera cues (`scene`, `home`, `frame`, `select`) at least 35 spoken characters apart. `cutaway` only in the turbine and the alternator, `xray` only in the
  alternator, `flows` only in the site and the shed (`src/narration.test.ts`).
- No `lab:` cue: the lab defines no `narration.onCue` hook. A storm that folds the tail while the narrator speaks would need one (the simulation scenarios are run by the panel).

## Checked

`npx vitest run src/narration.test.ts`: ids, scopes and starting worlds, known cues on parts and worlds of the current world, everything switched on is switched off, camera spacing,
disclaimers and safety lines once, no names, budget, no digit or symbol in the spoken text, no seven-word run copied from the private transcript (skipped where it is absent),
same segments and same cues in both languages. Dry run: 42 segments, no segment rejected.

## Next, in this order

1. The owner reads or listens to a sample (the intro and one world) and says yes: credits are never spent before.
2. Generate (`generate.mjs --src narration/fr.json --out public/audio/fr`, same for English), declare `narration: { manifest: 'audio/{lang}/manifest.json' }` in `src/lab.ts`, bump the kit to
   v0.4.0 (`npm run kit:bump`), `check-narration` in the build, listen in the browser.
