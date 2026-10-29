import { lazyModule } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { PiggottState } from '../sim/types';
import { createAlternatorScene as buildAlternatorScene } from './alternator/scene';
import { createBladesScene as buildBladesScene } from './blades/scene';
import { createSiteScene } from './site/scene';
import { createTurbineScene as buildTurbineScene } from './turbine/scene';

// The four worlds. `site` is the default world and is built at once; the three detailed worlds are `lazyModule`s: nothing is
// built until the visitor goes there (or something reads the module), so the start-up stays light. Use the result as the
// `module` of the `SceneDef`.

export { createSiteScene };
export const createTurbineScene = (): SceneModule<PiggottState> =>
  lazyModule<PiggottState>('turbine', () => buildTurbineScene());
export const createAlternatorScene = (): SceneModule<PiggottState> =>
  lazyModule<PiggottState>('alternator', () => buildAlternatorScene());
export const createBladesScene = (): SceneModule<PiggottState> =>
  lazyModule<PiggottState>('blades', () => buildBladesScene());
