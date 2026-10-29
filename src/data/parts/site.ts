// Parts of the `site` world (ids frozen in src/part-ids.ts). Status words: see ../part-helpers.ts.
//
// Conventions of the catalogue (checked by ../data.test.ts):
//   - `maintenance` is THREE paragraphs, each opened by a bold label, in this order: the typical failure, how a visitor
//     can check it, the routine maintenance (see `maint`).
//   - Who says what is always visible in the text, by name (never by a research code): the video, the Low-tech Lab wiki,
//     Hugh Piggott's plans (2003), Tripalium, Service-public, the model (« modèle »), or the lab's own drawing
//     (« estimation »). A value computed from reported figures is « dérivé », from the simulation « résultat du modèle ».
//   - The video shows NO site: only the machine and a test mast. The site sheets are built from the plans (wiring, batteries,
//     tower, siting), from Tripalium's maintenance notes and from the model; they say so where it matters.
//   - The label says 200 W (nominal, wind speed not given); the model finds about 60 W at 12 m/s. A text that quotes a power says which.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, tf } from '../part-helpers';

export const SITE_PARTS: PartInfo[] = [
  {
    id: 'wind-turbine',
    scene: 'site',
    category: 'mechanical',
    name: l('Éolienne', 'Wind turbine'),
    short: l(
      'La machine au sommet du mât : rotor, alternateur, nacelle et queue. Détail dans la vue de l’éolienne.',
      'The machine on top of the mast: rotor, alternator, nacelle and tail. Detail in the turbine view.',
    ),
    description: lf(
      'C’est l’éolienne Piggott de la vidéo, vue de loin : un **rotor** de trois pales de {diameter} m, un **alternateur** sans réducteur, une **nacelle** en acier qui pivote sur le mât et une **queue** qui replie la machine quand le vent forcit. Elle charge une batterie 12 V. L’étiquette annonce {rated} W (valeur nominale : la vitesse de vent n’est pas donnée) ; le modèle du labo, qui n’a pas été réglé sur cette étiquette, trouve environ {w12} W à 12 m/s. Ouvrez la vue de l’éolienne pour voir chaque pièce.',
      'This is the Piggott turbine of the video, seen from afar: a {diameter} m **rotor** of three blades, a gearless **alternator**, a steel **nacelle** that swivels on the mast and a **tail** that folds the machine away when the wind rises. It charges a 12 V battery. The label says {rated} W (a nominal value: the wind speed is not given); the lab’s model, which was not tuned to that label, finds about {w12} W at 12 m/s. Open the turbine view to see each part.',
    ),
    material: l(
      'Bois (pales), acier, cuivre, résine polyester et aimants néodyme',
      'Wood (blades), steel, copper, polyester resin and neodymium magnets',
    ),
    specs: [
      sp('Diamètre du rotor', 'Rotor diameter', '1,20 m'),
      sp('Pales', 'Blades', '3'),
      sp(
        'Puissance annoncée',
        'Rated power',
        l('200 W à 12 V (nominal, vent non précisé)', '200 W at 12 V (nominal, wind speed not given)'),
      ),
      sp(
        'Puissance du modèle',
        'Model power',
        tf(
          'model',
          '≈ {w12} W à 12 m/s, ≈ {peak} W au mieux (à {peakWind} m/s)',
          '≈ {w12} W at 12 m/s, ≈ {peak} W at best (at {peakWind} m/s)',
        ),
      ),
      sp('Surface balayée', 'Swept area', tf('derived', '{area} m²')),
      sp('Début du repli', 'Furling starts', l('≈ 10 m/s (vidéo)', '≈ 10 m/s (video)')),
      sp(
        'Famille de machines',
        'Machine family',
        l('rotors de 1,0 à 4,2 m (Tripalium)', '1.0 to 4.2 m rotors (Tripalium)'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une soudure de la queue qui lâche après quelques années de vibrations (Tripalium raconte une queue tombée au bout d’environ quatre ans, mal soudée), un roulement qui se grippe, un fil coincé entre la nacelle et le mât.',
        check:
          'Fermez l’interrupteur de freinage, puis regardez de loin : les trois pales décrivent-elles le même cercle, la queue est-elle droite, la machine tourne-t-elle sans à-coups ni frottement ?',
        care: 'Descendez la machine sur le pied articulé une fois par an : boulons, jeu du moyeu, graisse, état des pales. Les carnets de Tripalium notent ces visites.',
      },
      {
        failure:
          'A tail weld that gives way after a few years of vibration (Tripalium tells of a tail that fell after about four years, badly welded), a bearing that seizes, a wire trapped between the nacelle and the mast.',
        check:
          'Close the brake switch, then look from a distance: do the three blades sweep the same circle, is the tail straight, does the machine turn without jolts or rubbing?',
        care: 'Lower the machine on the hinged base once a year: bolts, hub play, grease, state of the blades. Tripalium’s logbooks record such visits.',
      },
    ),
    tip: l(
      'Arrêtez toujours la machine avec l’interrupteur de freinage avant de la toucher ou de monter : ne vous fiez pas à un rotor « qui a l’air lent ».',
      'Always stop the machine with the brake switch before touching it or climbing: do not trust a rotor that “looks slow”.',
    ),
    video: ['00:45', '01:03', '07:11'],
    design: l(
      'Trois pales fines et rapides, pas de réducteur, pas de fer dans l’alternateur : tout est pensé pour qu’un atelier de village puisse la construire, la comprendre et la réparer. Le reportage de France 3 explique que la méthode accepte de perdre un peu de performance pour que la machine reste lisible et tolère les erreurs.',
      'Three thin, fast blades, no gearbox, no iron in the alternator: everything is meant so that a village workshop can build, understand and repair it. The France 3 report explains that the method accepts losing a little performance so that the machine stays legible and forgiving.',
    ),
    qty: 1,
  },
  {
    id: 'tower',
    scene: 'site',
    category: 'structure',
    name: l('Mât', 'Tower'),
    short: l(
      'Tuyau d’acier haubané qui porte la machine hors des turbulences.',
      'Guyed steel pipe that lifts the machine out of the turbulence.',
    ),
    description: lf(
      'Le mât est un simple tuyau d’eau en acier : les plans de Hugh Piggott disent qu’un tube de 60 mm (2 pouces) suffit, haubané. Il doit monter la machine au-dessus des turbulences : 6 m dans un lieu très dégagé, plus souvent 12 ou 18 m. Plus haut vaut mieux. La vidéo ne montre qu’un mât d’essai ; le labo permet de 3 à 24 m. Le haut du mât s’enfile dans le tube pivot de la nacelle, et les fils descendent par l’intérieur.',
      'The mast is a plain steel water pipe: Hugh Piggott’s plans say a 60 mm (2 in) tube is enough, guyed. It must lift the machine above the turbulence: 6 m in a very open place, more often 12 or 18 m. The higher the better. The video only shows a test mast; the lab allows 3 to 24 m. The top of the mast slides into the nacelle’s pivot tube, and the wires come down inside.',
    ),
    material: l('Tuyau d’eau en acier', 'Steel water pipe'),
    specs: [
      sp('Tube du mât', 'Mast tube', l('60 mm (2 pouces)', '60 mm (2 in)')),
      sp(
        'Hauteurs citées par les plans',
        'Heights named by the plans',
        l('6 m (très dégagé), 12 ou 18 m', '6 m (very open), 12 or 18 m'),
      ),
      sp('Mât de la vidéo', 'The video’s mast', l('non précisé (mât d’essai)', 'not given (test mast)')),
      sp('Haubans', 'Guys', l('tous les ≈ 4 m (plans)', 'every ≈ 4 m (plans)')),
      sp(
        'Mât du labo par défaut',
        'Lab mast by default',
        tf('assumed', '12 m, réglable de {mastMin} à {mastMax} m', '12 m, adjustable from {mastMin} to {mastMax} m'),
      ),
      sp(
        'Vent au moyeu, hameau',
        'Hub wind, hamlet',
        tf(
          'model',
          '{hub6} / {hub12} / {hub18} m/s pour 6 / 12 / 18 m',
          '{hub6} / {hub12} / {hub18} m/s for 6 / 12 / 18 m',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un mât mal haubané plie dans les rafales ; l’acier rouille au pied et aux soudures des demi-tubes qui reçoivent les haubans.',
        check:
          'Regardez le mât de deux côtés à angle droit : il doit être droit, les haubans tendus de façon semblable, sans fil tordu à la sortie du bas.',
        care: 'Repeignez ou galvanisez le tube, et profitez de la descente annuelle de la machine sur le pied articulé pour tout contrôler.',
      },
      {
        failure:
          'A badly guyed mast bends in gusts; the steel rusts at the foot and at the welded half-pipes that take the guys.',
        check:
          'Look at the mast from two sides at right angles: it must be straight, the guys equally taut, with no twisted wire at the bottom outlet.',
        care: 'Repaint or galvanise the tube, and use the yearly lowering of the machine on the hinged base to check everything.',
      },
    ),
    tip: l(
      'En France, un mât de moins de 12 m ne demande en général aucune formalité, un mât de 12 m ou plus demande un permis de construire : renseignez-vous auprès de la mairie.',
      'In France a mast under 12 m generally needs no formality, a mast of 12 m or more needs a building permit: check with the mairie (town hall).',
    ),
    design: lf(
      'Les plans acceptent un tube léger, mais plus il monte, plus il faut de haubans. La hauteur compte beaucoup : dans le modèle, au pied de grands arbres de 8 m, un mât de 6 m produit {calmKwh6} kWh par an, un mât de 18 m {calmKwh18} kWh (résultat du modèle, site de la vallée calme).',
      'The plans accept a light tube, but the higher it goes, the more guys it needs. Height matters a great deal: in the model, among 8 m trees, a 6 m mast yields {calmKwh6} kWh a year, an 18 m mast {calmKwh18} kWh (model result, calm valley site).',
    ),
    qty: 1,
  },
  {
    id: 'guy-wires',
    scene: 'site',
    category: 'structure',
    name: l('Haubans', 'Guy wires'),
    short: l(
      'Câbles qui tiennent le mât droit, tous les 4 m environ.',
      'Cables that hold the mast upright, about every 4 m.',
    ),
    description: l(
      'Les haubans sont des câbles tendus du mât vers le sol, dans plusieurs directions. Les plans en posent tous les 4 m environ : ceux du haut portent l’essentiel de l’effort, les autres ne font que raidir le tube. Ils passent bien à l’écart du bout des pales, mais pas trop loin en dessous, sinon le tube plie davantage quand le vent forcit. Aucune source ne donne la position des ancrages : le labo les dessine à titre d’illustration (estimation).',
      'The guy wires are cables stretched from the mast to the ground, in several directions. The plans fit them about every 4 m: the top ones carry most of the load, the others only stiffen the tube. They pass well clear of the blade tips, but not too far below them, or the tube bends more when the wind rises. No source gives the position of the anchors: the lab draws them as an illustration (estimate).',
    ),
    material: l(
      'Câble d’acier galvanisé (ou cordage, fil de clôture, chaîne selon les plans)',
      'Galvanised steel wire rope (or rope, fence wire, chain, as the plans list)',
    ),
    specs: [
      sp('Espacement', 'Spacing', l('≈ 4 m le long du mât (plans)', '≈ 4 m along the mast (plans)')),
      sp('Vie d’un câble galvanisé', 'Life of galvanised wire rope', l('5 à 10 ans (plans)', '5 to 10 years (plans)')),
      sp(
        'Autres matières citées',
        'Other materials named',
        l(
          'cordage (provisoire), fil de clôture (bon marché, mais peut casser), chaîne (mât court)',
          'fibre rope (temporary), fence wire (cheap, but can snap), chain (short mast)',
        ),
      ),
      sp(
        'Fixation sur le mât',
        'Fixing on the mast',
        l('demi-tubes soudés, le hauban passe dedans (plans)', 'welded half-pipes, the guy passes through (plans)'),
      ),
      sp('Ancrages', 'Anchors', l('non donnés par les sources', 'not given by the sources')),
    ],
    maintenance: maint(
      {
        failure:
          'Un hauban qui casse ou qui lâche à l’ancrage. Le câble galvanisé fatigue en cinq à dix ans ; le fil de clôture peut claquer, préviennent les plans.',
        check:
          'Faites le tour du mât : tensions semblables, aucun brin cassé, pas de rouille aux boucles, ancrages sans jeu.',
        care: 'Remplacez les haubans avant la fin de leur durée de vie et retendez-les après les premiers mois.',
      },
      {
        failure:
          'A guy that breaks or pulls out at the anchor. Galvanised rope tires in five to ten years; fence wire can snap, the plans warn.',
        check: 'Walk round the mast: similar tensions, no broken strand, no rust at the loops, anchors with no play.',
        care: 'Replace the guys before the end of their life and re-tension them after the first few months.',
      },
    ),
    tip: l(
      'Gardez les haubans bien à l’écart du bout des pales, mais pas beaucoup plus bas : le mât travaille d’autant plus en flexion.',
      'Keep the guys well clear of the blade tips, but not much lower: the mast then works harder in bending.',
    ),
    design: l(
      'Un tube léger haubané coûte bien moins qu’un mât autoportant : les plans le disent, avec une condition, des haubans en nombre. Seuls ceux du haut sont forts ; les autres donnent de la raideur.',
      'A light guyed tube costs far less than a free-standing mast: the plans say so, on one condition, enough guys. Only the top ones are strong; the others give stiffness.',
    ),
  },
  {
    id: 'tower-base',
    scene: 'site',
    category: 'structure',
    name: l('Pied de mât articulé', 'Hinged base'),
    short: l(
      'Charnière au pied du mât pour monter et descendre la machine sans échelle.',
      'Hinge at the foot of the mast to raise and lower the machine without a ladder.',
    ),
    description: l(
      'Le pied du mât est articulé : on assemble la machine au sol, mât couché, puis on le relève ; pour l’entretien, on le redescend. Les plans disent que l’articulation peut se faire de plusieurs façons (de la cornière d’acier suffit) et qu’il faut laisser sortir les fils par le bas sans les plier, pour pouvoir vérifier qu’ils ne se tordent pas. Tripalium rapporte une corde de levage qui a cassé : l’éolienne et son mât sont tombés d’environ 2 m.',
      'The foot of the mast is hinged: the machine is assembled on the ground with the mast lying down, then raised; for maintenance it is lowered again. The plans say the hinge can be made in several ways (steel angle will do) and that the wires must leave at the bottom without kinking, so that you can check they are not twisting. Tripalium reports a lifting rope that broke: the turbine and its mast fell about 2 m.',
    ),
    material: l('Acier : cornières et axe d’articulation', 'Steel: angle iron and hinge pin'),
    specs: [
      sp('Articulation', 'Hinge', l('cornière d’acier, axe (plans)', 'steel angle, pin (plans)')),
      sp(
        'Sortie des fils',
        'Wire outlet',
        l('en bas, sans pli, visible (plans)', 'at the bottom, no kink, visible (plans)'),
      ),
      sp('Chute de Tripalium', 'Tripalium’s fall', l('≈ 2 m (corde de levage cassée)', '≈ 2 m (lifting rope broke)')),
      sp(
        'Fondation et ancrages',
        'Foundation and anchors',
        l('non donnés par les sources', 'not given by the sources'),
      ),
      sp('Masse à lever', 'Mass to lift', l('inconnue (non publiée)', 'unknown (not published)')),
    ],
    maintenance: maint(
      {
        failure:
          'L’axe de la charnière grippe ou se déforme ; la corde de levage casse (c’est arrivé à Tripalium) ; la fondation bouge.',
        check:
          'Manœuvrez le pied sans la machine, à vide : l’articulation doit tourner franchement, sans jeu ni point dur ; regardez l’axe et les soudures.',
        care: 'Graissez l’axe une fois par an et changez la corde au moindre doute. N’essayez jamais de lever seul, ni sans haubans.',
      },
      {
        failure:
          'The hinge pin seizes or bends; the lifting rope breaks (it happened to Tripalium); the foundation moves.',
        check:
          'Work the base with no machine on it: the hinge must turn freely, with no play or tight spot; look at the pin and the welds.',
        care: 'Grease the pin once a year and change the rope at the slightest doubt. Never try to raise it alone, or without guys.',
      },
    ),
    tip: l(
      'Ne vous tenez jamais sous la machine pendant la levée. Fermez l’interrupteur de freinage avant de lever ou de descendre : un rotor qui tourne pendant la manœuvre est une raison de plus de se tenir à l’écart.',
      'Never stand under the machine during the lift. Close the brake switch before raising or lowering: a rotor that turns during the manoeuvre is one more reason to stand clear.',
    ),
    design: l(
      'Descendre la machine au sol rend l’entretien possible sans monter : les carnets de Tripalium montrent une machine descendue pour régler le jeu du moyeu. Le pied articulé fait aussi de la levée une manœuvre contrôlée, à plusieurs, avec haubans.',
      'Lowering the machine to the ground makes maintenance possible without climbing: Tripalium’s logbooks show a machine lowered to adjust the hub play. The hinged base also makes raising a controlled manoeuvre, with several people and guys.',
    ),
  },
  {
    id: 'cable-run',
    scene: 'site',
    category: 'electrical',
    name: l('Câble vers les batteries', 'Cable run'),
    short: l(
      'Les trois fils de la machine jusqu’aux batteries : section et longueur décident des pertes.',
      'The machine’s three wires down to the batteries: section and length set the losses.',
    ),
    description: l(
      'Trois fils partent de la machine, descendent dans le mât et courent jusqu’aux batteries, où se trouvent l’interrupteur de freinage et le redresseur : c’est le montage le plus sûr des plans. En 12 V le courant est fort, et la perte dans le câble croît comme son carré. Pour 500 W, avec 6 mm² sur 30 m, les plans comptent 38 % de la puissance perdue ; en 24 V, 13 %. À la moitié de la puissance, la perte est moitié moindre.',
      'Three wires leave the machine, come down inside the mast and run to the batteries, where the brake switch and the rectifier sit: this is the plans’ safest layout. At 12 V the current is large, and the loss in the cable grows as its square. For 500 W, with 6 mm² over 30 m, the plans count 38% of the power lost; at 24 V, 13%. At half the power, the loss is halved.',
    ),
    material: l(
      'Cuivre : souple dans la descente du mât, câble fixe protégé au sol',
      'Copper: flexible in the mast drop, protected fixed cable on the ground',
    ),
    specs: [
      sp('Perte, 12 V, 500 W, 6 mm², 30 m', 'Loss, 12 V, 500 W, 6 mm², 30 m', '38 %'),
      sp('Même câble en 24 V / 48 V', 'Same cable at 24 V / 48 V', '13 % / 4 %'),
      sp('Section minimale, 500 W, 12 V', 'Minimum size, 500 W, 12 V', '6 mm²'),
      sp('25 mm² sur 30 m, 12 V', '25 mm² over 30 m, 12 V', '13 %'),
      sp(
        'Câble par défaut du labo',
        'Lab default cable',
        tf('assumed', '10 mm², 15 m à l’aller', '10 mm², 15 m one way'),
      ),
      sp(
        'Câble fin du scénario',
        'Thin cable of the scenario',
        tf(
          'model',
          '2,5 mm² sur 40 m : ≈ {thinLoss} % de la puissance produite à 8 m/s, contre ≈ {defaultLoss} % par défaut',
          '2.5 mm² over 40 m: ≈ {thinLoss}% of the power generated at 8 m/s, against ≈ {defaultLoss}% by default',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un câble trop fin qui chauffe et gaspille l’énergie, une gaine abîmée au passage, un fil qui se tord dans la descente du mât.',
        check:
          'Regardez les cosses et les gaines : noires, vertes, fondues ou fendues, c’est le signe d’une mauvaise connexion. Dans la descente du mât, cherchez une torsion.',
        care: 'Sertissez les cosses (jamais de pinces crocodiles, disent les plans), protégez le câble fixe par un conduit ou prenez un câble armé, et reprenez les serrages chaque année.',
      },
      {
        failure:
          'A cable too thin that heats and wastes energy, a sheath damaged at a crossing, a wire that twists in the mast drop.',
        check:
          'Look at the lugs and sheaths: black, green, melted or split means a bad connection. In the mast drop, look for a twist.',
        care: 'Crimp the lugs (never crocodile clips, say the plans), protect the fixed cable with conduit or use armoured cable, and re-check the tightness every year.',
      },
    ),
    tip: l(
      'La perte se compte sur toute la longueur : préférez un gros câble à un long câble, et placez les batteries près du mât si vous le pouvez.',
      'The loss is counted over the whole length: prefer a thick cable to a long one, and put the batteries near the mast if you can.',
    ),
    design: l(
      'Les plans amènent les trois fils jusqu’aux batteries : l’interrupteur de freinage est alors à portée de main, au pied du mât, et on peut arrêter la machine sans monter.',
      'The plans bring all three wires to the batteries: the brake switch is then within reach, at the foot of the mast, and the machine can be stopped without climbing.',
    ),
    qty: 1,
  },
  {
    id: 'brake-switch',
    scene: 'site',
    category: 'electrical',
    name: l('Interrupteur de freinage', 'Brake switch'),
    short: l(
      'Court-circuite l’alternateur pour l’arrêter, jamais la batterie.',
      'Short-circuits the alternator to stop it, never the battery.',
    ),
    description: lf(
      'L’interrupteur de freinage est un interrupteur à deux pôles, de 20 A en 12 V continu, placé entre les trois fils de la machine et le redresseur. Fermé, il met l’alternateur en court-circuit : les bobines s’opposent à la rotation et le rotor ne tourne plus que très lentement (≈ {brakeRpm} tr/min à 8 m/s dans le modèle). Il ne faut jamais court-circuiter la batterie : le fusible sauterait. Ce n’est ni un verrou ni une assurance en pleine tempête : on ne s’approche pas d’une machine qui tourne.',
      'The brake switch is a two-pole switch, rated 20 A at 12 V DC, placed between the machine’s three wires and the rectifier. Closed, it short-circuits the alternator: the coils oppose the rotation and the rotor only turns very slowly (≈ {brakeRpm} rpm at 8 m/s in the model). The battery must never be short-circuited: the fuse would blow. It is neither a lock nor a guarantee in a full storm: do not approach a machine that is turning.',
    ),
    material: l('Interrupteur bipolaire sous boîtier étanche', 'Two-pole switch in a weatherproof box'),
    specs: [
      sp('Calibre', 'Rating', l('2 pôles, 20 A en 12 V continu (plans)', '2 poles, 20 A at 12 V DC (plans)')),
      sp(
        'Effet fermé',
        'Effect when closed',
        l(
          'alternateur en court-circuit, couple régulier et très raide (plans)',
          'alternator shorted, smooth and very stiff torque (plans)',
        ),
      ),
      sp('Rotor freiné à 8 m/s', 'Braked rotor at 8 m/s', tf('model', '≈ {brakeRpm} tr/min', '≈ {brakeRpm} rpm')),
      sp(
        'À ne jamais court-circuiter',
        'Never short-circuit',
        l('la batterie (le fusible saute)', 'the battery (the fuse blows)'),
      ),
      sp('Alarme du labo', 'Lab alarm', l('plus de 20 A : surintensité', 'above 20 A: overcurrent')),
    ],
    maintenance: maint(
      {
        failure:
          'Des contacts oxydés ou collés par l’humidité, un interrupteur trop petit qui chauffe, ou un frein oublié fermé : la machine ne charge plus et la batterie se vide.',
        check:
          'Par vent modéré, fermez-le : le rotor doit ralentir nettement ; rouvrez-le : la charge doit reprendre. La manette doit être franche, sans point dur.',
        care: 'Mettez-le dans une boîte sèche et manœuvrez-le de temps en temps : des contacts qui ne bougent jamais s’oxydent.',
      },
      {
        failure:
          'Oxidised contacts or contacts stuck by damp, a switch too small that heats up, or a brake left closed: the machine no longer charges and the battery runs down.',
        check:
          'In a moderate wind, close it: the rotor must slow clearly; open it: charging must resume. The lever must be crisp, with no tight spot.',
        care: 'Keep it in a dry box and work it from time to time: contacts that never move oxidise.',
      },
    ),
    tip: l(
      'Fermez-le avant de monter, de descendre ou de toucher la machine, et gardez en tête que tension et courant restent présents tant que le rotor tourne, même lentement.',
      'Close it before climbing, lowering or touching the machine, and remember that voltage and current stay present as long as the rotor turns, even slowly.',
    ),
    design: l(
      'Un alternateur en court-circuit freine tout seul : il n’y a rien de mécanique à user, ni frein à disque ni sangle. Les plans lui donnent un interrupteur ordinaire, que le modèle du labo reproduit.',
      'A short-circuited alternator brakes itself: there is nothing mechanical to wear, no disc brake and no strap. The plans give it an ordinary switch, which the lab’s model reproduces.',
    ),
    qty: 1,
  },
  {
    id: 'rectifier',
    scene: 'site',
    category: 'electrical',
    name: l('Redresseur', 'Rectifier'),
    short: l(
      'Transforme le courant alternatif des trois fils en courant continu pour la batterie.',
      'Turns the alternating current of the three wires into direct current for the battery.',
    ),
    description: lf(
      'La machine produit un courant alternatif triphasé, que la batterie ne sait pas recevoir. Le redresseur, un pont de diodes, ne laisse passer le courant que dans un sens : la tension continue vaut environ 1,4 fois la tension alternative, moins 1,5 V perdus dans les diodes (plans). C’est pourquoi la machine, qui ne donne que 1,9 V alternatifs à un tour par seconde, ne charge qu’au-delà de ≈ {cutInRpm} tr/min dans le modèle. Dans les plans, deux ponts de diodes côte à côte offrent assez de bornes pour trois fils ; le wiki préfère un redresseur triphasé dans un boîtier étanche sur la machine.',
      'The machine makes three-phase alternating current, which the battery cannot take. The rectifier, a diode bridge, lets the current through one way only: the DC voltage is about 1.4 times the AC voltage, minus 1.5 V lost in the diodes (plans). That is why the machine, which gives only 1.9 V AC at one turn per second, charges only beyond ≈ {cutInRpm} rpm in the model. In the plans two diode bridges side by side offer enough terminals for three wires; the wiki prefers a three-phase rectifier in a sealed box on the machine.',
    ),
    material: l('Ponts de diodes sur dissipateur en aluminium', 'Diode bridges on an aluminium heatsink'),
    specs: [
      sp(
        'Montage des plans',
        'The plans’ layout',
        l('deux ponts monophasés, au pied du mât', 'two single-phase bridges, at the foot of the mast'),
      ),
      sp('Chute de tension', 'Voltage drop', l('≈ 1,5 V au total (plans)', '≈ 1.5 V in total (plans)')),
      sp('Tension continue', 'DC voltage', l('≈ 1,4 × alternative − 1,5 V (plans)', '≈ 1.4 × AC − 1.5 V (plans)')),
      sp('Début de la charge', 'Charging starts', tf('model', '≈ {cutInRpm} tr/min', '≈ {cutInRpm} rpm')),
      sp('Perte dans les diodes à 12 m/s', 'Diode loss at 12 m/s', tf('model', '≈ {diode12} W')),
    ],
    maintenance: maint(
      {
        failure:
          'Un pont qui chauffe faute de dissipateur, ou des connexions qui prennent l’humidité et se corrodent (les plans conseillent une bouteille en plastique comme abri de pluie). Une diode claquée fait baisser la charge.',
        check:
          'Avec un multimètre, comparez la tension continue de sortie et la tension alternative d’entrée : la sortie vaut ≈ 1,4 fois l’entrée moins 1,5 V (plans).',
        care: 'Fixez les ponts sur une cornière d’aluminium, abritez-les de l’eau et resserrez les cosses chaque année.',
      },
      {
        failure:
          'A bridge that overheats for lack of a heatsink, or connections that take damp and corrode (the plans suggest a plastic bottle as a rain shield). A blown diode lowers the charge.',
        check:
          'With a multimeter, compare the DC output voltage with the AC input voltage: the output is ≈ 1.4 times the input minus 1.5 V (plans).',
        care: 'Bolt the bridges to an aluminium angle, shelter them from water and re-tighten the lugs every year.',
      },
    ),
    tip: l(
      'Un fil alternatif se branche sur n’importe quelle borne alternative (les deux bornes en diagonale) ; la borne positive du pont est à angle droit des autres.',
      'An AC wire goes on any AC terminal (the two diagonal ones); the bridge’s positive terminal is at right angles to the others.',
    ),
    design: l(
      'Un pont de diodes n’a ni pièce mobile ni réglage, et il laisse l’alternateur « se débrouiller » : plus le rotor tourne vite, plus la tension monte, jusqu’à dépasser la batterie. Le prix à payer est cette chute de 1,5 V, qui retarde le début de la charge.',
      'A diode bridge has no moving part and no adjustment, and it lets the alternator “fend for itself”: the faster the rotor turns, the higher the voltage rises, until it passes the battery’s. The price is that 1.5 V drop, which delays the start of charging.',
    ),
  },
  {
    id: 'fuse',
    scene: 'site',
    category: 'electrical',
    name: l('Fusible', 'Fuse'),
    short: l(
      'Protège le câble et la batterie en cas de court-circuit.',
      'Protects the cable and the battery in a short circuit.',
    ),
    description: l(
      'Dans les plans, tout circuit qui part d’une batterie porte un fusible ou un disjoncteur : c’est une règle de sécurité, pas une option. Celui de l’éolienne est sur le fil positif, entre les redresseurs et la batterie ; la maison a le sien, et un circuit de fil mince, comme celui du voltmètre, un fusible plus petit. Une batterie de 12 V peut débiter un courant énorme dans un court-circuit : sans fusible, le câble chauffe jusqu’à l’incendie.',
      'In the plans every circuit that leaves a battery has a fuse or a circuit breaker: it is a safety rule, not an option. The turbine’s sits on the positive wire, between the rectifiers and the battery; the house has its own, and a thin-wire circuit, like the voltmeter’s, a smaller fuse. A 12 V battery can deliver an enormous current in a short circuit: without a fuse the cable heats up to the point of fire.',
    ),
    material: l('Fusible ou disjoncteur, cosses serties', 'Fuse or circuit breaker, crimped lugs'),
    specs: [
      sp(
        'Position',
        'Position',
        l(
          'fil +, entre les redresseurs et la batterie (plans)',
          '+ wire, between the rectifiers and the battery (plans)',
        ),
      ),
      sp(
        'Circuits protégés',
        'Protected circuits',
        l('un pour l’éolienne, un pour les charges (plans)', 'one for the turbine, one for the loads (plans)'),
      ),
      sp(
        'Calibre',
        'Rating',
        l(
          'non donné par les plans : sous ce que le câble supporte',
          'not given by the plans: below what the cable can carry',
        ),
      ),
      sp('Courant normal à 12 m/s', 'Normal current at 12 m/s', tf('model', '≈ {amps12} A')),
      sp(
        'Connexions',
        'Connections',
        l('cosses serties, jamais de pinces crocodiles (plans)', 'crimped lugs, never crocodile clips (plans)'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un fusible qui saute sans raison apparente (calibre trop juste, connexion qui chauffe), ou, pire, remplacé par un fil de cuivre ou un modèle plus fort.',
        check:
          'Regardez s’il est noirci et vérifiez qu’il porte le calibre prévu ; une connexion qui chauffe laisse une trace brune.',
        care: 'Gardez des fusibles de rechange du bon calibre, et ne remplacez jamais un fusible par plus fort que le câble ne le permet.',
      },
      {
        failure:
          'A fuse that blows for no apparent reason (rating too tight, a connection that heats), or, worse, replaced by a copper wire or a stronger one.',
        check:
          'Look whether it is blackened and check it carries the intended rating; a connection that heats leaves a brown mark.',
        care: 'Keep spare fuses of the right rating, and never swap a fuse for a stronger one than the cable allows.',
      },
    ),
    tip: l(
      'Quand il saute, cherchez pourquoi avant de le changer : les plans le citent comme ce qui arrive si l’on court-circuite la batterie avec l’interrupteur de freinage.',
      'When it blows, find out why before replacing it: the plans cite it as what happens if you short-circuit the battery with the brake switch.',
    ),
    design: l(
      'Le fusible est la seule protection qui ne dépend de personne : il coupe même si l’on est loin, endormi ou distrait. C’est pourquoi les plans le placent sur chaque circuit.',
      'The fuse is the only protection that depends on nobody: it cuts even if you are far away, asleep or distracted. That is why the plans put one on every circuit.',
    ),
    qty: 1,
  },
  {
    id: 'charge-controller',
    scene: 'site',
    category: 'electrical',
    name: l('Régulateur de charge', 'Charge controller'),
    short: l(
      'Surveille la tension : envoie le surplus au délesteur à 14 V et coupe la maison sous 11,5 V.',
      'Watches the voltage: sends the surplus to the dump load at 14 V and cuts the house off below 11.5 V.',
    ),
    description: l(
      'Une batterie au plomb s’abîme si on la décharge trop ou si on la charge trop fort. Les plans fixent les repères : sous 11,5 V elle est trop déchargée, au-dessus de 14 V le courant de charge est trop fort. Un régulateur automatique s’en charge : un « délesteur » qui envoie l’excédent dans une charge de dérivation, et une coupure basse tension qui débranche la maison. Les plans décrivent un petit circuit à deux relais de 16 A ; le wiki rappelle qu’un régulateur est nécessaire entre l’éolienne et la batterie.',
      'A lead-acid battery is damaged if it is discharged too deeply or charged too hard. The plans set the marks: below 11.5 V it is too deeply discharged, above 14 V the charging current is too high. An automatic controller handles this: a “dump” that sends the surplus into a diversion load, and a low-voltage disconnect that cuts the house off. The plans describe a small circuit with two 16 A relays; the wiki reminds that a controller is needed between the turbine and the battery.',
    ),
    material: l(
      'Circuit électronique et relais 12 V, boîtier abrité',
      'Electronic circuit and 12 V relays, sheltered box',
    ),
    specs: [
      sp('Charge trop forte', 'Charging too hard', l('au-dessus de 14 V (plans)', 'above 14 V (plans)')),
      sp('Décharge trop profonde', 'Discharge too deep', l('sous 11,5 V (plans)', 'below 11.5 V (plans)')),
      sp('Relais du circuit des plans', 'Relays of the plans’ circuit', l('12 V, 16 A', '12 V, 16 A')),
      sp('Reconnexion de la maison', 'House reconnection', tf('assumed', '12,5 V', '12.5 V')),
      sp('Courant maximal du délesteur', 'Dump load’s largest current', tf('assumed', '16 A')),
    ],
    maintenance: maint(
      {
        failure:
          'Un relais collé ou grillé : le régulateur ne délestera plus, la tension monte et la batterie surchauffe. Un seuil mal réglé coupe la maison trop tôt ou trop tard.',
        check:
          'Par vent fort, batterie pleine, la tension doit rester vers 14 V et le délesteur chauffer. Les plans conseillent aussi de lire le voltmètre : sous 11,5 V on consomme trop, au-dessus de 14 V on gaspille.',
        care: 'Abritez le boîtier, reprenez les connexions chaque année, et vérifiez les seuils avec un voltmètre de confiance.',
      },
      {
        failure:
          'A stuck or burnt relay: the controller no longer dumps, the voltage climbs and the battery overheats. A badly set threshold cuts the house off too early or too late.',
        check:
          'In a strong wind with a full battery, the voltage must stay near 14 V and the dump load must warm up. The plans also advise reading the voltmeter: below 11.5 V you use too much, above 14 V you waste.',
        care: 'Shelter the box, re-check the connections every year, and verify the thresholds with a trustworthy voltmeter.',
      },
    ),
    tip: l(
      'Les plans donnent un repère simple sans voltmètre : des lampes qui faiblissent signalent une batterie basse, des lampes très vives trop de vent pour la batterie.',
      'The plans give a simple clue without a voltmeter: dimming lights mean a low battery, very bright lights mean too much wind for the battery.',
    ),
    design: l(
      'Une éolienne ne choisit pas quand le vent souffle. Le régulateur découple la production de la consommation : ce que la batterie ne peut pas prendre, il le brûle plutôt que de l’abîmer.',
      'A wind turbine does not choose when the wind blows. The controller decouples production from consumption: what the battery cannot take, it burns rather than ruin it.',
    ),
    qty: 1,
  },
  {
    id: 'dump-load',
    scene: 'site',
    category: 'electrical',
    name: l('Délesteur', 'Dump load'),
    short: l(
      'Résistance qui absorbe l’excédent quand la batterie est pleine.',
      'Resistor that soaks up the surplus when the battery is full.',
    ),
    description: l(
      'Quand la batterie est pleine et que le vent souffle encore, l’énergie doit aller quelque part, sinon la tension monte et la batterie souffre. Le délesteur est une charge, une résistance en général, que le régulateur branche à 14 V : elle transforme le surplus en chaleur, pour tenir la tension. Les plans y voient aussi une occasion : plus d’électricité à consommer en temps venteux, par exemple pour charger les batteries de voisins. Une éolienne sans délesteur a besoin que quelqu’un consomme.',
      'When the battery is full and the wind still blows, the energy has to go somewhere, or the voltage climbs and the battery suffers. The dump load is a load, usually a resistor, that the controller connects at 14 V: it turns the surplus into heat to hold the voltage. The plans see an opportunity in it too: more electricity to use in windy weather, for example to charge neighbours’ batteries. A turbine without a dump load needs someone to consume.',
    ),
    material: l('Résistances de puissance sur dissipateur', 'Power resistors on a heatsink'),
    specs: [
      sp('Rôle', 'Role', l('tenir la batterie à 14 V (plans)', 'hold the battery at 14 V (plans)')),
      sp(
        'Courant maximal dans le modèle',
        'Largest current in the model',
        tf('assumed', '16 A, comme le relais des plans', '16 A, like the plans’ relay'),
      ),
      sp(
        'Puissance à dissiper',
        'Power to dissipate',
        tf('derived', '≈ {dumpW} W (14 V × 16 A)', '≈ {dumpW} W (14 V × 16 A)'),
      ),
      sp(
        'Sans délesteur',
        'Without a dump load',
        l('la tension dépasse 14 V, alarme de surcharge', 'the voltage exceeds 14 V, overcharge alarm'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une résistance qui chauffe sans dissipateur ni aération, un fil qui s’échauffe, un relais qui reste collé en position branchée et vide la batterie.',
        check:
          'Quand le régulateur délestera, la résistance doit chauffer franchement, et la tension rester vers 14 V ; ne la touchez pas : elle est brûlante.',
        care: 'Dégagez-la de tout ce qui brûle, laissez-la respirer et dépoussiérez-la chaque année.',
      },
      {
        failure:
          'A resistor that overheats with no heatsink or ventilation, a wire that warms up, a relay that stays stuck in the connected position and empties the battery.',
        check:
          'When the controller dumps, the resistor must warm up clearly and the voltage stay near 14 V; do not touch it: it is scalding.',
        care: 'Clear it of anything flammable, let it breathe and dust it once a year.',
      },
    ),
    tip: l(
      'Chauffer de l’eau avec le surplus est une bonne idée de principe, mais le délesteur doit être dimensionné pour le courant maximal, pas pour la moyenne.',
      'Heating water with the surplus is a good idea in principle, but the dump load must be sized for the largest current, not for the average.',
    ),
    design: l(
      'Brûler l’excédent est inélégant mais sûr : pas de pièce mobile, rien à régler. C’est aussi ce qui rend la machine tolérante, qu’une batterie soit pleine ou qu’une maison soit absente.',
      'Burning the surplus is inelegant but safe: no moving part, nothing to adjust. It is also what makes the machine forgiving, whether a battery is full or a house is empty.',
    ),
    qty: 1,
  },
  {
    id: 'battery-bank',
    scene: 'site',
    category: 'electrical',
    name: l('Batteries', 'Battery bank'),
    short: l(
      'Réserve d’énergie en 12 V au plomb : à garder chargée, sans décharge profonde.',
      '12 V lead-acid reserve: keep it charged, never deeply discharged.',
    ),
    description: l(
      'La batterie est la réserve qui comble les temps sans vent : elle reçoit le courant redressé et alimente la maison. Les plans la veulent toujours chargée : une batterie trop déchargée ou laissée longtemps vide se sulfate et devient inutilisable ; en cas de panne de l’éolienne, rechargez-la depuis une autre source sous deux semaines. La charge la plus saine est un petit courant pendant longtemps. La vidéo ne montre aucune batterie : le labo en dessine une, de 12 V.',
      'The battery is the reserve that bridges windless spells: it receives the rectified current and feeds the house. The plans want it kept charged: a battery too deeply discharged or left empty for long sulphates and becomes useless; if the turbine breaks down, recharge it from another source within two weeks. The healthiest charge is a small current for a long time. The video shows no battery: the lab draws a 12 V one.',
    ),
    material: l('Batterie au plomb 12 V', '12 V lead-acid battery'),
    specs: [
      sp('Tension nominale', 'Nominal voltage', '12 V'),
      sp(
        'Limites de tension',
        'Voltage limits',
        l(
          '11,5 V (trop déchargée) à 14 V (charge trop forte) (plans)',
          '11.5 V (too deeply discharged) to 14 V (charging too hard) (plans)',
        ),
      ),
      sp(
        'Capacité du labo',
        'Lab capacity',
        tf('assumed', '100 Ah par défaut, réglable', '100 Ah by default, adjustable'),
      ),
      sp(
        'Recharge après une panne',
        'Recharge after a failure',
        l('sous 2 semaines (plans)', 'within 2 weeks (plans)'),
      ),
      sp('Consommation de la maison', 'House load', tf('assumed', '{house} W par défaut', '{house} W by default')),
    ],
    maintenance: maint(
      {
        failure:
          'Une décharge trop profonde ou trop longue (sulfatation), une charge trop forte qui chauffe, des cosses qui s’oxydent ; une batterie au plomb ouverte dégage de l’hydrogène, qui peut exploser.',
        check:
          'Mesurez la tension au repos : sous 11,5 V, on consomme trop ; au-dessus de 14 V en charge, on gaspille. Cosses propres, boîtier sans gonflement.',
        care: 'Ventilez le local, ne posez jamais d’outil métallique sur les bornes, utilisez des cosses serties (pas de pinces crocodiles) et rechargez vite après une panne.',
      },
      {
        failure:
          'Too deep or too long a discharge (sulphation), a charge too hard that heats, lugs that oxidise; an open lead-acid battery gives off hydrogen, which can explode.',
        check:
          'Measure the resting voltage: below 11.5 V you use too much; above 14 V while charging you waste. Clean lugs, no swelling of the case.',
        care: 'Ventilate the room, never lay a metal tool across the terminals, use crimped lugs (no crocodile clips) and recharge quickly after a breakdown.',
      },
    ),
    tip: l(
      'Aucun objet métallique sur les bornes : une clé qui les relie fait de grosses étincelles et des brûlures, préviennent les plans.',
      'No metal object across the terminals: a spanner that joins them makes big sparks and burns, the plans warn.',
    ),
    design: l(
      'La batterie découple le vent de la consommation, mais elle impose ses limites : 11,5 V et 14 V encadrent tout le réglage. À petite échelle, c’est elle qui fixe aussi le choix de 12 V pour l’alternateur de la vidéo.',
      'The battery decouples the wind from consumption, but it imposes its limits: 11.5 V and 14 V frame the whole regulation. At small scale it also sets the choice of 12 V for the video’s alternator.',
    ),
    qty: 1,
  },
  {
    id: 'house',
    scene: 'site',
    category: 'site',
    name: l('Habitation', 'House'),
    short: l(
      'Les charges que la batterie alimente : lampes, ordinateur, radio.',
      'The loads the battery feeds: lamps, a computer, a radio.',
    ),
    description: lf(
      'La vidéo présente cette petite machine comme de quoi alimenter un peu d’éclairage ou charger un ordinateur ; les plus grandes de la famille, jusqu’à 4,2 m, peuvent alimenter toute l’électricité d’un foyer, chauffage excepté. Le labo donne à la maison une consommation constante, {house} W par défaut (hypothèse). Sur un an, cela fait {houseKwh} kWh (dérivé) : le modèle en tire {hamletKwh} kWh dans le hameau, mais pas aux moments où la maison en a besoin, d’où la batterie.',
      'The video presents this small machine as enough to power some lighting or charge a computer; the larger ones of the family, up to 4.2 m, can supply a whole household’s electricity, heating excluded. The lab gives the house a constant load, {house} W by default (assumption). Over a year that makes {houseKwh} kWh (derived): the model draws {hamletKwh} kWh in the hamlet, but not at the moments the house needs it, hence the battery.',
    ),
    material: l('Non détaillée (charges en 12 V)', 'Not detailed (12 V loads)'),
    specs: [
      sp('Consommation du labo', 'Lab load', tf('assumed', '{house} W, constante', '{house} W, constant')),
      sp('Sur un an', 'Over a year', tf('derived', '{houseKwh} kWh', '{houseKwh} kWh')),
      sp(
        'Production du modèle, hameau',
        'Model output, hamlet',
        tf('model', '≈ {hamletKwh} kWh par an', '≈ {hamletKwh} kWh a year'),
      ),
      sp('Coupure basse tension', 'Low-voltage disconnect', l('sous 11,5 V (plans)', 'below 11.5 V (plans)')),
    ],
    maintenance: maint(
      {
        failure:
          'Une consommation qui dépasse ce que le vent apporte : la batterie descend, la maison est coupée sous 11,5 V.',
        check:
          'Suivez l’état de charge au fil des jours dans la simulation : s’il baisse chaque soir sans jamais remonter, la maison demande plus que la machine ne donne.',
        care: 'Choisissez des appareils sobres, en 12 V si possible, et répartissez les usages sur les jours de vent.',
      },
      {
        failure: 'A load that exceeds what the wind brings: the battery drops, the house is cut off below 11.5 V.',
        check:
          'Follow the state of charge over the days in the simulation: if it falls every evening and never recovers, the house asks for more than the machine gives.',
        care: 'Choose frugal appliances, in 12 V if possible, and spread the uses over the windy days.',
      },
    ),
    tip: l(
      'Estimez d’abord ce que vous consommez, ensuite seulement la taille de la machine : la production d’une petite éolienne est modeste.',
      'Work out what you consume first, the size of the machine only afterwards: a small turbine’s output is modest.',
    ),
    video: ['01:06', '01:13'],
    design: l(
      'Le dimensionnement part de la maison, pas de la machine : c’est ce qui fait de cette éolienne un outil d’autonomie, pas un gadget. Dans le modèle, la coupure basse tension protège la batterie quand la consommation dépasse la production.',
      'Sizing starts from the house, not from the machine: that is what makes this turbine a tool for autonomy, not a gadget. In the model the low-voltage disconnect protects the battery when consumption exceeds production.',
    ),
  },
  {
    id: 'obstacles',
    scene: 'site',
    category: 'site',
    name: l('Arbres et obstacles', 'Trees and obstacles'),
    short: l(
      'Arbres et bâtiments qui perturbent le vent : la machine doit les dépasser.',
      'Trees and buildings that disturb the wind: the machine must clear them.',
    ),
    description: lf(
      'Un obstacle ralentit le vent et le rend turbulent derrière lui. La vidéo commence par là : placez l’éolienne là où il y a peu d’obstacles, cherchez les vents dominants, choisissez un paysage bien dégagé. Dans le labo, des arbres de 5 m (le hameau) font tomber le vent au moyeu d’un mât de 6 m à {hub6} m/s avec {turb6} de turbulence (écart type sur la moyenne), contre {hub12} m/s et {turb12} pour un mât de 12 m (résultats du modèle).',
      'An obstacle slows the wind and makes it turbulent behind it. The video starts there: place the turbine where there are few obstacles, look for the prevailing winds, pick a well-open landscape. In the lab, 5 m trees (the hamlet) bring the hub wind of a 6 m mast down to {hub6} m/s with {turb6} turbulence (standard deviation over the mean), against {hub12} m/s and {turb12} for a 12 m mast (model results).',
    ),
    material: l('Non applicable (végétation, bâtiments)', 'Not applicable (vegetation, buildings)'),
    specs: [
      sp(
        'Conseil de la vidéo',
        'The video’s advice',
        l('peu d’obstacles, vents dominants, paysage dégagé', 'few obstacles, prevailing winds, open landscape'),
      ),
      sp('Mât très dégagé', 'Very open site', l('6 m peut suffire (plans)', '6 m may do (plans)')),
      sp(
        'Sinon',
        'Otherwise',
        l('12 ou 18 m pour sortir des turbulences (plans)', '12 or 18 m to clear the turbulence (plans)'),
      ),
      sp('Arbres du labo', 'Lab trees', tf('assumed', '0 à 15 m, 5 m dans le hameau', '0 to 15 m, 5 m in the hamlet')),
    ],
    maintenance: maint(
      {
        failure:
          'Les arbres grandissent : un site correct à la pose devient turbulent dix ans plus tard ; une construction voisine peut faire le même effet.',
        check:
          'Regardez d’où vient le vent dominant et ce qu’il traverse avant d’atteindre le mât : un arbre ou un toit en amont se paie en vitesse et en régularité.',
        care: 'Revoyez le site chaque année : taillez ou abattez ce qui dépasse la ligne du mât, ou montez le mât.',
      },
      {
        failure:
          'Trees grow: a site that was right at installation turns turbulent ten years later; a neighbouring building can do the same.',
        check:
          'Note where the prevailing wind comes from and what it crosses before reaching the mast: a tree or a roof upwind costs speed and steadiness.',
        care: 'Review the site every year: trim or fell what rises above the mast line, or raise the mast.',
      },
    ),
    tip: l(
      'Observez le site avant de poser quoi que ce soit : le vent est invisible, mais les arbres penchés et l’herbe couchée le dessinent.',
      'Observe the site before installing anything: the wind is invisible, but leaning trees and flattened grass draw it.',
    ),
    video: ['00:51'],
    design: l(
      'La position compte autant que la machine : dans le modèle, une machine de la vallée calme ne produit presque rien à 6 m parmi des arbres de 8 m, et plus de quatre fois plus à 18 m. Monter le mât coûte moins cher que de changer d’éolienne.',
      'Position matters as much as the machine: in the model a calm-valley machine yields almost nothing at 6 m among 8 m trees, and more than four times as much at 18 m. Raising the mast costs less than changing the turbine.',
    ),
  },
];
