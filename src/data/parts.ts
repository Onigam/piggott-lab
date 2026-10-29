import type { PartInfo } from '@onigam/lab-kit/content';
import { ALTERNATOR_PARTS } from './parts/alternator';
import { BLADES_PARTS } from './parts/blades';
import { SHED_PARTS } from './parts/shed';
import { SITE_PARTS } from './parts/site';
import { TURBINE_PARTS } from './parts/turbine';

// The parts catalogue: one entry per selectable 3D part, one file per world in ./parts, in the catalogue order of
// src/part-ids.ts (the ids are frozen there; a test checks that ids, scenes and categories agree with it).
export const PARTS: PartInfo[] = [...SITE_PARTS, ...TURBINE_PARTS, ...ALTERNATOR_PARTS, ...BLADES_PARTS, ...SHED_PARTS];
