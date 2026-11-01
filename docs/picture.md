# The picture: kit 0.5.1, a look per world

Rule: `lab-kit/docs/lab-quality.md` §3, « A warm, full, stable picture ». Kit 0.5.1 gives every world MSAA 4 on the scene pass, soft
shadow edges and adaptive quality on weak devices; what each world does with it is set here.

## The look of each world

| World      | `scene.userData.look`                       | Why                                                                                                  |
| ---------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| turbine    | `{ ...PAPER_STUDIO }` (`world.ts`)          | A paper floor (`#efe6d3`) that stays paper: ACES drew it as a grey (`#f3f2ee` on the shed's floor).  |
| alternator | `{ ...PAPER_STUDIO }` (`world.ts`)          | The same drafting-table floor.                                                                       |
| blades     | `{ ...PAPER_STUDIO }` (`world.ts`)          | The same, around the balancing post, the blank and the templates.                                    |
| shed       | `{ ...PAPER_STUDIO }` (`world.ts`)          | The technical room's floor and its wall.                                                             |
| site       | `{ toneMapping: 'neutral', exposure: 1.2 }` | The field's own tone. The sky is no longer burnt to white: it is blue overhead, warm at the horizon. |

The four paper worlds share `workshopScene()`, so one line sets them all.

**The timber is for the paper worlds only.** The site's objects (the house, the cable post) and the shed built for the site (`buildShed(true)`) keep the kit's own timber: under the site's sun and sky the recoloured timber read grey (the technical room's wall `#5a5b4d` against `#6a5c3a` before), the kit's colours read as before.

## What the Neutral curve changed, and what was done

- **Timber** (`src/three/timber.ts`): the kit's `MAT.wood`, `woodLight`, `woodDark` and `osb` were tuned under ACES and come out as a
  strong orange under Neutral. Measured on the shed overview and the blade close-up (kit 0.4.0 → kit 0.5.1 with the kit's own
  colours → now): back wall `#f0e1c3` → `#f6be7a` → `#f3d1a1`, side wall `#d5b585` → `#f2b776` → `#eacfa2`, the post `#ad815d` →
  `#865629` → `#aa8352`, a blade `#e3be8e` → `#f8b47e` → `#f8d49e`. The lab now recolours the same materials (it never edits the
  kit): `wood` `#9a8560`, `woodLight` `#b7a78a`, `woodDark` `#786247`, `osb` `#baa88c`. They are a touch warmer than before, not orange.
- **Site**: Neutral at 1.2 and nothing else. The sky is the Preetham sky as it was always meant (the 0.4.0 ACES curve burnt it to
  white), the meadow keeps its colours.

## Near detail (`src/three/detail.ts`)

The same code as the Pelton and Mill labs', without the melting grass and the stones (this lab has no cards or tufts):

- **the meadow's patches and tufts** (`grassDetail`): the site's ground was a smooth vertex-coloured plane; it now has drier and
  greener patches tens of metres across and tufts a metre across with their bump in the light, each fading before it is under two
  pixels;
- **wear on the parts** (`applyWear`: a slow variation of colour and `0.1` of roughness on metals) on the turbine's head, the
  alternator and the rotor of the blades world;
- **contact shadows** (`contactShadow`) under the mast block (turbine), the cradle's stand (alternator) and the balancing post (blades).

## Measured (kit `flicker.mjs`, 1280 × 720, 150 frames a move, Metal, clocks pinned)

Shimmer = share of pixels whose change from frame to frame is not smooth. « 0.4.0 » is the lab at `8aa88a2`; « now » is this work.

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

No spike over 1.55 (a pop is over 2).

**Said plainly**: this lab's picture was already steady, so the numbers move little, in both directions. The turbine and the
alternator are higher than the other worlds, before and after; I did not isolate why (the rotor turns during the measure and the
tool does not hold the simulation: a likely cause, not checked). The alternator's dolly is the one figure that got a little worse
(+0.07 point).

## Findings for the kit

- `alphaToCoverage` on an alpha-tested card leaves a fractional alpha in the scene's render target and the page's paper shows
  through the canvas as pale specks (found on Pelton). Not used here.
- The kit's `MAT.wood*` and `MAT.osb` turn orange under the `PAPER_STUDIO` look: three labs have had to recolour their timber. A
  kit palette for the studio (or timber colours tuned for Neutral) would save each lab doing it.
- `src/three/detail.ts` is now in four labs: a candidate for `@onigam/lab-kit/three`.

## After the review

- **The meadow's grass shimmered from 120 to 300 m** (review D1): the bump summed two octaves and faded with one. Each octave now fades with
  its own size on screen, the patterns' fade is tighter (full while a cell spans more than about 6 pixels, nothing under 2.5) and the tufts
  and the bump are weaker (0.06 and 0.018). Shimmering pixels in a slow dolly, before the work / as first committed / now: 200 → 160 m at
  1280 × 720 0.125 / 3.753 / 0.129 %; 390 × 844 at pixel ratio 2, 200 → 160 m 0.272 / 6.089 / 0.596 %, 300 → 240 m 0.400 / 7.334 / 0.473 %.
  At phone size, from the default overview (orbit / dolly): site 0.113 / 0.277 → 0.095 / 0.218 %; shed 0.046 / 0.579 → 0.090 / 0.878 %.
- The contact shadows are no longer fogged (a fogged plane is not white) and have a polygon offset; the stator's resin is a paler amber
  (`#c8a063`; it was `#c98f3d`, which came out saturated orange).
- **Not fixed**: the floors have lost their grid under the studio's Neutral curve, as on the ram pump (a decision for the owner); pale parts
  (the blade blank, the hub disc, the moulds) have less contrast against the cream floor; the plain is still empty beyond 40 m and ends on a
  hard square edge (the review suggests a far tree line, scattered shrubs, a track and a fence); the dawn and dusk skies are a saturated
  rainbow under Neutral; small metal parts and the shed shimmer a little more on a phone.
