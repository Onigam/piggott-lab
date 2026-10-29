import { COLORS, Drawing, INK_2, W, type DrawingSheet, type Pt, type View } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { FIG } from '../data/figures';
import { PARTS } from '../data/parts';
import { nEn, nFr } from '../data/units';
import { HEAD_Y, MAST } from '../three/dims';
import { EDU_NOTE, FILL, arrow, box, grid, heading, marksLegend, poly, med } from './draw';
import { DEG, cat, k, lab, labN } from './geom';

const NUMBER = 'PL-06';
const TITLE = l('Mât, haubans et levage', 'Tower, guys and raising');

const HUB = 12;
const TOP = HUB + HEAD_Y.capTop - 0.006;
/** Guy levels as the 3D builds them: a level every `guySpacing` metres, then one just under the cap. */
const LEVELS = (): number[] => {
  const out: number[] = [];
  for (let h = MAST.guySpacing; h < TOP - 1.5; h += MAST.guySpacing) out.push(h);
  out.push(TOP - 0.35);
  return out;
};
const rho = (h: number): number => Math.max(2, MAST.guyAnchorRatio * h);

/** A person, a stick figure of 1.7 m at the scale of the view (paper units), feet at (x, y). */
function person(p: View, x: number, y: number, color: string = COLORS.ink): void {
  p.circle([x, y - 7.2], 1.1, { w: W.medium, color, fill: COLORS.paper });
  p.line([x, y - 6], [x, y - 2.6], { w: W.medium, color });
  p.line([x, y - 2.6], [x - 1.4, y], { w: W.medium, color });
  p.line([x, y - 2.6], [x + 1.4, y], { w: W.medium, color });
  p.line([x - 1.8, y - 4.6], [x + 1.8, y - 5.4], { w: W.medium, color });
}

// ------------------------------------------------------------------------------------------------ A: elevation, 1:100

function elevation(d: Drawing, v: View): void {
  const p = d.paper();
  const levels = LEVELS();
  // ground and a ruler of heights
  v.line([-9000, 0], [9000, 0], { w: W.medium });
  v.rect([-9000, 0], [9000, -700], { w: 0, fill: 'none', hatch: 'earth' });
  v.rect([-450, 100], [450, -250], { w: W.medium, fill: FILL.steel });
  // mast
  const topM = TOP * 1000;
  v.line([0, 210], [0, topM], { w: W.thick * 1.6, color: COLORS.ink });
  // the machine at the top, drawn to the scale of the view
  const hub = HUB * 1000;
  v.rect([-190 - 67, hub + 600], [-190, hub - 600], { w: W.thin, dash: 'phantom', color: INK_2, fill: 'none' });
  v.rect([-100, hub + 6], [100, hub - 50], med(FILL.steel));
  v.line([140, hub - 16], [640, hub - 16 + 0], { w: W.medium });
  v.rect([620, hub + 134], [1060, hub - 166], { w: W.thin, fill: FILL.wood });
  // guys: four per level, two seen on each side; the anchors on the ground
  for (const h of levels) {
    const a = rho(h) * Math.SQRT1_2 * 1000;
    for (const s of [-1, 1]) {
      v.line([0, h * 1000], [s * a, 120], { w: W.thin, color: INK_2 });
      v.rect([s * a - 200, 120], [s * a + 200, -130], { w: W.thin, fill: FILL.steel });
    }
  }
  // levels: dimensions on the left
  let prev = 0;
  for (const h of levels) {
    v.dim([-100, prev * 1000], [-100, h * 1000], -22, {
      dir: 'v',
      label: labN(
        h - prev,
        h - prev === Math.round(h - prev) ? 0 : 1,
        h - prev === MAST.guySpacing ? 'R' : 'E',
        '',
        ' m',
      ),
      size: 2,
    });
    prev = h;
  }
  v.dim([-100, 0], [-100, hub], -42, {
    dir: 'v',
    label: cat(l('moyeu ', 'hub '), labN(HUB, 0, 'E', '', ' m')),
    size: 2.2,
  });
  // the 12 m line of the French rule
  v.line([-1500, hub], [4200, hub], { w: W.thin, dash: 'phantom', color: COLORS.red });
  p.text(
    [v.map([4300, hub])[0], v.map([4300, hub])[1]],
    l('12 m : seuil du permis (France)', '12 m: permit threshold (France)'),
    { size: 1.9, color: COLORS.red, baseline: 'middle' },
  );
  // labels
  v.leader(
    [0, levels[2]! * 1000 - 600],
    16,
    -3,
    l('haubans du haut : ils portent l’essentiel', 'top guys: they carry most of the load'),
    { size: 1.9 },
  );
  v.leader([0, levels[0]! * 1000], 14, 6, l('niveaux tous les 4 m', 'levels every 4 m'), { size: 1.9 });
  v.leader([0, 250], 12, 8, l('pied articulé, voir D', 'hinged foot, see D'), { size: 1.9 });
  v.leader([-190, hub + 400], -12, -4, l('rotor Ø1,2 m', 'rotor Ø1.2 m'), { size: 1.9 });
}

// ------------------------------------------------------------------------------------------------ B: plan, 1:200

function plan(d: Drawing, v: View): void {
  const levels = LEVELS();
  const R = Math.max(...levels.map(rho)) * 1000;
  for (const h of levels) v.circle([0, 0], rho(h) * 1000, { w: W.thin, dash: 'hidden', color: INK_2 });
  for (const h of levels) {
    for (const az of MAST.guyAzimuthsDeg) {
      const x = rho(h) * Math.cos(az * DEG) * 1000;
      const y = -rho(h) * Math.sin(az * DEG) * 1000;
      v.line([0, 0], [x, y], { w: W.thin, color: h === levels[levels.length - 1] ? COLORS.ink : INK_2 });
      v.rect([x - 200, y + 200], [x + 200, y - 200], { w: W.thin, fill: FILL.steel });
    }
  }
  v.circle([0, 0], 600, { w: W.thin, color: INK_2, fill: 'none' });
  v.circle([0, 0], 140, { w: W.medium, fill: COLORS.ink });
  v.center([-R - 1200, 0], [R + 1200, 0], 0);
  v.center([0, -R - 1200], [0, R + 1200], 0);
  const p = d.paper();
  const [wx, wy] = v.map([-R - 1200, R + 900]);
  arrow(p, [wx, wy], [wx + 12, wy], INK_2, W.medium);
  p.text([wx + 14, wy], l('vent', 'wind'), { size: 2, baseline: 'middle', color: INK_2 });
  v.leader(
    [rho(levels[2]!) * Math.cos(45 * DEG) * 1000, -rho(levels[2]!) * Math.sin(45 * DEG) * 1000],
    12,
    -4,
    cat(
      l('ancrage à ', 'anchor at '),
      l(
        `${nFr(MAST.guyAnchorRatio, 1)} × la hauteur du niveau*`,
        `${nEn(MAST.guyAnchorRatio, 1)} × the level’s height*`,
      ),
    ),
    { size: 1.8 },
  );
}

// ------------------------------------------------------------------------------------------------ D: hinged foot, 1:10

function foot(v: View): void {
  const pad = MAST.padSize * 1000;
  const above = MAST.padAbove * 1000;
  const pH = MAST.padHeight * 1000;
  v.line([-pad * 0.68, 0], [pad * 0.68, 0], { w: W.medium });
  v.rect([-pad / 2, above], [pad / 2, above - pH], { w: W.medium, fill: FILL.steel });
  v.text([0, above - pH / 2], l('socle béton*', 'concrete pad*'), { size: 1.9, anchor: 'middle', baseline: 'middle' });
  const lug = 140;
  v.rect([-lug / 2, above], [lug / 2, above + k(MAST.lugHeight)], { w: W.medium, fill: FILL.steel, hatch: 'steel' });
  const yPin = above + 110;
  v.rect([-50, yPin + 60], [50, yPin - 60], med(COLORS.paper));
  v.circle([0, yPin], k(MAST.pinDiameter) / 2, { w: W.medium, fill: FILL.steel, hatch: 'steel' });
  v.rect([-k(MAST.pipeOuter) / 2, yPin + 60], [k(MAST.pipeOuter) / 2, yPin + 380], med(FILL.steel));
  v.polyline(
    [
      [-60, yPin + 420],
      [60, yPin + 380],
    ],
    { w: W.thin },
  );
  v.center([0, yPin - 70], [0, yPin + 440], 0);
  // the mast lowered: the pipe lying on the other side, dashed, and the arc between the two
  v.rect([60, yPin + k(MAST.pipeOuter) / 2], [560, yPin - k(MAST.pipeOuter) / 2], {
    w: W.thin,
    dash: 'hidden',
    color: INK_2,
    fill: 'none',
  });
  v.arc([0, yPin], 330, 0, 90, { w: W.thin, color: COLORS.copper });
  v.polyline(
    [
      [590, yPin + 40],
      [560, yPin - 40],
    ],
    { w: W.thin },
  );
  v.dim([-pad / 2, above - pH], [pad / 2, above - pH], 4, { dir: 'h', label: lab(pad, 'E'), size: 2 });
  v.leader([0, yPin], -14, -10, cat(l('axe Ø', 'pin Ø'), lab(k(MAST.pinDiameter), 'E')), { size: 1.9 });
  v.leader([lug / 2 - 10, above + 200], 16, -6, l('deux oreilles d’acier*', 'two steel lugs*'), { size: 1.9 });
  v.text([300, yPin - 70], l('mât couché (pointillé)', 'mast laid down (dashed)'), { size: 1.8, color: COLORS.copper });
}

// ------------------------------------------------------------------------------------------------ C: raising, principle only

function raising(d: Drawing, x: number, y: number, L: number): void {
  const p = d.paper();
  const hx = x + 36;
  // ground and the hinge
  p.line([x - 14, y], [x + L + 40, y], { w: W.medium });
  p.circle([hx, y - 1.5], 1.6, { w: W.medium, fill: COLORS.paper });
  // fall zone under the swing of the mast
  const zone: Pt[] = [[hx, y]];
  for (let a = 0; a <= 90; a += 6) zone.push([hx + L * Math.cos(a * DEG), y - L * Math.sin(a * DEG)]);
  poly(p, zone, { w: W.thin, color: COLORS.red, fill: 'none', hatch: 'plastic' });
  poly(p, zone, { w: W.thin, color: COLORS.red, fill: 'none', dash: 'hidden' });
  p.text([hx + L * 0.5, y - L * 0.3], l('ZONE DE CHUTE', 'FALL ZONE'), {
    size: 2.3,
    weight: 'bold',
    color: COLORS.red,
    anchor: 'middle',
    halo: true,
  });
  p.text([hx + L * 0.5, y - L * 0.3 + 4.5], l('personne', 'nobody'), {
    size: 2.3,
    weight: 'bold',
    color: COLORS.red,
    anchor: 'middle',
    halo: true,
  });
  // the three positions of the mast
  for (const [a, col, w] of [
    [0, COLORS.ink, W.thick],
    [40, INK_2, W.medium],
    [90, COLORS.ink, W.thick],
  ] as const) {
    const tx = hx + L * Math.cos(a * DEG);
    const ty = y - L * Math.sin(a * DEG);
    p.line([hx, y - 1.5], [tx, ty], { w, color: col, dash: a === 40 ? 'hidden' : undefined });
    p.rect([tx - 3, ty - 1.2], [tx + 3, ty + 1.2], { w: W.thin, color: col, fill: FILL.steel });
  }
  p.arc([hx, y], L * 0.5, 0, 40, { w: W.thin, color: COLORS.copper });
  // rope from the mast to the people, who stand well away from the zone
  const [mx, my] = [hx + L * 0.6 * Math.cos(40 * DEG), y - L * 0.6 * Math.sin(40 * DEG)];
  p.line([mx, my], [x + 2, y - 11], { w: W.medium, color: COLORS.copper });
  p.text([x + 28, y - 28], l('corde ou câble de levage', 'lifting rope or cable'), {
    size: 1.9,
    color: COLORS.copper,
    anchor: 'end',
  });
  p.text([x + 28, y - 24], l('neufs et sûrs', 'new and sound'), { size: 1.9, color: COLORS.copper, anchor: 'end' });
  for (const dx of [2, 7, 12]) person(p, x + dx - 6, y);
  p.text([x - 14, y + 5], l('à plusieurs, à distance, casque', 'several people, at a distance, hard hats'), {
    size: 1.9,
    anchor: 'start',
  });
  p.text([hx + 3, y - L - 3], l('mât dressé', 'mast upright'), { size: 1.9, color: INK_2 });
  p.text([hx + 4, y + 5], l('mât couché, machine montée', 'mast laid down, machine fitted'), {
    size: 1.9,
    color: INK_2,
  });
}

// ------------------------------------------------------------------------------------------------ the sheet

function render(): Drawing {
  const d = new Drawing();
  d.frame({
    title: TITLE,
    subtitle: l(
      'Mât haubané de 12 m, niveaux de haubans, pied articulé, levage de principe · 1:100, 1:200, 1:10',
      '12 m guyed mast, guy levels, hinged foot, the principle of raising · 1:100, 1:200, 1:10',
    ),
    number: NUMBER,
    scale: '1:100·1:10',
  });
  heading(d, 14, 13, l('A · ÉLÉVATION · 1:100', 'A · ELEVATION · 1:100'), { size: 2.2 });
  const va = d.view(82, 172, 0.01);
  elevation(d, va);
  heading(d, 168, 13, l('B · PLAN DES ANCRAGES · 1:200', 'B · PLAN OF THE ANCHORS · 1:200'), { size: 2.2 });
  plan(d, d.view(214, 64, 0.005));
  heading(d, 290, 13, l('D · LE PIED ARTICULÉ · 1:10', 'D · THE HINGED FOOT · 1:10'), { size: 2.2 });
  foot(d.view(338, 92, 0.1));
  heading(
    d,
    262,
    134,
    l('C · LEVER LA MACHINE · principe, pas à l’échelle', 'C · RAISING THE MACHINE · principle, not to scale'),
    { size: 2.2 },
  );
  raising(d, 288, 236, 72);

  // parts list and notes
  const ids = ['tower', 'guy-wires', 'tower-base', 'wind-turbine'];
  const specs: Record<string, ReturnType<typeof l>> = {
    tower: cat(l('tube d’acier Ø', 'steel pipe Ø'), lab(k(MAST.pipeOuter), 'R')),
    'guy-wires': cat(l('4 par niveau, tous les ', '4 per level, every '), labN(MAST.guySpacing, 0, 'R', '', ' m')),
    'tower-base': l('socle, deux oreilles, axe*', 'pad, two lugs, pin*'),
    'wind-turbine': cat(l('au sommet : ', 'on top: '), labN(HUB, 0, 'E', '', ' m')),
  };
  heading(d, 14, 196, l('REPÈRES', 'ITEMS'), { size: 2.2 });
  const gh = grid(
    d,
    14,
    201,
    [
      { label: l('Désignation', 'Part'), w: 52 },
      { label: l('Dimensions', 'Dimensions'), w: 84 },
    ],
    ids.map((id) => [PARTS.find((x) => x.id === id)!.name, specs[id]!]),
    { size: 1.85, pad: 0.7, lineH: 2.9 },
  );
  box(
    d,
    14,
    201 + gh + 4,
    136,
    l('NOTES', 'NOTES'),
    [
      {
        bullet: '1',
        t: l(
          `Le mât est un tube d’acier de ${nFr(k(MAST.pipeOuter), 1)} mm ; les plans citent 6 m (lieu très dégagé), 12 ou 18 m. Le labo l’ajuste de ${nFr(FIG.mastMin[0])} à ${nFr(FIG.mastMax[0])} m ; en France, le permis de construire commence à 12 m (voir la mairie). Les haubans, tous les 4 m, sont dessinés comme dans le modèle 3D ; fondation et ancrages ne sont pas donnés par les sources.`,
          `The mast is a ${nEn(k(MAST.pipeOuter), 1)} mm steel pipe; the plans name 6 m (very open place), 12 or 18 m. The lab adjusts it from ${nEn(FIG.mastMin[0])} to ${nEn(FIG.mastMax[0])} m; in France a building permit starts at 12 m (ask the town hall). The guys, every 4 m, are drawn as in the 3D model; foundation and anchors are not given by the sources.`,
        ),
      },
      {
        bullet: '2',
        t: l(
          'Sécurité : par temps calme, avec plusieurs personnes et une corde neuve ; interrupteur de freinage fermé ; personne sous la machine ni dans la zone de chute. Tripalium a vu une corde casser : éolienne et mât sont tombés d’environ 2 m.',
          'Safety: in calm weather, with several people and a new rope; brake switch closed; nobody under the machine or in the fall zone. Tripalium has seen a rope break: turbine and mast fell about 2 m.',
        ),
      },
      { bullet: '3', t: EDU_NOTE },
    ],
    { size: 1.75 },
  );
  marksLegend(d, 160, 201, 70);
  return d;
}

export const towerGuys: DrawingSheet = {
  id: 'tower-guys',
  number: NUMBER,
  group: 'site',
  title: TITLE,
  description: l(
    'Le mât est un simple tube d’acier haubané : des haubans tous les 4 m environ, ceux du haut portant l’essentiel de l’effort. Son pied est articulé, pour assembler la machine au sol puis la relever, ou la redescendre pour l’entretien. Le dessin de principe du levage rappelle la règle : plusieurs personnes à distance, une corde neuve, et jamais personne sous la machine.',
    'The mast is a plain guyed steel pipe: guys about every 4 m, the top ones carrying most of the load. Its foot is hinged, so the machine is assembled on the ground then raised, or lowered for maintenance. The principle drawing of the lift recalls the rule: several people at a distance, a new rope, and nobody ever under the machine.',
  ),
  scene: 'site',
  parts: ['tower', 'guy-wires', 'tower-base', 'wind-turbine'],
  render,
};
