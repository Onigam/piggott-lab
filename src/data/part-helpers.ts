// Helpers shared by the part catalogues (src/data/parts/*.ts), the guides and the overviews. Ported from the ram lab
// (src/data/part-helpers.ts) and adapted.
//
// Status of the figures (the same words as docs/physics.md). A figure with NO tag is REPORTED by a source, named in the
// text: the video (Low-tech Lab, with its timestamp in `video`), the Low-tech Lab wiki tutorial, Hugh Piggott's plans
// (2003), Tripalium, Service-public. Tagged figures are not reported:
//   « dérivé / derived »                   computed from reported figures;
//   « résultat du modèle / model result »  an output of the simulation (src/sim), checked by data.test.ts;
//   « calibré sur la vidéo / calibrated »  the one setting chosen so that the model retrieves a reported figure;
//   « hypothèse du modèle / assumption »   a model constant that no source gives (src/sim/machine.ts);
//   « estimation / estimate »              a dimension of the 3D model (src/three/dims.ts) that no source gives.
// The label of the machine says 200 W (nominal, the wind speed is not given): a text that quotes the power says if it is
// the label or the model's. Nothing here is copied from the private transcript or from a source: facts and figures only.

import type { Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { DERIVED_KEYS, FIG, MODEL_KEYS, type FigName } from './figures';
import { nEn, nFr } from './units';

/** English form of a number written the French way (7,5 -> 7.5 ; 5 700 -> 5,700 ; 40 % -> 40%). */
export function enNum(fr: string): string {
  return fr
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d) (\d{3})(?!\d)/g, '$1,$2')
    .replace(/(\d) %/g, '$1%');
}

/** Plain value written the French way: derive the English form when it differs. */
export function num(fr: string): L | string {
  const en = enNum(fr);
  return en === fr ? fr : l(fr, en);
}

/** Spec row with a bilingual label and a plain (auto-localised) or bilingual value. */
export function sp(fr: string, en: string, value: string | L): Spec {
  return { label: l(fr, en), value: typeof value === 'string' ? num(value) : value };
}

export type Status = 'derived' | 'model' | 'calibrated' | 'assumed' | 'estimate';

export const TAG: Record<Status, readonly [string, string]> = {
  derived: ['dérivé', 'derived'],
  model: ['résultat du modèle', 'model result'],
  calibrated: ['calibré sur la vidéo', 'calibrated on the video'],
  assumed: ['hypothèse du modèle', 'model assumption'],
  estimate: ['estimation', 'estimate'],
};

/** A value that is not reported by a source, tagged in both languages. `en` defaults to the converted `fr`. */
export function tagged(status: Status, fr: string, en?: string): L {
  const [tf, te] = TAG[status];
  return l(`${fr} (${tf})`, `${en ?? enNum(fr)} (${te})`);
}

/** A length in metres shown in millimetres, tagged unless reported (status null). */
export function lenMm(status: Status | null, ...metres: number[]): L {
  const fr = metres.map((m) => nFr(m * 1000, Math.abs(m * 1000 - Math.round(m * 1000)) < 1e-6 ? 0 : 1)).join(' × ');
  const en = metres.map((m) => nEn(m * 1000, Math.abs(m * 1000 - Math.round(m * 1000)) < 1e-6 ? 0 : 1)).join(' × ');
  return status ? tagged(status, `${fr} mm`, `${en} mm`) : l(`${fr} mm`, `${en} mm`);
}

function fill(text: string, lang: 'fr' | 'en'): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => {
    const fig = FIG[key as FigName];
    if (!fig) throw new Error(`unknown figure {${key}} in "${text}"`);
    return lang === 'fr' ? nFr(fig[0], fig[1]) : nEn(fig[0], fig[1]);
  });
}

/** A text that uses a model result or a derived figure must say so in the same text, in each language. */
function checkStatus(fr: string, en: string, filledFr: string, filledEn: string): void {
  const keys = [...new Set([...fr.matchAll(/\{(\w+)\}/g), ...en.matchAll(/\{(\w+)\}/g)].map((m) => m[1] as string))];
  const need = (set: ReadonlySet<string>, reFr: RegExp, reEn: RegExp, what: string) => {
    if (keys.some((k) => set.has(k)) && !(reFr.test(filledFr) && reEn.test(filledEn)))
      throw new Error(`a ${what} figure is used without saying so (both languages): "${filledFr}"`);
  };
  need(MODEL_KEYS, /modèle/i, /model/i, 'model-result');
  need(DERIVED_KEYS, /dérivé/i, /derived/i, 'derived');
}

/** Bilingual text whose {placeholders} are FIG numbers, written the French way in `fr` and the English way in `en`. */
export function lf(fr: string, en: string): L {
  const filled = { fr: fill(fr, 'fr'), en: fill(en, 'en') };
  checkStatus(fr, en, filled.fr, filled.en);
  return l(filled.fr, filled.en);
}

/** Same as `lf` for a spec value that is not reported by a source: adds the status tag. `en` defaults to `fr`. */
export function tf(status: Status, fr: string, en?: string): L {
  const [tagFr, tagEn] = TAG[status];
  const filled = { fr: `${fill(fr, 'fr')} (${tagFr})`, en: `${fill(en ?? fr, 'en')} (${tagEn})` };
  checkStatus(fr, en ?? fr, filled.fr, filled.en);
  return l(filled.fr, filled.en);
}

/**
 * The three paragraphs of a `maintenance` text (the kit renders a blank line as a paragraph break), each opened by a bold
 * label, in this order: the typical failure, how a visitor can check it, the routine maintenance.
 */
export function maint(
  fr: { failure: string; check: string; care: string },
  en: { failure: string; check: string; care: string },
): L {
  return lf(
    `**Panne à prévoir.** ${fr.failure}\n\n**À vérifier.** ${fr.check}\n\n**Entretien.** ${fr.care}`,
    `**Typical failure.** ${en.failure}\n\n**How to check.** ${en.check}\n\n**Maintenance.** ${en.care}`,
  );
}
