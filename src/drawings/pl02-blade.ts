import { COLORS, Drawing, INK_2, W, type DrawingSheet, type Pt } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { nEn, nFr } from '../data/units';
import { partIds } from '../part-ids';
import { sectionOutline } from '../three/blades/geometry';
import { BLADE, HUB_DISC, ROTOR_DISC, bladePitch } from '../three/dims';
import { EDU_NOTE, FILL, box, grid, heading, marksLegend, poly } from './draw';
import { DEG, k, lab, labN } from './geom';
import { bladePlanform } from './head';

const NUMBER = 'PL-02';
const TITLE = l('Taille de la pale en six postes', 'Carving the blade in six stations');
const SC = 0.5;

/** Section of station `i` in (u, v): u along the rotor plane towards the trailing edge, v along the axis, leading edge of the flat face at (0, 0). */
function sectionPoints(i: number): Pt[] {
  const th = bladePitch(i);
  return sectionOutline(i).map(([c, h]): Pt => [
    k(c * Math.cos(th) - h * Math.sin(th)),
    k(c * Math.sin(th) + h * Math.cos(th)),
  ]);
}

function render(): Drawing {
  const d = new Drawing();
  d.frame({
    title: TITLE,
    subtitle: l(
      'Plan de la pale, coupes aux six postes, pied à 120° · échelle 1:2 · cotes des plans publiés',
      'Blade plan, sections at the six stations, 120° root · scale 1:2 · dimensions of the published plans',
    ),
    number: NUMBER,
    scale: '1:2',
  });
  const p = d.paper();
  const R = k(BLADE.length);
  const half = k(BLADE.rootWidth) / 2;

  // ------------------------------------------------------------------ planform, leading edge on top
  const ox = 26;
  const oy = 71;
  heading(
    d,
    14,
    13,
    l('VUE EN PLAN · face plane (côté du vent) vers le lecteur', 'PLAN · flat windward face towards the reader'),
    { size: 2.2 },
  );
  const v = d.view(ox, oy, SC);
  const plan = bladePlanform();
  const outline: Pt[] = [...plan.lead, ...[...plan.trail].reverse()].map(([t, r]): Pt => [r, t]);
  poly(v, outline, { w: W.thick, fill: FILL.wood, hatch: 'wood' });
  v.center([-18, 0], [R + 22, 0], 0);
  // the 120° of the root: the two 60° cuts meet at the centre of the hub
  v.arc([0, 0], 30, -60, 60, { w: W.thin });
  v.text([-8, -3], l('120°', '120°'), { size: 2.1, anchor: 'end', mono: true, halo: true });
  v.text([plan.rootApex * 0.5 + 4, half * 0.62], l('coupe à 60°', '60° cut'), {
    size: 1.9,
    anchor: 'start',
    halo: true,
  });
  // station lines and balloons
  BLADE.stationRadius.forEach((r, i) => {
    const x = k(r);
    v.line([x, half + 6], [x, -half - 6], { w: W.thin, dash: 'center', color: INK_2 });
    const [bx, by] = v.map([x, half + 6]);
    p.circle([bx, by - 4.2], 3.1, { w: W.thin, fill: COLORS.paper });
    p.text([bx, by - 4.2], String(i + 1), { size: 2.4, weight: 'bold', anchor: 'middle', baseline: 'middle' });
    // width at the station, read across the plank
    const w = k(BLADE.stationWidth[i]!);
    const [yTop, yBot] = [half, half - w];
    v.dim([x, yTop], [x, yBot], 0, { dir: 'v', label: lab(w, 'R'), size: 2 });
  });
  v.text([R / 2 + 50, half - 14], l('bord d’attaque (droit)', 'leading edge (straight)'), {
    size: 2,
    anchor: 'middle',
    color: INK_2,
    halo: true,
  });
  v.text([R - 160, -half + 66], l('bord de fuite', 'trailing edge'), {
    size: 2,
    anchor: 'middle',
    color: INK_2,
    halo: true,
  });
  // chain of radii under the blade
  let prev = 0;
  for (const r of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]) {
    const status = r === 0.6 ? 'R' : 'E';
    v.dim([prev, -half], [k(r), -half], 9, { dir: 'h', label: lab(k(r) - prev, status), size: 2 });
    prev = k(r);
  }
  v.dim([0, -half], [R, -half], 20, {
    dir: 'h',
    label: l('600 : de l’axe du moyeu au bout', '600: hub axis to tip'),
    size: 2.2,
  });

  // ------------------------------------------------------------------ root, seen from the front: three planks at 120°
  const cx = 372;
  const cy = 55;
  heading(d, 336, 14, l('PIED · trois planches à 120°', 'ROOT · three planks at 120°'), { size: 2.2 });
  d.paper().text([336, 20.5], l('échelle 1:5', 'scale 1:5'), { size: 1.8, color: INK_2, baseline: 'top', mono: true });
  const rv = d.view(cx, cy, 0.2);
  const window = 120;
  for (let a = 0; a < 3; a++) {
    const pts: Pt[] = [
      [0, 0],
      [plan.rootApex, half],
      [window, half],
      [window, -half],
      [plan.rootApex, -half],
    ];
    const rotd = pts.map(([x, y]): Pt => {
      const t = -a * 120 + 90;
      const c = Math.cos(t * DEG);
      const s = Math.sin(t * DEG);
      return [x * c - y * s, x * s + y * c];
    });
    poly(rv, rotd, { w: W.medium, fill: FILL.wood, hatch: 'wood' });
  }
  rv.circle([0, 0], k(HUB_DISC.diameter) / 2, { w: W.thin, dash: 'hidden', color: INK_2 });
  rv.circle([0, 0], k(ROTOR_DISC.boltCircleDiameter) / 2, { w: W.thin, dash: 'center', color: INK_2 });
  rv.leader([-70, -70], -8, 16, cat2(l('contreplaqué Ø', 'plywood Ø'), k(HUB_DISC.diameter), 'E'), { size: 1.9 });
  rv.text([0, -window - 36], l('chaque pied : coupes à 60°', 'each root: 60° cuts'), {
    size: 1.9,
    anchor: 'middle',
    color: INK_2,
  });

  // ------------------------------------------------------------------ sections
  heading(
    d,
    14,
    133,
    l('COUPES AUX POSTES · le contour de chaque gabarit', 'SECTIONS AT THE STATIONS · the outline of each template'),
    { size: 2.2 },
  );
  const yb = 176;
  let x = 20;
  const gap = 11;
  BLADE.stationRadius.forEach((_r, i) => {
    const pts = sectionPoints(i);
    const wdt = k(BLADE.stationWidth[i]!);
    const drop = k(BLADE.stationDrop[i]!);
    const sv = d.view(x, yb, SC);
    poly(sv, pts, { w: W.thick, fill: FILL.wood, hatch: 'wood' });
    // the plane of rotation through the leading edge, and the pitch of the flat face
    sv.line([-6, 0], [wdt + 10, 0], { w: W.thin, dash: 'hidden', color: INK_2 });
    const [lx, ly] = sv.map([0, 0]);
    p.circle([lx, ly - 34], 3.1, { w: W.thin, fill: COLORS.paper });
    p.text([lx, ly - 34], String(i + 1), { size: 2.4, weight: 'bold', anchor: 'middle', baseline: 'middle' });
    p.text([lx + 6, ly - 34], lab(k(BLADE.stationRadius[i]!), 'E', 'r = '), {
      size: 2,
      baseline: 'middle',
      mono: true,
    });
    // width, drop, thickness
    sv.dim([0, 0], [wdt, 0], 6, { dir: 'h', label: lab(wdt, 'R'), size: 2 });
    if (drop > 0.5) sv.dim([wdt, 0], [wdt, drop], 5, { dir: 'v', label: lab(drop, 'R'), size: 2 });
    const t = k(BLADE.stationThickness[i]!);
    // thickness, measured at the thickest point of the profile (perpendicular to the flat face)
    const th = bladePitch(i);
    const c0 = 0.3 * Math.hypot(drop, wdt);
    const foot: Pt = [c0 * Math.cos(th), c0 * Math.sin(th)];
    const top: Pt = [foot[0] - t * Math.sin(th), foot[1] + t * Math.cos(th)];
    sv.dim(foot, top, 0.0, { dir: 'aligned', label: lab(t, 'R'), size: 2 });
    if (i === 0) {
      sv.text([wdt / 2, drop + t + 8], l('dos (extrados)', 'back (suction face)'), {
        size: 1.9,
        anchor: 'middle',
        color: INK_2,
      });
    }
    x += wdt * SC + gap;
  });
  const sv0 = d.view(20, yb, SC);
  sv0.text(
    [k(BLADE.stationWidth[0]!) / 2, -22],
    l('face plane (intrados), au vent', 'flat face (pressure side), windward'),
    { size: 1.9, anchor: 'middle', color: INK_2 },
  );
  // pitch note under the last station
  p.text(
    [20, yb + 22],
    l(
      'Lecture : le vent arrive par en dessous, la face plane au vent ; la pale avance vers la gauche, bord d’attaque devant. Trait mixte = plan du rotor : la face plane s’en écarte du pas θ (tableau).',
      'Reading: the wind arrives from below on the flat windward face; the blade moves to the left, leading edge first. Dashed = rotor plane: the flat face leans away from it by the pitch θ (table).',
    ),
    { size: 1.9, color: INK_2 },
  );

  // ------------------------------------------------------------------ station table
  const ty = 206;
  heading(d, 14, ty - 5, l('TABLEAU DES POSTES · d’après les plans', 'STATION TABLE · from the plans'), { size: 2.2 });
  const gh = grid(
    d,
    14,
    ty,
    [
      { label: l('Poste', 'Stn'), w: 12, align: 'middle' },
      { label: l('Rayon', 'Radius'), w: 20, align: 'end', mono: true },
      { label: l('Largeur', 'Width'), w: 20, align: 'end', mono: true },
      { label: l('Chute', 'Drop'), w: 18, align: 'end', mono: true },
      { label: l('Épaisseur', 'Thickness'), w: 24, align: 'end', mono: true },
      { label: l('Pas θ', 'Pitch θ'), w: 20, align: 'end', mono: true },
    ],
    BLADE.stationRadius.map((r, i) => [
      { t: String(i + 1), bold: true },
      labN(k(r), 0, 'E'),
      labN(k(BLADE.stationWidth[i]!), 0, 'R'),
      i === 0 ? '—' : labN(k(BLADE.stationDrop[i]!), 0, 'R'),
      labN(k(BLADE.stationThickness[i]!), 0, 'R'),
      i === 0 ? '—' : labN(bladePitch(i) / DEG, 1, 'D', '', '°'),
    ]),
    { size: 1.95, pad: 0.75, lineH: 3 },
  );
  p.text(
    [14, ty + gh + 3],
    l(
      'Millimètres. Chute = recul du bord de fuite par rapport à la face plane au bord d’attaque.',
      'Millimetres. Drop = how far the trailing edge sits behind the leading edge along the axis.',
    ),
    { size: 1.8, color: INK_2 },
  );

  // ------------------------------------------------------------------ notes
  box(
    d,
    134,
    ty - 2,
    98,
    l('NOTES', 'NOTES'),
    [
      {
        bullet: '1',
        t: l(
          `Pied : planche de ${nFr(k(BLADE.rootWidth), 0)} × ${nFr(k(BLADE.rootThickness), 0)} mm†, non travaillée. Le wiki parle d’un bois de 150 × 45 mm ; la longueur à tailler est ${nFr(k(BLADE.blankLength), 0)} mm* avec la chute du bout.`,
          `Root: a plank of ${nEn(k(BLADE.rootWidth), 0)} × ${nEn(k(BLADE.rootThickness), 0)} mm†, left uncarved. The wiki mentions a 150 × 45 mm timber; the length to cut is ${nEn(k(BLADE.blankLength), 0)} mm* with the tip offcut.`,
        ),
      },
      {
        bullet: '2',
        t: l(
          'Les postes sont tous les 100 mm* ; les plans graduent la pale tous les 100 mm sans nommer le rayon de chaque poste. Le gabarit est un contreplaqué découpé au contour de la coupe ; sa taille n’est pas publiée.',
          'The stations are every 100 mm*; the plans mark the blade every 100 mm without naming each station’s radius. A template is plywood cut to the outline of the section; its size is not published.',
        ),
      },
      { bullet: '3', t: EDU_NOTE },
    ],
    { size: 1.8 },
  );
  marksLegend(d, 238, ty - 2, 62);
  return d;
}

function cat2(a: ReturnType<typeof l>, valueMm: number, status: 'R' | 'D' | 'E') {
  const t = lab(valueMm, status);
  return l(`${a.fr}${t.fr}`, `${a.en}${t.en}`);
}

export const bladeCarving: DrawingSheet = {
  id: 'blade-carving',
  number: NUMBER,
  group: 'machine',
  title: TITLE,
  description: l(
    'La pale de 600 mm est taillée dans une planche de 153 mm de large, en suivant six postes. À chaque poste, les plans donnent la largeur, la chute du bord de fuite et l’épaisseur : de 153 à 55 mm de large et de 49 à 6 mm d’épais, du pied au bout. Chaque gabarit en contreplaqué reprend le contour de sa coupe ; le pied est coupé à 60° de chaque côté, pour que trois pales fassent 120°.',
    'The 600 mm blade is carved from a 153 mm wide plank, following six stations. At each station the plans give the width, the drop of the trailing edge and the thickness: from 153 to 55 mm wide and from 49 to 6 mm thick, root to tip. Each plywood template follows the outline of its section; the root is cut at 60° on each side, so that three blades make 120°.',
  ),
  scene: 'blades',
  parts: partIds('blades'),
  render,
};
