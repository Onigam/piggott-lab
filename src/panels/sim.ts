import {
  fill,
  h,
  icon,
  ICONS,
  LineChart,
  SERIES_COLORS,
  section as kitSection,
  slider as kitSlider,
  toggle as kitToggle,
  type AppContext,
  type PanelController,
} from '@onigam/lab-kit/ui';
import { num, t, type UiKey } from '../i18n/ui';
import type { PiggottSim } from '../sim/engine';
import { PRESET_IDS, RANGES, SCENARIO_IDS, type RangedKey } from '../sim/presets';
import { nameplate, type CurvePoint, type YearlyYield } from '../sim/yield';
import type { PiggottParams, PresetId, ScenarioId } from '../sim/types';
import {
  chainSegments,
  cpChartData,
  liveChartData,
  mainReadouts,
  moreReadouts,
  powerChartData,
  PRESET_KEYS,
  SCENARIO_KEYS,
  statusOf,
  weibullChartData,
  type Readout,
} from './model';

// Simulation mode: presets and scenarios, the live readouts, the chain of power from rotor to battery, grouped controls
// and charts (power curve, Cp(λ), the last minute, the Weibull year). Built only from the kit's widgets and charts.

type ChartOpts = ConstructorParameters<typeof LineChart>[0];

/** Real seconds the machine and the site must stay unchanged before the curves and the yearly yield are recomputed. */
const CURVE_DELAY = 0.35;

/** The parameters the curves depend on (everything but the switches and the time controls). */
const curveKey = (p: PiggottParams): string =>
  JSON.stringify([
    p.diameter,
    p.turns,
    p.tailWeight,
    p.fixedTail,
    p.cableLength,
    p.cableSection,
    p.altitude,
    p.batteryAh,
    p.meanWind,
    p.weibullK,
    p.mastHeight,
    p.obstacleHeight,
    p.gusts,
  ]);

/** A control the panel keeps in step with the simulation (a scenario can flip a switch or move the wind by itself). */
interface Control {
  key: keyof PiggottParams;
  el: HTMLElement;
  kind: 'slider' | 'toggle';
  fmt?: (v: number) => string;
}

export class SimPanel implements PanelController {
  readonly el = h('div', { class: 'sim' });
  private presetSelect: HTMLSelectElement | null = null;
  private status = h('div', {});
  private readouts = h('div', { class: 'readouts' });
  private more = h('div', { class: 'readouts' });
  private chain = h('div', { class: 'losses' });
  private yearly = h('div', { class: 'readouts' });
  private computing = h('p', { class: 'hint' });
  private controls: Control[] = [];

  private powerOpts: ChartOpts;
  private powerChart: LineChart;
  private cpChart: LineChart;
  private windChart: LineChart;
  private rpmChart: LineChart;
  private liveChart: LineChart;
  private weibullChart: LineChart;

  private lastReadouts = 0;
  private lastCharts = 0;
  private lastScope = 0;
  private key = '';
  private wait = 0;
  private jobs: ('curve' | 'yearly' | 'onset')[] = [];
  private curve: CurvePoint[] = [];
  private yearlyData: YearlyYield | null = null;
  private onset = Infinity;

  constructor(private ctx: AppContext<PiggottSim>) {
    const sim = () => this.ctx.sim;
    const seconds = (v: number) => (v === 0 ? '0' : `${num(v)} s`);
    this.powerOpts = {
      height: 180,
      series: [
        { key: 'wind', label: () => t('seriesWindPower'), color: SERIES_COLORS.pv },
        { key: 'betz', label: () => t('seriesBetz'), color: SERIES_COLORS.pv, dash: true },
        { key: 'rotor', label: () => t('seriesRotor'), color: SERIES_COLORS.load },
        { key: 'battery', label: () => t('seriesBattery'), color: SERIES_COLORS.hydro, bold: true },
        { key: 'rated', label: () => t('seriesRated'), color: SERIES_COLORS.dump, dash: true },
      ],
      yMax: 250,
      yFmt: (v) => num(v),
      xFmt: (v) => `${num(v)} m/s`,
      markers: () => {
        const s = sim().state;
        return [{ x: s.wind, y: s.busPower, label: `${num(s.busPower)} W`, color: SERIES_COLORS.hydro }];
      },
    };
    this.powerChart = new LineChart(this.powerOpts);
    this.cpChart = new LineChart({
      height: 130,
      series: [
        { key: 'cp', label: () => t('seriesCp'), color: SERIES_COLORS.load, bold: true },
        { key: 'betz', label: () => t('seriesBetzCp'), color: SERIES_COLORS.pv, dash: true },
      ],
      yMax: 0.6,
      yFmt: (v) => num(v, 1),
      xFmt: (v) => `λ ${num(v)}`,
      markers: () => {
        const s = sim().state;
        return [
          { x: s.lambda, y: s.cp, label: `λ ${num(s.lambda, 1)} · Cp ${num(s.cp, 2)}`, color: SERIES_COLORS.dump },
        ];
      },
    });
    this.windChart = new LineChart({
      height: 70,
      series: [{ key: 'wind', label: () => t('chartLiveWind'), color: SERIES_COLORS.hydro }],
      yFmt: (v) => num(v),
      xFmt: seconds,
    });
    this.rpmChart = new LineChart({
      height: 70,
      series: [{ key: 'rpm', label: () => t('chartLiveRpm'), color: SERIES_COLORS.load }],
      yFmt: (v) => num(v),
      xFmt: seconds,
    });
    this.liveChart = new LineChart({
      height: 90,
      series: [
        { key: 'rotor', label: () => t('seriesRotor'), color: SERIES_COLORS.load },
        { key: 'battery', label: () => t('seriesBattery'), color: SERIES_COLORS.hydro, bold: true },
      ],
      yFmt: (v) => num(v),
      xFmt: seconds,
    });
    this.weibullChart = new LineChart({
      height: 130,
      series: [
        { key: 'hours', label: () => t('seriesHours'), color: SERIES_COLORS.hydro },
        { key: 'energy', label: () => t('seriesEnergy'), color: SERIES_COLORS.dump, bold: true },
      ],
      yFmt: (v) => `${num(v)} %`,
      xFmt: (v) => `${num(v)} m/s`,
      markers: () =>
        this.yearlyData ? [{ x: this.yearlyData.hubWind, label: `${num(this.yearlyData.hubWind, 1)} m/s` }] : [],
    });
  }

  /** Apply a change live; the panel is not rebuilt, so the dragged input survives. */
  private set(patch: Partial<PiggottParams>): void {
    this.ctx.sim.set(patch);
    this.renderStatus();
    this.renderReadouts();
  }

  render(): void {
    const sim = this.ctx.sim;
    const p = sim.params;
    this.controls = [];

    const presetSelect = h(
      'select',
      {
        'aria-label': t('preset'),
        onchange: (ev: Event) => {
          sim.applyPreset((ev.target as HTMLSelectElement).value as PresetId);
          this.render();
        },
      },
      ...PRESET_IDS.map((id) => h('option', { value: id, selected: p.preset === id }, t(PRESET_KEYS[id]))),
      h('option', { value: 'custom', selected: p.preset === 'custom', disabled: true }, t('custom')),
    );
    this.presetSelect = presetSelect;

    /** A slider on a ranged parameter, registered so that the panel can follow a scripted change. */
    const slider = (key: UiKey, field: RangedKey, fmt: (v: number) => string) => {
      const el = kitSlider(t(key), p[field], RANGES[field].min, RANGES[field].max, RANGES[field].step, fmt, (v) =>
        this.set({ [field]: v } as Partial<PiggottParams>),
      );
      this.controls.push({ key: field, el, kind: 'slider', fmt });
      return el;
    };
    const toggle = (key: UiKey, field: 'weather' | 'fixedTail' | 'batteryConnected' | 'brake' | 'dumpLoad') => {
      const el = kitToggle(t(key), p[field], (v) => this.set({ [field]: v } as Partial<PiggottParams>));
      this.controls.push({ key: field, el, kind: 'toggle' });
      return el;
    };
    const hint = (key: UiKey) => h('p', { class: 'hint' }, t(key));

    fill(
      this.el,
      h('div', { class: 'eyebrow eyebrow--accent' }, t('simTitle')),
      h(
        'div',
        { class: 'sim-top' },
        presetSelect,
        h(
          'button',
          {
            class: 'btn',
            'aria-label': t('reset'),
            title: t('reset'),
            onclick: () => (sim.reset(), this.render()),
          },
          icon(ICONS.reset, 16),
        ),
      ),
      h('div', { class: 'eyebrow' }, t('scenarios')),
      h(
        'div',
        { class: 'part-chips' },
        ...SCENARIO_IDS.map((id: ScenarioId) =>
          h(
            'button',
            { class: 'part-chip', onclick: () => (sim.applyScenario(id), this.render()) },
            t(SCENARIO_KEYS[id]),
          ),
        ),
      ),
      hint('scenarioHint'),
      this.status,
      this.readouts,
      h('div', { class: 'eyebrow' }, t('chainTitle')),
      this.chain,
      hint('chainHint'),
      this.more,
      kitSection(
        t('secSite'),
        slider('meanWind', 'meanWind', (v) => `${num(v, 1)} m/s`),
        hint('windHint'),
        slider('weibullK', 'weibullK', (v) => num(v, 1)),
        hint('weibullHint'),
        toggle('weather', 'weather'),
        slider('gusts', 'gusts', (v) => `× ${num(v, 1)}`),
        slider('mastHeight', 'mastHeight', (v) => `${num(v)} m`),
        slider('obstacleHeight', 'obstacleHeight', (v) => `${num(v)} m`),
        hint('obstacleHint'),
        slider('altitude', 'altitude', (v) => `${num(v)} m`),
      ),
      kitSection(
        t('secMachine'),
        slider('diameter', 'diameter', (v) => `${num(v, 1)} m`),
        hint('diameterHint'),
        slider('turns', 'turns', (v) => num(v)),
        hint('turnsHint'),
        slider('tailWeight', 'tailWeight', (v) => `× ${num(v, 2)}`),
        toggle('fixedTail', 'fixedTail'),
        hint('tailHint'),
      ),
      kitSection(
        t('secElectric'),
        slider('cableSection', 'cableSection', (v) => `${num(v, 1)} mm²`),
        slider('cableLength', 'cableLength', (v) => `${num(v)} m`),
        hint('cableHint'),
        toggle('batteryConnected', 'batteryConnected'),
        toggle('brake', 'brake'),
        hint('brakeHint'),
        toggle('dumpLoad', 'dumpLoad'),
        slider('batteryAh', 'batteryAh', (v) => `${num(v)} Ah`),
        slider('loadPower', 'loadPower', (v) => `${num(v)} W`),
        hint('loadHint'),
      ),
      h('div', { class: 'eyebrow' }, t('chartPower')),
      this.powerChart.el,
      hint('chartPowerHint'),
      h('div', { class: 'eyebrow' }, t('chartCp')),
      this.cpChart.el,
      hint('chartCpHint'),
      h('div', { class: 'eyebrow' }, t('chartLive')),
      h('div', { class: 'eyebrow' }, t('chartLiveWind')),
      this.windChart.el,
      h('div', { class: 'eyebrow' }, t('chartLiveRpm')),
      this.rpmChart.el,
      h('div', { class: 'eyebrow' }, t('chartLivePower')),
      this.liveChart.el,
      hint('chartLiveHint'),
      h('div', { class: 'eyebrow' }, t('chartWeibull')),
      this.weibullChart.el,
      hint('chartWeibullHint'),
      h('div', { class: 'eyebrow' }, t('yearlyTitle')),
      this.yearly,
      hint('yearlyHint'),
      this.computing,
    );
    // the first view comes with its curves
    this.key = curveKey(p);
    this.wait = 0;
    this.jobs = ['curve', 'yearly', 'onset'];
    while (this.jobs.length) this.runJob();
    this.refresh();
  }

  /** Called every frame while the panel is open: readouts at 5 Hz, the last minute at 4 Hz, the curves at 2 Hz. */
  tick(dt: number): void {
    this.lastReadouts += dt;
    this.lastCharts += dt;
    this.lastScope += dt;
    this.scheduleCurves(dt);
    if (this.lastReadouts > 0.2) {
      this.lastReadouts = 0;
      this.renderStatus();
      this.renderReadouts();
      this.followScript();
    }
    if (this.lastScope > 0.25) {
      this.lastScope = 0;
      this.drawLive();
    }
    if (this.lastCharts > 0.5) {
      this.lastCharts = 0;
      this.drawCurves();
    }
  }

  /** Redraw everything now (after a change made from the panel). */
  private refresh(): void {
    this.renderStatus();
    this.renderReadouts();
    this.drawLive();
    this.drawCurves();
  }

  // ------------------------------------------------------------------ the curves

  /** The curves cost about 70 ms: they start once the controls have been quiet for a moment, one job per frame. */
  private scheduleCurves(dt: number): void {
    const key = curveKey(this.ctx.sim.params);
    if (key !== this.key) {
      this.key = key;
      this.wait = CURVE_DELAY;
      this.jobs = [];
    } else if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) this.jobs = ['curve', 'yearly', 'onset'];
    }
    this.runJob();
  }

  private runJob(): void {
    const job = this.jobs.shift();
    const sim = this.ctx.sim;
    if (job === 'curve') this.curve = sim.getCurve();
    else if (job === 'yearly') this.yearlyData = sim.getYearly();
    else if (job === 'onset') this.onset = sim.getFurlingOnset();
    if (job) this.lastCharts = 1; // draw at once
  }

  // ------------------------------------------------------------------ status and readouts

  private renderStatus(): void {
    const sim = this.ctx.sim;
    if (this.presetSelect && this.presetSelect.value !== sim.params.preset) this.presetSelect.value = sim.params.preset;
    const { key, tone } = statusOf(sim.state, sim.params);
    fill(
      this.status,
      tone === 'warn'
        ? h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t(key)))
        : h('p', { class: 'hint' }, t(key)),
    );
  }

  private renderReadouts(): void {
    const s = this.ctx.sim.state;
    const cell = (label: string, value: string, unit = '') =>
      h('div', { class: 'readout' }, h('span', {}, label), h('b', {}, value, unit ? h('small', {}, ` ${unit}`) : null));
    const fromReadout = (r: Readout) => cell(t(r.key), num(r.value, r.digits), r.unit);
    fill(this.readouts, ...mainReadouts(s, t('unitRpm')).map(fromReadout));
    fill(
      this.more,
      ...moreReadouts(s).map(fromReadout),
      cell(t('liveFurlOnset'), Number.isFinite(this.onset) ? num(this.onset, 1) : '—', 'm/s'),
      cell(t('liveCutIn'), num(s.cutInRpm), t('unitRpm')),
    );
    this.renderChain();
    this.renderYearly();
  }

  /** The rotor power split between the battery and the losses of each stage, as one bar with its legend. */
  private renderChain(): void {
    const s = this.ctx.sim.state;
    if (s.rotorPower < 1) {
      fill(this.chain, h('p', { class: 'hint' }, '—'));
      return;
    }
    const rows = chainSegments(s);
    const total = rows.reduce((a, r) => a + r.watts, 0) || 1;
    fill(
      this.chain,
      h(
        'div',
        { class: 'loss-bar', role: 'img', 'aria-label': t('chainTitle') },
        ...rows.map((r) =>
          h('span', {
            style: `flex:${Math.max(r.watts, 0.0001)};background:${r.colour}`,
            title: `${t(r.key)} ${num(r.watts)} W`,
          }),
        ),
      ),
      h(
        'div',
        { class: 'loss-legend' },
        ...rows.map((r) =>
          h(
            'span',
            {},
            h('i', { style: `background:${r.colour}` }),
            `${t(r.key)} `,
            h('b', {}, `${num(r.watts, r.watts < 10 ? 1 : 0)} W`),
            h('small', {}, ` ${num((100 * r.watts) / total)} %`),
          ),
        ),
      ),
      h(
        'div',
        { class: 'loss-legend' },
        h('span', {}, `${t('chainRotorOfWind')} `, h('b', {}, `${num(100 * s.etaRotor)} %`)),
        h('span', {}, `${t('chainBatteryOfRotor')} `, h('b', {}, `${num(100 * s.etaChain)} %`)),
      ),
    );
  }

  private renderYearly(): void {
    const y = this.yearlyData;
    if (!y) return;
    const cell = (label: string, value: string, unit = '') =>
      h('div', { class: 'readout' }, h('span', {}, label), h('b', {}, value, unit ? h('small', {}, ` ${unit}`) : null));
    fill(
      this.yearly,
      cell(t('yearlyEnergy'), num(y.energy), t('unitKwhYear')),
      cell(t('yearlyMean'), num(y.meanPower, 1), 'W'),
      cell(t('yearlyCf'), num(100 * y.capacityFactor, 1), '%'),
      cell(t('yearlySpecific'), num(y.specific), t('unitKwhM2Year')),
      cell(t('yearlyHubWind'), num(y.hubWind, 1), 'm/s'),
      cell(t('liveFurlOnset'), Number.isFinite(this.onset) ? num(this.onset, 1) : '—', 'm/s'),
    );
  }

  /** A scenario can move a slider or flip a switch by itself: the controls follow. */
  private followScript(): void {
    const p = this.ctx.sim.params;
    for (const c of this.controls) {
      const input = c.el.querySelector('input');
      if (!input) continue;
      const value = p[c.key];
      if (c.kind === 'toggle') {
        if (input.checked !== value) input.checked = Boolean(value);
      } else if (typeof value === 'number' && Math.abs(Number(input.value) - value) > 1e-9) {
        input.value = String(value);
        const out = c.el.querySelector('output');
        if (out && c.fmt) out.textContent = c.fmt(value);
      }
    }
  }

  // ------------------------------------------------------------------ charts

  private drawLive(): void {
    const d = liveChartData(this.ctx.sim.scope);
    this.windChart.setData(d.xs, { wind: d.ys.wind });
    this.rpmChart.setData(d.xs, { rpm: d.ys.rpm });
    this.liveChart.setData(d.xs, { rotor: d.ys.rotor, battery: d.ys.battery });
    this.windChart.draw();
    this.rpmChart.draw();
    this.liveChart.draw();
  }

  private drawCurves(): void {
    const sim = this.ctx.sim;
    if (this.curve.length) {
      const d = powerChartData(this.curve, nameplate(sim.params.diameter));
      this.powerOpts.yMax = d.yMax;
      this.powerChart.setData(d.xs, d.ys);
      this.powerChart.draw();
    }
    const cp = cpChartData();
    this.cpChart.setData(cp.xs, cp.ys);
    this.cpChart.draw();
    if (this.yearlyData) {
      const w = weibullChartData(this.yearlyData);
      this.weibullChart.setData(w.xs, w.ys);
      this.weibullChart.draw();
    }
    this.computing.textContent = this.wait > 0 || this.jobs.length > 0 ? t('computing') : '';
  }
}
