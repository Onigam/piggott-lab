# Research notes — Piggott Lab

Cadrage (research role, done by the lead, no agent team) of the homemade Piggott wind turbine lab, 2026-10-29. Everything
the other roles rely on is here, with its source. "Derived" means computed by us from reported figures, with the
assumptions stated. "Unknown" means the sources are silent: it must be estimated and flagged, never invented.

## 0. Summary and decisions to validate

- **The device**: a small homemade wind turbine of the kind designed by Hugh Piggott (Scoraig, Scotland) and taught in
  week-long courses by the French Tripalium network: **three hand-carved wooden blades**, a **direct-drive axial-flux
  alternator** (neodymium magnets on steel discs facing coils cast in resin, no gearbox, no iron), a steel nacelle
  that swivels on the mast (yaw bearing), and a **tail on an inclined hinge** that folds the machine out of the wind in a
  storm (furling). It charges a 12 V battery through a rectifier.
- **Proposed main source**: Low-tech Lab, _How to build homemade Piggott wind turbine_ (8:49): the whole build in order,
  on the 1.20 m / 200 W / 12 V machine. The video says little in numbers, so three more sources carry the figures: the
  Low-tech Lab wiki tutorial of the same machine (S3), Hugh Piggott's published plans (S4) and the Tripalium site (S6).
  The second video named in the roadmap (France 3, 1:35) is a short report on a course: it gives the human story, not figures.
- **One version**, no V1/V2. The size range (1.0 to 4.2 m rotors in the Tripalium family) becomes a **diameter parameter** of
  the simulation, not a second machine (§6).
- **Level (confirmed by the owner, 2026-10-29)**: Full, but kept lean — four worlds (`site`, `turbine`, `alternator`,
  `blades`), about 40 parts, 6 lessons (the owner found 12–14 too many on the ram lab), about 7 drawings. A Lite variant (two
  worlds, ~25 parts, 3–4 drawings) is described in §4 and was not chosen.
- **Official data exist, unlike the ram**: the maker publishes his plans for free, with dimensions of the 1.2 m machine
  (blade stations, magnets, coils, tail geometry), and the wiki gives the video build almost to the screw. The 3D model can
  follow them; the lab credits them and reuses no text, drawing or footage (§7).
- **What the sources do not give**: the power curve (watts against wind speed), the cut-in wind speed, the rotor power
  coefficient curve, the wind speed at which "200 W" is reached, and the furling wind speed other than "about 10 m/s". The
  physics role derives them from the figures below and the lab says which are derived (§2, §5).
- Decisions of the owner: §8 (all recommendations adopted on 2026-10-29).

## 1. Sources

| #   | Source                                                                                                 | Link                                                                                                            | What it gives                                                                                                                                                           | Access                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| S1  | Low-tech Lab, _How to build homemade Piggott wind turbine - DIY / L'éolienne Piggott_ (8:49)           | https://www.youtube.com/watch?v=e_sZ3tH_15E                                                                     | **main source**: the whole build in order (blades, rotor, stator, nacelle, moulds, tail), siting advice, furling, first test; filmed at an open workshop in Valence     | French auto captions (many errors, numbers especially); kept privately in `docs/transcript.md` (ignored)      |
| S2  | France 3 Occitanie, _Lozère : apprenez à construire votre éolienne Piggott vous-même à Florac_ (1:35)  | https://www.youtube.com/watch?v=6DMyj2sBf_Q                                                                     | a week-long course in Florac (Lozère): trainees, the collaborative method, the design philosophy (legible, forgiving, a little performance traded for ease of building) | French auto captions; private transcript                                                                      |
| S3  | Low-tech Lab wiki, _Éolienne 200 W_ (tutorial of the S1 machine)                                       | https://wiki.lowtechlab.org/wiki/Eolienne_200W                                                                  | **the figures of the S1 machine**: 1.20 m, 200 W at 12 V, 600 mm blades, 8 magnets 46×30×10, 6 coils × 76 turns of 1.4 mm, test at 1 turn/s, costs, parts list          | web page, French; page text cut after step 30 in our fetch                                                    |
| S4  | Hugh Piggott, _How to build a wind turbine, axial flux alternator windmill plans_ (May 2003, 48 pages) | https://www.scoraigwind.com/pirate%20oldies/Hugh%20Piggott%20Axial-flow%20PMG%20wind%20turbine%20May%202003.pdf | **official dimensions** of the 4-foot (1.2 m) and 8-foot (2.4 m) machines; blade theory (rule of thumb, tip speed ratio); furling theory; wiring and battery advice     | PDF read in full by the lead (text extracted); an older revision of the 1.2 m design (85 turns instead of 76) |
| S5  | Hugh Piggott's blog, _Wiring up a 12-volt stator_ (2011)                                               | https://scoraigwind.co.uk/2011/12/wiring-up-a-12-volt-stator/                                                   | 3 coils for every 4 magnets, 76 turns of 2 × 1 mm for the 1200 machine, coils wired in parallel then rectified one by one; the size table is only in the Recipe Book    | web page                                                                                                      |
| S6  | Tripalium (network of Piggott course trainers)                                                         | http://www.tripalium.org/                                                                                       | rotor sizes 1.0, 1.2, 1.8, 2.4, 3.0, 3.6, 4.2 m; nominal 200 W to 2 000 W; one-week courses; manual 20 €; maintenance and accident notes                                | web page                                                                                                      |
| S7  | Engineering for Change, _Piggott Axial Flux Alternator Wind Turbine_                                   | https://www.engineeringforchange.org/solutions/product/piggott-axial-flux-alternator-wind-turbine/              | two sizes: 2 m rotor 500 W at 12 m/s (material 350–400 €), 4 m rotor 2 000 W at 12 m/s (about 700 €)                                                                    | web page                                                                                                      |
| S8  | Wikipedia (EN), _Betz's law_                                                                           | https://en.wikipedia.org/wiki/Betz%27s_law                                                                      | limit 16/27 = 0.593; power in the wind ½ρSv³; large modern turbines reach 0.45–0.50                                                                                     | encyclopedia, secondary                                                                                       |
| S9  | Service-public, _Installation d'une éolienne domestique ou agricole_                                   | https://entreprendre.service-public.gouv.fr/vosdroits/F33368                                                    | France: no formality below a 12 m mast in general, protected areas excepted; building permit from 12 m                                                                  | official page, summarised by a search result: re-read before the lab states it                                |
| S10 | Windside, FAQ on power production (a vertical-axis maker)                                              | https://windside.com/faq/power-production/                                                                      | generic bracket of 100–300 kWh per m² of swept area per year for propellers in similar conditions; same mean wind, very different yield                                 | secondary, only a sanity bracket; not used as a validation source                                             |
| S11 | Pure Self Made, _Wind turbine DIY book_ (the book the S1 video is inspired by, per the owner)          | https://pureselfmade.com/wind-turbine-diy-book/                                                                 | Piggott ferrite machines from about 600 W to about 3 kW, rotors 2 m to 4 m; no rated wind speed, no figure for 1.2 m                                                    | sales page, read once on 2026-10-29; no data of the book itself                                               |

Credits for the lab: the video authors (S1 Low-tech Lab, who credit the Tripalium trainer who guided the build; S2 France 3
Occitanie), the wiki authors (S3), Hugh Piggott (design and plans, S4–S5), the Tripalium network (S6). The lab is an
independent educational reconstruction; no footage, image or drawing is reused. Note the video licence shown on S1's page
(CC-BY-NC-ND-SA): the lab quotes no footage and derives nothing from the images, only facts and figures.

## 2. Key figures to reproduce

`reported` = stated in a source; `derived` = ours. Timestamps are those of S1 unless noted. Each row becomes a unit test of
the simulation (or a scenario check). Constants: air density ρ = 1.23 kg/m³ (S3), swept area A = π·0.6² = 1.131 m².

| #   | Quantity                                  | Value                                                                                                                                                                                                                                                                                                   | Kind     | Conditions / source                                                                                                           |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| K1  | Rotor diameter                            | **1.20 m**                                                                                                                                                                                                                                                                                              | reported | S3 ("1 m 20 d'envergure"), S1 description, S6; the caption at 01:03 reads "un maître 26", a recognition error                 |
| K2  | Rated output                              | **200 W at 12 V** (nominal)                                                                                                                                                                                                                                                                             | reported | S1 description, S3. **The wind speed of the rating is not given** (see K19)                                                   |
| K3  | The family                                | rotor 1.0 / 1.2 / 1.8 / 2.4 / 3.0 / 3.6 / 4.2 m, nominal 200 W to 2 000 W; the largest "supply a whole household's electricity, heating excluded"                                                                                                                                                       | reported | S6; S1 01:13–01:20 (caption reads "4,9")                                                                                      |
| K4  | Blades                                    | **3**, carved from light, rot-resistant, knot-free softwood (spruce, Douglas fir, larch; red cedar in S3), length **600 mm** after trimming                                                                                                                                                             | reported | S1 01:33–01:42, S3 steps 2 and 5, S4                                                                                          |
| K5  | Blade section                             | flat-ish windward face (underside), curved leeward face, "a wing profile that accelerates the rotation"; chord 153 → 55 mm and thickness 22 → 6 mm from root to tip; twist                                                                                                                              | reported | S1 01:44–01:58; numbers: S4 small-machine table (6 stations, below)                                                           |
| K6  | Rotor (magnet) disc                       | steel disc **230 mm × 6 mm**; **8** neodymium magnets **46 × 30 × 10 mm**, alternating N / S; cast in polyester resin; the 1.2 m machine has ONE such disc facing the stator (corrected 2026-10-29: the two-rotor layout, 12 magnets each, is the 2.4 m machine's)                                      | reported | S3 steps 17–22 and 26, S1 02:19–02:40, S4 p. 44–46 (small-machine supplement, "sectional view of 4' diameter machine")        |
| K7  | Stator                                    | **6 coils × 76 turns** of enamelled copper **1.4 mm**, spaced 60°, wired in **star**, three phases, cast in resin; about 1.5 kg of wire                                                                                                                                                                 | reported | S3 steps 11–12, S1 02:44–03:15                                                                                                |
| K8  | Magnets to coils                          | **4 : 3** (8 magnets, 6 coils)                                                                                                                                                                                                                                                                          | reported | S1 02:54, S5                                                                                                                  |
| K9  | Voltage choice                            | more turns = more volts: 12 V = 76 turns of 1.4 mm; the 2003 plans give 85 turns of 1.4 mm (12 V) or 170 turns of 0.8 mm (24 V)                                                                                                                                                                         | reported | S1 03:08–03:20, S4 p. 46, S5                                                                                                  |
| K10 | Bench test of the finished alternator     | turned at **1 turn per second**: about **1.9 V AC between phases**                                                                                                                                                                                                                                      | reported | S3 step 27. Derived constant: 0.032 V (line-to-line rms) per rpm                                                              |
| K11 | Air gap between magnets and stator        | about **1 mm**                                                                                                                                                                                                                                                                                          | reported | S3 step 26                                                                                                                    |
| K12 | Furling                                   | the tail ("safran") keeps the machine facing the wind **up to about 10 m/s**; beyond, the blades progressively turn parallel to the wind against the tail, protecting the electrics                                                                                                                     | reported | S1 06:16–06:41 (garbled caption; the 10 m/s must be checked on the video)                                                     |
| K13 | Furling geometry of the 1.2 m machine     | alternator **offset 41 mm** (1 5/8 in) from the yaw axis; tail hinge **20° from the vertical** and **55° to the shaft** in plan view; tail swings ~95°, from 80° to the rotor plane (low end) to nearly parallel; boom 500 mm (S4) or 700 mm (S3); vane 18 × 12 in = 0.135 m² (S4) or about 0.1 m² (S3) | reported | S4 p. 47–49, S3 steps 24–25. For the 2.4 m machine the offset is 125 mm (5 in). Tail weight sets the furling speed (S4 p. 31) |
| K14 | Power in the wind                         | **0.70 W at 1 m/s**, **696 W at 10 m/s** (A = 1.131 m², ρ = 1.23 kg/m³, P = ½ρAv³)                                                                                                                                                                                                                      | derived  | the 0.7 W at 1 m/s is quoted by S3; the 696 W is ours                                                                         |
| K15 | Betz limit and real blades                | 16/27 = **0.593**; homebuilt blades **0.25–0.35**, "up to 35 %"                                                                                                                                                                                                                                         | reported | S8; S4 p. 9 ("25–35 % is typical for homebuilt rotor blades"), S3                                                             |
| K16 | Design tip speed ratio and rotor speed    | tip speed ratio **about 7**; the worked example for a 2.4 m rotor in a 3 m/s wind is **167 rpm**                                                                                                                                                                                                        | reported | S4 p. 9. Derived for 1.2 m at 3 m/s: **334 rpm** (rpm = v·λ·60/πD)                                                            |
| K17 | Rule of thumb for blade power             | **P ≈ 0.15 · D² · v³**: 216 W at 10 m/s for D = 1.2 m (S4's own example: "900 W" for 2.4 m at 10 m/s, 864 W unrounded)                                                                                                                                                                                  | reported | S4 p. 9. Matches K15: 0.5·1.23·1.131·0.31 ≈ 0.15·D²                                                                           |
| K18 | Output of the larger machines             | 2.4 m: "about 500 W normally, more than 1 000 W for short periods"; S7: 2 m = 500 W and 4 m = 2 000 W, both **at 12 m/s**                                                                                                                                                                               | reported | S4 p. 2, S7                                                                                                                   |
| K19 | Where the 200 W plateau must lie          | S7's machines give 0.15 × (wind power at 12 m/s) overall; the 1.2 m machine's 200 W is 0.17 at 12 m/s but **0.29 at 10 m/s**, too high for blades plus alternator → 200 W is reached **near 12 m/s**, with furling starting around 10–12 m/s                                                            | derived  | K2, K12, K18. To confirm on the video                                                                                         |
| K20 | Cut-in: when the battery starts to charge | alternator voltage 1.35 × 0.032 V/rpm × rpm must exceed battery (≈ 12.6–13 V) + 2 rectifier diodes (≈ 1.4 V): ≈ **330 rpm**, i.e. a wind of **about 3 m/s** at tip speed ratio 7                                                                                                                        | derived  | K10, K16; falls if the number of turns rises. S5: fewer turns "does not work at low rpm" but gives more output at high speed  |
| K21 | Wiring loss (the plans' table)            | 12 V, 500 W, 6 mm², 30 m one way: **38 %** of the power generated; 24 V: 13 %; 48 V: 4 %; at half power the percentage halves                                                                                                                                                                           | reported | S4 p. 38. **Reproduced by hand** with I²R (round trip, ρ_Cu = 0.0175 Ω·mm²/m): 304 W lost at 41.7 A; 13.2 % at 24 V           |
| K22 | Battery limits                            | below **11.5 V** the battery is too deep discharged; above **14 V** charging is too hard; a dump load and a low-voltage disconnect regulate; short-circuiting the alternator ("brake switch") stops the rotor but never short the battery                                                               | reported | S4 p. 37–42                                                                                                                   |
| K23 | Cost, effort                              | about **350 €** of materials, about **2 000 €** with mast and electronics; difficulty "hard", **20 days** (the wiki); a **one-week course** with 10–20 people (Tripalium, France 3)                                                                                                                     | reported | S3, S6, S2                                                                                                                    |
| K24 | Mast height                               | tall enough to clear turbulence: 6 m "in a very open place", often 12 or 18 m; "the higher the better"; in France a mast under 12 m generally needs no formality                                                                                                                                        | reported | S4 p. 40, S9                                                                                                                  |
| K25 | Yield bracket (sanity only)               | 100–300 kWh per m² of swept area per year for propellers in similar conditions: **113–340 kWh/year** for 1.131 m²                                                                                                                                                                                       | derived  | S10, generic; the same mean speed can give 2.85 times more or less depending on the distribution                              |

**Sanity checks done.**

1. **K14, K15 and K17 agree**: the rule 0.15·D²·v³ (216 W at 10 m/s) is the same as a power coefficient of 0.31
   (0.15 = ½·1.23·π/4·Cp), inside the 0.25–0.35 band of homebuilt blades.
2. **K21 reproduced by hand** (I²R with the round trip): 38 % at 12 V and 13 % at 24 V. The wiring-loss table can be a unit
   test.
3. **K19 is an inconsistency to resolve, not a result.** Read as "200 W at 10 m/s", the machine would turn 29 % of the wind
   power into battery power, at the top of what blades alone achieve (K15) before any alternator loss. Compared with S7
   (overall 15 % at 12 m/s) it is consistent only if the rating lies near 12 m/s. The lab will plot the full power curve and
   say plainly that the wind speed of the rating is not in the sources.
4. **Winding resistance (open, to check in wave 1).** 6 coils × 76 turns × about 0.19–0.24 m of wire per turn gives a
   phase resistance of about 0.3–0.4 Ω (copper, 1.4 mm). At 200 W and 14 V (≈ 14 A DC, ≈ 11 A rms per phase, S4's 0.8
   rule) the copper loss would be 100–160 W, as much as the output: too high to be right. Either the turn length is shorter,
   or the 200 W is a short-lived or gross figure. The physics role must settle this with a bench-style calibration (K10) and
   report the alternator efficiency honestly. **Do not tune the model until it prints 200 W: report both numbers.**
5. **Caption errors.** S1's captions garble most numbers ("un maître 26" for 1.20 m, "4,9" for 4.20 m). The figures above
   come from the description, the wiki or the plans, not from the captions. The end of the video (07:56–08:09) announces a
   first reading ("on était à 1…") that the captions cut: to read from the video itself.

## 3. Official dimensions and data

Dimensions go to `src/three/dims.ts` (metres, the single source for the 3D model, the drawings and the simulation). Each
constant is tagged `reported`, `derived` or `estimate`. Official values for the 1.2 m machine (S4 "small machine
supplement", S3):

| Dimension                              | Value                                                                                                                                            | Kind     | Source          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | --------------- |
| Rotor diameter / blade length          | 1.20 m / 600 mm                                                                                                                                  | reported | S3, S4          |
| Blade workpiece                        | 3 × (about 1.8 m long timber, 150 × 45 mm in the wiki; plans: pieces cut for 600 mm blades)                                                      | reported | S3, S4          |
| Blade stations, width (mm), root → tip | 153, 153, 100, 80, 65, 55                                                                                                                        | reported | S4 p. 43        |
| Blade stations, drop (mm)              | –, 45, 19, 10, 6, 3                                                                                                                              | reported | S4 p. 43        |
| Blade stations, thickness (mm)         | 49 (root), 22, 14, 10, 8, 6                                                                                                                      | reported | S4 p. 43        |
| Blade station spacing                  | six stations over 600 mm, scale marked every 100 mm (spacing to read on the drawing)                                                             | estimate | S4 p. 43        |
| Blade root angle / leading-edge angle  | 120° at the root, leading edge cut at about 60° (wiki); the plans use a 30° cut + wedges on the large machine, none on the small                 | reported | S3, S4          |
| Hub disc                               | plywood 140 mm × 8 mm (wiki); plans: 200 mm (8 in) disc with a bore for the bearing housing                                                      | reported | S3, S4          |
| Rotor steel disc                       | 230 mm (9 in) × 6 mm, 4 holes M12 on a 100 mm circle; casting outer diameter 240 mm                                                              | reported | S3, S4          |
| Magnets                                | 8 per disc, 46 × 30 × 10 mm (2 × 1 × ½ in), alternating poles                                                                                    | reported | S3, S4          |
| Stator                                 | overall 264 mm, 6 coils, hole in each coil matching a magnet (46 × 30 mm), coil former 11 mm                                                     | reported | S4 p. 46        |
| Coils                                  | 76 turns, 1.4 mm enamelled copper, star connection, three 2.5 mm² flexible output cores                                                          | reported | S3              |
| Shaft and bearings                     | hollow shaft 1 in (25.4 mm) overall, 300 mm; a trailer / car hub with its bearings; spacer ~45 mm                                                | reported | S4 p. 44        |
| Nacelle and yaw                        | angle iron 50 × 50 × 6 mm, 206 mm; yaw pipe 42.2 mm outer diameter over a 33.4 mm pipe                                                           | reported | S3, S4 p. 47    |
| Tail                                   | hinge 20° / 55°, offset 41 mm, boom 33.4 mm × 500–700 mm, vane 0.1–0.135 m² plywood                                                              | reported | S3, S4 p. 47–49 |
| Mast top                               | 400 mm of 48 mm pipe slipping into the yaw pipe; mast 60 mm (2 in) steel pipe, guyed every ~4 m (tower page of the large machine, assumed alike) | reported | S4 p. 40        |
| Rectifier, brake switch, fuse          | two single-phase bridge rectifiers on a heatsink, 2-pole 20 A switch (brake), fuse to the battery                                                | reported | S4 p. 48        |
| Rotor mass, inertia                    | **unknown** (not in the sources); estimated from blade timber and discs for the dynamics                                                         | estimate | —               |
| Mast height of the video               | **unknown** (only a test mast is shown); the lab offers 6 to 18 m                                                                                | estimate | —               |

## 4. Worlds and parts (draft, ids to freeze before the 3D and data roles start)

**Worlds** (Full, four): `site` (the field: the mast with its guys at the end of a cable run, the battery shed, the house, a
few trees to show turbulence), `turbine` (the whole machine on its mast top: rotor, alternator, yaw bearing, tail), `alternator`
(rotor discs, magnets, stator, shaft: section and exploded view), `blades` (the carving: the workpiece, the stations, the
two faces). **Lite variant**: only `site` and `turbine`, with the alternator and the blade shown as sectioned parts of the
`turbine` world (~25 parts, 3–4 drawings).

| World      | Id                  | Name FR / EN                                        | Category   | Note                                                                                                            |
| ---------- | ------------------- | --------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| site       | `tower`             | Mât / Tower                                         | structure  | steel pipe, 6–18 m, hinged base to lower it (K24)                                                               |
| site       | `guy-wires`         | Haubans / Guy wires                                 | structure  | every ~4 m; the top guys carry the load (S4)                                                                    |
| site       | `tower-base`        | Pied de mât articulé / Hinged base                  | structure  | the machine is raised and lowered by the base                                                                   |
| site       | `cable-run`         | Câble vers les batteries / Cable run                | electrical | loss by section and length (K21)                                                                                |
| site       | `brake-switch`      | Interrupteur de freinage / Brake switch             | electrical | short-circuits the alternator, never the battery                                                                |
| site       | `rectifier`         | Redresseur / Rectifier                              | electrical | two bridges on a heatsink                                                                                       |
| site       | `fuse`              | Fusible / Fuse                                      | electrical |                                                                                                                 |
| site       | `charge-controller` | Régulateur de charge / Charge controller            | electrical | dump load at 14 V, disconnect at 11.5 V (K22)                                                                   |
| site       | `dump-load`         | Délesteur / Dump load                               | electrical |                                                                                                                 |
| site       | `battery-bank`      | Batteries / Battery bank                            | electrical | 12 V lead-acid                                                                                                  |
| site       | `house`             | Habitation / House                                  | site       | loads                                                                                                           |
| site       | `obstacles`         | Arbres et obstacles / Trees and obstacles           | site       | turbulence, mast height rule                                                                                    |
| turbine    | `rotor`             | Rotor (pales et moyeu) / Rotor                      | mechanical | assembly of the three blades and the hub                                                                        |
| turbine    | `nacelle-frame`     | Cadre de nacelle / Nacelle frame                    | structure  | angle iron                                                                                                      |
| turbine    | `yaw-bearing`       | Pivot d'orientation / Yaw bearing                   | mechanical | the offset of 41 mm is here (K13)                                                                               |
| turbine    | `tail-hinge`        | Charnière inclinée / Inclined tail hinge            | mechanical | 20° / 55° (K13)                                                                                                 |
| turbine    | `tail-boom`         | Bras de queue / Tail boom                           | mechanical |                                                                                                                 |
| turbine    | `tail-vane`         | Safran / Tail vane                                  | mechanical | its weight sets the furling speed                                                                               |
| turbine    | `wire-loop`         | Boucle de câble / Cable loop                        | electrical | the three wires pass down the tube; never pinch them when servicing (S6)                                        |
| alternator | `magnet-rotor`      | Disque à aimants / Magnet rotor                     | mechanical | ONE steel disc 230 × 6 mm, bolted to the bearing hub (K6, corrected)                                            |
| alternator | `magnets`           | Aimants néodyme / Neodymium magnets                 | electrical | 8 on the one disc (K6); safety                                                                                  |
| alternator | `stator`            | Stator coulé en résine / Resin-cast stator          | electrical | 6 coils with 3 slotted M12 × 70 rods cast in, nutted on the cradle (S3)                                         |
| alternator | `coils`             | Bobines / Coils                                     | electrical | 6 × 76 turns (K7)                                                                                               |
| alternator | `shaft`             | Fusée et berceau / Stub axle and cradle             | mechanical | FIXED: car-hub stub axle screwed on the cradle (Ø140 × 8 disc); the plans' 1" hollow shaft is the older variant |
| alternator | `bearing-hub`       | Cloche de moyeu à roulements / Hub bell on bearings | mechanical | turns on the stub axle; carries the rotor and the blades on 4 M12 × 140 rods                                    |
| alternator | `studs`             | Tiges de stator / Stator rods                       | mechanical | 3 × M12 × 70, set the stator on the cradle and the ~1 mm air gap                                                |
| alternator | `air-gap`           | Entrefer / Air gap                                  | electrical | about 1 mm (K11), shown as a gauge, not a solid                                                                 |
| alternator | `star-wiring`       | Couplage étoile / Star wiring                       | electrical | three phases                                                                                                    |
| blades     | `blade`             | Pale / Blade                                        | mechanical | the carved blade                                                                                                |
| blades     | `blade-blank`       | Plateau de bois / Timber blank                      | material   | start of the carving                                                                                            |
| blades     | `windward-face`     | Face au vent (intrados) / Windward face             | mechanical | flat-ish, twisted                                                                                               |
| blades     | `leeward-face`      | Dos de pale (extrados) / Leeward face               | mechanical | curved                                                                                                          |
| blades     | `blade-root`        | Pied de pale / Blade root                           | mechanical | widest (153 mm)                                                                                                 |
| blades     | `blade-tip`         | Bout de pale / Blade tip                            | mechanical | 55 mm chord                                                                                                     |
| blades     | `hub-disc`          | Disque de moyeu / Hub disc                          | mechanical | plywood disc carrying the blades                                                                                |
| blades     | `moulds`            | Moules (rotor, stator) / Moulds                     | tool       | polyester resin work; dust and fumes (S7 hazards in §7)                                                         |

**Frozen on 2026-10-29 in `src/part-ids.ts`: 35 ids** (site 13, turbine 8, alternator 10, blades 4), which replaces the draft
above. Changes: `wind-turbine` added to `site` (the machine on the mast, one part that opens `turbine`); `alternator` added to
`turbine` (one part that opens the `alternator` world, like the ram lab's `waste-valve`); `moulds` moved from `blades` to
`alternator` (they cast the discs and the stator); in `blades` the faces, the root and the tip are no longer parts (they
are labels and text of `blade`: a blade is one solid piece of timber), and `station-templates` is new (the six sections
of S4 p. 43). **Corrected the same day, after the data role read S3 and S4 p. 44–46:** the 1.2 m machine has ONE magnet rotor (8 magnets), so
`magnet-rotor-front` and `magnet-rotor-rear` became `magnet-rotor`; the two-rotor layout (12 magnets each) is the 2.4 m
machine's. The machine of the video is the wiki's (S3), which prevails over the 2003 plans: a car-hub stub axle screwed on a cradle (disc Ø140 × 8) welded to the nacelle is FIXED, the stator hangs on the cradle by three M12 × 70 rods, and the hub bell turns on the stub axle carrying the rotor and the blades on four M12 × 140 rods; the plans' hollow shaft with the stator moulded onto it is the older variant. Categories follow the kit's five (`hydraulic`, `mechanical`, `electrical`, `structure`, `site`): the draft's
`material` and `tool` do not exist. Guides: **assembly** (≈ 25 steps over the `blades` then `alternator` then `turbine` worlds: carve the blades,
cast the rotors, wind and cast the stator, build the frame and tail, assemble, balance the rotor, test on the bench at one
turn per second, wire) and **installation** (≈ 10 steps over `site`: siting, tower and guys, cable, rectifier and brake
switch, battery, controller, raise the machine, first check). The video's own touches become _Tip_ and _Warning_ callouts
(S1: choosing a windy, clear site; the first bench test "est-ce qu'on a du jus").

Drawings (A3, generated from `dims.ts`): overview, blade carving by stations, alternator (rotors and stator), stator winding
and star wiring, furling geometry (yaw, tail hinge), tower and guys, electrical schematic with brake switch, fuse and
battery. About 7 sheets.

Lessons (6): 1. Why the wind speed counts cubed (and what mast height buys). 2. Betz and the blades: three thin fast blades,
tip speed ratio. 3. From rotation to volts: magnets, coils, turns, the 12 V choice. 4. Cut-in and the battery: why it only
charges above about 3 m/s, wiring losses. 5. Surviving the storm: the offset and the inclined tail. 6. Siting and sizing:
mast, obstacles, annual yield, honest capacity factor.

## 5. Physics (for the physics role)

All in SI, ρ = 1.23 kg/m³ (adjustable with altitude). New modules, not in the kit yet: wind (Weibull, gusts, shear) and
rotor aerodynamics; the electrical side reuses `@onigam/lab-kit/sim/electric` (rectifier, battery, cable, dump load), as
the Pelton lab did.

1. **Wind**: a mean speed `U` and a Weibull distribution (shape k = 2, the Rayleigh case, adjustable) for the yearly view; a
   gust process (a slow turbulence around the mean, intensity set by the obstacles and the mast height) for the live view;
   a power-law shear with height for the mast height lesson.
2. **Rotor**: `P_rotor = ½ρ·A·Cp(λ)·v³ · cos³(yaw)` with `λ = ω·R/v` and a smooth `Cp(λ)` curve peaking at `Cp_max ≈ 0.30` near
   `λ ≈ 6–7` (K15–K16), falling to zero at low `λ` (stall: the lesson of S4, "this alternator holds the blade speed down very
   low at high power, which can cause the blades to stall") and at the runaway speed. The torque is `P_rotor/ω`.
3. **Alternator (axial-flux, three phases, star)**: `E_ll = ke·ω` with `ke` set from K10; phase resistance from the winding (K7
   and §2 check 4) and a small synchronous reactance; **12 V charging through a three-phase bridge** (`V_dc = 1.35·E_ll`
   minus two diode drops); battery current `I = (V_dc − V_batt)/R_dc`, power `V_batt·I`; the electromagnetic torque closes
   the loop. Dynamics `J·dω/dt = T_rotor − T_elec − T_friction`, with `J` estimated from the rotor mass (unknown).
   Brake switch: the phases are shorted, the rotor stops. Battery disconnected: the rotor **runs away**.
4. **Battery and regulation**: a simple state of charge with a voltage curve, limits 11.5 V and 14 V (K22), a dump load at 14 V,
   low-voltage disconnect at 11.5 V, loads of the house.
5. **Cable**: `I²R` of the round trip with section and length (K21 is a test).
6. **Furling**: thrust `T = ½ρA·Ct(λ)·v²`; yaw moment `T·e` (offset, K13) against the restoring moment of the tail vane, whose
   lift and weight act through the inclined hinge. The tail folds as a function of wind speed and tail weight: the model
   calibrates one parameter, the tail weight, so that furling starts near 10 m/s (K12), and says so in the "design" note.
   Effective rotor area falls with the yaw angle (power ∝ cos³ in the simplest case, to check).
7. **Yearly yield**: integrate the power curve over the Weibull distribution: energy, capacity factor, and the K25 bracket.
8. **Diameter parameter**: 1.0 to 4.2 m (K3): power ∝ D², the alternator and the tail scale with D; the 2.4 m machine
   (K18: ~500 W normal) is a second calibration point.

**Presets**: `calm-valley` (mean 3.5 m/s), `hamlet` (5 m/s, the default), `windy-plateau` (7 m/s). **Scenarios**: steady wind
sweep (power curve, cut-in at about 3 m/s); gusts; **storm** (the tail folds, power plateaus, the rotor stays safe) against a
fixed tail (overspeed); battery full (dump load); battery disconnected (runaway, brake switch); thin or long cable (K21);
mast too low (turbulence); too few turns (no charging at low wind, K9, S5); 24 V stator on a 12 V battery.

**Tests** (`src/sim/*.test.ts`): K14 (696 W in the wind at 10 m/s, ±1 %), K15 (Cp never above Betz, peak 0.25–0.35), K16 (334 rpm
at 3 m/s and λ = 7), K17 (blade power within 20 % of the rule), K10 (1.9 V at 60 rpm), K20 (cut-in between 2.5 and 4 m/s), K21
(38 % and 13 %), K12 (furling onset between 8 and 12 m/s), K22 (regulation), K2/K19 (peak battery power 150–250 W, curve flat
after furling), K18 (2.4 m: about 500 W), energy conservation (battery power never above rotor power).
**Open modelling questions**: the wind speed of the 200 W rating (K19), the winding resistance and alternator efficiency
(§2 check 4), the shape of `Cp(λ)` and of the furling curve (not in the sources, to be derived), the rotor inertia.

## 6. Versions

**One version.** The video shows one machine (1.2 m, 200 W, 12 V). The sizes of the family (K3) change little in the story:
the rotor diameter becomes a parameter of the simulation and of the sizing lesson. The kit has no version switch (BRIEF §3).
The 2.4 m machine of the plans (24 magnets, 500 W) could justify a second version only if the owner wants a comparison of
scales in 3D: not proposed.

## 7. Safety, legal, credits

- **Hazards**: medium. (1) **Neodymium magnets**: they snap together and crush fingers, shatter, and affect pacemakers; keep
  them apart with the jig, never let two discs approach by hand. (2) **Raising the machine on a mast**: S6 reports a lifting
  rope that broke and dropped a turbine and its mast; use a hinged base, guys, and never stand under the machine. (3)
  **Spinning blades and high winds**: stop the machine with the brake switch before climbing or servicing, and never
  approach in a storm. (4) **Electrical**: 12 V means high currents (about 15 A at 200 W); fuse every circuit, thick cable (K21), a brake switch
  that shorts the alternator but never the battery; a lead-acid battery gives off hydrogen. (5) **Workshop**: polyester resin
  (styrene fumes), fibreglass, wood dust, welding. (6) **Do not trap the wires** between nacelle and mast top (S6).
- **Warning to show**: this is an educational lab, not a construction plan; a course with a trainer is strongly advised (S6).
- **Legal (France)**: a mast under 12 m generally needs no formality, except in protected areas or against local planning
  rules; from 12 m a building permit is required; check with the mairie (S9). Other countries differ.
- **Notice**: independent educational reconstruction, not an official drawing or a product; credit and link S1–S7; no images
  or footage from the videos; the dimensions of the plans are facts published by their author, credited and not copied as
  text or drawings.

## 8. Decisions of the owner (2026-10-29)

The owner answered "Je fais confiance à tes recommandations": every recommendation below is adopted.

1. **Level: Full** (4 worlds, ~40 parts, 6 lessons, ~7 drawings), not Lite. Full probably costs about twice as much in agents
   (the ram lab took about 7.8 million tokens for its enrichment, review and QA waves); the roadmap marks Piggott as Full.
2. **Main source: the Low-tech Lab video (S1)**, with the wiki figures (S3) and the maker's plans (S4).
3. **The machine: 1.2 m / 200 W / 12 V of the video**, with the rotor diameter as a simulation parameter from 1.0 to 4.2 m
   (no second machine).
4. **Dimensions: the maker's published ones** (blade stations, magnets, coils, tail geometry) in the 3D model and the part
   sheets, with credit and a "take a course" warning.
5. **Story and the "aha"**: the storm (the tail folds, power plateaus) and the cubic law, plus the yearly yield with a sober
   capacity factor.
6. **Sites: generic presets** (calm valley, hamlet, windy plateau), not a real place.
7. **Winding resistance puzzle** (§2 check 4): the physics **reports the alternator efficiency it finds**, even if the 200 W is
   then reached later than the sources suggest; the model is never tuned to print 200 W.
8. **Video details** (furling wind speed at 06:25, first reading at 08:09, mast height of the test): **not checked on the
   video** (nobody watched it); the estimates marked in §3 and the "to confirm" notes in §2 stand.

### After wave 1 (2026-10-29)

Wave 1 (commit `7ad62d6`, `docs/physics.md` §7) found a peak battery power of 63 W for the 1.2 m machine (50 W at 10 m/s,
60 W at 12 m/s), not the 200 W of the label (K2/K19), and 242 W for 2.4 m against "about 500 W" (K18). Nothing was tuned.

9. **The owner's judgement: about 60 W is the right order for a machine of this size**, "it depends on the size" (the video
   is inspired by the DIY wind-turbine book of S11). Consequence for now: the model stays as it is, with the sensitivity
   note (`docs/physics.md` §7.4). **Caveat recorded**: S11's page gives no figure for 1.2 m; it presents Piggott ferrite
   machines from about 600 W to about 3 kW with rotors from 2 m to 4 m. Scaled with the swept area (P ∝ D²), 600 W at 2 m
   would give about 215 W at 1.2 m, the order of the label (S3), so S11 does not by itself support 60 W; what stays open is
   the wind speed of those ratings. The first reading of S1 (08:09) is still to be read by the owner.

10. **Wave 2 launched** (2026-10-29, "tu peux continuer"). The owner could not find the first reading at 08:09 on the video
    either, so K19 stays open (the wind speed of the 200 W rating is in no source we can read) and the model is unchanged.

## 9. Next steps

Wave 1 physics is done (above). Next: wave 2 3D ‖ data (ids of §4) → wave 3 drawings ‖ lessons → wave 4 QA → checkpoint with
the owner. The lessons must say that the machine's power curve is nearly linear in the wind speed once the rotor is held in
the stall (physics §7.6), not a cube. **Sizes** (the owner's idea, left to the lead, decided 2026-10-29): the diameter slider
(1.0 to 4.2 m) has been in the simulation panel since wave 1; the comparison of the seven sizes of K3 on one power chart goes
in wave 3 with a lesson "it depends on the size" (model, hamlet, cable scaled with the area: battery power at 12 m/s is
42, 60, 135, 242, 382, 558 and 773 W for 1.0, 1.2, 1.8, 2.4, 3.0, 3.6 and 4.2 m, about 0.3 of the labels scaled from the 200 W).
The spoken guide only after the checkpoint
(`lab-kit/docs/narration-style.md`; about 35 000 to 45 000 ElevenLabs credits in two languages, about 38 500 left). The
lead asks the owner's approval before launching each wave (token cost: the ram lab used about twice the estimate).
