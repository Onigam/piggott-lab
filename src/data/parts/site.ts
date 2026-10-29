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
    id: 'technical-room',
    scene: 'site',
    category: 'electrical',
    name: l('Local technique', 'Technical room'),
    short: l(
      'Le cabanon qui abrite l’électronique et la batterie, au bout du câble. Détail dans la vue du local.',
      'The shed that houses the electronics and the battery, at the end of the cable. Detail in the room view.',
    ),
    description: l(
      'C’est le **local technique** : un cabanon sec, près de la maison, où arrive le **câble** du mât. Sur un panneau de contreplaqué au mur, le courant passe dans l’ordre par l’**interrupteur de freinage**, le **redresseur**, le **fusible** et le **régulateur de charge**, qui le dirige vers la **batterie** posée au sol ou, quand elle est pleine, vers le **délesteur**. Le plan de l’éolienne, lui, s’arrête à la batterie : la maison se branche ensuite sur elle. Ouvrez la vue du local pour voir chaque appareil et suivre le courant.',
      'This is the **technical room**: a dry shed, close to the house, where the mast’s **cable** arrives. On a plywood board on the wall, the current goes in order through the **brake switch**, the **rectifier**, the **fuse** and the **charge controller**, which sends it to the **battery** standing on the floor or, once it is full, to the **dump load**. The turbine’s drawing stops at the battery: the house is connected to it afterwards. Open the room view to see each device and follow the current.',
    ),
    material: l(
      'Cabanon en bois sur dalle, panneau de contreplaqué, appareils fixés à plat',
      'Timber shed on a slab, plywood board, devices fixed flat',
    ),
    specs: [
      sp(
        'Rôle',
        'Role',
        l('abriter, protéger et brancher l’électronique', 'house, protect and connect the electronics'),
      ),
      sp('Tension', 'Voltage', '12 V'),
      sp(
        'Ordre du courant',
        'Order of the current',
        l('interrupteur, redresseur, fusible, régulateur, batterie', 'switch, rectifier, fuse, controller, battery'),
      ),
      sp(
        'Vue du labo',
        'Lab view',
        l('un cabanon et son panneau, ouvert devant (estimation)', 'a shed and its board, open in front (estimate)'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'De l’humidité qui entre et oxyde les bornes, un appareil qui chauffe parce qu’il est enfermé sans air, une batterie sans ventilation.',
        check:
          'Entrez par temps sec : le local doit sentir le neuf, pas l’acide ni le brûlé. Touchez les câbles (machine arrêtée) : aucun ne doit être chaud.',
        care: 'Gardez le local sec, aéré en haut et en bas, rangé : rien à côté de la batterie qui puisse tomber sur ses bornes.',
      },
      {
        failure:
          'Damp that gets in and oxidises the terminals, a device that overheats because it is shut in without air, a battery with no ventilation.',
        check:
          'Go in on a dry day: the room should smell of nothing, not of acid or burning. Feel the cables (machine stopped): none should be hot.',
        care: 'Keep the room dry, ventilated high and low, and tidy: nothing beside the battery that could fall across its terminals.',
      },
    ),
    tip: l(
      'Un cabanon, pas une cave : la batterie dégage un gaz qui s’enflamme, donc de l’air en haut, aucune étincelle et rien de fragile à côté.',
      'A shed, not a cellar: the battery gives off a gas that can ignite, so air at the top, no spark and nothing fragile nearby.',
    ),
    design: l(
      'Les plans mettent l’interrupteur et le redresseur à côté des batteries plutôt qu’au pied de la machine : un seul endroit à protéger et à surveiller, et le frein à portée de main.',
      'The plans put the switch and the rectifier next to the batteries rather than at the foot of the machine: one place to protect and watch, and the brake within reach.',
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
