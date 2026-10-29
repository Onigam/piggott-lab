// Parts of the `blades` world (ids frozen in src/part-ids.ts): the carving of the blades and the hub. The faces, the root and the
// tip of a blade are labels of the 3D view and text of `blade`, not parts. Conventions: see site.ts. Sources named in the text:
// the video (01:22–02:17: the three blades), the Low-tech Lab wiki (steps 1–7) and Hugh Piggott's plans (2003: blade theory p. 9,
// small-machine stations p. 43). The station table below is the plans' (p. 43); src/three/dims.ts holds the same numbers for the
// 3D model and data.test.ts checks that the two agree.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { BLADE } from '../../three/dims';
import { lf, maint, sp, tf } from '../part-helpers';
import { mm } from '../units';

/** A column of the plans' station table (metres in dims.ts) as « 153, 153, 100 … » in each language; a zero is shown as an en dash. */
const column = (metres: readonly number[]) => {
  const fr = metres.map((m) => (m === 0 ? '–' : mm(m).fr)).join(', ');
  const en = metres.map((m) => (m === 0 ? '–' : mm(m).en)).join(', ');
  return { fr, en };
};
const widths = column(BLADE.stationWidth);
const drops = column(BLADE.stationDrop);
const thicks = column(BLADE.stationThickness);

export const BLADES_PARTS: PartInfo[] = [
  {
    id: 'blade-blank',
    scene: 'blades',
    category: 'mechanical',
    name: l('Plateau de bois', 'Timber blank'),
    short: l(
      'Le morceau de bois tendre dans lequel on sculpte une pale.',
      'The piece of softwood from which a blade is carved.',
    ),
    description: l(
      'Chaque pale part d’un plateau de bois : un bois imputrescible, léger et sans trop de nœuds, comme l’épicéa, le douglas ou le mélèze, dit la vidéo ; le wiki en fait de même avec une poutre de cèdre. Il faut une poutre d’au moins 95 × 35 mm sur 1,80 m (le wiki en utilise une de 150 × 45 mm) pour tirer trois pales identiques. Les nœuds se placent de préférence vers le pied de la pale, et on garde 4 à 5 cm de marge au bout.',
      'Each blade starts as a block of wood: a rot-resistant, light wood without too many knots, such as spruce, Douglas fir or larch, says the video; the wiki does the same with a cedar beam. You need a beam at least 95 × 35 mm and 1.80 m long (the wiki uses one of 150 × 45 mm) to get three identical blades. The knots are best placed towards the blade root, and a margin of 4 to 5 cm is kept at the tip.',
    ),
    material: l(
      'Bois tendre : épicéa, douglas, mélèze (cèdre dans le wiki)',
      'Softwood: spruce, Douglas fir, larch (cedar in the wiki)',
    ),
    specs: [
      sp('Poutre minimale', 'Minimum beam', l('95 × 35 mm, 1,80 m de long (wiki)', '95 × 35 mm, 1.80 m long (wiki)')),
      sp('Exemple du wiki', 'The wiki’s example', l('cèdre de 150 × 45 mm', '150 × 45 mm cedar')),
      sp('Pales à en tirer', 'Blades to get out of it', '3'),
      sp(
        'Marge au bout',
        'Margin at the tip',
        l('4 à 5 cm, retirée à la fin (wiki)', '4 to 5 cm, trimmed at the end (wiki)'),
      ),
    ],
    tip: l(
      'Choisissez un bois sec, droit et léger, et tirez les trois pales de la même poutre : elles auront le même poids et la même rigidité.',
      'Choose dry, straight, light wood, and cut the three blades from the same beam: they will have the same weight and stiffness.',
    ),
    video: ['01:22', '01:33'],
    design: l(
      'Le bois est léger et se travaille à la main : les plans trouvent la sculpture agréable et rapide pour une pièce unique. Un bois imputrescible évite la pourriture, puisque les pales passent leur vie dehors.',
      'Wood is light and can be worked by hand: the plans find carving pleasant and quick for a one-off piece. A rot-resistant wood avoids decay, since the blades spend their whole life outdoors.',
    ),
    qty: 3,
  },
  {
    id: 'station-templates',
    scene: 'blades',
    category: 'mechanical',
    name: l('Gabarits de sections', 'Station templates'),
    short: l(
      'Les six sections de la pale, du pied au bout : largeur, décalage et épaisseur.',
      'The six sections of the blade, root to tip: width, drop and thickness.',
    ),
    description: l(
      'Les plans décrivent la pale par six « stations », des sections le long de sa longueur, avec pour chacune une largeur, un « décalage » (la distance entre la face du plateau et le bord de fuite) et une épaisseur. Ces mesures donnent la bonne largeur de pale et son angle de calage : la pale est large et épaisse au pied, mince et étroite au bout, et tordue. On taille jusqu’à ce que chaque gabarit épouse la pale. Le wiki marque quatre zones à la place ; le labo suit les six stations des plans.',
      'The plans describe the blade by six “stations”, sections along its length, each with a width, a “drop” (the distance from the face of the workpiece to the trailing edge) and a thickness. These measures give the right blade width and its pitch angle: the blade is wide and thick at the root, thin and narrow at the tip, and twisted. You carve until each template fits the blade. The wiki marks four zones instead; the lab follows the plans’ six stations.',
    ),
    material: l('Carton fort ou contreplaqué mince', 'Stiff card or thin plywood'),
    specs: [
      sp('Largeur, du pied au bout', 'Width, root to tip', l(`${widths.fr} mm`, `${widths.en} mm`)),
      sp('Décalage', 'Drop', l(`${drops.fr} mm`, `${drops.en} mm`)),
      sp('Épaisseur', 'Thickness', l(`${thicks.fr} mm`, `${thicks.en} mm`)),
      sp(
        'Position des stations',
        'Station positions',
        tf(
          'estimate',
          `tous les ${mm(BLADE.stationRadius[1]! - BLADE.stationRadius[0]!).fr} mm, de ${mm(BLADE.stationRadius[0]!).fr} à ${mm(BLADE.stationRadius[5]!).fr} mm du centre`,
          `every ${mm(BLADE.stationRadius[1]! - BLADE.stationRadius[0]!).en} mm, from ${mm(BLADE.stationRadius[0]!).en} to ${mm(BLADE.stationRadius[5]!).en} mm from the centre`,
        ),
      ),
    ],
    tip: l(
      'Faites un seul jeu de gabarits pour les trois pales et gardez-le : vous retrouverez la forme exacte quand il faudra remplacer une pale.',
      'Make a single set of templates for the three blades and keep it: you will recover the exact shape when a blade has to be replaced.',
    ),
    design: l(
      'Un rotor conçu pour tourner à sept fois la vitesse du vent garde la même forme, quelle que soit sa taille : on agrandit ou réduit les mesures. Les plans préfèrent une pale très tordue et effilée, plus solide et qui démarre mieux à l’arrêt.',
      'A rotor designed to run at seven times the wind speed keeps the same shape whatever its size: the measures are simply scaled up or down. The plans prefer a strongly twisted and tapered blade, which is stronger and starts better from rest.',
    ),
    qty: 6,
  },
  {
    id: 'blade',
    scene: 'blades',
    category: 'mechanical',
    name: l('Pale', 'Blade'),
    short: l(
      'Une pale de 600 mm sculptée à la main : face au vent presque plate, dos arrondi.',
      'A 600 mm hand-carved blade: nearly flat windward face, curved back.',
    ),
    description: lf(
      'La pale se sculpte en deux temps : on travaille d’abord la face au vent (l’intrados), presque plate, puis le dos (l’extrados), arrondi, à la manière d’un profil d’aile d’avion qui accélère la rotation. Au pied, large de {rootW} mm et épais de {rootT} mm, la coupe d’environ 120° s’ajuste au disque de moyeu ; au bout, elle n’a plus que {tipW} mm de large et {tipT} mm d’épaisseur. Le bord de fuite est affiné à moins de 1 mm. La pale finie fait {bladeL} mm ; les trois doivent être parfaitement identiques.',
      'The blade is carved in two stages: first the windward face (the pressure side), nearly flat, then the back (the suction side), curved, like an aircraft wing profile that speeds the rotation. At the root, {rootW} mm wide and {rootT} mm thick, a cut of about 120° fits the hub disc; at the tip it is only {tipW} mm wide and {tipT} mm thick. The trailing edge is thinned to under 1 mm. The finished blade is {bladeL} mm long; the three must be perfectly identical.',
    ),
    material: l('Bois tendre, peint ou vernis', 'Softwood, painted or varnished'),
    specs: [
      sp('Longueur', 'Length', lf('{bladeL} mm', '{bladeL} mm')),
      sp('Largeur, pied → bout', 'Width, root → tip', lf('{rootW} → {tipW} mm', '{rootW} → {tipW} mm')),
      sp('Épaisseur, pied → bout', 'Thickness, root → tip', lf('{rootT} → {tipT} mm', '{rootT} → {tipT} mm')),
      sp(
        'Angle du pied / bord d’attaque',
        'Root angle / leading edge',
        l('120° / ≈ 60° (wiki)', '120° / ≈ 60° (wiki)'),
      ),
      sp('Masse d’une pale', 'Mass of one blade', tf('assumed', '≈ 0,35 kg', '≈ 0.35 kg')),
      sp(
        'Vitesse limite du bout de pale',
        'Tip speed limit',
        l('≈ 89 m/s, soit 200 mph (plans)', '≈ 89 m/s, i.e. 200 mph (plans)'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Le bord d’attaque s’use (pluie, poussière, insectes) et le bois se fend ; un bout de pale qui file trop vite devient bruyant et s’use vite. Dans une tempête, une machine à queue bloquée atteindrait ≈ {tipFixed25} m/s en bout de pale dans le modèle, contre ≈ 89 m/s de limite.',
        check:
          'Regardez les trois pales de près, machine arrêtée : bord d’attaque lisse, aucune fente, peinture intacte. Comparez-les : elles doivent paraître semblables.',
        care: 'Repeignez ou revernissez chaque année avant que le bois ne se fende ; Tripalium note le remplacement d’une pale parmi ses interventions. Équilibrez de nouveau après tout remplacement.',
      },
      {
        failure:
          'The leading edge wears (rain, dust, insects) and the wood splits; a blade tip that spins too fast gets noisy and wears quickly. In a storm a machine with a locked tail would reach ≈ {tipFixed25} m/s at the blade tip in the model, against the ≈ 89 m/s limit.',
        check:
          'Look closely at the three blades, machine stopped: smooth leading edge, no split, paint intact. Compare them: they must look alike.',
        care: 'Repaint or revarnish every year before the wood splits; Tripalium logs a blade replacement among its interventions. Rebalance after any replacement.',
      },
    ),
    tip: l(
      'Portez un masque anti-poussière quand vous poncez, et si possible travaillez dehors : la poussière de bois est un danger pour vous et pour les autres (plans).',
      'Wear a dust mask when sanding, and work outdoors if possible: wood dust is a hazard to you and to others (plans).',
    ),
    video: ['01:22', '01:44', '01:50', '02:07'],
    design: l(
      'Trois pales fines tournant vite font le même travail que beaucoup de pales larges tournant lentement : une pale rapide donne bien plus de portance par unité de surface (plans). Le profil, plat au vent et arrondi au dos, ressemble à une aile ; la forte torsion et l’effilement des plans rendent la pale solide et lui permettent de démarrer mieux à l’arrêt.',
      'Three slender blades turning fast do the same job as many wide blades turning slowly: a fast blade makes far more lift per unit of surface (plans). The profile, flat on the windward side and curved on the back, resembles a wing; the strong twist and taper of the plans make the blade strong and let it start better from rest.',
    ),
    qty: 3,
  },
  {
    id: 'hub-disc',
    scene: 'blades',
    category: 'mechanical',
    name: l('Disque de moyeu', 'Hub disc'),
    short: l(
      'Le disque de contreplaqué qui tient les trois pales à 120° les unes des autres.',
      'The plywood disc that holds the three blades at 120° to one another.',
    ),
    description: l(
      'Le disque de moyeu est un disque de contreplaqué de 9 mm ; le wiki n’en donne pas le diamètre, le labo reprend les 200 mm des plans (estimation). Les trois pales s’y vissent à 120° les unes des autres, un triangle de contreplaqué les serrant du côté du vent. Pour le centrer, le wiki préconise trois personnes et trois mètres en règle. On visse d’abord une vis par pale, on ajuste, puis on serre tout. Quatre trous de 12 mm traversent l’ensemble pour les tiges filetées, et un évidement de 60 mm sur 30 mm de profondeur reçoit le moyeu.',
      'The hub disc is a plywood disc 9 mm thick; the wiki does not give its diameter, the lab takes the plans’ 200 mm (estimate). The three blades are screwed onto it at 120° to one another, a plywood triangle clamping them on the windward side. To centre it, the wiki recommends three people and three metre rules. One screw per blade is fitted first, adjusted, then everything is tightened. Four 12 mm holes go through the assembly for the threaded rods, and a 60 mm recess 30 mm deep receives the hub.',
    ),
    material: l('Contreplaqué de 9 mm, vis de 5 × 30 mm', '9 mm plywood, 5 × 30 mm screws'),
    specs: [
      sp('Disque', 'Disc', l('contreplaqué de 9 mm (wiki)', '9 mm plywood (wiki)')),
      sp(
        'Diamètre',
        'Diameter',
        tf('estimate', 'non précisé par le wiki ; 200 mm dans les plans', 'not given by the wiki; 200 mm in the plans'),
      ),
      sp('Vis', 'Screws', l('5 × 30 mm (wiki)', '5 × 30 mm (wiki)')),
      sp('Trous pour les tiges', 'Rod holes', l('4 de 12 mm', '4 of 12 mm')),
      sp('Évidement du moyeu', 'Hub recess', l('Ø 60 mm, 30 mm de profondeur (wiki)', 'Ø 60 mm, 30 mm deep (wiki)')),
      sp('Alignement des pointes', 'Tip tracking', l('à 10 mm près (plans)', 'within 10 mm (plans)')),
    ],
    maintenance: maint(
      {
        failure:
          'Le contreplaqué s’écrase ou se fend aux serrages répétés, une vis qui prend du jeu : une pale se met en avance sur les autres et le rotor vibre.',
        check:
          'Faites passer les bouts de pale devant un repère fixe : ils doivent suivre la même trace à 10 mm près (plans) ; regardez si les têtes de vis sont toujours bien en place.',
        care: 'Peignez le disque avant l’assemblage final (plans), resserrez les écrous à chaque visite et ne forcez pas : on peut corriger l’alignement en serrant les écrous du côté en retard, ce qui écrase un peu le bois.',
      },
      {
        failure:
          'The plywood crushes or splits with repeated tightening, a screw works loose: one blade gets ahead of the others and the rotor vibrates.',
        check:
          'Pass the blade tips in front of a fixed mark: they must follow the same track within 10 mm (plans); check that the screw heads are still seated.',
        care: 'Paint the disc before the final assembly (plans), retighten the nuts at each visit and do not force: the tracking can be corrected by tightening the nuts on the lagging side, which crushes the wood slightly.',
      },
    ),
    tip: l(
      'Assemblez à plusieurs, à plat, sur un sol propre : un disque mal centré donne un rotor déséquilibré qu’on ne rattrape qu’avec du plomb.',
      'Assemble with several people, flat, on a clean floor: an off-centre disc gives an unbalanced rotor that can only be rescued with lead.',
    ),
    design: l(
      'Le disque est un « sandwich » qui serre le pied des pales sans les affaiblir : le contreplaqué est facile à percer et à ajuster, et un petit écrasement corrige l’alignement. C’est la pièce qui transforme trois pales taillées à la main en un rotor rond.',
      'The disc is a “sandwich” that clamps the blade roots without weakening them: plywood is easy to drill and adjust, and a slight crush corrects the tracking. It is the part that turns three hand-carved blades into a round rotor.',
    ),
    qty: 1,
  },
];
