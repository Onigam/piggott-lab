// The figures of the lessons and the way a lesson text is built from them (lessons.ts uses both; lessons.test.ts checks them).
//
// Who says what. A number in a lesson is one of four things:
//   reported  stated by a source and written in the text itself (the video, the wiki, Hugh Piggott's plans, Tripalium,
//             Service-public); lessons.test.ts keeps a list of them, each with its source;
//   derived   computed by us from reported figures: the text says « calcul / calculation » in the same paragraph;
//   model     an output of src/sim for the default machine on the site the lesson opens: the text says « modèle / model »;
//             lessons.test.ts re-runs the simulation and fails loudly if the model is ever recalibrated;
//   label     the 200 W of the label (nominal, the wind speed is not given): the text says it is the label.
// The numbers that are derived or model results are written once, here or in figures.ts (the part sheets' table), and put in
// the French and the English text through {name} placeholders, so that the two languages cannot drift apart.

import type { Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { TAIL } from '../three/dims';
import { DERIVED_KEYS, FIG, MODEL_KEYS } from './figures';
import { nEn, nFr } from './units';

export type Kind = 'reported' | 'derived' | 'model';
type LessonFig = readonly [value: number, decimals: number, kind: Kind];

/** The figures of the lessons that the sheets' table (figures.ts) does not hold: [value as printed, decimals, kind]. */
export const LESSON_FIG = {
  // ---- derived
  wind5: [87, 0, 'derived'], // W in the wind at 5 m/s: ½ρAv³ with A = π·0.6² (K14 gives 696 W at 10 m/s)
  rpm10Design: [1114, 0, 'derived'], // rpm of a 1.2 m rotor at tip speed ratio 7 in 10 m/s: v·λ·60/(πD)
  bridge: [1.35, 2, 'derived'], // 3√2/π: rectified voltage per volt between phases (S4 rounds it to 1.4)
  needDc: [13.9, 1, 'derived'], // V at the bridge output to charge a 12.4 V battery: 12.4 + 1.5 V of diodes
  needAc: [10.3, 1, 'derived'], // V between phases for that: 13.9 / 1.35
  amps500: [42, 0, 'derived'], // A for 500 W at 12 V (K21 reproduced by hand: 41.7 A)
  amps200: [14, 0, 'derived'], // A for 200 W at 14 V: 14.3
  copper200: [150, 0, 'derived'], // W of heat in two phases of 0.371 Ω at 14.3 A (physics.md §7.3): 151
  // ---- reported, from the dimensions the 3D role keeps
  hinge: [TAIL.tiltDeg, 0, 'reported'], // K13
  // ---- model results (default machine, hamlet preset unless the comment says otherwise)
  w5: [13, 0, 'model'], // W to the battery in a steady 5 m/s at the hub
  mastRatio: [4.4, 1, 'model'], // (hub wind of the 18 m mast / hub wind of the 6 m mast)³ among 5 m trees
  batt: [12.4, 1, 'model'], // V of the half-charged battery of the cut-in example (the model's table: 12.25 V at 50 %, 12.5 V at 75 %)
  cut38: [4.2, 1, 'model'], // m/s: first watt of a stator wound with 38 turns (physics.md §7.5)
  size10: [42, 0, 'model'], // W to the battery at 12 m/s, hamlet, cable scaled with the area: 1.0 m
  size24: [242, 0, 'model'], // 2.4 m
  size42: [773, 0, 'model'], // 4.2 m
} as const satisfies Record<string, LessonFig>;

export type LessonFigName = keyof typeof LESSON_FIG;

export interface FigInfo {
  value: number;
  decimals: number;
  kind: Kind;
}

/** The value, the decimals and the status of a placeholder: the lessons' own table first, then the part sheets' table. */
export function figInfo(key: string): FigInfo | undefined {
  const own = (LESSON_FIG as Record<string, LessonFig>)[key];
  if (own) return { value: own[0], decimals: own[1], kind: own[2] };
  const sheet = (FIG as Record<string, readonly [number, number]>)[key];
  if (!sheet) return undefined;
  return {
    value: sheet[0],
    decimals: sheet[1],
    kind: MODEL_KEYS.has(key) ? 'model' : DERIVED_KEYS.has(key) ? 'derived' : 'reported',
  };
}

function fill(text: string, lang: 'fr' | 'en'): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => {
    const info = figInfo(key);
    if (!info) throw new Error(`unknown figure {${key}} in "${text}"`);
    return lang === 'fr' ? nFr(info.value, info.decimals) : nEn(info.value, info.decimals);
  });
}

/** The templates (with their {placeholders}) of the texts built by `lx`, for the tests: the filled text alone cannot tell a figure from a typed number. */
const RAW = new WeakMap<object, { fr: string; en: string }>();

export function rawOf(text: L): { fr: string; en: string } {
  return RAW.get(text) ?? { fr: text.fr, en: text.en };
}

/** Bilingual text whose {placeholders} are figures of LESSON_FIG or of figures.ts, written the French way and the English way. */
export function lx(fr: string, en: string): L {
  const out = l(fill(fr, 'fr'), fill(en, 'en'));
  RAW.set(out, { fr, en });
  return out;
}

/** Key-figure chip: a short label and a short value (the kit shows the value in a monospace font). */
export function chip(labelFr: string, labelEn: string, valueFr: string, valueEn: string = valueFr): Spec {
  return { label: lx(labelFr, labelEn), value: lx(valueFr, valueEn) };
}
