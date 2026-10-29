import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { partIds } from '../../part-ids';
import { DIAMETER_REF } from '../../sim/machine';
import { HEAD_Y, MAST } from '../dims';
import { finiteTree, floating, isolateOne, sceneBoxes, stateWith, view } from '../test-utils';
import { EXPLODE, createSiteScene } from './scene';

// The `site` world by script: ids, the field at the size the state says (mast, trees, rotor), the wind sock, the lamps of the
// shed and of the house, the current dots, floating parts, explode, NaN-free animation over the whole range of the state.

const IDS = partIds('site');

describe('site world', () => {
  const mod = createSiteScene();
  const reg = mod.registry;
  const go = (over = {}, v = {}, frames = 2) => {
    const s = stateWith(over);
    for (let i = 0; i < frames; i++) mod.update(s, 1 / 60, view(v));
    mod.scene.updateMatrixWorld(true);
    return s;
  };

  it('registers exactly the eight frozen ids, each with meshes of its own', () => {
    go();
    expect([...reg.ids()].sort()).toEqual([...IDS].sort());
    for (const id of IDS) expect(reg.get(id)!.meshes.length, id).toBeGreaterThan(0);
  });

  it('has hotspots for every part (four main labels); the machine on the mast opens the turbine world, the shed the technical room', () => {
    expect(mod.hotspots.map((h) => h.partId).sort()).toEqual([...IDS].sort());
    expect(mod.hotspots.filter((h) => !h.minor).map((h) => h.partId)).toEqual([
      'wind-turbine',
      'tower',
      'technical-room',
      'house',
    ]);
    expect(mod.hotspots.find((h) => h.partId === 'wind-turbine')!.goto).toBe('turbine');
    expect(mod.hotspots.find((h) => h.partId === 'technical-room')!.goto).toBe('shed');
    mod.scene.updateMatrixWorld(true);
    for (const h of mod.hotspots) {
      let o: THREE.Object3D | null = h.anchor;
      while (o && o !== mod.scene) o = o.parent;
      expect(o, h.partId).toBe(mod.scene);
    }
  });

  it('has no floating part: the mast stands on its hinged base, the machine on the mast, the rest on the ground or the board', () => {
    go({ mastHeight: 12, obstacleHeight: 5, diameter: 1.2 });
    reg.setAllFactors(0);
    const ground = new THREE.Box3(new THREE.Vector3(-300, -1, -300), new THREE.Vector3(300, 0.03, 300));
    expect(floating(sceneBoxes(mod), 0.01, [ground])).toEqual([]);
    const b = sceneBoxes(mod);
    expect(b.get('tower')!.min.y).toBeLessThan(0.35);
    expect(b.get('tower')!.max.y).toBeGreaterThan(b.get('wind-turbine')!.min.y - 0.01);
  });

  it('draws the mast, the machine and the trees at the size of the state', () => {
    for (const [hub, d, trees] of [
      [6, 1.0, 3],
      [12, 1.2, 5],
      [18, 2.4, 8],
      [24, 4.2, 15],
    ]) {
      go({ mastHeight: hub, diameter: d, obstacleHeight: trees });
      const s = d / DIAMETER_REF;
      const t = reg.bounds('wind-turbine');
      // the rotor disc is the diameter of the state, centred on the hub height
      expect(t.max.y - hub).toBeCloseTo(d / 2, 0);
      expect(t.max.z - t.min.z).toBeGreaterThan(d * 0.95);
      // the mast ends under the cap of the yaw bearing
      expect(reg.bounds('tower').max.y).toBeCloseTo(hub + (HEAD_Y.capTop - 0.006) * s, 3);
      expect(mod.drawn.hub).toBe(hub);
      // trees: as tall as the state says (each one 0.7 to 1.1 of it)
      const o = reg.bounds('obstacles');
      expect(o.max.y).toBeGreaterThan(0.7 * trees);
      expect(o.max.y).toBeLessThan(1.25 * trees);
      // guys: a level every 4 m below the top one
      expect(mod.drawn.guyLevels).toBe(Math.ceil((hub + (HEAD_Y.capTop - 0.006) * s - 1.5) / MAST.guySpacing) - 1 + 1);
    }
    go({ obstacleHeight: 0 });
    expect(mod.drawn.trees).toBe(0);
    const o = reg.bounds('obstacles');
    expect(o.isEmpty() || o.max.y < 1).toBe(true);
    go({ mastHeight: 12, diameter: 1.2, obstacleHeight: 5 });
  });

  it('keeps the wind sock pointing downwind (+X) whatever the speed, higher in a stronger wind', () => {
    go({ windMean: 0.5 });
    const calm = new THREE.Box3().setFromObject(mod.sock);
    go({ windMean: 9 });
    const wind = new THREE.Box3().setFromObject(mod.sock);
    const pole = mod.sock.parent!.position.x;
    for (const b of [calm, wind]) expect((b.min.x + b.max.x) / 2).toBeGreaterThan(pole - 0.01);
    expect(wind.max.x - wind.min.x).toBeGreaterThan(calm.max.x - calm.min.x);
    expect(wind.min.y).toBeGreaterThan(calm.min.y);
  });

  it('lights what the state says: brake lever, LEDs, glowing dump load, charge bar, windows of the house', () => {
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
    go({ loadPower: 40, lvdOpen: false });
    expect(mod.house.panes.emissiveIntensity).toBeGreaterThan(0.8);
    go({ loadPower: 40, lvdOpen: true });
    expect(mod.house.panes.emissiveIntensity).toBe(0);
    go({ loadPower: 0, lvdOpen: false });
    expect(mod.house.panes.emissiveIntensity).toBe(0);
  });

  it('moves the current dots in proportion to the current, and only in the Flux view', () => {
    go({}, { schematic: false });
    expect(mod.flows.object.visible).toBe(false);
    const first = () => {
      const p = mod.flows.object.geometry.attributes.position;
      return new THREE.Vector3().fromBufferAttribute(p, 1);
    };
    const move = (amps: number) => {
      go({ dcCurrent: amps, brake: false }, { schematic: true }, 1);
      const a = first();
      mod.update(stateWith({ dcCurrent: amps, brake: false }), 0.05, view({ schematic: true }));
      return a.distanceTo(first());
    };
    const d10 = move(10);
    expect(mod.flows.object.visible).toBe(true);
    const d20 = move(20);
    expect(d10).toBeGreaterThan(0.1);
    expect(d20 / d10).toBeCloseTo(2, 1);
    expect(move(0)).toBeCloseTo(0, 9);
    go({}, { schematic: false });
  });

  it('explodes every part by its own offset', () => {
    go();
    reg.setAllFactors(0);
    const before = sceneBoxes(mod);
    for (const id of IDS) expect(reg.get(id)!.explode.length(), id).toBeGreaterThan(0);
    reg.setAllFactors(1);
    go({}, {}, 400);
    const after = sceneBoxes(mod);
    reg.setAllFactors(0);
    for (const id of IDS) {
      const e = EXPLODE[id];
      expect(after.get(id)!.min.y - before.get(id)!.min.y, id).toBeCloseTo(e[1], 4);
    }
    go({}, {}, 400);
  });

  it('animates the whole range of the state and isolates every part without NaN', () => {
    const cases = [
      { mastHeight: 3, diameter: 1.0, obstacleHeight: 0 },
      {
        mastHeight: 24,
        diameter: 4.2,
        obstacleHeight: 15,
        yaw: 85,
        tailSwing: 95,
        rotorBlur: 1,
        hour: 0,
        soc: 1,
        runaway: true,
      },
      {
        mastHeight: 12,
        yaw: 5,
        tailSwing: 0,
        rotorBlur: 0.4,
        hour: 12.5,
        dcCurrent: 40,
        brake: true,
        lvdOpen: true,
        batteryFull: true,
      },
      { mastHeight: 18, diameter: 2.4, obstacleHeight: 8, hour: 21.9, windMean: 25, wind: 40 },
    ];
    for (const c of cases)
      for (const v of [{}, { schematic: true }, { slowMo: 0.02 }]) {
        go(c, v, 3);
        expect(finiteTree(mod.scene)).toBe(true);
        for (const id of IDS) expect(Number.isFinite(reg.bounds(id).min.x) || reg.bounds(id).isEmpty(), id).toBe(true);
      }
    for (const id of IDS)
      for (const mode of ['hidden', 'ghost'] as const) {
        isolateOne(reg, id, mode);
        go({ yaw: 30, tailSwing: 40 });
        expect(reg.get(id)!.meshes.every((m) => m.visible)).toBe(true);
      }
    reg.setAllDisplay('solid');
  });
});
