import { getLang } from '@onigam/lab-kit/i18n';
import { fill, h, LineChart, SERIES_COLORS, section as kitSection, type SeriesDef } from '@onigam/lab-kit/ui';
import { num, t } from '../i18n/ui';
import {
  pendingSizes,
  SIZE_DIAMETERS,
  SIZE_TABLE_WIND,
  sizeCurve,
  sizeKey,
  sizesChartData,
  sizesTable,
  type SizesChartData,
} from './model';

// The "Sizes" section of the simulation panel: the model's battery power against the wind for the seven rotor diameters of
// the family, the size set above highlighted in copper, and its label (200 W scaled with the swept area) in dashes. It is
// closed at first and computes nothing until it is opened; then one curve per frame (about 12 ms each), cached for good
// (model.ts), and it draws again only when the set diameter or the language changes. Nothing is allocated per frame.

/** From light (1.0 m) to dark (4.2 m): the size reads as a darkening of the kit's blue. */
const RAMP = ['#9cc7e4', '#7db3d8', '#5a9ccb', '#3b86bd', '#2a6f9f', '#1f5a82', '#16456a'];
const SET_COLOUR = SERIES_COLORS.dump;

type ChartOpts = ConstructorParameters<typeof LineChart>[0];

export class SizesSection {
  /** The collapsible section, rebuilt by `build()` (its title and hint follow the language); the open state is kept. */
  el: HTMLDetailsElement | null = null;
  private readonly chartOpts: ChartOpts;
  private readonly chart: LineChart;
  private readonly summary = h('p', { class: 'hint' });
  private readonly grid = h('div', { class: 'readouts' });
  /** The set size whose curves are all in the cache; the set size and the language of the last drawing (NaN = draw again). */
  private readyFor = Number.NaN;
  private drawnFor = Number.NaN;
  private drawnLang = '';

  constructor(private readonly diameter: () => number) {
    this.chartOpts = {
      height: 170,
      series: [],
      legend: true, // the series are given at each drawing: the legend row must exist from the start
      yMax: 1000,
      yFmt: (v) => num(v),
      xFmt: (v) => `${num(v)} m/s`,
      // the wind of the table under the chart
      markers: () => [{ x: SIZE_TABLE_WIND, label: `${num(SIZE_TABLE_WIND)} m/s` }],
    };
    this.chart = new LineChart(this.chartOpts);
  }

  /** The section for `SimPanel.render()`: closed the first time, as it was left afterwards. */
  build(): HTMLElement {
    const wasOpen = this.el?.open ?? false;
    const el = kitSection(
      t('secSizes'),
      h('p', { class: 'hint' }, t('sizesHint')),
      this.chart.el,
      this.summary,
      this.grid,
    ) as HTMLDetailsElement;
    el.open = wasOpen;
    this.el = el;
    this.drawnFor = Number.NaN;
    return el;
  }

  /** Called every frame by the panel: nothing to do while the section is closed or up to date. */
  tick(): void {
    if (!this.el?.open) return;
    const set = this.diameter();
    if (this.readyFor !== set) {
      // the curves of the family and of the set size: one per frame, so that opening the section never stalls the animation
      const todo = pendingSizes(set);
      if (todo.length) {
        sizeCurve(todo[0]!);
        return;
      }
      this.readyFor = set;
    }
    const lang = getLang();
    if (set === this.drawnFor && lang === this.drawnLang) return;
    this.drawnFor = set;
    this.drawnLang = lang;
    this.draw(sizesChartData(set), set);
  }

  /** The curves of the family (the set size in copper and bold), the set size on its own when it is not in the family, its label. */
  private seriesFor(d: SizesChartData, set: number): SeriesDef[] {
    const family = SIZE_DIAMETERS.map((size, i): SeriesDef => {
      const on = sizeKey(size) === d.setKey;
      return {
        key: sizeKey(size),
        label: () => `${num(size, 1)} m`,
        color: on ? SET_COLOUR : (RAMP[i] ?? SERIES_COLORS.hydro),
        bold: on,
      };
    });
    if (d.setKey === 'set') family.push({ key: 'set', label: () => `${num(set, 1)} m`, color: SET_COLOUR, bold: true });
    family.push({ key: 'rated', label: () => t('seriesRatedSize'), color: SET_COLOUR, dash: true });
    return family;
  }

  private draw(d: SizesChartData, set: number): void {
    this.chartOpts.series = this.seriesFor(d, set);
    this.chartOpts.yMax = d.yMax;
    this.chart.setData(d.xs, d.ys);
    this.chart.draw();

    const cell = (size: number, model: number, rated: number) =>
      h(
        'div',
        { class: 'readout', style: sizeKey(size) === d.setKey ? 'border-color:var(--copper)' : '' },
        h('span', {}, `${num(size, 1)} m`),
        h('b', {}, num(model), h('small', {}, ` / ${num(rated)}`)),
      );
    fill(this.grid, ...sizesTable().map((r) => cell(r.diameter, r.model, r.rated)));
    fill(
      this.summary,
      `${t('sizesSet')} ${num(set, 1)} m · ${t('sizesModel')} ${num(d.set.model)} W · ${t('sizesRated')} ${num(d.set.rated)} W`,
    );
  }
}
