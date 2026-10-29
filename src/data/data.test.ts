import { describe, expect, it } from 'vitest';
import type { GuideStep, PartCategory, PartInfo } from '@onigam/lab-kit/content';
import type { L } from '@onigam/lab-kit/i18n';
import { LAB_STRINGS } from '../i18n/ui';
import { PART_CATEGORIES, WORLDS, partIds, type WorldId } from '../part-ids';
import { cutInOmega } from '../sim/alternator';
import { furlingOnset } from '../sim/calibration';
import { buildConfig } from '../sim/config';
import { radToRpm } from '../sim/physics';
import { presetParams } from '../sim/presets';
import { operatingPoint, referenceBattery } from '../sim/steady';
import { hubWind, turbulenceIntensity } from '../sim/wind';
import { yearlyYield } from '../sim/yield';
import { AIR_GAP, BLADE, HEAD, MAGNET, MAST, NACELLE, ROTOR_DISC, STATOR, STATOR_RODS, TAIL, YAW } from '../three/dims';
import { ASSEMBLY } from './assembly';
import { CHAPTERS } from './chapters';
import { FIG, MODEL } from './figures';
import { INSTALL } from './install';
import { OVERVIEWS } from './overviews';
import { PARTS } from './parts';
import { nEn } from './units';

// Content checks of the data role: the catalogue and the two guides against the frozen ids of src/part-ids.ts, FR/EN parity,
// the timestamps of the video, the numbers that the prose repeats against their sources, and every model result quoted in a text
// against the simulation (a recalibration of src/sim cannot go unnoticed).

const FROZEN: Record<string, { scene: WorldId; category: PartCategory }> = Object.fromEntries(
  WORLDS.flatMap((world) =>
    Object.entries(PART_CATEGORIES[world]).map(([id, category]) => [id, { scene: world, category }]),
  ),
);
const CATEGORIES: PartCategory[] = ['hydraulic', 'mechanical', 'electrical', 'structure', 'site'];
const VIDEO_SECONDS = 8 * 60 + 49; // Low-tech Lab, « How to build homemade Piggott wind turbine » (8:49)

const isL = (v: unknown): v is L => typeof v === 'object' && v !== null && 'fr' in v && 'en' in v;
const seconds = (ts: string): number => {
  const [m, s] = ts.split(':').map(Number);
  return (m ?? 0) * 60 + (s ?? 0);
};
const words = (t: string): number => t.trim().split(/\s+/).length;
const sentences = (t: string): number => t.split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ0-9«“"(*])/).length;

/** Every bilingual text of a part, with a label for the failure message. */
function partTexts(p: PartInfo): [string, L][] {
  const out: [string, L][] = [
    ['name', p.name],
    ['short', p.short],
    ['description', p.description],
    ['material', p.material],
  ];
  if (p.maintenance) out.push(['maintenance', p.maintenance]);
  if (p.tip) out.push(['tip', p.tip]);
  if (p.design) out.push(['design', p.design]);
  p.specs.forEach((s, i) => {
    out.push([`specs[${i}].label`, s.label]);
    if (isL(s.value)) out.push([`specs[${i}].value`, s.value]);
    else out.push([`specs[${i}].value`, { fr: s.value, en: s.value }]);
  });
  return out;
}

function stepTexts(s: GuideStep): [string, L][] {
  const out: [string, L][] = [
    ['title', s.title],
    ['text', s.text],
  ];
  if (s.tip) out.push(['tip', s.tip]);
  if (s.warning) out.push(['warning', s.warning]);
  s.tools?.forEach((t, i) => out.push([`tools[${i}]`, t]));
  return out;
}

/** Every bilingual text of the data role, labelled. */
function allTexts(): [string, L][] {
  const out: [string, L][] = [];
  for (const p of PARTS) for (const [k, v] of partTexts(p)) out.push([`part ${p.id}.${k}`, v]);
  for (const [guide, steps] of [
    ['assembly', ASSEMBLY],
    ['install', INSTALL],
  ] as const)
    for (const s of steps) for (const [k, v] of stepTexts(s)) out.push([`${guide} ${s.id}.${k}`, v]);
  for (const [world, o] of Object.entries(OVERVIEWS)) {
    out.push([`overview ${world}.title`, o.title]);
    out.push([`overview ${world}.text`, o.text]);
  }
  for (const [ts, fr, en] of CHAPTERS) out.push([`chapter ${ts}`, { fr, en }]);
  return out;
}

/** Numbers of a text, normalised so that the French and English spellings compare equal (7,5 / 7.5, 5 700 / 5,700). */
function figures(text: string, lang: 'fr' | 'en'): string[] {
  let t = text.replace(/[−–]/g, '-');
  if (lang === 'fr') t = t.replace(/(\d) (\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  else t = t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  return (t.match(/\d+(?:\.\d+)?/g) ?? []).sort();
}

// ------------------------------------------------------------------------------------------------ the catalogue

describe('parts catalogue', () => {
  it('has exactly the frozen ids of src/part-ids.ts, each once, in the catalogue order of that file', () => {
    const ids = PARTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(WORLDS.flatMap((w) => partIds(w)));
    expect(ids.length).toBe(36);
  });

  it('gives every part the frozen scene and category', () => {
    for (const world of WORLDS) {
      expect(PARTS.filter((p) => p.scene === world).length, world).toBe(partIds(world).length);
    }
    for (const p of PARTS) {
      expect(CATEGORIES, p.id).toContain(p.category);
      expect(p.scene, p.id).toBe(FROZEN[p.id]?.scene);
      expect(p.category, p.id).toBe(FROZEN[p.id]?.category);
    }
  });

  it('has a non-empty French and English text everywhere, no placeholder, no straight apostrophe', () => {
    const bad = /todo|tbd|lorem|xxx|placeholder|\{\w+\}/i;
    for (const [label, v] of allTexts()) {
      expect(v.fr.trim().length, `${label} fr`).toBeGreaterThan(0);
      expect(v.en.trim().length, `${label} en`).toBeGreaterThan(0);
      expect(v.fr + v.en, label).not.toMatch(bad);
      expect(v.fr + v.en, label).not.toMatch(/\p{L}'\p{L}/u);
      expect(v.fr.split('**').length % 2, `${label}: unbalanced ** in fr`).toBe(1);
      expect(v.en.split('**').length % 2, `${label}: unbalanced ** in en`).toBe(1);
    }
  });

  it('writes the two languages differently for the long texts, at the same level of detail', () => {
    for (const [label, v] of allTexts()) {
      if (v.fr.length < 40 && v.en.length < 40) continue;
      expect(v.fr, label).not.toBe(v.en);
      expect(v.fr.length / v.en.length, label).toBeGreaterThan(0.6);
      expect(v.fr.length / v.en.length, label).toBeLessThan(1.7);
    }
  });

  it('keeps the same figures in French and English', () => {
    for (const [label, v] of allTexts()) {
      expect(figures(v.fr, 'fr'), label).toEqual(figures(v.en, 'en'));
    }
  });

  it('tags a non-reported figure the same way in both languages', () => {
    const pairs: [string, string][] = [
      ['(estimation)', '(estimate)'],
      ['(dérivé)', '(derived)'],
      ['(hypothèse du modèle)', '(model assumption)'],
      ['(calibré sur la vidéo)', '(calibrated on the video)'],
      ['(résultat du modèle)', '(model result)'],
    ];
    for (const [label, v] of allTexts()) {
      for (const [fr, en] of pairs) expect(v.fr.includes(fr), `${label}: ${v.fr}`).toBe(v.en.includes(en));
    }
  });

  it('leaves no French in the English texts and no word in a spec value that is the same in both languages', () => {
    for (const [label, v] of allTexts()) expect(v.en, label).not.toMatch(/[éèêëàâùûôîïç]/i);
    for (const p of PARTS)
      for (const sp of p.specs) {
        const fr = isL(sp.value) ? sp.value.fr : sp.value;
        const en = isL(sp.value) ? sp.value.en : sp.value;
        if (/\p{L}{4,}/u.test(en.replace(/plans|wiki|Tripalium|Piggott|NdFeB/g, '')))
          expect(fr, `${p.id}: ${sp.label.en}`).not.toBe(en);
      }
  });

  it('has at least three specs per part, and short one-line summaries', () => {
    for (const p of PARTS) {
      expect(p.specs.length, p.id).toBeGreaterThanOrEqual(3);
      expect(p.short.fr.length, `${p.id} short`).toBeLessThanOrEqual(150);
      expect(p.short.en.length, `${p.id} short`).toBeLessThanOrEqual(150);
      expect(p.short.fr, `${p.id} short`).not.toMatch(/\n/);
    }
  });

  it('keeps a description to two to six sentences', () => {
    for (const p of PARTS) {
      for (const lang of ['fr', 'en'] as const) {
        const n = sentences(p.description[lang]);
        expect(n, `${p.id}.description ${lang}: ${n} sentences`).toBeGreaterThanOrEqual(2);
        expect(n, `${p.id}.description ${lang}: ${n} sentences`).toBeLessThanOrEqual(6);
      }
    }
  });

  it('writes the maintenance in three labelled paragraphs, in the order failure, check, care', () => {
    for (const p of PARTS) {
      if (!p.maintenance) continue;
      for (const [lang, labels] of [
        ['fr', ['**Panne à prévoir.**', '**À vérifier.**', '**Entretien.**']],
        ['en', ['**Typical failure.**', '**How to check.**', '**Maintenance.**']],
      ] as const) {
        const paragraphs = p.maintenance[lang].split('\n\n');
        expect(paragraphs.length, `${p.id} ${lang}`).toBe(3);
        labels.forEach((label, i) =>
          expect(paragraphs[i], `${p.id} ${lang}`).toMatch(new RegExp(`^${label.replace(/[*.]/g, '\\$&')}`)),
        );
      }
    }
    // the only sheets without one are the two that are not objects that age: the timber and the templates
    expect(PARTS.filter((p) => !p.maintenance).map((p) => p.id)).toEqual(['blade-blank', 'station-templates']);
  });

  it('gives video timestamps as mm:ss within the 8:49 video, in increasing order', () => {
    for (const p of PARTS) {
      let last = -1;
      for (const ts of p.video ?? []) {
        expect(ts, p.id).toMatch(/^\d{2}:[0-5]\d$/);
        expect(seconds(ts), `${p.id} ${ts}`).toBeLessThanOrEqual(VIDEO_SECONDS);
        expect(seconds(ts), `${p.id} ${ts}`).toBeGreaterThan(last);
        last = seconds(ts);
      }
    }
  });

  it('gives a positive whole quantity where there is one, as the sources say', () => {
    for (const p of PARTS) if (p.qty !== undefined) expect(Number.isInteger(p.qty) && p.qty > 0, p.id).toBe(true);
    const qty = (id: string) => PARTS.find((p) => p.id === id)?.qty;
    expect(qty('magnets')).toBe(8); // one rotor of 8 magnets (the 2.4 m machine has 2 × 12)
    expect(qty('blade')).toBe(3);
    expect(qty('blade-blank')).toBe(3);
    expect(qty('coils')).toBe(6);
    expect(qty('studs')).toBe(3); // the three stator rods (the four long rotor rods are drawn with the bearing hub)
  });

  it('makes the three parent sheets short and pointing at the detailed world', () => {
    for (const id of ['wind-turbine', 'rotor', 'alternator']) {
      const p = PARTS.find((x) => x.id === id)!;
      expect(p.short.fr, id).toMatch(/vue/);
      expect(p.short.en, id).toMatch(/view/);
      expect(p.description.fr.length, id).toBeLessThan(900);
    }
  });

  it('never cites the research notes by code: sources are named in words', () => {
    for (const [label, v] of allTexts()) expect(v.fr + v.en, label).not.toMatch(/\b(K\d{1,2}|S\d{1,2})\b/);
  });

  it('says that the 200 W is the label whenever it is quoted, and that the model finds less', () => {
    for (const [label, v] of allTexts()) {
      if (/\b200 W\b/.test(v.fr)) expect(v.fr, label).toMatch(/nominal|annonc|étiquette/i);
      if (/\b200 W\b/.test(v.en)) expect(v.en, label).toMatch(/nominal|rated|label/i);
    }
    const turbine = PARTS.find((p) => p.id === 'wind-turbine')!;
    expect(turbine.description.fr).toMatch(/wind speed|vent|vitesse/);
    expect(turbine.description.en).toMatch(/not given/);
    expect(turbine.description.en).toMatch(/not tuned/);
  });

  it('says that the small machine has ONE magnet rotor and that two rotors with 24 magnets are the 2.4 m machine’s', () => {
    for (const id of ['magnet-rotor', 'magnets']) {
      const p = PARTS.find((x) => x.id === id)!;
      expect(p.description.fr, id).toMatch(/2,4 m/);
      expect(p.description.fr, id).toMatch(/24/);
      expect(p.description.en, id).toMatch(/2\.4 m/);
      expect(p.description.en, id).toMatch(/\b24\b/);
    }
    expect(PARTS.find((x) => x.id === 'magnet-rotor')!.description.en).toMatch(/single rotor/);
    // the corrected research K6: no sheet or step speaks of front and rear rotors or of 16 magnets
    for (const [label, v] of allTexts()) {
      expect(v.en, label).not.toMatch(/front (magnet )?(rotor|disc)|rear (magnet )?(rotor|disc)|16 magnets/i);
      // the 2003 plans' hollow shaft is only ever a named variant
      if (/hollow/i.test(v.en)) expect(v.en, label).toMatch(/plans/);
    }
  });

  it('writes the kinematics of the video’s machine right (the wiki): a fixed stub axle and cradle, a stator on three rods, a hub bell that turns', () => {
    const text = (id: string) =>
      partTexts(PARTS.find((p) => p.id === id)!)
        .map(([, v]) => v.en)
        .join(' ');
    expect(text('shaft')).toMatch(/never turns/);
    expect(text('shaft')).toMatch(/screwed onto the cradle/);
    expect(text('shaft')).toMatch(/140 × 8 mm steel disc/);
    expect(text('shaft')).not.toMatch(/shaft that turns/);
    expect(text('nacelle-frame')).toMatch(/cradle is welded/);
    expect(text('stator')).toMatch(/three 12 mm rods/);
    expect(text('stator')).toMatch(/screwed onto the nacelle’s cradle/);
    expect(text('studs')).toMatch(/Three 12 mm threaded rods 70 mm long/);
    expect(text('studs')).toMatch(/air gap/);
    expect(text('bearing-hub')).toMatch(/bell turns on them, on the fixed stub axle/);
    expect(text('bearing-hub')).toMatch(/Four long 12 mm threaded rods 140 mm long, with sixteen nuts/);
    expect(text('magnet-rotor')).toMatch(/bolted to the bell/);
    expect(text('air-gap')).toMatch(/between the magnets and the stator face/);
    expect(text('air-gap')).toMatch(/stator nuts/);
    expect(text('hub-disc')).toMatch(/9 mm/);
    expect(text('hub-disc')).toMatch(/\(estimate\)/);
  });
});

// ------------------------------------------------------------------------------------------------ the guides

const guideIds = (steps: GuideStep[]) => steps.flatMap((s) => s.parts);

describe('assembly guide', () => {
  it('has 24 steps, with unique ids and a world each, in the wiki’s order: blades, the alternator parts, the frame, the assembly, the machine', () => {
    expect(ASSEMBLY.length).toBe(24);
    expect(new Set(ASSEMBLY.map((s) => s.id)).size).toBe(ASSEMBLY.length);
    const order = ASSEMBLY.map((s) => s.scene);
    expect(order.every((s) => typeof s === 'string')).toBe(true);
    const runs = order.filter((s, i) => s !== order[i - 1]);
    expect(runs).toEqual(['blades', 'alternator', 'turbine', 'alternator', 'turbine']);
  });

  it('installs every id of blades, alternator and turbine exactly once, and nothing else', () => {
    const expected = [...partIds('blades'), ...partIds('alternator'), ...partIds('turbine')].sort();
    expect(guideIds(ASSEMBLY).sort()).toEqual(expected);
    for (const s of ASSEMBLY) for (const id of s.parts) expect(FROZEN[id]?.scene, `${s.id}: ${id}`).toBe(s.scene);
  });

  it('has exactly two steps that install nothing: the bench test and the balancing of the rotor', () => {
    expect(ASSEMBLY.filter((s) => s.parts.length === 0).map((s) => s.id)).toEqual(['bench-test', 'balance']);
  });

  it('keeps every step text within 80 words in both languages, tips and warnings short', () => {
    for (const s of ASSEMBLY) {
      for (const lang of ['fr', 'en'] as const) {
        expect(words(s.text[lang]), `${s.id} text ${lang}`).toBeLessThanOrEqual(80);
        if (s.tip) expect(words(s.tip[lang]), `${s.id} tip ${lang}`).toBeLessThanOrEqual(35);
        if (s.warning) expect(words(s.warning[lang]), `${s.id} warning ${lang}`).toBeLessThanOrEqual(60);
      }
    }
  });

  it('gives rough durations written as estimates, tools in both languages, and no torque', () => {
    for (const s of ASSEMBLY) {
      expect(s.duration, s.id).toMatch(/^≈ \d+ (h|min) \(est\.\)$/);
      expect(s.torque, s.id).toBeUndefined();
      expect(s.tools?.length ?? 0, s.id).toBeGreaterThan(0);
    }
  });

  it('puts a warning where the hazards are: magnets, resin, welding, the tail hinge, the wires', () => {
    const step = (id: string) => ASSEMBLY.find((s) => s.id === id)!;
    expect(step('magnets').warning?.en).toMatch(/crush|pacemaker/);
    expect(step('stator').warning?.en).toMatch(/styrene/);
    expect(step('stator').warning?.en).toMatch(/catalyst/);
    expect(step('frame').warning?.en).toMatch(/Welding/);
    expect(step('bearing-hub').warning?.en).toMatch(/slowly/);
    expect(step('tail-hinge').warning?.en).toMatch(/weld/i);
    expect(step('wire-loop').warning?.en).toMatch(/short-circuits/);
  });

  it('does not publish the resin recipe', () => {
    const text = ASSEMBLY.map((s) => s.text.en + (s.warning?.en ?? '') + (s.tip?.en ?? '')).join(' ');
    expect(text).not.toMatch(/\bml\b|\bcc\b|\bgrams?\b|\b\d+ ?g\b/);
    expect(step('stator').text.en).toMatch(/not given here/);
    function step(id: string) {
      return ASSEMBLY.find((s) => s.id === id)!;
    }
  });

  it('runs through the machine in the wiki’s order: parts at the bench, the frame and its cradle, the generator assembly, the test, the blades, the tail', () => {
    const at = (id: string) => ASSEMBLY.findIndex((s) => s.id === id);
    expect(at('carve')).toBeLessThan(at('moulds'));
    for (const [a, b] of [
      ['moulds', 'coils'],
      ['coils', 'star'],
      ['star', 'stator'],
      ['studs', 'stator'], // the rods are screwed on the cradle and cast into the stator
      ['stator', 'frame'], // the cradle is welded on the frame after it served as the casting jig
      ['magnet-disc', 'magnets'],
      ['magnets', 'frame'],
      ['frame', 'yaw'],
      ['frame', 'shaft'], // the stub axle is screwed on the cradle of the frame
      ['shaft', 'bearing-hub'], // the hub bell turns on the stub axle
      ['bearing-hub', 'air-gap'], // the gap is set with the stator nuts once the rotor is on
      ['air-gap', 'alternator-on-frame'],
      ['alternator-on-frame', 'bench-test'],
      ['bench-test', 'rotor'],
      ['rotor', 'balance'],
      ['balance', 'tail-hinge'],
      ['tail-hinge', 'tail-boom'],
      ['tail-boom', 'tail-vane'],
      ['tail-vane', 'wire-loop'],
    ] as const)
      expect(at(a), `${a} before ${b}`).toBeLessThan(at(b));
  });
});

describe('installation guide', () => {
  it('has about 12 steps, all in the site world, with unique ids', () => {
    expect(INSTALL.length).toBeGreaterThanOrEqual(10);
    expect(INSTALL.length).toBeLessThanOrEqual(13);
    expect(new Set(INSTALL.map((s) => s.id)).size).toBe(INSTALL.length);
    // every step plays in the world of its parts (the technical room has its own), the closing check on the site
    for (const s of INSTALL) expect(s.scene, s.id).toBe(s.parts.length ? FROZEN[s.parts[0]!]?.scene : 'site');
  });

  it('installs every id of site exactly once, and nothing else', () => {
    expect(guideIds(INSTALL).sort()).toEqual([...partIds('site'), ...partIds('shed')].sort());
  });

  it('has one last step that installs nothing: the first check', () => {
    expect(INSTALL.filter((s) => s.parts.length === 0).map((s) => s.id)).toEqual(['check']);
    expect(INSTALL[INSTALL.length - 1]!.id).toBe('check');
  });

  it('keeps every step text within 80 words in both languages, tips and warnings short', () => {
    for (const s of INSTALL) {
      for (const lang of ['fr', 'en'] as const) {
        expect(words(s.text[lang]), `${s.id} text ${lang}`).toBeLessThanOrEqual(80);
        if (s.tip) expect(words(s.tip[lang]), `${s.id} tip ${lang}`).toBeLessThanOrEqual(35);
        // a safety or legal warning is never shortened below what it must say
        if (s.warning) expect(words(s.warning[lang]), `${s.id} warning ${lang}`).toBeLessThanOrEqual(60);
      }
      expect(s.duration, s.id).toMatch(/^≈ \d+ (h|min) \(est\.\)$/);
      expect(s.torque, s.id).toBeUndefined();
    }
  });

  it('puts safety first: the legal rule, the broken rope, the brake switch, the battery', () => {
    const step = (id: string) => INSTALL.find((s) => s.id === id)!;
    const siting = step('siting').warning!;
    expect(siting.fr).toMatch(/12 m/);
    expect(siting.fr).toMatch(/mairie/);
    expect(siting.en).toMatch(/mairie/);
    expect(step('raise').warning?.en).toMatch(/rope/);
    expect(step('raise').text.en).toMatch(/Close the brake switch/);
    expect(step('raise').text.en).toMatch(/Let no one stand under/);
    expect(step('base').warning?.en).toMatch(/rope/);
    expect(step('brake').text.en).toMatch(/Never short-circuit the battery/);
    expect(step('battery').warning?.en).toMatch(/hydrogen/);
    expect(step('fuse').text.en).toMatch(/never crocodile clips/);
  });

  it('says that the label (200 W) is not what the model finds, in the first check', () => {
    const check = INSTALL.find((s) => s.id === 'check')!;
    expect(check.text.en).toMatch(/label/);
    expect(check.text.en).toMatch(/model/);
  });

  it('makes the french legal rule consistent with the interface string', () => {
    const siting = INSTALL.find((s) => s.id === 'siting')!.warning!.en;
    expect(siting).toMatch(/under 12 m/);
    expect(siting).toMatch(/from 12 m/);
    expect(LAB_STRINGS.legal![1]).toMatch(/under 12 m/);
    expect(LAB_STRINGS.legal![1]).toMatch(/from 12 m/);
  });
});

describe('chapters and overviews', () => {
  it('lists about ten chapters of the 8:49 video, in increasing order, in both languages', () => {
    expect(CHAPTERS.length).toBeGreaterThanOrEqual(8);
    expect(CHAPTERS.length).toBeLessThanOrEqual(12);
    let last = -1;
    for (const [ts, fr, en] of CHAPTERS) {
      expect(ts).toMatch(/^\d{2}:[0-5]\d$/);
      expect(seconds(ts)).toBeGreaterThan(last);
      expect(seconds(ts)).toBeLessThanOrEqual(VIDEO_SECONDS);
      last = seconds(ts);
      expect(fr.length).toBeGreaterThan(0);
      expect(en.length).toBeGreaterThan(0);
    }
    expect(CHAPTERS[0]![0]).toBe('00:00');
  });

  it('gives an overview to each world: a title and a few short paragraphs', () => {
    expect(Object.keys(OVERVIEWS).sort()).toEqual([...WORLDS].sort());
    for (const w of WORLDS) {
      const o = OVERVIEWS[w];
      for (const lang of ['fr', 'en'] as const) {
        expect(o.title[lang].length, `${w} title`).toBeGreaterThan(0);
        const paragraphs = o.text[lang].split('\n\n');
        expect(paragraphs.length, `${w} ${lang}`).toBeGreaterThanOrEqual(2);
        expect(paragraphs.length, `${w} ${lang}`).toBeLessThanOrEqual(3);
        expect(o.text[lang], `${w} ${lang}`).toMatch(/\*\*[^*]+\*\*/);
        expect(sentences(o.text[lang]), `${w} ${lang}`).toBeLessThanOrEqual(12);
      }
    }
  });

  it('names in bold the parts of each world in its overview', () => {
    const must: Record<WorldId, string[]> = {
      site: ['mât', 'local technique', 'maison'],
      shed: ['batterie', 'délesteur', 'redresseur'],
      turbine: ['rotor', 'alternateur', 'queue'],
      alternator: ['stator', 'bobines', 'entrefer'],
      blades: ['pales', 'disque de moyeu'],
    };
    for (const w of WORLDS)
      for (const word of must[w])
        expect(OVERVIEWS[w].text.fr, `${w} ${word}`).toMatch(new RegExp(`\\*\\*[^*]*${word}`, 'i'));
  });
});

describe('interface strings added by the data role', () => {
  it('has the scene names, the go buttons, the warnings and the chapters heading, in both languages', () => {
    for (const key of [
      'sceneSite',
      'sceneTurbine',
      'sceneAlternator',
      'sceneBlades',
      'goSite',
      'goTurbine',
      'goAlternator',
      'goBlades',
      'safety',
      'legal',
      'chapters',
    ]) {
      const entry = LAB_STRINGS[key];
      expect(entry, key).toBeDefined();
      expect(entry![0].length, key).toBeGreaterThan(0);
      expect(entry![1].length, key).toBeGreaterThan(0);
    }
  });
});

// ------------------------------------------------------------------------------------------------ the numbers

/**
 * Every number a text may carry that is not a FIG figure (those are allowed by construction: derived or model results, checked
 * below against the simulation), with where it comes from. Wiki = Low-tech Lab tutorial of the machine, plans = Hugh Piggott 2003,
 * video = the Low-tech Lab video, Service-public = the French rule, Tripalium = its logbooks. A number that is not here is a
 * number nobody checked: add it WITH its source, or write it by placeholder from figures.ts.
 */
const REPORTED: Record<string, string> = {
  // small integers: counts, ratios, steps, poles
  '0': 'trees from 0 to 15 m: the range of the obstacle slider (src/sim/presets.ts)',
  '0.05': 'friction torque of the model, N·m (assumption, src/sim/machine.ts)',
  '0.1': 'vane about 0.1 m² (wiki)',
  '0.30': 'peak power coefficient of the model (assumption, src/sim/machine.ts), quoted with the model result',
  '0.35': 'mass of one blade, kg (assumption of the model)',
  '0.6': 'the × 0.6 of the tail weight slider (src/sim/presets.ts)',
  '1': 'one turn per second; 1 mm air gap; 1 m/s',
  '1.0': 'rotor of 1.0 m (Tripalium family)',
  '1.131': 'swept area (derived) — also in FIG',
  '1.20': 'rotor diameter (video description, wiki)',
  '1.4': 'wire of 1.4 mm (wiki); 1.4 × AC − 1.5 V (plans)',
  '1.5': 'about 1.5 kg of wire (wiki); 1.5 V diode drop (plans); 1.5 m above the floor (plans)',
  '1.8': 'tail ×1.8 (presets); 1.80 m beam (wiki)',
  '1.80': 'beam 1.80 m (wiki)',
  '1.9': '1.9 V at one turn per second (wiki)',
  '2': 'two-pole switch (plans); 2 × 12 magnets (plans); 2 in mast; two weeks',
  '2.5': '2.5 mm² cable (wiki); 2.5 mm² in the thin-cable scenario',
  '3': 'three blades, phases, rods, wires; 3 mm',
  '4': '4 : 3 magnets to coils; every 4 m (plans); four rods',
  '4.2': 'rotors up to 4.2 m (Tripalium); also 4.20 in the chapters',
  '4.20': 'rotor up to 4.20 m (video 01:13)',
  '5': 'five to ten years (plans); 5 mm pilot holes (wiki); 5 m trees (hamlet preset)',
  '6': 'plywood 6 mm (wiki, plans); 6 coils; 6 mm² cable (plans); 6 m mast (plans)',
  '7': 'tip speed ratio about 7 (plans)',
  '8': '8 magnets per disc (wiki); 8 mm; 8 m/s (scenario); 8 m trees (calm valley preset)',
  '9': 'plywood 9 mm (wiki); 9 mm',
  '10': '10 m/s furling (video); 10 mm plywood and slot (wiki); 10 mm² default cable (presets); 10 W house (FIG); 10 mm magnet',
  '11': '11 mm coil former (plans); 11 % (FIG)',
  '11.5': 'battery low limit, V (plans)',
  '12': '12 V; 12 m (S9, plans); 12 mm rods (wiki); 12 m/s',
  '12.5': 'house reconnection voltage (assumption of the model, src/sim/machine.ts)',
  '13': '13 % loss at 24 V or 25 mm² (plans)',
  '14': '14 V charging limit (plans)',
  '15': 'default cable length 15 m (presets); steps 5 to 15 of the assembly',
  '16': '16 A relay (plans); sixteen nuts (wiki); steps 16 to 25',
  '19': 'station drop 19 mm (plans)',
  '20': '20 A switch (plans); 20° hinge tilt (plans); 20 days (wiki)',
  '22': 'station thickness 22 mm (plans)',
  '24': '24 V stator (plans), 24 V cable loss',
  '25': 'steps 16 to 25 of the assembly; 25 mm² (plans); 25 m/s (storm of the model)',
  '25.4': 'hollow shaft 1 in = 25.4 mm (plans)',
  '30': '30 cm of wire (wiki); 30 mm magnet side and recess depth (wiki); 30 % of the width (wiki); 30 turns (model scenario)',
  '33.4': 'tube Ø 33.4 mm (wiki, plans)',
  '35': 'beam 95 × 35 mm (wiki)',
  '38': '38 % loss (plans)',
  '40': 'N40 magnets (wiki); 40 m cable (scenario)',
  '41': 'offset of the alternator axis, mm (plans)',
  '42.2': 'tube Ø 42.2 mm (wiki, plans)',
  '45': 'drop 45 mm (plans); spacer 45 mm (plans); beam 150 × 45 mm (wiki)',
  '46': 'magnet 46 × 30 × 10 mm (wiki)',
  '2.4': 'the large 2.4 m machine of the plans (offset 125 mm, air gap 3 mm each side)',
  '48': '48 V battery: 4 % loss (plans table)',
  '49': 'root thickness 49 mm (plans, in FIG)',
  '50': 'angle 50 × 50 × 6 mm (wiki); 50 mm …',
  '55': 'tip chord 55 mm (plans); hinge 55° to the rotor shaft (plans)',
  '60': '60 cm cable, 60 mm tube or recess, 60° coil spacing (wiki, plans)',
  '65': 'station width 65 mm (plans)',
  '70': 'stator rods 70 mm (wiki step 9)',
  '76': '76 turns (video, wiki)',
  '2003': 'the 2003 plans, named as the variant of the hollow shaft',
  '80': 'station width 80 mm (plans); tail at 80° to the rotor plane (plans); 80 % (FIG)',
  '89': '89 m/s = 200 mph (plans)',
  '90': 'a quarter turn of the balancing procedure (plans)',
  '95': '95 × 35 mm beam (wiki); tail swing 95° (plans)',
  '100': '100 mm bolt circle (wiki, plans); 100 mm station radius; 100 mm of pivot tube (wiki); 100 Ah (presets)',
  '110': 'bird’s mouth at 110° (wiki)',
  '120': 'blade roots at 120° (wiki); /120 in the frequency formula (plans)',
  '125': 'offset of the 2.4 m machine, mm (plans)',
  '140': 'rods 140 mm (wiki); steel disc 140 × 8 mm (wiki)',
  '150': 'beam 150 × 45 mm (wiki); tube 33.4 × 150 mm (wiki)',
  '153': 'root width (plans, in FIG)',
  '200': 'the label’s nominal 200 W; 200 mm hub disc (plans); 200 mph (plans)',
  '206': 'angle iron 206 mm (wiki)',
  '230': 'steel disc 230 mm (wiki, plans)',
  '240': 'casting diameter 240 mm (plans)',
  '250': 'support angle 250 mm (wiki)',
  '264': 'stator diameter 264 mm (plans)',
  '300': 'hollow shaft 300 mm (plans); triangle 300 mm (wiki); vane height',
  '500': '500 W (plans table); boom 500 mm (plans)',
  '600': 'blade 600 mm (wiki, plans)',
  '700': 'boom 700 mm (wiki)',
};

function figNumbers(): Set<number> {
  const set = new Set<number>();
  for (const [value] of Object.values(FIG)) set.add(Number(value));
  return set;
}

describe('numbers in the texts', () => {
  const allowed = new Set<number>([...Object.keys(REPORTED).map(Number), ...figNumbers()]);
  // the figures FIG holds to a rounder precision than the texts print: allow the printed forms too
  for (const [value, digits] of Object.values(FIG)) allowed.add(Number(nEn(value, digits).replace(/,/g, '')));

  it('has every number of every text either in figures.ts (derived or model) or in the allow-list with its source', () => {
    const unknown: string[] = [];
    for (const [label, v] of allTexts()) {
      for (const n of figures(v.en, 'en')) if (!allowed.has(Number(n))) unknown.push(`${label}: ${n}`);
    }
    expect(unknown).toEqual([]);
  });

  it('uses the lab’s own model figures only where the model is named (the status of a figure is said in the text)', () => {
    // enforced when the text is built (part-helpers.ts: checkStatus); here, a sample of the figures that most need it
    const rotor = PARTS.find((p) => p.id === 'rotor')!;
    expect(rotor.description.en).toMatch(/in the model/);
    const coils = PARTS.find((p) => p.id === 'coils')!;
    expect(coils.description.en).toMatch(/in the model/);
    const tailVane = PARTS.find((p) => p.id === 'tail-vane')!;
    expect(tailVane.description.en).toMatch(/in the model/);
  });

  it('has a reason for every allow-listed number: none is unused', () => {
    const used = new Set<number>();
    for (const [, v] of allTexts()) for (const n of figures(v.en, 'en')) used.add(Number(n));
    const unused = Object.keys(REPORTED).filter((k) => !used.has(Number(k)) && !figNumbers().has(Number(k)));
    expect(unused).toEqual([]);
  });
});

// ------------------------------------------------------------------------------------------------ against dims.ts

describe('the sheets agree with src/three/dims.ts, the single source of lengths', () => {
  const textOf = (id: string): string => {
    const p = PARTS.find((x) => x.id === id)!;
    return partTexts(p)
      .map(([, v]) => v.en)
      .join(' ');
  };
  const mmStr = (m: number) => nEn(m * 1000, Math.abs(m * 1000 - Math.round(m * 1000)) < 1e-6 ? 0 : 1);
  const has = (id: string, ...metres: number[]) => {
    const t = textOf(id);
    for (const m of metres) expect(t, `${id}: ${mmStr(m)} mm`).toContain(mmStr(m));
  };

  it('magnet rotor: 230 × 6 mm steel, 240 mm casting, 100 mm bolt circle', () => {
    has(
      'magnet-rotor',
      ROTOR_DISC.diameter,
      ROTOR_DISC.thickness,
      ROTOR_DISC.castingDiameter,
      ROTOR_DISC.boltCircleDiameter,
    );
  });
  it('magnets: 46 × 30 × 10 mm, 8 of them', () => {
    expect(textOf('magnets')).toContain(
      `${mmStr(MAGNET.length)} × ${mmStr(MAGNET.width)} × ${mmStr(MAGNET.thickness)} mm`,
    );
    expect(MAGNET.count).toBe(8);
  });
  it('stator, coils, air gap', () => {
    has('stator', STATOR.outer);
    has('coils', STATOR.coilHoleLength, STATOR.coilHoleWidth, STATOR.thickness);
    has('air-gap', AIR_GAP);
    expect(textOf('stator')).toContain(String(STATOR.coilCount));
  });
  it('frame, pivot, offset', () => {
    has('nacelle-frame', NACELLE.leg, NACELLE.thickness, NACELLE.length);
    has('yaw-bearing', YAW.pipeOuter, YAW.stubOuter, HEAD.offset);
  });
  it('tail: hinge angles, swing, rest angle, boom tube and the plans’ length', () => {
    const hinge = textOf('tail-hinge');
    for (const a of [TAIL.tiltDeg, TAIL.planDeg, TAIL.swingDeg, TAIL.restDeg])
      expect(hinge, `${a}°`).toContain(`${a}°`);
    has('tail-boom', TAIL.boomOuter, TAIL.boomLength);
  });
  it('blades: the six stations of the plans, the root and the tip', () => {
    const stations = textOf('station-templates');
    for (const w of BLADE.stationWidth) expect(stations).toContain(mmStr(w));
    for (const t of BLADE.stationThickness) expect(stations).toContain(mmStr(t));
    has('blade', BLADE.length, BLADE.rootWidth, BLADE.rootThickness);
    expect(textOf('blade')).toContain(String(BLADE.rootAngleDeg));
  });
  it('mast: the 60 mm pipe and the guys every 4 m', () => {
    expect(textOf('tower')).toContain('60');
    expect(textOf('guy-wires')).toContain(String(MAST.guySpacing));
  });

  // Disagreements found by the data role between its sources and dims.ts, settled by the 3D role and pinned here.
  it('dims.ts follows the wiki where it is the source: stator rods 12 × 70 mm, vane 6 mm, yaw pipe 100 mm', () => {
    expect(STATOR_RODS.diameter).toBeCloseTo(0.012, 6);
    expect(STATOR_RODS.length).toBeCloseTo(0.07, 6);
    expect(TAIL.vaneThickness).toBeCloseTo(0.006, 6);
    expect(YAW.pipeLength).toBeCloseTo(0.1, 6);
  });
});

// ------------------------------------------------------------------------------------------------ the model results

describe('the model results quoted in the texts are what the simulation finds', () => {
  const base = presetParams('hamlet');
  const cfgOf = (patch: Partial<typeof base> = {}) => buildConfig({ ...base, ...patch });
  const cfg = cfgOf();
  const point = (c: ReturnType<typeof cfgOf>, v: number, brake = false, connected = true) =>
    operatingPoint(c, referenceBattery(c, connected), brake, v);
  const deg = (r: number) => (r * 180) / Math.PI;

  it('the power: 63 W at best (14.5 m/s), 50 W at 10 m/s, 60 W at 12 m/s, 56 W at 25 m/s', () => {
    let best = { v: 0, p: 0 };
    for (let v = 1; v <= 25; v += 0.25) {
      const p = point(cfg, v).busPower;
      if (p > best.p) best = { v, p };
    }
    expect(best.p).toBeCloseTo(MODEL.peak, 0);
    expect(best.v).toBeCloseTo(MODEL.peakWind, 0);
    expect(point(cfg, 10).busPower).toBeCloseTo(MODEL.w10, 0);
    expect(point(cfg, 12).busPower).toBeCloseTo(MODEL.w12, 0);
    expect(point(cfg, 25).busPower).toBeCloseTo(MODEL.w25, 0);
  });

  it('the cut-in: first watt near 2.6 m/s, the bridge conducts from about 325 rpm', () => {
    let v = 1;
    while (point(cfg, v).busPower < 1 && v < 10) v += 0.05;
    expect(v).toBeCloseTo(MODEL.cutIn, 1);
    expect(radToRpm(cutInOmega(cfg, 12.4))).toBeCloseTo(MODEL.cutInRpm, -1);
    expect(Math.abs(radToRpm(cutInOmega(cfg, 12.4)) - MODEL.cutInRpm)).toBeLessThan(2);
  });

  it('the stall: rotor speed, tip speed ratio and Cp at 10 and 12 m/s', () => {
    const p10 = point(cfg, 10);
    const p12 = point(cfg, 12);
    expect(p10.rpm).toBeCloseTo(MODEL.rpm10, -1);
    expect(Math.abs(p10.rpm - MODEL.rpm10)).toBeLessThan(1);
    expect(Math.abs(p12.rpm - MODEL.rpm12)).toBeLessThan(1);
    expect(Math.abs(p10.lambda - MODEL.lambda10)).toBeLessThan(0.05);
    expect(Math.abs(p10.cp - MODEL.cp10)).toBeLessThan(0.005);
  });

  it('the losses and the efficiency at 12 m/s', () => {
    const p = point(cfg, 12);
    expect(Math.abs(p.copperLoss - MODEL.copper12)).toBeLessThan(0.5);
    expect(Math.abs((1 - p.copperLoss / p.airGapPower) * 100 - MODEL.etaAlt12)).toBeLessThan(0.6);
    expect(Math.abs(p.rotorPower - MODEL.rotor12)).toBeLessThan(0.5);
    expect(Math.abs(p.windPower - MODEL.windPower12)).toBeLessThan(1);
    expect(Math.abs((p.busPower / p.windPower) * 100 - MODEL.eta12)).toBeLessThan(0.3);
    expect(Math.abs(p.diodeLoss - MODEL.diode12)).toBeLessThan(0.5);
    expect(Math.abs(p.dcCurrent - MODEL.amps12)).toBeLessThan(0.1);
  });

  it('the furling: yaw at 10, 12, 16 and 25 m/s, onset for the light and the heavy tail', () => {
    for (const [v, yaw] of [
      [10, MODEL.yaw10],
      [12, MODEL.yaw12],
      [16, MODEL.yaw16],
      [25, MODEL.yaw25],
    ] as const)
      expect(Math.abs(deg(point(cfg, v).yaw) - yaw), `${v} m/s`).toBeLessThan(0.6);
    expect(Math.abs(furlingOnset(cfgOf({ tailWeight: 0.6 })) - MODEL.furlLight)).toBeLessThan(0.06);
    expect(Math.abs(furlingOnset(cfgOf({ tailWeight: 1.8 })) - MODEL.furlHeavy)).toBeLessThan(0.06);
    expect(furlingOnset(cfg)).toBeCloseTo(10, 1);
  });

  it('the storm: a folding tail against a locked one at 25 m/s', () => {
    const fixed = point(cfgOf({ fixedTail: true }), 25);
    expect(Math.abs(point(cfg, 25).thrust - MODEL.thrust25)).toBeLessThan(1);
    expect(Math.abs(fixed.thrust - MODEL.thrustFixed25)).toBeLessThan(1);
    expect(Math.abs(fixed.copperLoss - MODEL.copperFixed25)).toBeLessThan(10);
    expect(Math.abs(fixed.dcCurrent - MODEL.ampsFixed25)).toBeLessThan(0.6);
    expect(Math.abs(fixed.omega * 0.6 - MODEL.tipFixed25)).toBeLessThan(1);
  });

  it('the runaway, the brake switch and the cable', () => {
    const open = point(cfg, 8, false, false);
    expect(Math.abs(open.rpm - MODEL.runawayRpm)).toBeLessThan(6);
    expect(Math.abs(open.openCircuitVolts - MODEL.runawayVolts)).toBeLessThan(0.6);
    expect(Math.abs(point(cfg, 8, true).rpm - MODEL.brakeRpm)).toBeLessThan(1);
    const thin = point(cfgOf({ cableSection: 2.5, cableLength: 40 }), 8);
    const normal = point(cfg, 8);
    expect(Math.abs((thin.cableLoss / (thin.busPower + thin.cableLoss)) * 100 - MODEL.thinLoss)).toBeLessThan(0.6);
    expect(Math.abs((normal.cableLoss / (normal.busPower + normal.cableLoss)) * 100 - MODEL.defaultLoss)).toBeLessThan(
      0.6,
    );
  });

  it('the year: energy, per m², capacity factor, and the masts of the calm valley', () => {
    const y = yearlyYield(base);
    expect(Math.abs(y.energy - MODEL.hamletKwh)).toBeLessThan(0.6);
    expect(Math.abs(y.specific - MODEL.hamletKwhM2)).toBeLessThan(0.6);
    expect(Math.abs(y.capacityFactor * 100 - MODEL.hamletCf)).toBeLessThan(0.06);
    expect(Math.abs(yearlyYield(presetParams('windy-plateau')).energy - MODEL.windyKwh)).toBeLessThan(0.6);
    const calm = presetParams('calm-valley');
    for (const [mast, kwh] of [
      [6, MODEL.calmKwh6],
      [12, MODEL.calmKwh12],
      [18, MODEL.calmKwh18],
    ] as const)
      expect(Math.abs(yearlyYield({ ...calm, mastHeight: mast }).energy - kwh), `${mast} m`).toBeLessThan(0.6);
    expect(calm.obstacleHeight).toBe(8); // the 8 m trees of the text
  });

  it('the wind at the hub among 5 m trees, for masts of 6, 12 and 18 m', () => {
    for (const [mast, hub, ti] of [
      [6, MODEL.hub6, MODEL.turb6],
      [12, MODEL.hub12, MODEL.turb12],
      [18, MODEL.hub18, undefined],
    ] as const) {
      expect(Math.abs(hubWind(5, mast, 5) - hub), `${mast} m`).toBeLessThan(0.06);
      if (ti !== undefined) expect(Math.abs(turbulenceIntensity(mast, 5) - ti), `${mast} m`).toBeLessThan(0.006);
    }
  });

  it('a stator wound with 30 turns: cut-in and power at 12 m/s without furling', () => {
    const few = cfgOf({ turns: 30 });
    let v = 1;
    while (point(few, v).busPower < 1 && v < 12) v += 0.05;
    expect(Math.abs(v - MODEL.turn30Cut)).toBeLessThan(0.15);
    expect(Math.abs(point({ ...few, fixedTail: true }, 12).busPower - MODEL.turn30W12)).toBeLessThan(1.5);
  });

  it('the derived figures of FIG: swept area, 334 rpm at 3 m/s, 4 Hz, the 10 W house', () => {
    expect(FIG.area[0]).toBeCloseTo(1.131, 3);
    expect(FIG.rpm3[0]).toBe(334);
    expect(FIG.hz60[0]).toBe(4);
    expect(FIG.houseKwh[0]).toBeCloseTo(87.6, 1);
    expect(FIG.kePerRpm[0]).toBeCloseTo(1.9 / 60, 4);
    expect(FIG.dumpW[0]).toBe(224);
  });
});
