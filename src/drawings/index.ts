import type { DrawingSheet } from '@onigam/lab-kit/drawings';
import { generalArrangement } from './pl01-general';
import { bladeCarving } from './pl02-blade';
import { furlingGeometry } from './pl03-furling';
import { alternatorSection } from './pl04-alternator';
import { statorWinding } from './pl05-winding';
import { towerGuys } from './pl06-tower';
import { electricalSchematic } from './pl07-electrical';
import { powerBySize } from './pl08-sizes';

/** Every drawing of the "Plans" mode, in reading order. */
export const SHEETS: DrawingSheet[] = [
  generalArrangement,
  bladeCarving,
  furlingGeometry,
  alternatorSection,
  statorWinding,
  towerGuys,
  electricalSchematic,
  powerBySize,
];
