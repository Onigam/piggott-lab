# Piggott Lab

An interactive 3D lab of a **homemade Piggott wind turbine**: three hand-carved wooden blades, a gearless axial-flux alternator
and a tail that folds the machine out of the wind in a storm, charging a 12 V battery with no grid.

**▶ https://piggott-lab.vercel.app** · French and English · desktop, tablet and phone

It is the third lab of a series that started with [Pelton Lab](https://github.com/Onigam/pelton-lab) (micro-hydro
electricity), built on the same frame, [lab-kit](https://github.com/Onigam/lab-kit).

## What is in it

- **Four 3D worlds**: the **site** (a guyed mast on a hinged base, trees, the cable run to a battery shed, the house), the
  **machine** on its mast top, its **alternator** and the **blades** being carved. Explode, X-ray, isolate, section and
  current-flow overlays, labels, slow motion.
- **Assembly and installation guides** that follow the build step by step (24 and 12 steps) and move from one world to another.
- **A simulation** of the machine (a pure, unit-tested physics model): wind with gusts and a yearly distribution, a rotor held
  back by its alternator, a lead-acid battery with its dump load and cable, furling in a storm, three sites, eleven scenarios,
  and a rotor diameter from 1.0 to 4.2 m.
- **Eight A3 design drawings** generated from the same dimensions as the 3D model (the machine, the blade, furling, the
  alternator, the winding, the tower, the electrical schematic, power by size), **six short lessons with a quiz**, and a
  **catalogue of 35 parts** whose sheets say what each part does, how it is made and what to watch for.
- **A size comparison** in the simulation: the model's power for the seven rotor diameters of the family on one chart.

## What is real and what is not

- This is an **independent educational reconstruction**: not an official drawing, not a product, no footage or image of the
  video is reused.
- The main source is the Low-tech Lab video
  [_How to build homemade Piggott wind turbine_](https://www.youtube.com/watch?v=e_sZ3tH_15E), with the figures of the
  Low-tech Lab wiki (_Éolienne 200 W_), the plans published by Hugh Piggott and the Tripalium network. The machine is the
  1.20 m, 12 V one of the video; the family of sizes is a parameter of the simulation.
- **The label says 200 W; the model does not retrieve it.** With the bench figure of the wiki (1.9 V between phases at one turn
  per second) the alternator holds the rotor in the stall and the model gives about 60 W at 12 m/s, 63 W at its peak. Nothing was
  tuned to print 200 W: the wind speed of that rating is in no source we can read, and the result depends on a curve of the blades
  that nobody publishes (44 to 98 W across the variants). The reasoning is in [`docs/physics.md`](docs/physics.md) §7.
- Every figure is tagged _reported_, _derived_, _model result_, _calibrated_, _assumption_ or _estimate_; the sources are in
  [`docs/research.md`](docs/research.md).
- **Safety and law**: neodymium magnets crush fingers, resin and wood dust need a mask, a mast is raised with a hinged base and
  guys, never from under the machine. In France a mast under 12 m generally needs no formality, from 12 m a permit: ask the
  mairie. Nothing here is a plan to build from; a course with a trainer is the right school.

## Run it

```bash
npm install
npm run dev
```

`npm run typecheck && npm run format:check && npm test && npm run build` is what CI runs; every push to `main` deploys to
Vercel. `npm run kit:bump` moves to a newer lab-kit.

## Project layout

- `src/three/` the four worlds and `dims.ts`, the single source of dimensions (metres, each tagged); `src/sim/` the pure
  physics; `src/data/` parts, guides, chapters, lessons; `src/drawings/` the A3 sheets; `src/panels/` the simulation panel; `src/lab.ts` describes the lab to the kit;
  `src/part-ids.ts` freezes the 35 part ids shared by all of them.
- `docs/` research notes and sources, physics notes, 3D and data notes, requests to the kit; `BRIEF.md` is the brief the agent
  team works from.

Built with Three.js, TypeScript and Vite (MIT). Credits and links to every source are in the app, in _Sources_.

---

## Français

**Piggott Lab** est un lab 3D interactif d'une **éolienne Piggott artisanale** : trois pales de bois taillées à la main, un
alternateur à flux axial sans réducteur et une queue qui replie la machine hors du vent dans la tempête, pour charger une batterie
12 V sans réseau. Il est le troisième de la série commencée avec [Pelton Lab](https://github.com/Onigam/pelton-lab), sur le même
socle, [lab-kit](https://github.com/Onigam/lab-kit).

**▶ https://piggott-lab.vercel.app** · français et anglais · ordinateur, tablette et téléphone

**Ce qu'il contient.** Quatre mondes 3D (le **site**, la **machine** sur son mât, son **alternateur**, les **pales** en cours de
taille) avec éclaté, rayons X, isolement, coupe et flux ; des guides de **montage** (24 étapes) et d'**installation** (12 étapes) ;
une **simulation** (vent avec rafales, rotor freiné par son alternateur, batterie, délesteur, câble, repliement dans la tempête,
trois sites, onze scénarios, diamètre de 1,0 à 4,2 m, comparaison des sept tailles sur un graphique) ; **huit plans A3** générés
des cotes du modèle 3D ; **six leçons** avec quiz ; un catalogue de **35 pièces**.

**Ce qui est réel, ce qui ne l'est pas.** Reconstitution pédagogique indépendante, aucune image de la vidéo reprise. Source
principale : la vidéo du Low-tech Lab, avec les chiffres de leur wiki, les plans publiés par Hugh Piggott et le réseau Tripalium.
**L'étiquette annonce 200 W ; le modèle ne les retrouve pas** : avec la mesure du wiki (1,9 V entre phases à un tour par seconde),
l'alternateur retient le rotor en décrochage et le modèle donne environ 60 W à 12 m/s (63 W au pic). Rien n'a été ajusté pour
afficher 200 W (voir [`docs/physics.md`](docs/physics.md) §7). **Sécurité et droit** : les aimants néodyme écrasent les doigts, la
résine et la poussière de bois demandent un masque, un mât se lève avec un pied articulé et des haubans ; en France, un mât de moins
de 12 m n'exige en général aucune formalité, à partir de 12 m un permis : renseignez-vous en mairie. Ce n'est pas un plan de
construction.

**Lancer en local.** `npm install` puis `npm run dev` ; la CI lance `npm run typecheck && npm run format:check && npm test && npm
run build` ; chaque push sur `main` déploie sur Vercel.
