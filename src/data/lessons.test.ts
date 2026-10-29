import { describe, expect, it } from 'vitest';
import type { Lesson } from '@onigam/lab-kit/content';
import type { L } from '@onigam/lab-kit/i18n';
import { LAB_STRINGS } from '../i18n/ui';
import { sizesTable } from '../panels/model';
import { partIds, WORLDS } from '../part-ids';
import { cutInOmega } from '../sim/alternator';
import { buildConfig } from '../sim/config';
import { PiggottSim } from '../sim/engine';
import { batteryOcv } from '../sim/electrical';
import { BRIDGE_FACTOR, KE_LL_REF, R_PHASE_REF, RECTIFIER_DROP, SOC_REFERENCE } from '../sim/machine';
import { cableLossShare, radToRpm, rpmAtTipSpeedRatio, windPower } from '../sim/physics';
import { PRESET_IDS, presetParams, SCENARIO_IDS, scenarioSetup } from '../sim/presets';
import { operatingPoint, referenceBattery } from '../sim/steady';
import { hubWind, turbulenceIntensity } from '../sim/wind';
import { yearlyYield } from '../sim/yield';
import { TAIL } from '../three/dims';
import { CHAPTERS } from './chapters';
import { FIG } from './figures';
import { figInfo, LESSON_FIG, rawOf, type Kind } from './lessons-fig';
import { LESSONS } from './lessons';

// The six lessons: shape and length, French and English written together, the focus each one opens in the 3D view and in the
// simulation, the quiz, every number of every text (a typed number against an allow-list with its source, a placeholder against
// the simulation, the dimensions or the sources), and what the lessons say will happen when the visitor runs their scenario.

const VIDEO_SECONDS = 8 * 60 + 49; // Low-tech Lab, « How to build homemade Piggott wind turbine » (8:49)

const seconds = (ts: string): number => {
  const [m, s] = ts.split(':').map(Number);
  return (m ?? 0) * 60 + (s ?? 0);
};
const plain = (t: string): string => t.replace(/\*\*/g, '');
const words = (t: string): number => plain(t).trim().split(/\s+/).length;
const sentenceList = (t: string): string[] => plain(t).split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ0-9«“"(])/);

/** Numbers of a text, normalised so that the French and English spellings compare equal (7,5 / 7.5, 5 700 / 5,700). */
function figures(text: string, lang: 'fr' | 'en'): string[] {
  let t = text.replace(/[−–]/g, ' ');
  if (lang === 'fr') t = t.replace(/(\d) (\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  else t = t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  return (t.match(/\d+(?:\.\d+)?/g) ?? []).sort();
}

interface Unit {
  label: string;
  texts: L[];
}

/** Every text of the lessons, grouped the way a visitor reads it: a title and a summary, a paragraph, a chip, a quiz item. */
function units(): Unit[] {
  const out: Unit[] = [];
  for (const les of LESSONS) {
    out.push({ label: `${les.id} title+summary`, texts: [les.title, les.summary] });
    les.body.forEach((p, i) => out.push({ label: `${les.id} body ${i + 1}`, texts: [p] }));
    (les.figures ?? []).forEach((f, i) =>
      out.push({ label: `${les.id} chip ${i + 1}`, texts: [f.label, f.value as L] }),
    );
    (les.quiz ?? []).forEach((q, i) =>
      out.push({ label: `${les.id} quiz ${i + 1}`, texts: [q.q, ...q.choices, q.explain] }),
    );
  }
  return out;
}
const allTexts = (): { label: string; text: L }[] =>
  units().flatMap((u) => u.texts.map((text, i) => ({ label: `${u.label} #${i}`, text })));

/** Short choices ("×4", "Plus tôt", "26 W (le double)") are a figure or a word: only the longer ones are judged on length. */
const isShort = (q: { choices: L[] }): boolean =>
  q.choices.reduce((n, c) => n + c.fr.length, 0) / q.choices.length < 30;

// ------------------------------------------------------------------------------------------------ shape and parity

describe('the six lessons', () => {
  it('are six, with unique kebab-case ids, in the order of the series', () => {
    expect(LESSONS.map((x) => x.id)).toEqual([
      'wind-cube',
      'betz-blades',
      'volts',
      'battery',
      'storm',
      'siting-sizing',
    ]);
    for (const les of LESSONS) expect(les.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it('have a title, a one-line summary, 3 or 4 paragraphs, 3 key figures and 2 or 3 quiz questions', () => {
    for (const les of LESSONS) {
      for (const lang of ['fr', 'en'] as const) {
        expect(les.title[lang].length, `${les.id} title ${lang}`).toBeGreaterThan(10);
        expect(les.title[lang].length, `${les.id} title ${lang}`).toBeLessThanOrEqual(60);
        expect(les.summary[lang].length, `${les.id} summary ${lang}`).toBeGreaterThan(40);
        expect(les.summary[lang].length, `${les.id} summary ${lang}`).toBeLessThanOrEqual(190);
      }
      expect(les.body.length, les.id).toBeGreaterThanOrEqual(3);
      expect(les.body.length, les.id).toBeLessThanOrEqual(4);
      expect(les.figures?.length, les.id).toBe(3);
      expect(les.quiz?.length, les.id).toBeGreaterThanOrEqual(2);
      expect(les.quiz?.length, les.id).toBeLessThanOrEqual(3);
    }
    expect(LESSONS.reduce((n, x) => n + (x.quiz?.length ?? 0), 0)).toBe(15);
  });

  it('keep every paragraph short: 2 to 4 sentences, at most 85 words, no sentence over 36 words, a lesson under 330 words', () => {
    for (const les of LESSONS) {
      for (const lang of ['fr', 'en'] as const) {
        let total = 0;
        les.body.forEach((p, i) => {
          const n = sentenceList(p[lang]).length;
          expect(n, `${les.id} p${i + 1} ${lang}: ${n} sentences`).toBeGreaterThanOrEqual(2);
          expect(n, `${les.id} p${i + 1} ${lang}: ${n} sentences`).toBeLessThanOrEqual(4);
          expect(words(p[lang]), `${les.id} p${i + 1} ${lang}`).toBeLessThanOrEqual(85);
          for (const s of sentenceList(p[lang]))
            expect(words(s), `${les.id} p${i + 1} ${lang}: ${s}`).toBeLessThanOrEqual(36);
          total += words(p[lang]);
        });
        expect(total, `${les.id} ${lang}`).toBeLessThanOrEqual(330);
        expect(total, `${les.id} ${lang}`).toBeGreaterThanOrEqual(150);
      }
    }
  });

  it('have a non-empty French and English text everywhere, no placeholder left, no straight apostrophe, bold balanced', () => {
    const bad = /todo|tbd|lorem|xxx|placeholder|undefined|\{\w+\}|\bNaN\b/i;
    for (const { label, text } of allTexts()) {
      expect(text.fr.trim().length, `${label} fr`).toBeGreaterThan(0);
      expect(text.en.trim().length, `${label} en`).toBeGreaterThan(0);
      expect(text.fr + text.en, label).not.toMatch(bad);
      expect(text.fr + text.en, label).not.toMatch(/\p{L}'\p{L}/u);
      expect(text.fr.split('**').length % 2, `${label}: ** in fr`).toBe(1);
      expect(text.en.split('**').length % 2, `${label}: ** in en`).toBe(1);
    }
  });

  it('write the two languages differently, at the same level of detail, with the same figures and the same bold terms', () => {
    for (const { label, text } of allTexts()) {
      if (text.fr.length > 40) {
        expect(text.fr, label).not.toBe(text.en);
        expect(text.fr.length / text.en.length, label).toBeGreaterThan(0.75);
        expect(text.fr.length / text.en.length, label).toBeLessThan(1.5);
      }
      expect(figures(text.fr, 'fr'), label).toEqual(figures(text.en, 'en'));
      expect(text.fr.split('**').length, `${label} bold`).toBe(text.en.split('**').length);
      expect(text.en, label).not.toMatch(/[éèêëàâùûôîïç]/i);
    }
  });

  it('follow the typography of French: a space before : ; ? ! (the kit makes it a fixed one), a typographic apostrophe, « » with spaces', () => {
    for (const { label, text } of allTexts()) {
      const fr = text.fr.replace(/\d:\d/g, '');
      expect(fr, `${label}: space before : ; ? !`).not.toMatch(/[^\s][:;?!]/);
      expect(fr, label).not.toMatch(/«\S|\S»/);
      expect(fr, label).not.toMatch(/ {2}|\.\.\./);
      expect(text.en, label).not.toMatch(/ {2}|\.\.\./);
    }
  });

  it('use no research code and no part id in visitor text: the sources are named in words', () => {
    for (const { label, text } of allTexts()) {
      expect(text.fr + text.en, label).not.toMatch(/\b(K\d{1,2}|S\d{1,2})\b/);
      expect(text.fr + text.en, label).not.toMatch(/\b(wind-turbine|tail-hinge|battery-bank|yaw-bearing)\b/);
    }
  });

  it('define each term once: no bold phrase is repeated from one lesson to another', () => {
    for (const lang of ['fr', 'en'] as const) {
      const seen = new Map<string, string>();
      for (const les of LESSONS)
        for (const p of les.body)
          for (const m of p[lang].matchAll(/\*\*([^*]+)\*\*/g)) {
            const term = m[1]!.toLowerCase();
            expect(
              seen.get(term),
              `${lang}: « ${term} » is bold in ${seen.get(term)} and in ${les.id}`,
            ).toBeUndefined();
            seen.set(term, les.id);
          }
      expect(seen.size, lang).toBeGreaterThanOrEqual(24);
    }
  });

  it('give the formula as symbols only (it is not translated) and the key figures short', () => {
    for (const les of LESSONS) {
      if (les.formula !== undefined) {
        expect(les.formula.length, les.id).toBeLessThanOrEqual(40);
        expect(les.formula, les.id).toMatch(/[=∝≤]/);
      }
      for (const f of les.figures ?? []) {
        const label = f.label as L;
        const value = f.value as L;
        expect(label.fr.length, `${les.id} chip`).toBeLessThanOrEqual(55);
        expect(label.en.length, `${les.id} chip`).toBeLessThanOrEqual(55);
        expect(value.fr.length, `${les.id} chip`).toBeLessThanOrEqual(24);
      }
    }
    expect(LESSONS.filter((x) => x.formula).map((x) => x.id)).toEqual([
      'wind-cube',
      'betz-blades',
      'battery',
      'siting-sizing',
    ]);
  });
});

// ------------------------------------------------------------------------------------------------ the focus

describe('the focus of each lesson opens what it talks about', () => {
  it('names a world of src/part-ids.ts, a part of that world, a real preset and a real scenario', () => {
    for (const les of LESSONS) {
      const f = les.focus;
      expect(WORLDS as string[], `${les.id} scene`).toContain(f.scene);
      expect(f.part, `${les.id} part`).toBeDefined();
      expect(partIds(f.scene as (typeof WORLDS)[number]), `${les.id} part`).toContain(f.part);
      expect(PRESET_IDS as string[], `${les.id} preset`).toContain(f.preset);
      expect(SCENARIO_IDS as string[], `${les.id} scenario`).toContain(f.scenario);
    }
  });

  it('opens the hamlet, the site whose figures the lessons quote, and each scenario is run by the engine', () => {
    for (const les of LESSONS) {
      expect(les.focus.preset, les.id).toBe('hamlet');
      const sim = new PiggottSim(1);
      sim.applyPreset('windy-plateau');
      sim.applyPreset(les.focus.preset as 'hamlet');
      expect(sim.params.preset, les.id).toBe('hamlet');
      expect(sim.params.diameter, les.id).toBe(1.2);
      sim.applyScenario(les.focus.scenario as (typeof SCENARIO_IDS)[number]);
      expect(sim.params.preset, `${les.id}: a scenario makes the preset « custom »`).toBe('custom');
      for (let i = 0; i < 120; i++) sim.step(1 / 60);
      expect(Number.isFinite(sim.state.busPower), les.id).toBe(true);
    }
  });

  it('uses each of the six worlds-and-parts at most once, in five different worlds, so that every lesson opens on something new', () => {
    expect(new Set(LESSONS.map((x) => `${x.focus.scene}/${x.focus.part}`)).size).toBe(6);
    expect(new Set(LESSONS.map((x) => x.focus.scene)).size).toBe(5);
    expect(new Set(LESSONS.map((x) => x.focus.scenario)).size).toBe(6);
  });

  it('points the video timestamp at the start of a chapter of the 8:49 video', () => {
    const starts = CHAPTERS.map(([ts]) => ts);
    for (const les of LESSONS) {
      if (les.video === undefined) continue;
      expect(les.video, les.id).toMatch(/^\d{2}:[0-5]\d$/);
      expect(seconds(les.video), les.id).toBeLessThanOrEqual(VIDEO_SECONDS);
      expect(starts, les.id).toContain(les.video);
    }
    expect(LESSONS.filter((x) => x.video).map((x) => x.id)).toEqual([
      'wind-cube',
      'betz-blades',
      'volts',
      'storm',
      'siting-sizing',
    ]);
  });
});

// ------------------------------------------------------------------------------------------------ the quiz

describe('the quiz', () => {
  const items = LESSONS.flatMap((les) => (les.quiz ?? []).map((q, i) => ({ id: `${les.id} Q${i + 1}`, les, q })));

  it('has 3 or 4 choices per question, an answer in range, a distinct text per choice and an explanation of at most 60 words', () => {
    expect(items).toHaveLength(15);
    for (const { id, q } of items) {
      expect(q.choices.length, id).toBeGreaterThanOrEqual(3);
      expect(q.choices.length, id).toBeLessThanOrEqual(4);
      expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length, id).toBe(true);
      for (const lang of ['fr', 'en'] as const) {
        expect(new Set(q.choices.map((c) => c[lang])).size, `${id} ${lang}`).toBe(q.choices.length);
        expect(words(q.explain[lang]), `${id} explain ${lang}`).toBeLessThanOrEqual(60);
        expect(words(q.explain[lang]), `${id} explain ${lang}`).toBeGreaterThanOrEqual(15);
        expect(words(q.q[lang]), `${id} question ${lang}`).toBeLessThanOrEqual(40);
        for (const c of q.choices) expect(words(c[lang]), `${id} choice ${lang}`).toBeLessThanOrEqual(22);
      }
    }
  });

  it('does not put the right answer always at the same place: not in one lesson, and no place for more than 40 % of the questions', () => {
    for (const les of LESSONS) {
      expect(new Set((les.quiz ?? []).map((q) => q.answer)).size, les.id).toBeGreaterThan(1);
    }
    const count = [0, 1, 2, 3].map((k) => items.filter((x) => x.q.answer === k).length);
    expect(count.filter((c) => c > 0).length, `places ${count}`).toBeGreaterThanOrEqual(3);
    expect(Math.max(...count) / items.length, `places ${count}`).toBeLessThanOrEqual(0.4);
  });

  it('cannot be guessed from the length: the choices of a text question are within 1.6 of each other, and the right one is the longest in at most a third of them', () => {
    const textual = items.filter((x) => !isShort(x.q));
    expect(textual.length).toBeGreaterThanOrEqual(8);
    for (const lang of ['fr', 'en'] as const) {
      let longest = 0;
      for (const { id, q } of textual) {
        const lengths = q.choices.map((c) => c[lang].length);
        expect(Math.max(...lengths) / Math.min(...lengths), `${id} ${lang}: ${lengths}`).toBeLessThanOrEqual(1.6);
        const right = lengths[q.answer]!;
        if (lengths.every((n, k) => k === q.answer || n < right)) longest++;
      }
      expect(
        longest / textual.length,
        `${lang}: the right choice is the longest in ${longest} of ${textual.length}`,
      ).toBeLessThanOrEqual(1 / 3);
    }
  });

  it('puts the dangerous misconceptions among the wrong choices and says so in the explanation: the battery is never short-circuited, never disconnected to rest', () => {
    const q = LESSONS.find((x) => x.id === 'battery')!.quiz![2]!;
    expect(q.choices[1]!.en).toMatch(/disconnects the battery/);
    expect(q.choices[2]!.en).toMatch(/short-circuits the battery/);
    expect(q.explain.en).toMatch(/never short-circuited/);
    expect(q.explain.en).toMatch(/run away/);
  });
});

// ------------------------------------------------------------------------------------------------ the numbers

/**
 * Every number that a text of the lessons types itself (a figure written by {placeholder} is checked against the model below,
 * the dimensions or the sources), with where it comes from. Wiki = Low-tech Lab tutorial of the machine, plans = Hugh Piggott 2003,
 * video = the Low-tech Lab video, Tripalium = its site, Service-public = the French rule. A number that is not here is a number
 * nobody checked: add it WITH its source, or write it by placeholder. An entry no text uses is an error.
 */
const TYPED: Record<string, string> = {
  '1': 'the wind-sweep scenario starts at 1 m/s (presets.ts); one turn per second (wiki)',
  '2': 'cross-references « leçon 2 »; 2³ and 2² in the quiz; two phases; two rotors; 2 m/s of a quiz wind',
  '3': 'cross-reference « leçon 3 »; 3 coils; 3 m/s (cut-in by the simple calculation, research K20, and the wind of the 334 rpm)',
  '4': '4 magnets for 3 coils (video, 4 : 3); 4 m/s (few-turns scenario, quiz wind); ×4 area; 4 times the energy per kilo (v²)',
  '76': '76 turns per coil (video, wiki): the winding that the quiz of lesson 3 compares with 38',
  '5': 'cross-reference « leçon 5 »; 5 m/s (hamlet preset and the wind of the first lesson); 5 m trees (hamlet preset)',
  '6': '6 coils (wiki); 6 m mast (plans, low-mast scenario)',
  '7': 'design tip speed ratio about 7 (plans)',
  '8': '×8 and 8 m/s (thin-cable and brake scenarios); 8 m trees (calm-valley preset)',
  '10': '10 m/s and 10 m (the hamlet wind is given at 10 m above the ground); 10 mm² default cable (presets.ts)',
  '12': '12 V battery (video, wiki); 12 m mast (plans, Service-public); 12 m/s (the rating wind of the other sources and of the table)',
  '13': '13 % loss at 24 V (plans table)',
  '14': '14 V (plans), the battery limit',
  '15': '15 m of cable (presets.ts)',
  '16': '16/27 = Betz (Wikipedia); ×16 is a wrong choice (2⁴)',
  '18': '18 m mast (plans)',
  '20': 'the wind-sweep scenario goes up to 20 m/s (presets.ts); the runaway scenario disconnects the battery at 20 s (presets.ts)',
  '24': '24 V stator and battery (plans table of the cable loss)',
  '25': 'the storm scenario goes up to 25 m/s (presets.ts)',
  '26': 'wrong choice of lesson 1: 2 × the 13 W of the model at 5 m/s',
  '27': '16/27 = Betz (Wikipedia)',
  '30': 'a cable of 30 m one way (plans table); 30 to 40 % of the label (the model against 200 W and 2 000 W)',
  '38': '38 turns (the few-turns scenario, presets.ts); 38 % cable loss at 12 V (plans table)',
  '40': '40 m of cable (thin-cable scenario, presets.ts); 30 to 40 % of the label',
  '59': 'Betz 59 % (Wikipedia)',
  '95': 'the battery-full scenario starts at 95 % (presets.ts)',
  '100':
    '100 to 300 kWh per m² and per year for propellers (Windside, research K25); under 100 rpm with the brake switch (engine.test.ts)',
  '104': 'wrong choice of lesson 1: 8 × the 13 W of the model at 5 m/s',
  '500': '500 W at the battery of the plans’ cable table (12 V, 6 mm², 30 m one way)',
  '125': 'offset of the 2.4 m machine, mm (plans)',
  '200': 'the label of the 1.2 m machine, W (video description, wiki): nominal, the wind speed is not given',
  '300': '100 to 300 kWh per m² and per year (Windside, research K25)',
  '400': 'about 400 rpm in 8 m/s just before the battery is disconnected (engine run, tested below)',
  '1000': 'a kilowatt-hour is 1 000 W for one hour; over 1 000 rpm after the disconnection (engine run, tested below)',
  '2000': 'the label of the largest size, W (Tripalium)',
  '0.25': 'homebuilt blades 0.25 to 0.35 (plans, Wikipedia)',
  '0.3': 'peak power coefficient of the model, 0.30 (assumption of machine.ts); the 0.6 of the tail weight is 0.6',
  '0.35': 'homebuilt blades 0.25 to 0.35 (plans, Wikipedia)',
  '0.593': 'Betz limit 16/27 (Wikipedia)',
  '0.6': 'the tail 0.6 times as heavy (presets of the tail-weight slider)',
  '1.0': 'smallest rotor of the family, m (Tripalium)',
  '1.2': 'rotor of the video, m (video description, wiki)',
  '1.4': 'wire of 1.4 mm (wiki); the rectifier gives 1.4 times the voltage in the plans',
  '1.5': 'two diodes drop about 1.5 V (plans)',
  '1.8': 'the tail 1.8 times as heavy (presets of the tail-weight slider)',
  '1.9': '1.9 V at one turn per second (wiki)',
  '2.4': 'the large machine of the plans, m; the second example size of the quiz',
  '2.5': 'a cable of 2.5 mm² (thin-cable scenario, presets.ts)',
  '4.2': 'largest rotor of the family, m (Tripalium)',
  '11.5': 'battery lower limit, V (plans)',
};

describe('every number of every text', () => {
  const typedNumbers = (raw: string): string[] => figures(raw.replace(/\{\w+\}/g, ' '), 'en');

  it('is either a figure written by {placeholder} or in the allow-list, with its source', () => {
    const allowed = new Set(Object.keys(TYPED).map(Number));
    const unknown: string[] = [];
    for (const { label, text } of allTexts()) {
      const raw = rawOf(text);
      for (const n of typedNumbers(raw.en)) if (!allowed.has(Number(n))) unknown.push(`${label}: ${n}`);
    }
    expect(unknown).toEqual([]);
  });

  it('has a reason for every allow-listed number: none is unused', () => {
    const used = new Set<number>();
    for (const { text } of allTexts()) for (const n of typedNumbers(rawOf(text).en)) used.add(Number(n));
    const unused = Object.keys(TYPED).filter((k) => !used.has(Number(k)));
    expect(unused).toEqual([]);
  });

  it('writes the same placeholders in the two languages and only names figures that exist', () => {
    for (const { label, text } of allTexts()) {
      const raw = rawOf(text);
      const keys = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();
      expect(keys(raw.fr), label).toEqual(keys(raw.en));
      for (const k of keys(raw.en)) expect(figInfo(k), `${label}: {${k}}`).toBeDefined();
    }
  });

  it('uses every figure of the lessons’ own table', () => {
    const used = new Set<string>();
    for (const { text } of allTexts()) for (const m of rawOf(text).en.matchAll(/\{(\w+)\}/g)) used.add(m[1]!);
    for (const k of Object.keys(LESSON_FIG)) expect(used.has(k), k).toBe(true);
  });

  it('says what a figure is: a model result in a unit that says « model », a derived one in a unit that says « calculation »', () => {
    for (const u of units()) {
      const kinds = new Set<Kind>();
      for (const t of u.texts) for (const m of rawOf(t).en.matchAll(/\{(\w+)\}/g)) kinds.add(figInfo(m[1]!)!.kind);
      const fr = u.texts.map((t) => t.fr).join(' ');
      const en = u.texts.map((t) => t.en).join(' ');
      if (kinds.has('model')) {
        expect(fr, u.label).toMatch(/modèle/i);
        expect(en, u.label).toMatch(/model/i);
      }
      if (kinds.has('derived')) {
        expect(fr, u.label).toMatch(/calcul|dérivé/i);
        expect(en, u.label).toMatch(/calculat|derived/i);
      }
    }
  });

  it('says that 200 W is the label (nominal, no wind speed) wherever it is quoted', () => {
    for (const u of units()) {
      const fr = u.texts.map((t) => t.fr).join(' ');
      const en = u.texts.map((t) => t.en).join(' ');
      if (/\b200 W\b/.test(fr)) expect(fr, u.label).toMatch(/étiquette|nominale|annoncée/i);
      if (/\b200 W\b/.test(en)) expect(en, u.label).toMatch(/label|nominal|rated/i);
    }
    const sizing = LESSONS.find((x) => x.id === 'siting-sizing')!;
    const last = sizing.body[3]!;
    expect(last.en).toMatch(/no wind speed given/);
    expect(last.en).toMatch(/does not tune its model to the label/);
    expect(last.fr).toMatch(/ne règle pas son modèle sur l’étiquette/);
  });
});

// ------------------------------------------------------------------------------------------------ the model results

describe('the figures of the lessons are what the simulation finds', () => {
  const base = presetParams('hamlet');
  const cfg = buildConfig(base);
  const point = (v: number, c = cfg) => operatingPoint(c, referenceBattery(c), false, v);
  const value = (key: keyof typeof LESSON_FIG) => LESSON_FIG[key][0];
  /** The figure is what the text prints: the computed value rounded to the decimals of the table. */
  const printed = (key: keyof typeof LESSON_FIG, computed: number) => {
    const d = LESSON_FIG[key][1];
    expect(Math.round(computed * 10 ** d) / 10 ** d, `${key}: ${computed}`).toBe(value(key));
  };

  it('derived: the power in the wind at 5 m/s, the rpm at tip speed ratio 7, the bridge, the cut-in example, the currents, the heat', () => {
    printed('wind5', windPower(5, 1.2, 1.23));
    printed('rpm10Design', rpmAtTipSpeedRatio(7, 10, 1.2));
    printed('bridge', BRIDGE_FACTOR);
    printed('needDc', value('batt') + RECTIFIER_DROP);
    printed('needAc', (value('batt') + RECTIFIER_DROP) / BRIDGE_FACTOR);
    printed('amps500', 500 / 12);
    printed('amps200', 200 / 14);
    expect(Math.abs(2 * R_PHASE_REF * (200 / 14) ** 2 - value('copper200'))).toBeLessThan(5);
    // the worked example of lesson 3 ends where the model's cut-in speed is: 10.3 V at 0.0317 V per rpm
    const rpm = value('needAc') / (1.9 / 60);
    expect(Math.abs(rpm - FIG.cutInRpm[0])).toBeLessThan(3);
    expect(Math.abs(radToRpm(cutInOmega(cfg, value('batt'))) - FIG.cutInRpm[0])).toBeLessThan(2);
    expect(KE_LL_REF * 60).toBeGreaterThan(0); // (the constant of the bench test, K10)
  });

  it('derived: the cable of the plans loses 38 % at 12 V and 13 % at 24 V, four times less heat at half the current', () => {
    expect(cableLossShare(500, 12, 30, 6)).toBeCloseTo(0.38, 2);
    expect(cableLossShare(500, 24, 30, 6)).toBeCloseTo(0.13, 2);
    expect(value('hinge')).toBe(TAIL.tiltDeg);
    expect(value('hinge')).toBe(20);
  });

  it('model: the battery at 5 m/s, the cut-in example battery, the first watt of 38 turns', () => {
    printed('w5', point(5).busPower);
    expect(Math.abs(batteryOcv(SOC_REFERENCE) - value('batt'))).toBeLessThan(0.1);
    const few = buildConfig({ ...base, turns: 38 });
    let v = 1;
    while (point(v, few).busPower < 1 && v < 12) v += 0.05;
    expect(Math.abs(v - value('cut38'))).toBeLessThan(0.15);
    // and the default winding starts to charge at the cut-in of the sheets' table
    let v0 = 1;
    while (point(v0).busPower < 1 && v0 < 12) v0 += 0.05;
    expect(Math.abs(v0 - FIG.cutIn[0])).toBeLessThan(0.1);
  });

  it('model: the masts of 6 and 18 m among 5 m trees give 4.4 times the power in the wind', () => {
    const ratio = (hubWind(5, 18, 5) / hubWind(5, 6, 5)) ** 3;
    printed('mastRatio', ratio);
    expect(turbulenceIntensity(6, 5) / turbulenceIntensity(12, 5)).toBeGreaterThan(1.8);
    expect(turbulenceIntensity(6, 5) / turbulenceIntensity(12, 5)).toBeLessThan(2.2);
  });

  it('model: FINDING — at 12 m/s the battery gets 42, 60, 242 and 773 W for 1.0, 1.2, 2.4 and 4.2 m, 30 to 40 % of the label', () => {
    const rows = sizesTable();
    const at = (d: number) => rows.find((r) => r.diameter === d)!.model;
    printed('size10', at(1.0));
    printed('size24', at(2.4));
    printed('size42', at(4.2));
    expect(Math.round(at(1.2))).toBe(Math.round(FIG.w12[0]));
    // the label of the video's machine is 200 W, the largest of the family 2 000 W (Tripalium): the "30 to 40 %" of lesson 6
    expect(at(1.2) / 200).toBeGreaterThan(0.28);
    expect(at(1.2) / 200).toBeLessThan(0.32);
    expect(at(4.2) / 2000).toBeGreaterThan(0.36);
    expect(at(4.2) / 2000).toBeLessThan(0.42);
    // and the power follows the swept area: twice the diameter, four times the power (the quiz of lesson 6)
    expect(at(2.4) / at(1.2)).toBeGreaterThan(3.8);
    expect(at(2.4) / at(1.2)).toBeLessThan(4.2);
  });

  it('the first lesson’s honest point: the battery gets near four times the power for twice the wind, not eight, nearly a straight line', () => {
    const p5 = point(5).busPower;
    const p10 = point(10).busPower;
    expect(p10 / p5).toBeGreaterThan(3.4);
    expect(p10 / p5).toBeLessThan(4.2);
    expect(windPower(10, 1.2, 1.23) / windPower(5, 1.2, 1.23)).toBeCloseTo(8, 6);
    // between the two the curve stays within 10 % of the straight line that joins them
    for (const v of [6, 7, 8, 9]) {
      const line = p5 + ((p10 - p5) * (v - 5)) / 5;
      expect(Math.abs(point(v).busPower - line), `${v} m/s`).toBeLessThan(0.1 * p10);
    }
    // and 26 W (double) and 104 W (eight times) are the two wrong choices of the quiz: the printed 13 W times 2 and times 8
    expect(2 * value('w5')).toBe(26);
    expect(8 * value('w5')).toBe(104);
    // the plateau after the furling: the curve does not go on rising
    expect(point(25).busPower).toBeLessThan(point(14.5).busPower);
  });

  it('the second lesson’s claims: at the cut-in the blades are near their ideal speed, at 10 m/s they stall at λ = 2.6', () => {
    const atCutIn = point(FIG.cutIn[0]);
    expect(atCutIn.lambda).toBeGreaterThan(6);
    expect(atCutIn.lambda).toBeLessThan(8.5);
    const p10 = point(10);
    expect(Math.round(p10.rpm)).toBe(FIG.rpm10[0]);
    expect(p10.cp).toBeLessThan(0.15);
    expect(p10.lambda).toBeLessThan(3);
  });

  it('the third lesson’s aside: half the turns charge later but harvest more energy over the year in the hamlet', () => {
    const half = yearlyYield({ ...base, turns: 38 }).energy;
    expect(half).toBeGreaterThan(yearlyYield(base).energy * 1.2);
  });

  it('the fifth lesson’s comparison: nine times the thrust with the tail locked; a heavier tail folds later', () => {
    expect(FIG.thrustFixed25[0] / FIG.thrust25[0]).toBeGreaterThan(8.5);
    expect(FIG.thrustFixed25[0] / FIG.thrust25[0]).toBeLessThan(9.5);
    expect(FIG.furlHeavy[0]).toBeGreaterThan(FIG.furling[0]);
    expect(FIG.furlLight[0]).toBeLessThan(FIG.furling[0]);
    expect(FIG.tipFixed25[0]).toBeGreaterThan(FIG.tipLimit[0]);
  });
});

// ------------------------------------------------------------------------------------------------ what the scenarios do

describe('what each lesson says will happen when the visitor runs its scenario', () => {
  function run(sim: PiggottSim, secondsTotal: number, at: Record<number, () => void> = {}): void {
    const marks = Object.keys(at).map(Number);
    for (let i = 0; i < Math.round(secondsTotal * 60); i++) {
      sim.step(1 / 60);
      const t = (i + 1) / 60;
      for (const m of marks) if (Math.abs(t - m) < 0.5 / 60) at[m]!();
    }
  }
  const started = (id: (typeof SCENARIO_IDS)[number]) => {
    const sim = new PiggottSim(1);
    sim.applyPreset('hamlet');
    sim.applyScenario(id);
    return sim;
  };

  it('lesson 1, wind sweep: the wind rises from 1 to 20 m/s over five minutes and the battery power rises, then levels off', () => {
    const setup = scenarioSetup('wind-sweep');
    expect(setup.ramps[0]).toMatchObject({ key: 'meanWind', from: 1, to: 20 });
    expect(setup.ramps[0]!.duration).toBe(300);
    const sim = started('wind-sweep');
    const power: number[] = [];
    run(sim, 300, {
      60: () => power.push(sim.state.busPower),
      140: () => power.push(sim.state.busPower),
      230: () => power.push(sim.state.busPower),
    });
    expect(power[0]!).toBeLessThan(power[1]!);
    expect(power[1]!).toBeLessThan(power[2]! + 20); // levels off after the furling
  });

  it('lesson 2, runaway: the battery is disconnected at 20 s, the rotor goes from about 400 to over 1 000 rpm in ten seconds, the brake brings it under 100 rpm', () => {
    const setup = scenarioSetup('runaway');
    expect(setup.events[0]).toMatchObject({ at: 20, patch: { batteryConnected: false } });
    expect(setup.events[1]).toMatchObject({ at: 70, patch: { brake: true } });
    const sim = started('runaway');
    const rpm: Record<string, number> = {};
    run(sim, 100, {
      19: () => (rpm.before = sim.state.rpm),
      30: () => (rpm.after = sim.state.rpm),
      99: () => (rpm.braked = sim.state.rpm),
    });
    expect(rpm.before!).toBeGreaterThan(370);
    expect(rpm.before!).toBeLessThan(430);
    expect(rpm.after!).toBeGreaterThan(1000);
    expect(rpm.braked!).toBeLessThan(100);
  });

  it('lesson 3, too few turns: 38 turns at 4 m/s, the rotor spins freely and charges nothing', () => {
    const setup = scenarioSetup('few-turns');
    expect(setup.params.turns).toBe(38);
    expect(setup.params.meanWind).toBe(4);
    const sim = started('few-turns');
    run(sim, 50);
    expect(sim.state.rpm).toBeGreaterThan(300);
    expect(sim.state.busPower).toBeLessThan(0.5);
  });

  it('lesson 4, battery full: it starts at 95 % and the dump load holds the bus at 14 V', () => {
    expect(scenarioSetup('battery-full').soc).toBe(0.95);
    const sim = started('battery-full');
    run(sim, 40);
    expect(sim.state.dumpActive).toBe(true);
    expect(Math.abs(sim.state.busVoltage - 14)).toBeLessThan(0.1);
  });

  it('lesson 4, the cables: 2.5 mm² over 40 m at 8 m/s is the thin-cable scenario; the default cable is 10 mm² over 15 m', () => {
    const thin = scenarioSetup('thin-cable').params;
    expect([thin.cableSection, thin.cableLength, thin.meanWind]).toEqual([2.5, 40, 8]);
    const base = presetParams('hamlet');
    expect([base.cableSection, base.cableLength]).toEqual([10, 15]);
  });

  it('lesson 5, storm: the wind climbs from 6 to 25 m/s, the tail folds, the thrust stays near 40 N', () => {
    const setup = scenarioSetup('storm');
    expect(setup.ramps[0]).toMatchObject({ from: 6, to: 25 });
    const sim = started('storm');
    run(sim, 190);
    expect(sim.state.yaw).toBeGreaterThan(55);
    expect(sim.state.tailSwing).toBeGreaterThan(55);
    expect(sim.state.thrust).toBeLessThan(80);
    expect(sim.state.alarms).toContain('furling');
  });

  it('lesson 5, the brake switch: the rotor falls to about 83 rpm at 8 m/s, the battery keeps its voltage', () => {
    const sim = started('brake-switch');
    run(sim, 60);
    expect(sim.state.alarms).toContain('brakeOn');
    expect(sim.state.rpm).toBeLessThan(120);
    expect(sim.state.busVoltage).toBeGreaterThan(11.5);
    expect(FIG.brakeRpm[0]).toBeLessThan(100);
  });

  it('lesson 6, low mast: a 6 m mast among 8 m trees, a hub wind well under a 12 m mast’s', () => {
    const setup = scenarioSetup('low-mast');
    expect(setup.params.mastHeight).toBe(6);
    expect(setup.params.obstacleHeight).toBe(8);
    expect(hubWind(5, 6, 8)).toBeLessThan(0.75 * hubWind(5, 12, 8));
  });
});

// ------------------------------------------------------------------------------------------------ the words the lessons share with the interface

describe('the lessons agree with the interface', () => {
  const lesson = (id: string): Lesson => LESSONS.find((x) => x.id === id)!;
  const bodyEn = (id: string) =>
    lesson(id)
      .body.map((p) => p.en)
      .join(' ');
  const bodyFr = (id: string) =>
    lesson(id)
      .body.map((p) => p.fr)
      .join(' ');

  it('names the Sizes section of the simulation panel as the panel names it, in both languages', () => {
    expect(bodyFr('siting-sizing')).toContain(`« ${LAB_STRINGS.secSizes![0]} »`);
    expect(bodyEn('siting-sizing')).toContain(`“${LAB_STRINGS.secSizes![1]}”`);
  });

  it('gives the French mast rule as the legal string of the interface does: under 12 m, from 12 m, ask the mairie', () => {
    expect(bodyEn('siting-sizing')).toMatch(/under 12 m/);
    expect(bodyEn('siting-sizing')).toMatch(/from 12 m/);
    expect(bodyEn('siting-sizing')).toMatch(/mairie/);
    expect(bodyFr('siting-sizing')).toMatch(/mairie/);
    expect(LAB_STRINGS.legal![1]).toMatch(/under 12 m/);
  });

  it('keeps the safety lines: close the brake switch before a disconnected battery, never short-circuit the battery, stop before climbing', () => {
    expect(bodyEn('betz-blades')).toMatch(/close the brake switch first/);
    expect(bodyEn('storm')).toMatch(/never short-circuited/);
    expect(bodyEn('storm')).toMatch(/before climbing/);
  });

  it('says plainly that the power in the wind is a cube but the battery of this machine is not', () => {
    expect(bodyEn('wind-cube')).toMatch(/not eight/);
    expect(bodyEn('wind-cube')).toMatch(/What grows as a cube is the power in the wind, not the battery’s/);
    expect(bodyFr('wind-cube')).toMatch(/pas celle de la batterie/);
  });

  it('says what the sources do not say: the wind of the label, the shape of the stall, the plans’ silence on turbulence', () => {
    expect(bodyEn('siting-sizing')).toMatch(/no wind speed given/);
    expect(bodyEn('siting-sizing')).toMatch(/nobody publishes/);
    expect(bodyEn('wind-cube')).toMatch(/only say that a mast must clear the turbulence/);
  });

  it('opens the lessons with an intro of the interface that does not promise what the lessons are not', () => {
    const intro = LAB_STRINGS.lessonsIntroPiggott!;
    expect(intro[0]).toMatch(/^Six leçons/);
    expect(intro[1]).toMatch(/^Six lessons/);
    expect(LESSONS).toHaveLength(6);
  });
});
