import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { partIds } from '../../part-ids';
import { finiteTree, isolateOne, sceneBoxes, stateWith, view } from '../test-utils';
import { EXPLODE, LABEL_TOP, createShedScene } from './scene';

// The `shed` world by script: ids, the devices in the order of the current, the lamps and the lever, the dots of current,
// explode, NaN-free animation over the range of the state.

const IDS = partIds('shed');

describe('shed world (the technical room)', () => {
  const mod = createShedScene();
  const reg = mod.registry;
  const go = (over = {}, v = {}, frames = 2) => {
    const s = stateWith(over);
    for (let i = 0; i < frames; i++) mod.update(s, 1 / 60, view(v));
    mod.scene.updateMatrixWorld(true);
    return s;
  };

  it('registers exactly the six frozen ids, each with meshes of its own, and a label on each', () => {
    go();
    expect([...reg.ids()].sort()).toEqual([...IDS].sort());
    for (const id of IDS) expect(reg.get(id)!.meshes.length, id).toBeGreaterThan(0);
    expect(mod.hotspots.map((h) => h.partId).sort()).toEqual([...IDS].sort());
    expect(mod.hotspots.every((h) => !h.minor)).toBe(true);
    for (const h of mod.hotspots) {
      let o: THREE.Object3D | null = h.anchor;
      while (o && o !== mod.scene) o = o.parent;
      expect(o, h.partId).toBe(mod.scene);
    }
  });

  it('keeps room over the top labels in what the overview fits, and nothing there to click', () => {
    go();
    reg.setAllFactors(0);
    const top = Math.max(...IDS.map((id) => reg.bounds(id).max.y));
    expect(top).toBeGreaterThanOrEqual(LABEL_TOP + 0.1);
    // the point that gives the room is invisible and a ray goes through it
    const pad = reg
      .get('brake-switch')!
      .object.children.filter((o): o is THREE.Points => o instanceof THREE.Points && !o.visible);
    expect(pad).toHaveLength(1);
    const ray = new THREE.Raycaster();
    ray.params.Points = { threshold: 50 };
    ray.set(new THREE.Vector3(0, LABEL_TOP + 0.16, 5), new THREE.Vector3(0, 0, -1));
    const hits: THREE.Intersection[] = [];
    pad[0]!.raycast(ray, hits);
    expect(hits).toEqual([]);
  });

  it('puts the devices on the board in the order of the current, and the battery on the floor in front of it', () => {
    go();
    reg.setAllFactors(0);
    const b = sceneBoxes(mod);
    const x = (id: string) => (b.get(id)!.min.x + b.get(id)!.max.x) / 2;
    const order = ['brake-switch', 'rectifier', 'fuse', 'charge-controller', 'dump-load'];
    for (let i = 1; i < order.length; i++) expect(x(order[i]!), order[i]).toBeGreaterThan(x(order[i - 1]!));
    expect(b.get('brake-switch')!.min.y).toBeGreaterThan(1);
    expect(b.get('battery-bank')!.min.y).toBeLessThan(0.2);
    expect(b.get('battery-bank')!.max.z).toBeGreaterThan(b.get('brake-switch')!.max.z);
  });

  it('lights what the state says: brake lever, LEDs, glowing dump load, charge bar', () => {
    const sh = mod.shed;
    go({ brake: false });
    const up = sh.lever.rotation.x;
    go({ brake: true });
    expect(sh.lever.rotation.x).toBeGreaterThan(up + 0.5);
    go({ dumpActive: false, dumpPower: 0 });
    expect(sh.glow.emissiveIntensity).toBe(0);
    go({ dumpActive: true, dumpPower: 150 });
    expect(sh.glow.emissiveIntensity).toBeGreaterThan(1);
    for (const [soc, lit] of [
      [0, 0],
      [0.55, 6],
      [1, 10],
    ] as const) {
      go({ soc });
      expect(sh.segments.filter((m) => m.emissiveIntensity > 1).length).toBe(lit);
    }
  });

  it('moves the current dots in proportion to the current, and only in the Flux view', () => {
    go({}, { schematic: false });
    expect(mod.flows.object.visible).toBe(false);
    const first = () => new THREE.Vector3().fromBufferAttribute(mod.flows.object.geometry.attributes.position, 1);
    const move = (amps: number) => {
      go({ dcCurrent: amps, brake: false }, { schematic: true }, 1);
      const a = first();
      mod.update(stateWith({ dcCurrent: amps, brake: false }), 0.05, view({ schematic: true }));
      return a.distanceTo(first());
    };
    const d10 = move(10);
    expect(mod.flows.object.visible).toBe(true);
    expect(d10).toBeGreaterThan(0.1);
    expect(move(20) / d10).toBeCloseTo(2, 1);
    expect(move(0)).toBeCloseTo(0, 9);
    go({}, { schematic: false });
  });

  it('explodes every device by its own offset, towards the viewer', () => {
    go();
    reg.setAllFactors(0);
    const before = sceneBoxes(mod);
    reg.setAllFactors(1);
    go({}, {}, 400);
    const after = sceneBoxes(mod);
    reg.setAllFactors(0);
    for (const id of IDS) {
      const e = EXPLODE[id as keyof typeof EXPLODE];
      expect(e[2], id).toBeGreaterThan(0);
      expect(after.get(id)!.min.y - before.get(id)!.min.y, id).toBeCloseTo(e[1], 4);
      expect(after.get(id)!.min.z - before.get(id)!.min.z, id).toBeCloseTo(e[2], 4);
    }
    go({}, {}, 400);
  });

  it('animates the whole range of the state and isolates every part without NaN', () => {
    for (const c of [
      { soc: 0, brake: true, dumpActive: false },
      { soc: 1, dumpActive: true, dumpPower: 400, batteryFull: true, dcCurrent: 40 },
      { lvdOpen: true, loadPower: 0, busPower: 0 },
    ])
      for (const v of [{}, { schematic: true }, { slowMo: 0.02 }]) {
        go(c, v, 3);
        expect(finiteTree(mod.scene)).toBe(true);
      }
    for (const id of IDS)
      for (const mode of ['hidden', 'ghost'] as const) {
        isolateOne(reg, id, mode);
        go();
        expect(reg.get(id)!.meshes.every((m) => m.visible)).toBe(true);
      }
    reg.setAllDisplay('solid');
  });
});
