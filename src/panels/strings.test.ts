import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import { LAB_STRINGS, num, t, type UiKey } from '../i18n/ui';
import { installFakeDom } from './test-dom';

// The lab's interface strings: French and English written together, same detail, no placeholder, and no number in a text
// that does not come from docs/research.md or docs/physics.md.

beforeAll(() => installFakeDom()); // setLang writes the language on the document element
afterEach(() => setLang('fr'));

const entries = Object.entries(LAB_STRINGS);
/** The numbers of a text, decimal commas read as points: "3,5 m/s" and "3.5 m/s" give the same list. */
const numbers = (s: string): string[] => (s.replace(/(\d),(\d)/g, '$1.$2').match(/\d+(\.\d+)?/g) ?? []).sort();

/**
 * Every number a text may contain, with its source. K-numbers (K1…K25) are checked apart.
 * 3.5, 5, 7: the presets (research §5); 1, 20: the wind sweep of the scenario; 60, 600, 3600: the time speeds of the strip;
 * 200: K2; 20: the 20 A switch (research §3); 14 and 11.5: K22; 2: Rayleigh; 1.0, 4.2: K3; 76, 1.4, 12: K7; 24: K9 (the 24 V stator); 10: K12; 38, 500, 6, 30: K21;
 * 59: Betz 16/27 (K15); 7: λ (K16); 100, 300: K25.
 */
const ALLOWED = new Set([
  '1',
  '2',
  '3.5',
  '5',
  '6',
  '7',
  '10',
  '11.5',
  '12',
  '14',
  '20',
  '24',
  '30',
  '38',
  '59',
  '60',
  '76',
  '100',
  '200',
  '300',
  '500',
  '600',
  '1.0',
  '1.4',
  '4.2',
  '3600',
]);

describe('interface strings', () => {
  it('there are strings to check', () => {
    expect(entries.length).toBeGreaterThan(120);
  });
  it('every string exists in both languages, non-empty, with no placeholder', () => {
    for (const [key, [fr, en]] of entries) {
      expect(fr.trim().length, `${key} fr`).toBeGreaterThan(0);
      expect(en.trim().length, `${key} en`).toBeGreaterThan(0);
      for (const text of [fr, en]) expect(text, key).not.toMatch(/TODO|FIXME|lorem|xxx|undefined|\[\[|\{\{/i);
    }
  });
  it('French and English carry the same numbers and the same K-references', () => {
    for (const [key, [fr, en]] of entries) {
      expect(numbers(fr), key).toEqual(numbers(en));
      expect(fr.match(/\bK\d+\b/g) ?? [], key).toEqual(en.match(/\bK\d+\b/g) ?? []);
    }
  });
  it('French and English have the same level of detail: a long text is never more than twice as long as its translation', () => {
    for (const [key, [fr, en]] of entries) {
      if (fr.length < 40 && en.length < 40) continue;
      expect(fr.length / en.length, key).toBeGreaterThan(0.6);
      expect(fr.length / en.length, key).toBeLessThan(1.7);
    }
  });
  it('only translated where it matters: the same text in both languages is a unit, a name or a single word', () => {
    for (const [key, [fr, en]] of entries) {
      if (fr === en) expect(fr.split(/\s+/).length, `${key}: ${fr}`).toBeLessThanOrEqual(2);
    }
  });
  it('no number in a text but those of the research (K-numbers 1 to 25 and the figures listed in this test)', () => {
    for (const [key, [, en]] of entries) {
      const text = en.replace(/\bK\d+\b/g, '').replace(/\bA3\b|\b3D\b/g, '');
      for (const n of numbers(text)) expect(ALLOWED.has(n), `${key}: ${n} in « ${en} »`).toBe(true);
      for (const k of en.match(/\bK(\d+)\b/g) ?? []) {
        const n = Number(k.slice(1));
        expect(n >= 1 && n <= 25, `${key}: ${k}`).toBe(true);
      }
    }
  });
  it('the typographic spaces of French are the kit’s: a colon is followed by a space', () => {
    setLang('fr');
    for (const [key] of entries) {
      const text = t(key as UiKey);
      expect(text, key).not.toMatch(/:\S/);
    }
  });
});

describe('num', () => {
  it('writes the decimal separator of the language', () => {
    setLang('fr');
    expect(num(7.5, 1)).toBe('7,5');
    setLang('en');
    expect(num(7.5, 1)).toBe('7.5');
    expect(num(Number.NaN)).toBe('—');
    expect(num(-0.001, 1)).toBe('0.0');
  });
});
