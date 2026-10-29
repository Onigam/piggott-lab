import { COLORS, Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { nEn, nFr } from '../data/units';
import { DIAMETER_REF, FURLING_SPEED, NAMEPLATE_REF } from '../sim/machine';
import { sweptArea } from '../sim/physics';
import { Chart } from './chart';
import { EDU_NOTE, FILL, box, grid, heading } from './draw';
import { cableSection, modelPower, sizeCurves } from './sizes-model';

/** The chart box in paper mm and the top of its power axis, W (the test checks the curves against it). */
export const CHART = { x: 34, y: 34, w: 184, h: 148, yMax: 900 } as const;
const NUMBER = 'PL-08';
const TITLE = l('Puissance selon la taille', 'Power by size');

/** One colour per size, light for the smallest to dark for the largest (one hue: it is one parameter of one model). */
export const RAMP = ['#9fc4de', '#7eaed3', '#5d98c8', '#417fb9', '#2a67a8', '#1c518f', '#133b6c'] as const;

const f = (v: number, d = 0): L => l(nFr(v, d), nEn(v, d));
const m = (d: number): L => l(`${nFr(d, 1)} m`, `${nEn(d, 1)} m`);
const cat = (...parts: (string | L)[]): L =>
  l(
    parts.map((x) => (typeof x === 'string' ? x : x.fr)).join(''),
    parts.map((x) => (typeof x === 'string' ? x : x.en)).join(''),
  );

function render(): Drawing {
  const d = new Drawing();
  d.frame({
    title: TITLE,
    subtitle: l(
      'Résultat du modèle : la puissance à la batterie des sept diamètres du rotor, comparée à l’étiquette',
      'Model result: battery power of the seven rotor diameters, compared with the label',
    ),
    number: NUMBER,
    scale: '—',
  });
  const p = d.paper();
  const curves = sizeCurves();

  // ------------------------------------------------------------------ A: the seven curves
  heading(
    d,
    14,
    13,
    l(
      'A · PUISSANCE À LA BATTERIE SELON LE VENT, POUR LES SEPT TAILLES',
      'A · BATTERY POWER AGAINST WIND, FOR THE SEVEN SIZES',
    ),
    { size: 2.2 },
  );
  p.rect([14, 17], [78, 24], { w: W.medium, color: COLORS.red, fill: COLORS.paper });
  p.text([46, 20.5], l('RÉSULTAT DU MODÈLE · pas une mesure', 'MODEL RESULT · not a measurement'), {
    size: 1.9,
    weight: 'bold',
    color: COLORS.red,
    anchor: 'middle',
    baseline: 'middle',
  });
  const ch = new Chart(
    p,
    { x: CHART.x, y: CHART.y, w: CHART.w, h: CHART.h },
    { min: 0, max: 25, step: 5, label: l('Vent au moyeu (m/s)', 'Hub wind (m/s)') },
    { min: 0, max: CHART.yMax, step: 100, label: l('Puissance à la batterie (W)', 'Battery power (W)') },
  ).frame();
  ch.vline(FURLING_SPEED, { color: INK_2, dash: 'phantom', w: W.thin });
  ch.text(FURLING_SPEED, 880, l('repliement de la queue', 'tail folding'), {
    size: 1.9,
    color: INK_2,
    dx: -1.5,
    baseline: 'middle',
    anchor: 'end',
  });
  ch.vline(12, { color: INK_2, dash: 'hidden', w: W.thin });
  curves.forEach((c, i) => {
    const col = RAMP[i]!;
    ch.line(
      c.winds.map((v, j): [number, number] => [v, c.power[j]!]),
      { color: col, w: 0.55 },
    );
    ch.marker(12, c.at12, 'circle', { color: col, fill: col, r: 1.1 });
  });
  // the values at 12 m/s, to the left of the dashed line, spaced so that none touches another
  let lastY = -Infinity;
  [...curves].reverse().forEach((c) => {
    const y = Math.max(ch.Y(c.at12) - 1, lastY + 3.4);
    lastY = y;
    p.text([ch.X(12) - 2, y], f(c.at12), { size: 2, anchor: 'end', mono: true, baseline: 'middle', halo: true });
  });
  p.text([ch.X(12) + 1.5, ch.Y(0) - 2.5], l('12 m/s', '12 m/s'), { size: 1.9, color: INK_2 });
  // names of the curves at their right end
  let prevY = -Infinity;
  [...curves].reverse().forEach((c, ri) => {
    const i = curves.length - 1 - ri;
    const y = Math.max(ch.Y(c.power[c.power.length - 1]!), prevY + 3.6);
    prevY = y;
    p.text([ch.box.x + ch.box.w + 2, y], m(c.diameter), {
      size: 2,
      mono: true,
      baseline: 'middle',
      color: RAMP[i],
      weight: 'bold',
    });
  });
  // the label scale: same axis, to the right of the curve names
  const xr = 246;
  p.line([xr, ch.Y(0)], [xr, ch.Y(900)], { w: W.thin, color: COLORS.copper });
  p.text([xr - 4, 18], l('ÉTIQUETTE (même échelle)', 'LABEL (same scale)'), {
    size: 2,
    color: COLORS.copper,
    weight: 'bold',
  });
  const rated = curves.filter((c) => c.label <= 900);
  rated.forEach((c, i) => {
    ch.marker(0, 0, 'circle', { r: 0 });
    p.polyline(
      [
        [xr, ch.Y(c.label) - 1.8],
        [xr + 1.8, ch.Y(c.label)],
        [xr, ch.Y(c.label) + 1.8],
        [xr - 1.8, ch.Y(c.label)],
      ],
      { closed: true, w: W.medium, color: COLORS.copper, fill: COLORS.paper },
    );
    p.text([xr + 3, ch.Y(c.label) + (i === 0 ? 2.2 : 0)], cat(f(c.label), ' W · ', m(c.diameter)), {
      size: 1.9,
      mono: true,
      baseline: 'middle',
      color: COLORS.copper,
    });
  });
  curves
    .filter((c) => c.label > 900)
    .forEach((c, i) => {
      const y = 22.5 + i * 3.6;
      p.polyline(
        [
          [xr - 1.8, y + 1.2],
          [xr + 1.8, y + 1.2],
          [xr, y - 1.8],
        ],
        { closed: true, w: W.medium, color: COLORS.copper, fill: COLORS.paper },
      );
      p.text([xr + 3, y], cat(f(c.label), ' W · ', m(c.diameter)), {
        size: 1.9,
        mono: true,
        baseline: 'middle',
        color: COLORS.copper,
      });
    });
  p.text([xr + 3, 33.4], l('▲ hors du graphique', '▲ off the chart'), {
    size: 1.7,
    color: COLORS.copper,
    baseline: 'middle',
  });

  // ------------------------------------------------------------------ B: the label and the model, side by side at 12 m/s
  heading(d, 282, 13, l('B · À 12 m/s : L’ÉTIQUETTE ET LE MODÈLE', 'B · AT 12 m/s: THE LABEL AND THE MODEL'), {
    size: 2.2,
  });
  const x0 = 296;
  const scaleW = 84;
  const top = Math.max(...curves.map((c) => c.label));
  p.rect([282, 18], [286, 21], { w: W.medium, color: COLORS.copper, fill: FILL.copper, hatch: 'wood' });
  p.text([288, 19.5], l('étiquette', 'label'), { size: 1.9, baseline: 'middle' });
  p.rect([314, 18], [318, 21], { w: W.medium, color: RAMP[4], fill: RAMP[4] });
  p.text([320, 19.5], l('modèle', 'model'), { size: 1.9, baseline: 'middle' });
  curves.forEach((c, i) => {
    const y = 28 + i * 12.4;
    p.text([282, y + 4.5], m(c.diameter), { size: 2, mono: true, baseline: 'middle', weight: 'bold' });
    p.rect([x0, y], [x0 + (scaleW * c.label) / top, y + 4.2], {
      w: W.medium,
      color: COLORS.copper,
      fill: FILL.copper,
      hatch: 'wood',
    });
    p.text([x0 + (scaleW * c.label) / top + 1.5, y + 2.1], cat(f(c.label), ' W'), {
      size: 1.9,
      mono: true,
      baseline: 'middle',
      color: COLORS.copper,
    });
    p.rect([x0, y + 5], [x0 + (scaleW * c.at12) / top, y + 9.2], { w: W.medium, color: RAMP[i], fill: RAMP[i] });
    p.text([x0 + (scaleW * c.at12) / top + 1.5, y + 7.1], cat(f(c.at12), ' W'), {
      size: 1.9,
      mono: true,
      baseline: 'middle',
      weight: 'bold',
    });
    p.text([404, y + 4.6], cat('× ', f(c.at12 / c.label, 2)), {
      size: 1.9,
      mono: true,
      anchor: 'end',
      baseline: 'middle',
      color: INK_2,
    });
  });

  // ------------------------------------------------------------------ C: the figures
  heading(d, 282, 118, l('C · LES CHIFFRES', 'C · THE FIGURES'), { size: 2.2 });
  const rows = curves.map((c) => [
    m(c.diameter),
    cat(f(sweptArea(c.diameter), 2), ' m²'),
    cat(f(c.label), ' W'),
    cat(f(c.at12), ' W'),
    cat(f(c.peak), ' W'),
  ]);
  grid(
    d,
    282,
    123,
    [
      { label: l('Rotor', 'Rotor'), w: 18, mono: true },
      { label: l('Surface', 'Area'), w: 24, align: 'end', mono: true },
      { label: l('Étiquette', 'Label'), w: 28, align: 'end', mono: true },
      { label: l('Modèle, 12 m/s', 'Model, 12 m/s'), w: 32, align: 'end', mono: true },
      { label: l('Meilleur', 'Best'), w: 22, align: 'end', mono: true },
    ],
    rows,
    { size: 1.85, pad: 0.6, lineH: 2.8 },
  );

  // ------------------------------------------------------------------ D: what is published for the sizes
  heading(d, 282, 164, l('D · CE QUE DISENT LES SOURCES, À COMPARER', 'D · WHAT THE SOURCES SAY, TO COMPARE'), {
    size: 2.2,
  });
  grid(
    d,
    282,
    169,
    [
      { label: l('Rotor', 'Rotor'), w: 18, mono: true },
      { label: l('Publié', 'Published'), w: 58 },
      { label: l('Modèle, 12 m/s', 'Model, 12 m/s'), w: 48, align: 'end', mono: true },
    ],
    [
      [
        m(2),
        l('500 W à 12 m/s (Engineering for Change)', '500 W at 12 m/s (Engineering for Change)'),
        cat(f(modelPower(2, 12)), ' W'),
      ],
      [
        m(2.4),
        l('« environ 500 W » en temps normal (plans)', '“about 500 W” normally (plans)'),
        cat(f(curves[3]!.at12), ' W'),
      ],
      [
        m(4),
        l('2 000 W à 12 m/s (Engineering for Change)', '2,000 W at 12 m/s (Engineering for Change)'),
        cat(f(modelPower(4, 12)), ' W'),
      ],
    ],
    { size: 1.8, pad: 0.6, lineH: 2.8 },
  );

  // ------------------------------------------------------------------ legend of the chart
  const lg = 224;
  p.text([222, lg - 1], l('LÉGENDE', 'KEY'), { size: 1.9, weight: 'bold' });
  p.line([222, lg + 4], [232, lg + 4], { w: 0.55, color: RAMP[4] });
  p.circle([227, lg + 4], 1.1, { w: W.medium, color: RAMP[4], fill: RAMP[4] });
  p.text([235, lg + 4], l('courbe du modèle ; point à 12 m/s', 'model curve; point at 12 m/s'), {
    size: 1.85,
    baseline: 'middle',
  });
  p.polyline(
    [
      [227, lg + 8.6],
      [229, lg + 10.4],
      [227, lg + 12.2],
      [225, lg + 10.4],
    ],
    { closed: true, w: W.medium, color: COLORS.copper, fill: COLORS.paper },
  );
  p.text([235, lg + 10.4], l('étiquette mise à l’échelle de la surface', 'label scaled with the swept area'), {
    size: 1.85,
    baseline: 'middle',
  });
  p.line([222, lg + 16.8], [232, lg + 16.8], { w: W.thin, color: INK_2, dash: 'phantom' });
  p.text([235, lg + 16.8], l('vent où la queue commence à se replier', 'wind at which the tail starts to fold'), {
    size: 1.85,
    baseline: 'middle',
  });

  // ------------------------------------------------------------------ notes
  box(
    d,
    14,
    198,
    198,
    l('NOTES', 'NOTES'),
    [
      {
        bullet: '1',
        t: l(
          `L’étiquette de la machine de la vidéo dit ${nFr(NAMEPLATE_REF)} W (nominal, vent non précisé). Le modèle, qui n’est pas ajusté à l’étiquette, donne ≈ ${nFr(curves[1]!.at12)} W à 12 m/s pour ${nFr(DIAMETER_REF, 1)} m. Les autres étiquettes sont ${nFr(NAMEPLATE_REF)} W × (D / ${nFr(DIAMETER_REF, 1)})², mises à l’échelle par la surface : ce n’est pas le tableau du constructeur.`,
          `The video machine’s label says ${nEn(NAMEPLATE_REF)} W (nominal, wind speed not given). The model, which is not tuned to the label, gives ≈ ${nEn(curves[1]!.at12)} W at 12 m/s for ${nEn(DIAMETER_REF, 1)} m. The other labels are ${nEn(NAMEPLATE_REF)} W × (D / ${nEn(DIAMETER_REF, 1)})², scaled with the swept area: this is not the maker’s table.`,
        ),
      },
      {
        bullet: '2',
        t: l(
          `Les sept tailles sont un seul paramètre du modèle, le diamètre, pas sept machines : l’alternateur et la queue le suivent, le câble suit la surface (${nFr(cableSection(DIAMETER_REF), 0)} mm² × (D / ${nFr(DIAMETER_REF, 1)})², 15 m), sur le site du hameau, avec une batterie à mi-charge.`,
          `The seven sizes are one parameter of the model, the diameter, not seven machines: the alternator and the tail follow it, the cable follows the area (${nEn(cableSection(DIAMETER_REF), 0)} mm² × (D / ${nEn(DIAMETER_REF, 1)})², 15 m), on the hamlet site, with a half-charged battery.`,
        ),
      },
      {
        bullet: '3',
        t: l(
          'Les courbes sont presque des droites, pas des cubes : l’alternateur tient le rotor en décrochage, loin de son meilleur régime. C’est la puissance du vent qui monte avec le cube. Vers 10 m/s la queue se replie et la courbe s’aplatit.',
          'The curves are nearly straight lines, not cubes: the alternator holds the rotor in the stall, far from its best speed. It is the power in the wind that goes up as a cube. Near 10 m/s the tail folds and the curve flattens.',
        ),
      },
      { bullet: '4', t: EDU_NOTE },
    ],
    { size: 1.8 },
  );
  return d;
}

export const powerBySize: DrawingSheet = {
  id: 'power-by-size',
  number: NUMBER,
  group: 'performance',
  title: TITLE,
  description: l(
    'Résultat du modèle : la puissance que la machine envoie à la batterie selon le vent, pour les sept diamètres de rotor de la famille, de 1,0 à 4,2 m. À côté, l’étiquette mise à l’échelle de la surface : le modèle donne environ 0,3 fois ce qu’elle annonce. Les tailles sont un paramètre du modèle, pas sept machines.',
    'Model result: the power the machine sends to the battery against wind speed, for the seven rotor diameters of the family, from 1.0 to 4.2 m. Beside it, the label scaled with the swept area: the model gives about 0.3 times what it announces. The sizes are one parameter of the model, not seven machines.',
  ),
  scene: 'site',
  parts: ['wind-turbine'],
  render,
};
