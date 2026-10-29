import { configureDrawings } from '@onigam/lab-kit/drawings';
import { strL } from '@onigam/lab-kit/i18n';
import { h, type AppContext, type LabDefinition } from '@onigam/lab-kit/ui';
import { ASSEMBLY } from './data/guide';
import { LESSONS } from './data/lessons';
import { PARTS } from './data/parts';
import { SHEETS } from './drawings';
import { num, t, type UiKey } from './i18n/ui';
import { SimPanel } from './panels/sim';
import { PiggottSim } from './sim/engine';
import type { AlarmKey } from './sim/types';
import { createDeviceScene } from './three/device';

// The lab described to the kit. Edit the content here and in src/data, src/three, src/sim, src/drawings;
// the kit supplies the whole application frame (see BRIEF.md: the frame is locked).

configureDrawings({ project: { fr: 'PIGGOTT LAB — dispositif', en: 'PIGGOTT LAB — device' } });

const SEVERE_ALARMS = new Set<AlarmKey>(['overspeed', 'runaway', 'overcharge', 'overload']);

export const lab: LabDefinition<PiggottSim> = {
  id: 'piggott-lab',
  brand: { title: 'PIGGOTT LAB', tagline: strL('tagline'), icon: './favicon.svg' },
  sim: new PiggottSim(),
  defaultScene: 'device',
  parts: PARTS,
  scenes: [
    {
      id: 'device',
      label: strL('sceneDevice'),
      module: createDeviceScene(),
      // text shown in the side panel while nothing is selected in this world
      overview: {
        title: { fr: 'Le dispositif', en: 'The device' },
        text: {
          fr: 'Un **volant** monté sur un **axe**, porté par un **socle** : cliquez une pièce pour l’étudier.',
          en: 'A **wheel** on an **axle**, carried by a **base**: click a part to study it.',
        },
      },
    },
  ],
  guides: { assembly: { scene: 'device', steps: ASSEMBLY } },
  lessons: { items: LESSONS, intro: strL('lessonsIntro') },
  plans: {
    sheets: SHEETS,
    groups: [{ id: 'device', label: strL('groupDevice') }],
    intro: strL('plansIntro'),
  },
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
  about: () => [h('div', { class: 'callout callout--tip' }, h('span', {}, t('disclaimer')))],
};
