import { configureDrawings } from '@onigam/lab-kit/drawings';
import { l, strL } from '@onigam/lab-kit/i18n';
import { h, icon, ICONS, type AppContext, type LabDefinition } from '@onigam/lab-kit/ui';
import { ASSEMBLY } from './data/assembly';
import { CHAPTERS } from './data/chapters';
import { INSTALL } from './data/install';
import { LESSONS } from './data/lessons';
import { OVERVIEWS } from './data/overviews';
import { PARTS } from './data/parts';
import { SHEETS } from './drawings';
import { num, t, type UiKey } from './i18n/ui';
import { SimPanel } from './panels/sim';
import { PiggottSim } from './sim/engine';
import type { AlarmKey } from './sim/types';
import {
  createAlternatorScene,
  createBladesScene,
  createShedScene,
  createSiteScene,
  createTurbineScene,
} from './three';

// The lab described to the kit. Edit the content here and in src/data, src/three, src/sim, src/drawings;
// the kit supplies the whole application frame (see BRIEF.md: the frame is locked).

configureDrawings({ project: { fr: 'PIGGOTT LAB — éolienne', en: 'PIGGOTT LAB — wind turbine' } });

const SEVERE_ALARMS = new Set<AlarmKey>(['overspeed', 'runaway', 'overcharge', 'overload']);

/** The "Sources" panel: notice, warnings, credits and links, outline of the main video. */
function about(ctx: AppContext<PiggottSim>): HTMLElement[] {
  const fr = document.documentElement.lang !== 'en';
  const link = (href: string, label: string) => h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, label);
  const li = (href: string, label: string, note: string) => h('li', {}, link(href, label), ' — ', note);
  return [
    h('div', { class: 'callout callout--tip' }, h('span', {}, t('disclaimer'))),
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t('safety'))),
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t('legal'))),
    h(
      'p',
      {},
      fr ? 'Source principale : ' : 'Main source: ',
      link('https://www.youtube.com/watch?v=e_sZ3tH_15E', 'How to build homemade Piggott wind turbine'),
      fr
        ? ' — Low-tech Lab (vidéo tournée lors d’un atelier ouvert, avec un formateur du réseau Tripalium). Aucune image de la vidéo n’est reprise.'
        : ' — Low-tech Lab (filmed at an open workshop, with a trainer of the Tripalium network). No footage from the video is reused.',
    ),
    h('h3', { class: 'section-title' }, t('chapters')),
    h(
      'ul',
      { class: 'chapters' },
      ...CHAPTERS.map(([ts, f, e]) => h('li', {}, link(ctx.videoUrl(ts), ts), ' ', fr ? f : e)),
    ),
    h(
      'ul',
      { class: 'links' },
      li(
        'https://wiki.lowtechlab.org/wiki/Eolienne_200W',
        fr ? 'Wiki du Low-tech Lab, « Éolienne 200 W »' : 'Low-tech Lab wiki, “Éolienne 200 W”',
        fr
          ? 'le tutoriel de la machine de la vidéo : cotes, aimants, bobines, essai à un tour par seconde'
          : 'the tutorial of the video’s machine: dimensions, magnets, coils, test at one turn per second',
      ),
      li(
        'https://www.scoraigwind.com/pirate%20oldies/Hugh%20Piggott%20Axial-flow%20PMG%20wind%20turbine%20May%202003.pdf',
        'Hugh Piggott',
        fr
          ? 'plans publiés (2003) : stations des pales, théorie, repliement, câblage et batterie'
          : 'published plans (2003): blade stations, theory, furling, wiring and battery',
      ),
      li(
        'https://scoraigwind.co.uk/2011/12/wiring-up-a-12-volt-stator/',
        fr ? 'Blog de Hugh Piggott' : 'Hugh Piggott’s blog',
        fr ? 'câblage d’un stator 12 V' : 'wiring up a 12-volt stator',
      ),
      li(
        'http://www.tripalium.org/',
        'Tripalium',
        fr
          ? 'le réseau de formateurs : tailles de 1,0 à 4,2 m, stages d’une semaine'
          : 'the network of trainers: sizes from 1.0 to 4.2 m, one-week courses',
      ),
      li(
        'https://www.youtube.com/watch?v=6DMyj2sBf_Q',
        'France 3 Occitanie',
        fr ? 'un stage à Florac (Lozère), 1 min 35' : 'a course in Florac (Lozère), 1 min 35',
      ),
      li(
        'https://www.engineeringforchange.org/solutions/product/piggott-axial-flux-alternator-wind-turbine/',
        'Engineering for Change',
        fr ? 'deux tailles et leurs puissances à 12 m/s' : 'two sizes and their output at 12 m/s',
      ),
      li(
        'https://entreprendre.service-public.gouv.fr/vosdroits/F33368',
        'Service-public',
        fr ? 'les règles pour une éolienne domestique en France' : 'the rules for a home wind turbine in France',
      ),
    ),
    h('p', { class: 'hint' }, 'Three.js · TypeScript · Vite — MIT'),
  ];
}

export const lab: LabDefinition<PiggottSim> = {
  id: 'piggott-lab',
  brand: { title: 'PIGGOTT LAB', tagline: strL('tagline'), icon: './favicon.svg' },
  sim: new PiggottSim(),
  defaultScene: 'site',
  video: { id: 'e_sZ3tH_15E' },
  parts: PARTS,
  scenes: [
    {
      id: 'site',
      label: strL('sceneSite'),
      module: createSiteScene(),
      cutaway: false,
      xrayNeedsSelection: true,
      partPadding: 2.2,
      stepFrame: { padding: 1.5, minRadius: 0.35 },
      xrayShell: (id) => ['obstacles', 'house'].includes(id),
      overview: {
        ...OVERVIEWS.site,
        actions: [
          { label: strL('goTurbine'), scene: 'turbine', primary: true },
          { label: strL('goShed'), scene: 'shed' },
        ],
      },
    },
    {
      id: 'turbine',
      label: strL('sceneTurbine'),
      module: createTurbineScene(),
      partPadding: 2.2,
      stepFrame: { padding: 1.5, minRadius: 0.12 },
      xrayShell: (id) => ['rotor', 'nacelle-frame', 'yaw-bearing'].includes(id),
      overview: {
        ...OVERVIEWS.turbine,
        actions: [
          { label: strL('goAlternator'), scene: 'alternator', primary: true },
          { label: strL('goBlades'), scene: 'blades' },
          { label: strL('goSite'), scene: 'site' },
        ],
      },
    },
    {
      id: 'alternator',
      label: strL('sceneAlternator'),
      module: createAlternatorScene(),
      partPadding: 2.0,
      stepFrame: { padding: 1.6, minRadius: 0.05 },
      xrayShell: (id) => ['magnet-rotor', 'bearing-hub', 'stator'].includes(id),
      overview: {
        ...OVERVIEWS.alternator,
        actions: [{ label: strL('goTurbine'), scene: 'turbine', primary: true }],
      },
    },
    {
      id: 'blades',
      label: strL('sceneBlades'),
      module: createBladesScene(),
      cutaway: false,
      partPadding: 2.2,
      stepFrame: { padding: 1.5, minRadius: 0.08 },
      xrayShell: (id) => id === 'hub-disc',
      overview: {
        ...OVERVIEWS.blades,
        actions: [{ label: strL('goTurbine'), scene: 'turbine', primary: true }],
      },
    },
    {
      id: 'shed',
      label: strL('sceneShed'),
      module: createShedScene(),
      cutaway: false,
      xrayNeedsSelection: true,
      partPadding: 2.4,
      stepFrame: { padding: 1.6, minRadius: 0.25 },
      xrayShell: () => false,
      overview: {
        ...OVERVIEWS.shed,
        actions: [{ label: strL('goSite'), scene: 'site', primary: true }],
      },
    },
  ],
  partLinks: {
    'wind-turbine': { scene: 'turbine', label: strL('goTurbine') },
    'technical-room': { scene: 'shed', label: strL('goShed') },
    rotor: { scene: 'blades', label: strL('goBlades') },
    alternator: { scene: 'alternator', label: strL('goAlternator') },
  },
  guides: {
    // the build crosses three worlds (every step names its own); the installation plays on the site
    assembly: { scene: 'blades', steps: ASSEMBLY },
    install: { scene: 'site', steps: INSTALL },
  },
  lessons: { items: LESSONS, intro: strL('lessonsIntroPiggott') },
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
  // spoken guide: audio and subtitles generated from narration/<lang>.json (see narration/README.md)
  narration: { manifest: 'audio/{lang}/manifest.json' },
  simPanel: (ctx: AppContext<PiggottSim>) => new SimPanel(ctx),
  strip: {
    values: (sim) => {
      const s = sim.state;
      return [
        { label: t('stripWind'), value: num(s.wind, 1), unit: 'm/s', cls: 'live--water' },
        { label: t('stripRpm'), value: num(s.rpm), unit: t('unitRpm') },
        { label: t('stripPower'), value: num(s.busPower), unit: 'W', cls: 'live--pv' },
        { label: t('stripBattery'), value: num(s.soc * 100), unit: '%', cls: 'live--load' },
      ];
    },
    // the simulated time of day (the run starts at 08:00) and the day
    clock: (sim) => {
      const s = sim.state;
      const hour = Math.floor(s.hour);
      const minute = Math.floor((s.hour - hour) * 60);
      return {
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        sub: `${t('clockDay')} ${s.day + 1}`,
      };
    },
    alarms: (sim) =>
      sim.state.alarms.map((key) => ({
        key,
        label: t(`alarm_${key}` as UiKey),
        severe: SEVERE_ALARMS.has(key),
      })),
  },
  about,
};
