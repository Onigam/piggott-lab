import { beforeAll, describe, expect, it } from 'vitest';
import { Drawing, configureDrawings } from '@onigam/lab-kit/drawings';
import { setLang } from '@onigam/lab-kit/i18n';
import dimsSource from '../three/dims.ts?raw';
import { PARTS } from '../data/parts';
import { MODEL } from '../data/figures';
import { nEn, nFr } from '../data/units';
import { PART_CATEGORIES, WORLDS, partIds, type WorldId } from '../part-ids';
import { buildConfig } from '../sim/config';
import { DIAMETER_REF, FURLING_SPEED, MEAN_TURN_LENGTH, NAMEPLATE_REF, R_PHASE_REF, TURNS_REF } from '../sim/machine';
import { presetParams } from '../sim/presets';
import { nameplate, powerCurve, windGrid } from '../sim/yield';
import * as DIMS from '../three/dims';
import { CHART, RAMP } from './pl08-sizes';
import { MARKED_ESTIMATE, STATUS, USED, mm } from './geom';
import { SHEETS } from './index';
import { SIZES, cableSection, modelPower, sizeCurves } from './sizes-model';
import { FakeElement, installFakeDom, textBoxes, textExtent, type TextBox } from './test-dom';

// The eight sheets of the "Plans" mode by script: the contract (ids, numbers, groups, worlds, parts), a render in French and in
// English with no NaN and no text on text, the numbers drawn against dims.ts, machine.ts and the simulation, the marks
// (reported, derived, estimate) against the JSDoc of dims.ts, and the seven curves of PL-08 against src/sim.

const CONTRACT = [
  { id: 'general-arrangement', number: 'PL-01', group: 'machine', scene: 'turbine' },
  { id: 'blade-carving', number: 'PL-02', group: 'machine', scene: 'blades' },
  { id: 'furling-geometry', number: 'PL-03', group: 'machine', scene: 'turbine' },
  { id: 'alternator-section', number: 'PL-04', group: 'alternator', scene: 'alternator' },
  { id: 'stator-winding', number: 'PL-05', group: 'alternator', scene: 'alternator' },
  { id: 'tower-guys', number: 'PL-06', group: 'site', scene: 'site' },
  { id: 'electrical-schematic', number: 'PL-07', group: 'site', scene: 'site' },
  { id: 'power-by-size', number: 'PL-08', group: 'performance', scene: 'site' },
] as const;

const LANGS = ['fr', 'en'] as const;
type Lang = (typeof LANGS)[number];
const key = (id: string, lang: Lang) => `${id}/${lang}`;
const rendered = new Map<string, FakeElement>();
const root = (d: { svg: SVGSVGElement }): FakeElement => d.svg as unknown as FakeElement;

beforeAll(() => {
  installFakeDom();
  configureDrawings({ project: { fr: 'PIGGOTT LAB — dispositif', en: 'PIGGOTT LAB — device' }, date: '2026-10-29' });
  for (const lang of LANGS) {
    setLang(lang);
    for (const s of SHEETS) rendered.set(key(s.id, lang), root(s.render()));
  }
  setLang('fr');
});

const boxes = (id: string, lang: Lang): TextBox[] => textBoxes(rendered.get(key(id, lang)) as FakeElement);
const texts = (id: string, lang: Lang): string[] => boxes(id, lang).map((t) => t.content);
const blob = (id: string, lang: Lang): string => texts(id, lang).join(' | ');
const fr = (x: number, d = 0): string => nFr(x, d);
const en = (x: number, d = 0): string => nEn(x, d);
const num = (lang: Lang) => (lang === 'fr' ? fr : en);

describe('the contract', () => {
  it('has the eight sheets in reading order with their ids, numbers, groups and worlds', () => {
    expect(SHEETS.map((s) => ({ id: s.id, number: s.number, group: s.group, scene: s.scene }))).toEqual(
      CONTRACT.map((c) => ({ ...c })),
    );
  });

  it('numbers follow the order of the groups, so that the list of the panel reads PL-01 … PL-08', () => {
    const order = ['machine', 'alternator', 'site', 'performance'];
    const seen = SHEETS.map((s) => order.indexOf(s.group));
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
    expect(new Set(SHEETS.map((s) => s.number)).size).toBe(8);
  });

  it('only shows frozen part ids of the world of the sheet, each once', () => {
    for (const s of SHEETS) {
      expect(WORLDS, s.id).toContain(s.scene);
      expect(s.parts?.length, s.id).toBeGreaterThan(0);
      expect(new Set(s.parts).size, `${s.id} lists a part twice`).toBe(s.parts!.length);
      for (const id of s.parts!) expect(partIds(s.scene as WorldId), `${s.id}: ${id}`).toContain(id);
      for (const id of s.parts!) expect(PART_CATEGORIES[s.scene as WorldId][id], id).toBeDefined();
    }
  });

  it('writes a different title and description in French and in English, of 2 to 4 sentences', () => {
    for (const s of SHEETS) {
      expect(s.title.fr, s.id).not.toBe(s.title.en);
      expect(s.description.fr, s.id).not.toBe(s.description.en);
      for (const lang of LANGS) {
        expect(s.title[lang].length, `${s.id} ${lang}`).toBeGreaterThan(8);
        const sentences = s.description[lang].split(/(?<=[.!?])\s+/).filter(Boolean);
        expect(sentences.length, `${s.id} ${lang}`).toBeGreaterThanOrEqual(2);
        expect(sentences.length, `${s.id} ${lang}`).toBeLessThanOrEqual(4);
      }
    }
  });
});

describe('every sheet renders', () => {
  for (const c of CONTRACT) {
    for (const lang of LANGS) {
      it(`${c.number} (${lang}): a full A3 drawing with no NaN, no infinity and no empty text`, () => {
        const svg = rendered.get(key(c.id, lang)) as FakeElement;
        expect(svg.getAttribute('viewBox')).toBe('0 0 420 297');
        const nodes = svg.all();
        expect(nodes.length, 'elements').toBeGreaterThan(150);
        for (const e of nodes)
          for (const [k, v] of e.attrs)
            expect(/NaN|Infinity|undefined/.test(v), `${c.id} ${e.tag} ${k}="${v.slice(0, 60)}"`).toBe(false);
        const all = boxes(c.id, lang);
        expect(all.length).toBeGreaterThan(40);
        for (const t of all) {
          expect(t.content.trim().length, `${c.id}: empty text at ${t.x},${t.y}`).toBeGreaterThan(0);
          expect(/undefined|\[object|NaN/.test(t.content), `${c.id}: "${t.content}"`).toBe(false);
          expect(/'|\s\s/.test(t.content), `${c.id}: typographic apostrophes, no double space: "${t.content}"`).toBe(
            false,
          );
          expect(Number.isFinite(t.x) && Number.isFinite(t.y) && t.size > 0, `${c.id}: ${t.content}`).toBe(true);
        }
        expect(all.some((t) => t.content === c.number)).toBe(true);
      });

      it(`${c.number} (${lang}): every text stays inside the frame of the paper and outside the title block`, () => {
        for (const t of boxes(c.id, lang)) {
          if (t.rotated) continue;
          const b = textExtent(t);
          expect(b.x0, `${c.id}: "${t.content}"`).toBeGreaterThan(8.5);
          expect(b.x1, `${c.id}: "${t.content}"`).toBeLessThan(411.5);
          expect(b.y0, `${c.id}: "${t.content}"`).toBeGreaterThan(8.5);
          expect(b.y1, `${c.id}: "${t.content}"`).toBeLessThan(288.5);
        }
      });
    }
  }

  it('keeps every text of the sheet itself out of the title block (x 232–410, y 249–287)', () => {
    const frame = new Set<string>();
    for (const lang of LANGS) {
      setLang(lang);
      const blank = new Drawing();
      blank.frame({ title: 'x', number: 'x', scale: 'x' });
      for (const t of textBoxes(root(blank))) frame.add(t.content);
    }
    setLang('fr');
    for (const c of CONTRACT)
      for (const lang of LANGS) {
        const bad = boxes(c.id, lang)
          .filter((t) => !t.rotated && !frame.has(t.content) && textExtent(t).y1 > 249.5 && textExtent(t).x1 > 231.5)
          .filter((t) => !isTitleBlock(t))
          .map((t) => `${c.number} ${lang}: "${t.content}"`);
        expect(bad).toEqual([]);
      }
  });

  it('keeps the scale of the title block short enough for its cell', () => {
    for (const c of CONTRACT) {
      const t = texts(c.id, 'fr');
      const scale = t[t.indexOf('Échelle') + 1]!;
      expect(scale, c.id).toBeDefined();
      expect(scale.length, c.id).toBeLessThanOrEqual(12);
    }
  });

  it('writes the numbers the way of each language: decimal comma in French, decimal point in English', () => {
    for (const c of CONTRACT) {
      expect(
        texts(c.id, 'fr').filter((t) => /\d\.\d/.test(t) && !/\d{4}-\d{2}-\d{2}/.test(t)),
        `${c.id} fr`,
      ).toEqual([]);
      expect(
        texts(c.id, 'en').filter((t) => /\d,\d{1,2}(?!\d)/.test(t)),
        `${c.id} en`,
      ).toEqual([]);
    }
  });

  it('writes both languages with the same level of detail', () => {
    for (const c of CONTRACT) {
      const f = texts(c.id, 'fr');
      const e = texts(c.id, 'en');
      expect(Math.abs(f.length - e.length) / Math.max(f.length, e.length), c.id).toBeLessThan(0.1);
      const cognates = new Set(['Dimensions (mm)', 'Dimensions', 'Notes', 'Rotor', 'Situation']);
      const same = f.filter(
        (t, i) => t === e[i] && /[a-zéèêàùç]{5,}/i.test(t) && !/^[A-Z0-9 .,·-]+$/.test(t) && !cognates.has(t),
      );
      expect(same.slice(0, 6), `${c.id}: untranslated?`).toEqual([]);
    }
  });

  it('never lays a text on another text (estimated boxes; a rotated text is left out)', () => {
    const clashes: string[] = [];
    for (const c of CONTRACT)
      for (const lang of LANGS) {
        const ext = boxes(c.id, lang)
          .filter((t) => !t.rotated && t.content.trim().length > 1)
          .map((t) => ({ t, e: textExtent(t) }));
        for (let i = 0; i < ext.length; i++)
          for (let j = i + 1; j < ext.length; j++) {
            const a = ext[i]!;
            const b = ext[j]!;
            const sx = (e: ReturnType<typeof textExtent>): number => (e.x1 - e.x0) * 0.08;
            const sy = (e: ReturnType<typeof textExtent>): number => (e.y1 - e.y0) * 0.2;
            const ox = Math.min(a.e.x1 - sx(a.e), b.e.x1 - sx(b.e)) - Math.max(a.e.x0 + sx(a.e), b.e.x0 + sx(b.e));
            const oy = Math.min(a.e.y1 - sy(a.e), b.e.y1 - sy(b.e)) - Math.max(a.e.y0 + sy(a.e), b.e.y0 + sy(b.e));
            if (ox > 0.2 && oy > 0.2) clashes.push(`${c.number} ${lang}: "${a.t.content}" / "${b.t.content}"`);
          }
      }
    expect(clashes, clashes.slice(0, 15).join('\n')).toEqual([]);
  });

  it('carries the notice that this is an educational reconstruction, not a construction plan, and the legend of the marks where dimensions are marked', () => {
    for (const c of CONTRACT)
      for (const lang of LANGS) {
        const t = blob(c.id, lang).replace(/ \| /g, ' ').replace(/\s+/g, ' ');
        expect(t, `${c.id} ${lang}`).toMatch(lang === 'fr' ? /pas un plan de construction/ : /not a construction plan/);
      }
    for (const id of [
      'general-arrangement',
      'blade-carving',
      'furling-geometry',
      'alternator-section',
      'stator-winding',
      'tower-guys',
    ])
      for (const lang of LANGS) expect(texts(id, lang), id).toContain('123†');
  });
});

/** A text that lies wholly inside the title block (the frame's own texts: title, subtitle, project, disclaimer, cells). */
function isTitleBlock(t: TextBox): boolean {
  const e = textExtent(t);
  return e.x0 > 231.5 && e.y0 > 249.5;
}

describe('the dimensions drawn are those of dims.ts and machine.ts', () => {
  for (const lang of LANGS) {
    const n = num(lang);
    const has = (id: string, label: string): void => {
      expect(texts(id, lang), `${id} ${lang}: ${label}`).toContain(label);
    };
    const hasPart = (id: string, part: string): void => {
      expect(blob(id, lang), `${id} ${lang}: ${part}`).toContain(part);
    };

    it(`PL-01 (${lang}) draws the rotor, the offset, the frame, the boom and the vane`, () => {
      has('general-arrangement', `Ø${n(DIAMETER_REF * 1000)}`);
      has('general-arrangement', n(mm(DIMS.HEAD.offset)));
      has('general-arrangement', n(mm(DIMS.NACELLE.length)));
      has('general-arrangement', n(mm(DIMS.TAIL.boomLength)));
      has('general-arrangement', `${n(mm(DIMS.TAIL.vaneLength))}†`);
      has('general-arrangement', `${n(mm(DIMS.TAIL.vaneHeight))}†`);
      has('general-arrangement', `${n(Math.abs(DIMS.HEAD.statorX * 1000))}*`);
      hasPart('general-arrangement', `Ø${n(mm(DIMS.MAST.pipeOuter), 1)}`);
      // the eight items, one per part of the world, in the order of the frozen ids
      const items = boxes('general-arrangement', lang).filter((t) => t.bold && /^\d$/.test(t.content) && t.x < 20);
      expect(items.map((t) => Number(t.content))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it(`PL-02 (${lang}) draws the six stations of the plans, the 600 mm and the 120° root`, () => {
      const t = texts('blade-carving', lang);
      DIMS.BLADE.stationWidth.forEach((w, i) => {
        expect(t, `width ${i}`).toContain(n(w * 1000));
        expect(t, `thickness ${i}`).toContain(n(DIMS.BLADE.stationThickness[i]! * 1000));
        expect(t, `radius ${i}`).toContain(`${n(DIMS.BLADE.stationRadius[i]! * 1000)}*`);
      });
      for (const drop of DIMS.BLADE.stationDrop.slice(1)) expect(t).toContain(n(drop * 1000));
      expect(t.some((x) => x.startsWith('600'))).toBe(true);
      expect(t).toContain('120°');
      expect(blob('blade-carving', lang)).toContain(n(DIMS.BLADE.rootWidth * 1000));
    });

    it(`PL-03 (${lang}) draws the offset, the 55° and 10° of the hinge and the boom, the 20° tilt and the model's yaw`, () => {
      const t = texts('furling-geometry', lang);
      expect(t).toContain(n(DIMS.HEAD.offset * 1000));
      expect(t).toContain(`${DIMS.TAIL.planDeg}°`);
      expect(t).toContain(`${DIMS.TAIL.tiltDeg}°`);
      expect(t).toContain(`${90 - DIMS.TAIL.restDeg}°`);
      expect(t).toContain(n(DIMS.TAIL.boomLength * 1000));
      for (const yaw of [MODEL.yaw10, MODEL.yaw12, MODEL.yaw16, MODEL.yaw25]) expect(t).toContain(`${yaw}°`);
      expect(t).toContain('95°');
      // the geometric limit of the yaw is derived (stop + the part of the swing that turns the rotor)
      expect(t).toContain('85°†');
      expect(blob('furling-geometry', lang)).toContain(`${n(FURLING_SPEED)} m/s`);
    });

    it(`PL-04 (${lang}) draws the stack of the alternator: disc, magnet, stator, cradle, gap`, () => {
      const t = texts('alternator-section', lang);
      for (const v of [DIMS.ROTOR_DISC.thickness, DIMS.MAGNET.thickness, DIMS.STATOR.thickness])
        expect(t).toContain(n(v * 1000));
      expect(t).toContain(`Ø${n(DIMS.STATOR.outer * 1000)}`);
      expect(t).toContain(`Ø${n(DIMS.CRADLE.diameter * 1000)}`);
      expect(t).toContain(n(DIMS.ROTOR_RODS.length * 1000));
      expect(t).toContain(`≈ ${n(DIMS.AIR_GAP * 1000)} mm`);
      hasPart('alternator-section', `Ø${n(DIMS.ROTOR_DISC.diameter * 1000)} × ${n(DIMS.ROTOR_DISC.thickness * 1000)}`);
      hasPart(
        'alternator-section',
        `${n(DIMS.MAGNET.length * 1000)} × ${n(DIMS.MAGNET.width * 1000)} × ${n(DIMS.MAGNET.thickness * 1000)}`,
      );
      // the parts list names the eight ids of the catalogue, in order, with the same names
      const names = ['magnet-rotor', 'magnets', 'bearing-hub', 'shaft', 'stator', 'coils', 'studs', 'air-gap'].map(
        (id) => PARTS.find((p) => p.id === id)!.name[lang],
      );
      for (const name of names)
        expect(blob('alternator-section', lang).replace(/\s/g, ' ')).toContain(name.replace(/\s/g, ' '));
    });

    it(`PL-05 (${lang}) draws six coils of ${TURNS_REF} turns, the phases of the 3D model and the figures of the winding`, () => {
      const t = texts('stator-winding', lang);
      DIMS.COIL_PHASE.forEach((ph, i) => expect(t, `coil ${i + 1}`).toContain(`${i + 1} · ${ph}`));
      for (const v of [
        DIMS.STATOR.coilOutlineLength,
        DIMS.STATOR.coilOutlineWidth,
        DIMS.STATOR.coilHoleLength,
        DIMS.STATOR.coilHoleWidth,
      ])
        expect(t).toContain(n(v * 1000));
      hasPart('stator-winding', String(TURNS_REF));
      hasPart('stator-winding', `${n(R_PHASE_REF, 2)} Ω†`);
      hasPart('stator-winding', `${n(MEAN_TURN_LENGTH * 1000)} mm†`);
      hasPart('stator-winding', `≈ ${n(1.9, 1)} V`);
      hasPart('stator-winding', `${n(4)} Hz†`);
      // four north and four south magnets, and the neutral point of the star
      expect(t.filter((x) => x === 'N').length).toBe(5);
      expect(t.filter((x) => x === 'S').length).toBe(4);
    });

    it(`PL-06 (${lang}) draws the guy levels the way the 3D builds them`, () => {
      const t = texts('tower-guys', lang);
      expect(t).toContain(`${n(DIMS.MAST.guySpacing)} m`);
      expect(t.filter((x) => x === `${n(DIMS.MAST.guySpacing)} m`).length).toBeGreaterThanOrEqual(2);
      const top = 12 + DIMS.HEAD_Y.capTop - 0.006 - 0.35;
      expect(t).toContain(`${n(top - 8, 1)} m*`);
      expect(t).toContain(`${n(DIMS.MAST.padSize * 1000)}*`);
      hasPart('tower-guys', `Ø${n(mm(DIMS.MAST.pipeOuter), 1)}`);
      hasPart('tower-guys', `Ø${n(DIMS.MAST.pinDiameter * 1000)}*`);
    });

    it(`PL-07 (${lang}) quotes the cable losses of the plans and the model's current`, () => {
      const p = lang === 'fr' ? (v: number) => `${v} %` : (v: number) => `${v}%`;
      const t = texts('electrical-schematic', lang);
      for (const v of [38, 13, 4]) expect(t).toContain(p(v));
      hasPart('electrical-schematic', `≈ ${n(MODEL.amps12)} A`);
      hasPart('electrical-schematic', `${n(MODEL.thinLoss)}`);
      hasPart('electrical-schematic', `${n(11.5, 1)} V`);
      const cfg = presetParams('hamlet');
      hasPart('electrical-schematic', `${n(cfg.cableSection)} mm²*`);
    });
  }

  it('shows no dimension that dims.ts does not hold: the template plates, the resin, the foundation have no number', () => {
    for (const lang of LANGS) {
      const all = blob('blade-carving', lang) + blob('tower-guys', lang) + blob('alternator-section', lang);
      expect(all).not.toMatch(/\d\s?(g|ml|mL|cl)\b/);
      expect(all).not.toMatch(/N·m|\bNm\b/);
    }
  });
});

describe('the marks (reported, derived, estimate) agree with the JSDoc of dims.ts', () => {
  /** What the comment above a constant of a section says: the first of "reported", "derived", "estimate" (the comment of the section if the constant has none). */
  function jsdocStatus(section: string, name: string): 'R' | 'D' | 'E' {
    const start = dimsSource.indexOf(`export const ${section} = {`);
    const end = dimsSource.indexOf('\n} as const;', start);
    const body = dimsSource.slice(start, end);
    const at = body.search(new RegExp(`(^|\\n|, )\\s*${name}:`));
    const before = at < 0 ? body : body.slice(0, at);
    const docs = [...before.matchAll(/\/\*\*([\s\S]*?)\*\//g)];
    let doc = docs.length ? docs[docs.length - 1]![1]! : '';
    if (!doc) {
      // the comment above the section
      const head = dimsSource.slice(0, start);
      const last = head.lastIndexOf('/**');
      if (last >= 0 && head.slice(last).includes('*/') && head.slice(last).split('\n').length < 12)
        doc = head.slice(last);
    }
    const first = /\b(reported|derived|estimate)\b/.exec(doc);
    return first ? (first[1] === 'reported' ? 'R' : first[1] === 'derived' ? 'D' : 'E') : 'E';
  }
  const RANK = { R: 2, D: 1, E: 0 } as const;
  /** Constants that come from src/sim/machine.ts, where their JSDoc says "reported" (STATOR_OUTER, OFFSET_REF…). */
  const FROM_MACHINE = new Set([
    'STATOR.outer',
    'STATOR.coilOutlineLength',
    'STATOR.coilOutlineWidth',
    'STATOR.coilHoleLength',
    'STATOR.coilHoleWidth',
    'STATOR.thickness',
    'MAGNET.length',
    'MAGNET.width',
    'TAIL.swingDeg',
    'TAIL.restDeg',
    'TAIL.tiltDeg',
  ]);

  it('has used constants of dims.ts (the sheets are generated from it)', () => {
    expect(USED.size).toBeGreaterThan(10);
  });

  it('never marks a dimension higher than the comment of dims.ts says (reported > derived > estimate)', () => {
    const wrong: string[] = [];
    for (const id of Object.keys(STATUS)) {
      if (FROM_MACHINE.has(id)) continue;
      const [section, name] = id.split('.') as [string, string];
      const doc = jsdocStatus(section, name);
      if (RANK[STATUS[id]!] > RANK[doc] && !MARKED_ESTIMATE.has(id))
        wrong.push(`${id}: the sheets say ${STATUS[id]}, dims.ts says ${doc}`);
    }
    expect(wrong).toEqual([]);
  });

  it('lists only constants that exist in dims.ts', () => {
    for (const id of Object.keys(STATUS)) {
      const [section, name] = id.split('.') as [keyof typeof DIMS, string];
      expect(typeof (DIMS[section] as unknown as Record<string, unknown>)[name], id).toBe('number');
    }
  });
});

describe('PL-08: the seven curves are the simulation’s', () => {
  const curves = sizeCurves();

  it('has the seven diameters of the Tripalium family, from 1.0 to 4.2 m', () => {
    expect(SIZES).toEqual([1.0, 1.2, 1.8, 2.4, 3.0, 3.6, 4.2]);
    expect(curves.map((c) => c.diameter)).toEqual([...SIZES]);
  });

  it('computes each curve from src/sim with the cable scaled with the area (hamlet, reference battery)', () => {
    const winds = windGrid(25, 0.5);
    for (const c of curves) {
      const cfg = buildConfig({
        ...presetParams('hamlet'),
        diameter: c.diameter,
        cableSection: 10 * (c.diameter / DIAMETER_REF) ** 2,
      });
      const power = powerCurve(cfg, winds).map((p) => p.busPower);
      expect(c.winds).toEqual(winds);
      expect(c.power).toEqual(power);
      expect(c.label).toBeCloseTo(nameplate(c.diameter), 9);
    }
    expect(cableSection(DIAMETER_REF)).toBeCloseTo(presetParams('hamlet').cableSection, 9);
  });

  it('FAILS IF THE MODEL IS RECALIBRATED: 42, 60, 135, 242, 382, 558 and 773 W at 12 m/s, labels 139 to 2 450 W', () => {
    expect(curves.map((c) => Math.round(c.at12))).toEqual([42, 60, 135, 242, 382, 558, 773]);
    expect(curves.map((c) => Math.round(c.label))).toEqual([139, 200, 450, 800, 1250, 1800, 2450]);
    // about 0.3 of the label, whatever the size
    for (const c of curves) {
      expect(c.at12 / c.label).toBeGreaterThan(0.29);
      expect(c.at12 / c.label).toBeLessThan(0.33);
    }
    // the machine of the video: the figure the texts of the app quote
    expect(curves[1]!.at12).toBeCloseTo(MODEL.w12, 0);
    expect(curves[1]!.label).toBe(NAMEPLATE_REF);
    // the published sizes that are not in the family
    expect(Math.round(modelPower(2, 12))).toBe(167);
    expect(Math.round(modelPower(4, 12))).toBe(697);
  });

  it('draws every curve of the model at its data coordinates, in both languages', () => {
    for (const lang of LANGS) {
      const svg = rendered.get(key('power-by-size', lang)) as FakeElement;
      const lines = svg.all().filter((e) => e.tag === 'polyline');
      const X = (v: number) => CHART.x + (v / 25) * CHART.w;
      const Y = (v: number) => CHART.y + CHART.h - (v / CHART.yMax) * CHART.h;
      curves.forEach((c, i) => {
        const found = lines.find(
          (e) => e.getAttribute('stroke') === RAMP[i] && e.getAttribute('stroke-width') === '0.55',
        );
        expect(found, `curve ${c.diameter} m`).toBeDefined();
        const pts = (found!.getAttribute('points') as string)
          .split(' ')
          .map((q) => q.split(',').map(Number) as [number, number]);
        expect(pts.length).toBe(c.winds.length);
        c.winds.forEach((v, j) => {
          expect(pts[j]![0], `${c.diameter} m, ${v} m/s (x)`).toBeCloseTo(X(v), 2);
          expect(pts[j]![1], `${c.diameter} m, ${v} m/s (y)`).toBeCloseTo(Y(c.power[j]!), 2);
        });
      });
    }
  });

  it('writes the values of the model and of the label as numbers of the sheet, tagged MODEL RESULT, with the note on the one parameter', () => {
    for (const lang of LANGS) {
      const n = num(lang);
      const t = texts('power-by-size', lang);
      for (const c of curves) {
        expect(t, `${lang} ${c.diameter} 12 m/s`).toContain(n(c.at12));
        expect(blob('power-by-size', lang), `${lang} label`).toContain(`${n(c.label)} W`);
        expect(t, `${lang} peak`).toContain(`${n(c.peak)} W`);
      }
      expect(t.join(' ')).toMatch(lang === 'fr' ? /RÉSULTAT DU MODÈLE/ : /MODEL RESULT/);
      expect(blob('power-by-size', lang).replace(/\s+/g, ' ')).toMatch(
        lang === 'fr'
          ? /un seul paramètre du modèle, le diamètre, pas sept machines/
          : /one parameter of the model, the diameter, not seven machines/,
      );
      expect(blob('power-by-size', lang)).toContain(`${n(NAMEPLATE_REF)} W`);
    }
  });

  it('is cached: the sweeps are computed once', () => {
    expect(sizeCurves()).toBe(sizeCurves());
  });
});
