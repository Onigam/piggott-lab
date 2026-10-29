import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import { num, t } from '../i18n/ui';
import { PiggottSim } from '../sim/engine';
import { nameplate } from '../sim/yield';
import {
  pendingSizes,
  SIZE_DIAMETERS,
  SIZE_TABLE_WIND,
  SIZE_WINDS,
  sizeCurve,
  sizeKey,
  sizeParams,
  sizesChartData,
  sizesTable,
} from './model';
import { SizesSection } from './sizes';
import { FakeElement, installFakeDom } from './test-dom';

// The Sizes section of the simulation panel: the data behind its chart (seven curves of the family, ordered, the 1.2 m one the
// model's own curve, the figures that docs/research.md §9 and the lessons quote), the lazy cache, and the section itself in
// a stand-in for the DOM (closed at first, one curve per frame once opened, drawn again only when the size or the language changes).

beforeAll(() => installFakeDom());
afterEach(() => setLang('fr'));

describe('nothing is computed before the section is opened', () => {
  it('the cache is empty at first: the seven curves and the set size are all still to compute', () => {
    expect(pendingSizes(1.2)).toHaveLength(7);
    expect(pendingSizes(1.5)).toHaveLength(8);
  });
  it('a closed section ignores the frames: still nothing in the cache after a hundred ticks', () => {
    setLang('fr');
    const section = new SizesSection(() => 1.2);
    section.build();
    for (let i = 0; i < 100; i++) section.tick();
    expect(pendingSizes(1.2)).toHaveLength(7);
  });
});

describe('the seven curves of the family', () => {
  // computed inside the tests, not while the file is collected: the first describe checks that the cache starts empty
  const family = () => SIZE_DIAMETERS.map((d) => sizeCurve(d));

  it('are the seven sizes of Tripalium, 1.0 to 4.2 m, in increasing order', () => {
    expect(SIZE_DIAMETERS).toEqual([1.0, 1.2, 1.8, 2.4, 3.0, 3.6, 4.2]);
    expect(SIZE_DIAMETERS.map(sizeKey)).toEqual(['d10', 'd12', 'd18', 'd24', 'd30', 'd36', 'd42']);
  });
  it('have a point at each wind of the grid, finite, never negative', () => {
    expect(SIZE_WINDS[0]).toBe(0);
    expect(SIZE_WINDS[SIZE_WINDS.length - 1]).toBe(25);
    for (const c of family()) {
      expect(c).toHaveLength(SIZE_WINDS.length);
      for (const v of c) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it('are ordered: at every wind the bigger rotor gives at least as much, and strictly more once the machines charge', () => {
    const curves = family();
    for (let k = 1; k < curves.length; k++) {
      for (let i = 0; i < SIZE_WINDS.length; i++) {
        expect(curves[k]![i]!, `${SIZE_DIAMETERS[k]} m at ${SIZE_WINDS[i]} m/s`).toBeGreaterThanOrEqual(
          curves[k - 1]![i]!,
        );
        if (SIZE_WINDS[i]! >= 4) expect(curves[k]![i]!).toBeGreaterThan(curves[k - 1]![i]!);
      }
    }
  });
  it('the 1.2 m curve is the model’s own power curve (the hamlet machine of the video), point for point', () => {
    const own = new PiggottSim().getCurve().map((p) => p.busPower);
    expect(sizeCurve(1.2)).toEqual(own);
    expect(own).toHaveLength(SIZE_WINDS.length);
  });
  it('are cached: the second request returns the same array, and nothing is left to compute', () => {
    expect(sizeCurve(2.4)).toBe(sizeCurve(2.4));
    expect(pendingSizes(1.2)).toEqual([]);
    expect(pendingSizes(3.0)).toEqual([]);
  });
  it('keep the cable in proportion to the swept area, so that the cable costs the same share at every size', () => {
    expect(sizeParams(1.2).cableSection).toBeCloseTo(10, 9);
    expect(sizeParams(2.4).cableSection).toBeCloseTo(40, 9);
    expect(sizeParams(4.2).cableSection).toBeCloseTo(10 * 3.5 ** 2, 9);
  });
});

describe('the figures that the notes and the lessons quote', () => {
  // docs/research.md §9: "42, 60, 135, 242, 382, 558 and 773 W at 12 m/s". If the model is ever recalibrated, this test fails
  // and the lessons (lessons.ts) and docs/lessons.md must be written again from the new numbers.
  it('FINDING: at 12 m/s the model gives 42, 60, 135, 242, 382, 558 and 773 W for 1.0, 1.2, 1.8, 2.4, 3.0, 3.6 and 4.2 m', () => {
    expect(sizesTable().map((r) => Math.round(r.model))).toEqual([42, 60, 135, 242, 382, 558, 773]);
    expect(SIZE_TABLE_WIND).toBe(12);
  });
  it('the label scaled with the swept area is 200 W at 1.2 m and 2 450 W at 4.2 m; the model gives 30 to 32 % of it everywhere', () => {
    const rows = sizesTable();
    expect(rows[1]!.rated).toBeCloseTo(200, 9);
    expect(rows[6]!.rated).toBeCloseTo(2450, 6);
    for (const r of rows) {
      expect(r.rated).toBeCloseTo(nameplate(r.diameter), 9);
      expect(r.model / r.rated, `${r.diameter} m`).toBeGreaterThan(0.29);
      expect(r.model / r.rated, `${r.diameter} m`).toBeLessThan(0.33);
    }
  });
  it('the power follows the swept area: P / D² is the same at every size to 5 %', () => {
    const per = sizesTable().map((r) => r.model / r.diameter ** 2);
    for (const p of per) expect(p / per[1]!).toBeGreaterThan(0.95);
    for (const p of per) expect(p / per[1]!).toBeLessThan(1.05);
  });
});

describe('the chart data', () => {
  it('has one series per size of the family and the label of the set size, on a fixed axis above the best curve', () => {
    const d = sizesChartData(1.2);
    expect(Object.keys(d.ys).sort()).toEqual([...SIZE_DIAMETERS.map(sizeKey), 'rated'].sort());
    expect(d.xs).toHaveLength(SIZE_WINDS.length);
    const best = Math.max(...sizeCurve(4.2));
    expect(d.yMax % 300).toBe(0);
    expect(d.yMax).toBeGreaterThan(best);
    expect(d.yMax).toBeLessThan(best + 300);
    expect(d.setKey).toBe('d12');
    expect(d.set.model).toBeCloseTo(60.4, 0);
    expect(d.set.rated).toBe(200);
    // the label of the 1.2 m machine fits under the axis: a flat line
    expect(d.ys.rated!.every((v) => v === 200)).toBe(true);
  });
  it('keeps the axis where it is whatever the set size, and lets a label that does not fit leave through the top', () => {
    const small = sizesChartData(1.2);
    const big = sizesChartData(4.2);
    expect(big.yMax).toBe(small.yMax);
    expect(big.set.rated).toBeCloseTo(2450, 6);
    expect(big.ys.rated!.every((v) => Number.isNaN(v))).toBe(true);
    expect(sizesChartData(2.4).ys.rated!.every((v) => v === 800)).toBe(true);
  });
  it('gives a set size that is not one of the seven (1.5 m) its own curve, between its neighbours', () => {
    const d = sizesChartData(1.5);
    expect(d.setKey).toBe('set');
    const at = SIZE_WINDS.indexOf(12);
    expect(d.ys.set![at]).toBeGreaterThan(sizeCurve(1.2)[at]!);
    expect(d.ys.set![at]).toBeLessThan(sizeCurve(1.8)[at]!);
    expect(d.set.rated).toBeCloseTo(200 * (1.5 / 1.2) ** 2, 9);
  });
});

describe('the section in the panel', () => {
  const text = (el: unknown): string => (el as FakeElement).textContent;

  it('is a closed collapsible section named Sizes / Tailles, with its chart, its summary and one cell per size', () => {
    setLang('fr');
    const section = new SizesSection(() => 1.2);
    const el = section.build() as unknown as FakeElement;
    expect(el.tagName).toBe('details');
    expect(el.open).toBe(false);
    expect(el.find('summary')[0]!.textContent).toBe(t('secSizes'));
    expect(el.find('canvas')).toHaveLength(1);
    expect(text(el)).toContain(t('sizesHint'));
  });
  it('once opened, computes one curve per frame, then draws: seven cells, the set size picked out, the summary', () => {
    setLang('fr');
    let diameter = 1.2;
    const section = new SizesSection(() => diameter);
    const el = section.build() as unknown as FakeElement;
    el.open = true;
    for (const d of SIZE_DIAMETERS) sizeCurve(d); // the family is in the cache, a size outside it is not
    diameter = 1.7;
    let frames = 0;
    while (pendingSizes(1.7).length > 0) {
      section.tick();
      frames++;
      expect(frames).toBeLessThan(10);
    }
    expect(frames).toBe(1); // only the curve of 1.7 m was missing
    section.tick();
    section.tick();
    const cells = el.find('.readout');
    expect(cells).toHaveLength(7);
    expect(cells.map((c) => c.find('span')[0]!.textContent)).toEqual([
      '1,0 m',
      '1,2 m',
      '1,8 m',
      '2,4 m',
      '3,0 m',
      '3,6 m',
      '4,2 m',
    ]);
    expect(cells[1]!.textContent).toBe(`1,2 m${num(60)} / ${num(200)}`);
    expect(cells[6]!.textContent).toBe(`4,2 m${num(773)} / ${num(2450)}`);
    const summary = text(el);
    expect(summary).toContain(`${t('sizesSet')} 1,7 m`);
    expect(summary).toContain(t('sizesModel'));
  });
  it('picks out the set size in the grid, in English too, and draws again when the size or the language changes', () => {
    setLang('en');
    let diameter = 2.4;
    const section = new SizesSection(() => diameter);
    const el = section.build() as unknown as FakeElement;
    el.open = true;
    section.tick();
    const highlighted = () => el.find('.readout').filter((c) => c.attrs.get('style') === 'border-color:var(--copper)');
    expect(highlighted().map((c) => c.find('span')[0]!.textContent)).toEqual(['2.4 m']);
    expect(text(el)).toContain('Size set 2.4 m');
    diameter = 3.6;
    section.tick();
    expect(highlighted().map((c) => c.find('span')[0]!.textContent)).toEqual(['3.6 m']);
    expect(text(el)).toContain('Size set 3.6 m');
    setLang('fr');
    section.tick();
    expect(text(el)).toContain('Taille réglée 3,6 m');
    expect(text(el)).not.toContain('undefined');
    expect(text(el)).not.toContain('NaN');
  });
  it('is rebuilt with the language but stays open once the visitor has opened it', () => {
    setLang('fr');
    const section = new SizesSection(() => 1.2);
    const first = section.build() as unknown as FakeElement;
    first.open = true;
    setLang('en');
    const second = section.build() as unknown as FakeElement;
    expect(second.open).toBe(true);
    expect(second.find('summary')[0]!.textContent).toBe('Sizes');
  });
});
