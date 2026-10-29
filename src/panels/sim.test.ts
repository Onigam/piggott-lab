import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { getLang, setLang } from '@onigam/lab-kit/i18n';
import type { AppContext } from '@onigam/lab-kit/ui';
import { t, type UiKey } from '../i18n/ui';
import { PiggottSim } from '../sim/engine';
import { PRESET_IDS, SCENARIO_IDS } from '../sim/presets';
import { powerCurve } from '../sim/yield';
import { buildConfig } from '../sim/config';
import { presetParams } from '../sim/presets';
import {
  chainSegments,
  cpChartData,
  liveChartData,
  mainReadouts,
  niceCeil,
  powerChartData,
  PRESET_KEYS,
  SCENARIO_KEYS,
  statusOf,
  weibullChartData,
} from './model';
import { SimPanel } from './sim';
import { FakeElement, installFakeDom } from './test-dom';

// The simulation panel rendered by a stand-in for the DOM: that it builds, what it offers, that it follows the
// simulation and that a click does what it says, in both languages. The wording itself is held by strings.test.ts.

beforeAll(() => installFakeDom());
afterEach(() => setLang('fr'));

interface Fixture {
  sim: PiggottSim;
  panel: SimPanel;
  root: FakeElement;
}

function open(lang: 'fr' | 'en' = 'fr', sim = new PiggottSim(1)): Fixture {
  setLang(lang);
  const ctx = { sim, ui: { scene: 'device' }, gotoScene: () => undefined } as unknown as AppContext<PiggottSim>;
  const panel = new SimPanel(ctx);
  panel.render();
  return { sim, panel, root: panel.el as unknown as FakeElement };
}

const str = (key: UiKey, lang: 'fr' | 'en' = 'fr'): string => {
  const before = getLang();
  setLang(lang);
  const text = t(key);
  setLang(before);
  return text;
};
const button = (root: FakeElement, label: string): FakeElement => {
  const found = root.find('button').find((b) => b.textContent === label);
  if (!found) throw new Error(`no button « ${label} »`);
  return found;
};
const run = (panel: SimPanel, sim: PiggottSim, seconds: number): void => {
  for (let i = 0; i < seconds * 60; i++) {
    sim.step(1 / 60);
    panel.tick(1 / 60);
  }
};

describe('what the panel offers', () => {
  it('opens on the hamlet preset with the three presets, a "custom" entry and one chip per scenario', () => {
    const { root } = open();
    const select = root.find('select')[0];
    const options = select.find('option');
    expect(options.map((o) => o.textContent)).toEqual([...PRESET_IDS.map((id) => str(PRESET_KEYS[id])), str('custom')]);
    const chips = root.find('button.part-chip');
    expect(chips.map((c) => c.textContent)).toEqual(SCENARIO_IDS.map((id) => str(SCENARIO_KEYS[id])));
    expect(SCENARIO_IDS).toHaveLength(11);
  });
  it('has three sections of controls: site, machine, electrics, with the sliders and toggles of the brief, then the closed Sizes section', () => {
    const { root } = open();
    const sections = root.find('details.sim-section');
    expect(sections.map((s) => s.find('summary')[0].textContent)).toEqual([
      str('secSite'),
      str('secMachine'),
      str('secElectric'),
      str('secSizes'),
    ]);
    expect(sections.map((s) => s.open)).toEqual([true, true, true, false]);
    const labels = root.find('label').map((l) => l.textContent);
    for (const key of [
      'meanWind',
      'diameter',
      'mastHeight',
      'obstacleHeight',
      'cableSection',
      'cableLength',
      'turns',
      'tailWeight',
      'batteryConnected',
      'brake',
      'dumpLoad',
      'fixedTail',
    ] as UiKey[]) {
      expect(
        labels.some((l) => l.startsWith(str(key))),
        String(key),
      ).toBe(true);
    }
    expect(root.find('input').filter((i) => i.getAttribute('type') === 'range').length).toBeGreaterThanOrEqual(12);
    expect(root.find('input').filter((i) => i.getAttribute('type') === 'checkbox').length).toBeGreaterThanOrEqual(5);
  });
  it('shows the live readouts and seven charts (the seventh is in the closed Sizes section)', () => {
    const { root } = open();
    const readouts = root.find('.readout').map((r) => r.textContent);
    expect(readouts.length).toBeGreaterThanOrEqual(20);
    for (const key of [
      'liveWind',
      'liveRpm',
      'liveLambda',
      'liveCp',
      'liveRotorPower',
      'liveBatteryPower',
      'liveSoc',
    ] as UiKey[]) {
      expect(
        readouts.some((r) => r.startsWith(str(key))),
        String(key),
      ).toBe(true);
    }
    expect(root.find('canvas')).toHaveLength(7); // six charts and the chart of the Sizes section
  });
  it('shows the yearly yield and the rotor-to-battery chain', () => {
    const { root, sim, panel } = open();
    run(panel, sim, 8);
    const text = root.textContent;
    expect(text).toContain(str('yearlyTitle'));
    expect(text).toContain(str('yearlyEnergy'));
    expect(text).toContain(str('chainTitle'));
    expect(root.find('.loss-bar')).toHaveLength(1);
    expect(root.find('.loss-bar')[0].find('span')).toHaveLength(5);
  });
  it('renders in English too, with the same structure', () => {
    const fr = open('fr').root;
    const en = open('en').root;
    expect(en.find('.readout')).toHaveLength(fr.find('.readout').length);
    expect(en.find('button.part-chip')).toHaveLength(fr.find('button.part-chip').length);
    expect(en.textContent).toContain('Power curve');
    expect(fr.textContent).toContain('Courbe de puissance');
    expect(en.textContent).not.toContain('undefined');
    expect(fr.textContent).not.toContain('undefined');
  });
});

describe('what it does', () => {
  it('a scenario chip loads the scenario and the preset select shows "custom"', () => {
    const { root, sim, panel } = open();
    button(root, str('scenarioStorm')).click();
    expect(sim.params.preset).toBe('custom');
    expect(sim.params.meanWind).toBe(6);
    run(panel, sim, 1);
    expect((panel.el as unknown as FakeElement).find('select')[0].value).toBe('custom');
  });
  it('the preset select loads a preset', () => {
    const { root, sim } = open();
    const select = root.find('select')[0];
    select.value = 'windy-plateau';
    select.dispatch('change', { target: select });
    expect(sim.params.preset).toBe('windy-plateau');
    expect(sim.params.meanWind).toBe(7);
  });
  it('a slider moves a parameter and does not rebuild the panel', () => {
    const { root, sim } = open();
    const slider = root
      .find('label')
      .find((l) => l.textContent.startsWith(str('meanWind')))!
      .find('input')[0];
    slider.value = '9';
    slider.dispatch('input', { target: slider });
    expect(sim.params.meanWind).toBe(9);
    expect(sim.params.preset).toBe('custom');
    expect(
      root
        .find('label')
        .find((l) => l.textContent.startsWith(str('meanWind')))!
        .find('input')[0],
    ).toBe(slider);
  });
  it('a toggle flips a switch: the brake switch closes and the status line says so', () => {
    const { root, sim, panel } = open();
    const toggle = root
      .find('label')
      .find((l) => l.textContent.startsWith(str('brake')))!
      .find('input')[0];
    toggle.checked = true;
    toggle.dispatch('change', { target: toggle });
    expect(sim.params.brake).toBe(true);
    run(panel, sim, 2);
    expect(root.textContent).toContain(str('statusBrake'));
  });
  it('the status line follows the machine: runaway with the battery off, in both languages', () => {
    const sim = new PiggottSim(1);
    sim.set({ weather: false, gusts: 0, meanWind: 8 });
    const { root, panel } = open('en', sim);
    run(panel, sim, 20);
    sim.set({ batteryConnected: false });
    run(panel, sim, 30);
    expect(root.textContent).toContain(str('statusRunaway', 'en'));
    expect(root.find('.callout--warn')).toHaveLength(1);
  });
  it('the controls follow a scripted change: during the wind sweep the wind slider and the readouts move', () => {
    const { root, sim, panel } = open();
    button(root, str('scenarioWindSweep')).click();
    run(panel, sim, 60);
    const slider = root
      .find('label')
      .find((l) => l.textContent.startsWith(str('meanWind')))!
      .find('input')[0];
    expect(Number(slider.value)).toBeGreaterThan(3);
    // the panel follows at 5 Hz: within a fraction of a metre per second of the wind of the script
    expect(Math.abs(Number(slider.value) - sim.params.meanWind)).toBeLessThan(0.1);
  });
  it('the reset button starts again', () => {
    const { root, sim, panel } = open();
    run(panel, sim, 10);
    expect(sim.state.simTime).toBeGreaterThan(5);
    root
      .find('button')
      .find((b) => b.getAttribute('aria-label') === str('reset'))!
      .click();
    expect(sim.state.simTime).toBe(0);
  });
  it('rendering again after every scenario and a minute of life never throws and shows no NaN', () => {
    for (const id of SCENARIO_IDS) {
      const { sim, panel, root } = open('fr', new PiggottSim(2));
      sim.applyScenario(id);
      panel.render();
      run(panel, sim, 20);
      expect(root.textContent, id).not.toContain('NaN');
      expect(root.textContent, id).not.toContain('undefined');
    }
  });
});

describe('what the charts plot', () => {
  const cfg = buildConfig(presetParams('hamlet'));
  const curve = powerCurve(cfg);
  it('the power chart: wind and Betz lines leave through the top, rotor and battery stay, the rated line is flat', () => {
    const d = powerChartData(curve, 200);
    expect(d.yMax).toBeGreaterThanOrEqual(200);
    expect(d.xs[0]).toBe(0);
    expect(d.xs[d.xs.length - 1]).toBe(25);
    expect(Number.isNaN(d.ys.wind[d.ys.wind.length - 1])).toBe(true);
    expect(d.ys.wind[4]).toBeLessThanOrEqual(d.yMax);
    expect(d.ys.betz[10] / d.ys.wind[10]).toBeCloseTo(16 / 27, 6);
    expect(d.ys.rated.every((v) => v === 200)).toBe(true);
    expect(Math.max(...d.ys.battery)).toBeLessThan(Math.max(...d.ys.rotor));
  });
  it('the Cp chart: Betz line at 0.593, peak 0.3 at λ = 7', () => {
    const d = cpChartData();
    expect(d.ys.betz[0]).toBeCloseTo(16 / 27, 9);
    const peak = Math.max(...d.ys.cp);
    expect(peak).toBeCloseTo(0.3, 2);
    expect(d.xs[d.ys.cp.indexOf(peak)]).toBeCloseTo(7, 0);
  });
  it('the live chart counts the time back from now', () => {
    const sim = new PiggottSim(1);
    for (let i = 0; i < 600; i++) sim.step(1 / 60);
    const d = liveChartData(sim.scope);
    expect(d.xs[d.xs.length - 1]).toBe(0);
    expect(d.xs[0]).toBeLessThan(-5);
  });
  it('the Weibull chart: two curves of percentages that each add up to 100', () => {
    const sim = new PiggottSim(1);
    const d = weibullChartData(sim.getYearly());
    expect(d.ys.hours.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6);
    expect(d.ys.energy.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6);
  });
  it('niceCeil rounds an axis up to 1, 2, 2.5, 5 × 10ⁿ', () => {
    expect(niceCeil(0)).toBe(1);
    expect(niceCeil(0.3)).toBe(0.5);
    expect(niceCeil(3)).toBe(5);
    expect(niceCeil(130)).toBe(200);
    expect(niceCeil(210)).toBe(250);
    expect(niceCeil(260)).toBe(500);
  });
  it('the status of a quiet machine, a charging one and a failing one', () => {
    const sim = new PiggottSim(1);
    sim.set({ weather: false, gusts: 0, meanWind: 0.3 });
    sim.reset();
    expect(statusOf(sim.state, sim.params).key).toBe('statusStill');
    sim.set({ meanWind: 8 });
    for (let i = 0; i < 1200; i++) sim.step(1 / 60);
    expect(statusOf(sim.state, sim.params).key).toBe('statusCharging');
    sim.applyScenario('storm-fixed-tail');
    for (let i = 0; i < 200 * 60; i++) sim.step(1 / 60);
    expect(statusOf(sim.state, sim.params).tone).toBe('warn');
  });
  it('the chain bar adds up to the rotor power', () => {
    const sim = new PiggottSim(1);
    sim.set({ weather: false, gusts: 0, meanWind: 9 });
    for (let i = 0; i < 1800; i++) sim.step(1 / 60);
    const total = chainSegments(sim.state).reduce((a, s) => a + s.watts, 0);
    expect(total).toBeCloseTo(sim.state.rotorPower, 3);
    expect(mainReadouts(sim.state, 'rpm')).toHaveLength(9);
  });
});
