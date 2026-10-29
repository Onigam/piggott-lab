// Numbers of the sheets: every length is read from the single source of dimensions (src/three/dims.ts, metres) or from
// src/sim/machine.ts, converted to millimetres here, and carries its status so that the sheets can mark it. Nothing is retyped.
import { l, type L } from '@onigam/lab-kit/i18n';
import { mm as mmText, nEn, nFr } from '../data/units';
import {
  BLADE,
  CABLE,
  CRADLE,
  HEAD,
  HUB,
  HUB_DISC,
  M12,
  MAGNET,
  MAST,
  NACELLE,
  ROTOR_DISC,
  ROTOR_RODS,
  SHAFT,
  SHED,
  STACK,
  STATOR,
  STATOR_RODS,
  TAIL,
  YAW,
} from '../three/dims';

// ------------------------------------------------------------------------------------------------ units and status

/** Metres to millimetres, exact (what the sheets draw). */
export const k = (m: number): number => m * 1000;
/** Metres to millimetres, to the tenth (what the sheets print). */
export const mm = (m: number): number => Math.round(m * 1e4) / 10;

/**
 * What a sheet prints after a dimension: reported by a source (no mark), derived from reported figures only (†), or an
 * estimate (*). A value computed from an estimate is an estimate: no source gives it.
 */
export type Status = 'R' | 'D' | 'E';
export const MARK: Record<Status, string> = { R: '', D: '†', E: '*' };

/** The sections of dims.ts the sheets read. */
const SECTIONS = {
  BLADE,
  CABLE,
  CRADLE,
  HEAD,
  HUB,
  HUB_DISC,
  M12,
  MAGNET,
  MAST,
  NACELLE,
  ROTOR_DISC,
  ROTOR_RODS,
  SHAFT,
  SHED,
  STACK,
  STATOR,
  STATOR_RODS,
  TAIL,
  YAW,
} as const;
type Sections = typeof SECTIONS;
type NumKey<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T] & string;

/**
 * Dimensions of dims.ts that are NOT estimates: reported (R) or derived (D). Every other constant is an estimate. The test
 * (drawings.test.ts) reads the JSDoc of dims.ts and fails when a mark here is higher than what the source says.
 */
export const STATUS: Record<string, Status> = {
  'BLADE.length': 'R',
  'BLADE.rootWidth': 'D',
  'BLADE.rootThickness': 'D',
  'BLADE.rootAngleDeg': 'R',
  'ROTOR_DISC.diameter': 'R',
  'ROTOR_DISC.thickness': 'R',
  'ROTOR_DISC.castingDiameter': 'R',
  'ROTOR_DISC.boltCircleDiameter': 'R',
  'MAGNET.length': 'R',
  'MAGNET.width': 'R',
  'MAGNET.thickness': 'R',
  'STATOR.outer': 'R',
  'STATOR.thickness': 'R',
  'STATOR.coilHoleLength': 'R',
  'STATOR.coilHoleWidth': 'R',
  'STATOR.coilOutlineLength': 'R',
  'STATOR.coilOutlineWidth': 'R',
  'STATOR_RODS.length': 'R',
  'STATOR_RODS.diameter': 'R',
  'STATOR_RODS.slot': 'R',
  'ROTOR_RODS.length': 'R',
  'ROTOR_RODS.diameter': 'R',
  'CRADLE.diameter': 'R',
  'CRADLE.thickness': 'R',
  'NACELLE.leg': 'R',
  'NACELLE.thickness': 'R',
  'NACELLE.length': 'R',
  'HEAD.offset': 'R',
  'YAW.pipeOuter': 'R',
  'YAW.pipeLength': 'R',
  'YAW.stubOuter': 'R',
  'TAIL.tiltDeg': 'R',
  'TAIL.planDeg': 'R',
  'TAIL.restDeg': 'R',
  'TAIL.swingDeg': 'R',
  'TAIL.boomOuter': 'R',
  'TAIL.boomLength': 'R',
  'TAIL.barLength': 'R',
  'TAIL.barWidth': 'R',
  'TAIL.vaneLength': 'D',
  'TAIL.vaneHeight': 'D',
  'TAIL.innerLength': 'R',
  'TAIL.sleeveLength': 'R',
  'TAIL.sleeveOuter': 'R',
  'MAST.pipeOuter': 'R',
  'MAST.guySpacing': 'R',
};

/**
 * Constants whose JSDoc in dims.ts says "reported" for a whole group but which a sheet prints as estimates (*): a value of the
 * group that the same comment calls an estimate. `STATUS` stays the faithful copy that the test checks.
 */
export const MARKED_ESTIMATE = new Set<string>(['STATOR_RODS.diameter']);

/** Ids of the dims.ts constants the sheets have asked for (the test checks their marks against the JSDoc). */
export const USED = new Set<string>();

/** A length of dims.ts: metres, millimetres to the tenth and status. */
export interface Dim {
  m: number;
  mm: number;
  status: Status;
}

export function dim<S extends keyof Sections>(section: S, key: NumKey<Sections[S]>): Dim {
  const m = (SECTIONS[section] as unknown as Record<string, number>)[key] as number;
  const id = `${section}.${key}`;
  USED.add(id);
  return { m, mm: mm(m), status: MARKED_ESTIMATE.has(id) ? 'E' : (STATUS[id] ?? 'E') };
}

// ------------------------------------------------------------------------------------------------ labels

/** Concatenation of bilingual pieces (plain strings stay as they are in both languages). */
export function cat(...parts: (string | L)[]): L {
  return l(
    parts.map((x) => (typeof x === 'string' ? x : x.fr)).join(''),
    parts.map((x) => (typeof x === 'string' ? x : x.en)).join(''),
  );
}

/** Bilingual label of a length in mm with the decimal sign of each language, a prefix (Ø, R, M), a suffix and the mark. */
export function lab(valueMm: number, status: Status, prefix = '', suffix = ''): L {
  const t = mmText(valueMm / 1000);
  return l(`${prefix}${t.fr}${suffix}${MARK[status]}`, `${prefix}${t.en}${suffix}${MARK[status]}`);
}

/** Label of a number with `digits` decimals in each language, a unit suffix and the mark. */
export function labN(value: number, digits: number, status: Status, prefix = '', suffix = ''): L {
  return l(
    `${prefix}${nFr(value, digits)}${suffix}${MARK[status]}`,
    `${prefix}${nEn(value, digits)}${suffix}${MARK[status]}`,
  );
}

/** Label of a dims.ts length (`times` 2 turns a radius into a diameter). */
export const labOf = (d: Dim, prefix = '', times = 1, suffix = ''): L => lab(d.mm * times, d.status, prefix, suffix);

/** A plain number in both languages: 7,5 / 7.5. */
export const num = (v: number, digits = 0): L => l(nFr(v, digits), nEn(v, digits));

export const DEG = Math.PI / 180;
