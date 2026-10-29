// The frozen part ids of every world, with their category (docs/research.md §4). THE CONTRACT between the roles: the
// catalogue (src/data/parts/*), the 3D registries (src/three/*), the guides, the lessons and the drawings all use these
// ids. Only the lead edits this file; a role that thinks an id is missing or wrong reports it, it never adds one.
import type { PartCategory } from '@onigam/lab-kit/content';

export type WorldId = 'site' | 'turbine' | 'alternator' | 'blades';

export const PART_CATEGORIES: Record<WorldId, Record<string, PartCategory>> = {
  // the field: the mast with its guys, the cable run to the battery shed, the house, the trees; the machine on top of the
  // mast is ONE part (`wind-turbine`) that opens the `turbine` world
  site: {
    'wind-turbine': 'mechanical',
    tower: 'structure',
    'guy-wires': 'structure',
    'tower-base': 'structure',
    'cable-run': 'electrical',
    'brake-switch': 'electrical',
    rectifier: 'electrical',
    fuse: 'electrical',
    'charge-controller': 'electrical',
    'dump-load': 'electrical',
    'battery-bank': 'electrical',
    house: 'site',
    obstacles: 'site',
  },
  // the whole machine on the mast top; `rotor` opens the `blades` world and `alternator` the `alternator` world
  turbine: {
    rotor: 'mechanical',
    alternator: 'electrical',
    'nacelle-frame': 'structure',
    'yaw-bearing': 'mechanical',
    'tail-hinge': 'mechanical',
    'tail-boom': 'mechanical',
    'tail-vane': 'mechanical',
    'wire-loop': 'electrical',
  },
  // the axial-flux alternator, in section and exploded (reached from `alternator`); the 1.2 m machine of the video (wiki S3)
  // has ONE magnet rotor; FIXED: `shaft` = the car-hub stub axle screwed on the cradle, `stator` hung on the cradle by the 3
  // `studs`; TURNING: `bearing-hub` (hub bell, bearings, the 4 long rotor rods) with `magnet-rotor` and `magnets`;
  // `air-gap` is shown as a gauge, `moulds` are the workshop tools of the resin casting
  alternator: {
    'magnet-rotor': 'mechanical',
    magnets: 'electrical',
    stator: 'electrical',
    coils: 'electrical',
    'star-wiring': 'electrical',
    shaft: 'mechanical',
    'bearing-hub': 'mechanical',
    studs: 'mechanical',
    'air-gap': 'electrical',
    moulds: 'structure',
  },
  // the carving of the blades and the hub (reached from `rotor`); the faces, the root and the tip of a blade are labels
  // (minor hotspots) and part-sheet text of `blade`, not parts
  blades: {
    'blade-blank': 'mechanical',
    'station-templates': 'mechanical',
    blade: 'mechanical',
    'hub-disc': 'mechanical',
  },
};

export const WORLDS = Object.keys(PART_CATEGORIES) as WorldId[];

/** Ids of one world, in catalogue order. */
export const partIds = (world: WorldId): string[] => Object.keys(PART_CATEGORIES[world]);
