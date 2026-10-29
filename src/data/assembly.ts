// Assembly guide of the machine (wave 2, data role): 24 steps, in the build order of the wiki (the video's machine), over three worlds.
//
//   `blades`     1-4    timber blank, section templates, the three blades, the hub disc (the video's 01:22-02:17)
//   `alternator` 5-11   (at the bench) moulds, coils, star wiring, the three stator rods, the stator cast with them, the magnet disc, the magnets
//   `turbine`    12-13  the nacelle frame with its cradle welded at the end, the yaw pivot
//   `alternator` 14-16  (generator assembly, wiki step 26) the stub axle and the stator screwed on the cradle, the hub bell and the rotor on
//                       its four rods, the air gap set with the stator nuts
//   `turbine`    17-24  the alternator checked on the frame, the bench test (no part), the rotor, the balancing (no part), the tail hinge,
//                       boom and vane (06:16-06:41), the wire loop
//
// Every id of blades, alternator and turbine is installed in exactly one step (a test checks it). Two steps install nothing: the bench test at
// one turn per second ("est-ce qu'on a du jus", the video at 07:11, the wiki's step 27) and the static balancing of the rotor (the plans, p. 39).
// The video shows that test near its end; the wiki puts it BEFORE the blades and the tail, which makes a fault easier to correct: the guide
// follows the wiki and says so. The video shows the rotor before the stator, then the nacelle and the moulds: a presentation order.
//
// KINEMATICS (the video's machine = the Low-tech Lab wiki, steps 8, 9, 15, 16, 24, 26; research K6 was wrong and the lead corrected it): ONE magnet
// rotor of 8 magnets. FIXED: the nacelle's angle iron with the cradle (a steel disc 140 × 8 mm, 12 mm holes) welded at its end, the car hub's stub
// axle (« fusée », not a hollow shaft) screwed on the cradle, the stator (a resin casting of the six coils with THREE slotted M12 × 70 mm rods
// cast in) nutted on the cradle, its nuts setting the air gap of about 1 mm. ROTATING: the hub bell on its bearings on the stub axle, the 230 × 6 mm
// rotor disc bolted to the bell by FOUR M12 × 140 mm rods and 16 nuts, the blades and the 9 mm plywood hub disc on the same rods. The 2003 plans
// (an older revision: a hollow shaft with the stator cast onto it; two rotors and 24 magnets on the 2.4 m machine) are mentioned in the sheets only.
//
// Conventions. Each step text stays within 80 words in both languages (a test checks it); tips and warnings are short; where the
// video, the wiki or the plans say a thing, the text says which. DURATIONS ARE ROUGH ESTIMATES (no source gives them; the wiki says
// "20 days", a one-week course gathers 10 to 20 people): `duration` is a plain string in the kit, so each reads « ≈ 4 h (est.) ».
// No torque is given: no source states one. The magnets, the resin and the welding carry a warning (docs/research.md §7).
// A numbered text is a reported figure (wiki, plans, video); the resin recipes are NOT published here: take a course (Tripalium).
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';

export const ASSEMBLY: GuideStep[] = [
  // ======================================================================================= the blades world
  {
    id: 'blank',
    scene: 'blades',
    title: l('Choisir le bois des pales', 'Choose the blade timber'),
    text: l(
      'On commence par les pales. Choisissez un bois imputrescible, léger et sans trop de nœuds : épicéa, douglas ou mélèze, dit la vidéo. Il faut une poutre d’au moins 95 × 35 mm sur 1,80 m ; placez les nœuds vers le pied des pales et gardez 4 à 5 cm de marge au bout. Débitez trois plateaux identiques. Plan : les pales (1 à 4), l’alternateur (5 à 11), la nacelle et l’assemblage (12 à 24).',
      'We start with the blades. Choose a rot-resistant, light wood without too many knots: spruce, Douglas fir or larch, says the video. You need a beam of at least 95 × 35 mm and 1.80 m long; put the knots towards the blade roots and keep 4 to 5 cm of margin at the tip. Cut three identical blanks. Plan: the blades (1 to 4), the alternator (5 to 11), the nacelle and the assembly (12 to 24).',
    ),
    parts: ['blade-blank'],
    tools: [l('Scie', 'Saw'), l('Mètre et équerre', 'Tape and square'), l('Serre-joints', 'Clamps')],
    tip: l(
      'Prenez les trois plateaux dans la même poutre : ils auront le même poids et la même rigidité.',
      'Cut the three blanks from the same beam: they will have the same weight and stiffness.',
    ),
    warning: l(
      'Masque anti-poussière pour poncer, et si possible travaillez dehors : la poussière de bois nuit à tout le monde (plans).',
      'Wear a dust mask when sanding, and work outdoors if possible: wood dust harms everyone (plans).',
    ),
    duration: '≈ 2 h (est.)',
  },
  {
    id: 'templates',
    scene: 'blades',
    title: l('Tracer les gabarits des six sections', 'Mark out the six section templates'),
    text: l(
      'Découpez dans du carton fort les gabarits des six sections de la pale. Largeur, du pied au bout : 153, 153, 100, 80, 65 et 55 mm ; épaisseur : 49, 22, 14, 10, 8 et 6 mm ; avec le « décalage », de la face du plateau au bord de fuite. Marquez sur chaque plateau la face au vent (intrados) et le dos (extrados). Le wiki marque quatre zones ; on suit les six stations des plans.',
      'Cut the templates of the blade’s six sections from stiff card. Width, root to tip: 153, 153, 100, 80, 65 and 55 mm; thickness: 49, 22, 14, 10, 8 and 6 mm; with the “drop”, the measure from the face of the blank to the trailing edge. Mark the windward face (pressure side) and the back (suction side) on each blank. The wiki marks four zones; we follow the plans’ six stations.',
    ),
    parts: ['station-templates'],
    tools: [
      l('Carton fort, ciseaux', 'Stiff card, scissors'),
      l('Règle et crayon', 'Ruler and pencil'),
      l('Pied à coulisse', 'Calipers'),
    ],
    tip: l(
      'Un seul jeu de gabarits pour les trois pales, à garder pour remplacer une pale plus tard.',
      'A single set of templates for the three blades, to keep for replacing a blade later.',
    ),
    duration: '≈ 3 h (est.)',
  },
  {
    id: 'carve',
    scene: 'blades',
    title: l('Sculpter les trois pales', 'Carve the three blades'),
    text: l(
      'Taillez d’abord la face au vent, presque plate, puis le dos, arrondi, comme un profil d’aile qui accélère la rotation (vidéo). Cherchez la coupe du pied, à environ 120°, affinez le bord de fuite à moins de 1 mm et coupez la pale à 600 mm. Vérifiez chaque section au gabarit. À 30 % de la largeur, comparez les épaisseurs : les trois pales doivent être parfaitement identiques.',
      'Carve the windward face first, nearly flat, then the back, curved, like a wing profile that speeds the rotation (video). Find the root cut, at about 120°, thin the trailing edge to under 1 mm and cut the blade to 600 mm. Check each section against its template. At 30% of the width, compare thicknesses: the three blades must be perfectly identical.',
    ),
    parts: ['blade'],
    tools: [
      l('Rabot et ciseaux à bois', 'Plane and wood chisels'),
      l('Râpe et papier de verre', 'Rasp and sandpaper'),
      l('Règle, équerre à biseau', 'Ruler, bevel gauge'),
    ],
    tip: l(
      'Dans la vidéo, il reste du travail sur les pales avant qu’elles soient parfaitement identiques : comparez-les souvent.',
      'In the video there is still work to do on the blades before they are perfectly identical: compare them often.',
    ),
    warning: l(
      'Outils tranchants : bloquez la pièce, et pensez à ce qui arrive si l’outil glisse (plans).',
      'Sharp tools: clamp the workpiece, and think what happens if the tool slips (plans).',
    ),
    duration: '≈ 16 h (est.)',
  },
  {
    id: 'hub',
    scene: 'blades',
    title: l('Assembler les pales sur le disque de moyeu', 'Assemble the blades on the hub disc'),
    text: l(
      'Découpez un disque de contreplaqué de 9 mm, tracez trois zones à 120° et percez des avant-trous de 5 mm. À trois personnes, avec trois mètres en règle, centrez le disque : une vis par pale, ajustez, puis serrez. Fixez le triangle de contreplaqué côté vent. Percez quatre trous de 12 mm à travers l’ensemble et creusez l’évidement de 60 mm sur 30 mm de profondeur côté dos.',
      'Cut a 9 mm plywood disc, mark three zones at 120° and drill 5 mm pilot holes. With three people and three metre rules, centre the disc: one screw per blade, adjust, then tighten. Fit the plywood triangle on the windward side. Drill four 12 mm holes through the assembly and cut the 60 mm recess, 30 mm deep, on the back.',
    ),
    parts: ['hub-disc'],
    tools: [
      l('Perceuse, scie cloche de 60 mm', 'Drill, 60 mm hole saw'),
      l('Vis de 5 × 30 mm', '5 × 30 mm screws'),
      l('Trois mètres en règle', 'Three metre rules'),
    ],
    tip: l(
      'Peignez pales et disques avant l’assemblage final : après, on n’accède plus aux faces serrées (plans).',
      'Paint blades and discs before the final assembly: afterwards the clamped faces cannot be reached (plans).',
    ),
    duration: '≈ 4 h (est.)',
  },
  // ======================================================================================= the alternator world
  {
    id: 'moulds',
    scene: 'alternator',
    title: l('Fabriquer les deux moules', 'Make the two moulds'),
    text: l(
      'On passe à l’alternateur (vue de l’alternateur). La vidéo montre deux moules, celui du stator et celui du rotor, avant d’y couler de la résine. Celui du stator, en contreplaqué de 10 mm, a quatre pièces (base, bordure, îlot central, couvercle) et trois pions d’alignement ; celui du rotor, en 16 mm, a un couvercle percé pour les écrous. Cirez-les avant chaque coulée.',
      'On to the alternator (alternator view). The video shows two moulds, the stator’s and the rotor’s, before resin is cast into them. The stator’s, in 10 mm plywood, has four pieces (base, border, central island, lid) and three alignment pins; the rotor’s, in 16 mm, has a lid with holes for the nuts. Wax them before each casting.',
    ),
    parts: ['moulds'],
    tools: [
      l('Scie et perceuse', 'Saw and drill'),
      l('Contreplaqué de 10 et 16 mm', '10 and 16 mm plywood'),
      l('Cire de démoulage', 'Release wax'),
    ],
    tip: l(
      'Une coulée n’a pas de seconde chance : prenez le temps de faire le moule droit, propre et de niveau.',
      'A casting gets no second chance: take the time to make the mould straight, clean and level.',
    ),
    duration: '≈ 6 h (est.)',
  },
  {
    id: 'coils',
    scene: 'alternator',
    title: l('Bobiner les six bobines', 'Wind the six coils'),
    text: l(
      'Montez le gabarit de bobinage : quatre clous de 6 mm tracent un rectangle de 46 × 30 mm, des joues règlent l’épaisseur. Enroulez 76 spires de fil émaillé de 1,4 mm par bobine, toutes dans le même sens, en laissant 30 cm de fil de chaque côté, et fixez chaque bobine au ruban avant de la retirer. Il faut environ 1,5 kg de fil pour les six.',
      'Build the winding former: four 6 mm nails mark a 46 × 30 mm rectangle, cheeks set the thickness. Wind 76 turns of 1.4 mm enamelled wire per coil, all in the same direction, leaving 30 cm of wire on each side, and tape each coil before taking it off. About 1.5 kg of wire is needed for the six.',
    ),
    parts: ['coils'],
    tools: [
      l('Gabarit de bobinage, clous de 6 mm', 'Winding former, 6 mm nails'),
      l('Fil de cuivre émaillé de 1,4 mm', '1.4 mm enamelled copper wire'),
      l('Ruban isolant', 'Insulating tape'),
    ],
    tip: l(
      'Plus de tours, plus de tension : la vidéo en fait 76 pour du 12 V.',
      'More turns, more voltage: the video makes 76 for 12 V.',
    ),
    duration: '≈ 8 h (est.)',
  },
  {
    id: 'star',
    scene: 'alternator',
    title: l('Coupler les bobines en étoile', 'Join the coils in a star'),
    text: l(
      'Posez les six bobines à 60° les unes des autres sur un gabarit, numérotées de 1 à 6, tous les tours dans le même sens. Réunissez les entrées 1, 2 et 3 : c’est le neutre. Reliez la sortie 1 à l’entrée 4, la 2 à la 5, la 3 à la 6. Soudez un câble souple à trois conducteurs de 2,5 mm² sur les sorties 4, 5 et 6, après avoir gratté 3 cm d’émail.',
      'Lay the six coils 60° apart on a jig, numbered 1 to 6, every turn in the same direction. Join inputs 1, 2 and 3: this is the neutral. Connect output 1 to input 4, 2 to 5, 3 to 6. Solder a flexible three-core 2.5 mm² cable to outputs 4, 5 and 6, after stripping 3 cm of enamel.',
    ),
    parts: ['star-wiring'],
    tools: [
      l('Fer à souder', 'Soldering iron'),
      l('Gaine thermorétractable', 'Heat-shrink sleeving'),
      l('Multimètre', 'Multimeter'),
    ],
    tip: l(
      'Isolez soigneusement : les trois fils ne doivent jamais pouvoir se toucher (wiki).',
      'Insulate carefully: the three wires must never be able to touch (wiki).',
    ),
    duration: '≈ 4 h (est.)',
  },
  {
    id: 'studs',
    scene: 'alternator',
    title: l('Préparer les trois tiges du stator', 'Prepare the three stator rods'),
    text: l(
      'Dans de la tige filetée de 12 mm, coupez trois tiges de 70 mm, fendues en croix sur 10 mm à un bout. Préparez le berceau, un disque d’acier de 140 × 8 mm percé de trous de 12 mm, et vissez-y les trois tiges, bien parallèles : il sert de gabarit pour la coulée. Dans la vidéo, ce sont ces trois tiges qui fixeront le stator.',
      'From 12 mm threaded rod, cut three 70 mm rods, slotted in a cross over 10 mm at one end. Prepare the cradle, a 140 × 8 mm steel disc drilled with 12 mm holes, and screw the three rods onto it, well parallel: it serves as a jig for the casting. In the video it is these three rods that will fix the stator.',
    ),
    parts: ['studs'],
    tools: [
      l('Scie à métaux, lime', 'Hacksaw, file'),
      l('Perceuse à colonne', 'Drill press'),
      l('Écrous de 12 mm', '12 mm nuts'),
    ],
    tip: l(
      'Réglez bien le parallélisme des tiges avant de couler : c’est lui qui fixera l’entrefer (wiki).',
      'Set the parallelism of the rods carefully before casting: it will fix the air gap (wiki).',
    ),
    duration: '≈ 2 h (est.)',
  },
  {
    id: 'stator',
    scene: 'alternator',
    title: l('Couler le stator avec ses trois tiges', 'Cast the stator with its three rods'),
    text: l(
      'Cirez le moule et les pièces. Posez le berceau et ses trois tiges, bout fendu dans la résine. Coulez : résine, disque de fibre de verre, bobines, résine chargée de talc (il aide à évacuer la chaleur), second disque, puis le couvercle et ses pions. Laissez durcir plusieurs heures avant de démouler et de finir. Les dosages ne sont pas donnés ici : suivez la notice ou un stage.',
      'Wax the mould and the parts. Set the cradle and its three rods, slotted end in the resin. Cast: resin, a fibreglass disc, the coils, resin loaded with talc (it helps carry off heat), a second disc, then the lid and its pins. Leave to cure for several hours before demoulding and finishing. Proportions are not given here: follow the datasheet or a course.',
    ),
    parts: ['stator'],
    tools: [
      l('Résine polyester de coulée', 'Polyester casting resin'),
      l('Fibre de verre et talc', 'Fibreglass and talc'),
      l('Gants, lunettes, masque', 'Gloves, goggles, mask'),
    ],
    warning: l(
      'Vapeurs de styrène toxiques : masque, gants, lunettes et ventilation. Ne mélangez jamais le catalyseur à l’accélérateur : il explose (plans).',
      'Toxic styrene fumes: mask, gloves, goggles and ventilation. Never mix the catalyst with the accelerator: it explodes (plans).',
    ),
    duration: '≈ 6 h (est.)',
  },
  {
    id: 'magnet-disc',
    scene: 'alternator',
    title: l('Préparer le disque du rotor', 'Prepare the rotor disc'),
    text: l(
      'Préparez un disque d’acier de 230 × 6 mm, galvanisé de préférence : de l’acier, ni aluminium ni inox. Percez quatre trous de 12 mm, un par quart de cercle de 100 mm. La petite machine n’a qu’un rotor, comme dans la vidéo et le wiki ; deux rotors face à face, 24 aimants en tout, sont ceux de la grande machine de 2,4 m des plans.',
      'Prepare a 230 × 6 mm steel disc, galvanised if possible: steel, not aluminium or stainless. Drill four 12 mm holes, one per quarter of a 100 mm circle. The small machine has a single rotor, as in the video and the wiki; two rotors facing each other, 24 magnets in all, belong to the plans’ large 2.4 m machine.',
    ),
    parts: ['magnet-rotor'],
    tools: [
      l('Perceuse à colonne', 'Drill press'),
      l('Disque d’acier de 230 × 6 mm', '230 × 6 mm steel disc'),
      l('Meuleuse', 'Angle grinder'),
    ],
    tip: l(
      'Ponçez la calamine là où iront les aimants et dégraissez : la colle et la résine ne tiennent pas sur du gras (plans).',
      'Sand the mill scale where the magnets will sit and degrease: glue and resin do not hold on grease (plans).',
    ),
    duration: '≈ 2 h (est.)',
  },
  {
    id: 'magnets',
    scene: 'alternator',
    title: l('Coller et couler les aimants', 'Glue and cast the magnets'),
    text: l(
      'Dégraissez le disque, vissez le gabarit et posez huit aimants N40 de 46 × 30 × 10 mm, un nord puis un sud, en alternance : sans l’alternance, l’alternateur ne marche pas. Coulez ensuite la résine, la fibre de verre posée, sous des masses d’acier : les aimants plaquent le couvercle et chassent l’excédent. Le disque est alors prêt ; tenez-le loin de tout acier.',
      'Degrease the disc, bolt on the jig and set eight 46 × 30 × 10 mm N40 magnets, one north then one south, in alternation: without the alternation, the alternator will not work. Then cast the resin, with the fibreglass laid, under steel weights: the magnets pull the lid down and squeeze out the excess. The disc is then ready; keep it away from all steel.',
    ),
    parts: ['magnets'],
    tools: [
      l('Gabarit de positionnement des aimants', 'Magnet positioning jig'),
      l('Masses d’acier', 'Steel weights'),
      l('Gants et lunettes', 'Gloves and goggles'),
    ],
    tip: l(
      'Vérifiez chaque polarité : l’aimant tenu au-dessus du précédent doit être repoussé (plans).',
      'Check each polarity: the magnet held above the previous one must be repelled (plans).',
    ),
    warning: l(
      'Les aimants se plaquent avec une force qui écrase les doigts et se brisent ; tenez-les à deux mains, loin des cartes et des montres, et loin d’un stimulateur cardiaque.',
      'The magnets snap together with a force that crushes fingers, and they shatter; hold them in both hands, away from cards and watches, and away from a pacemaker.',
    ),
    duration: '≈ 5 h (est.)',
  },
  // ======================================================================================= the turbine world
  {
    id: 'frame',
    scene: 'turbine',
    title: l('Souder le cadre de nacelle et le berceau', 'Weld the nacelle frame and the cradle'),
    text: l(
      'On passe à l’éolienne entière (vue de l’éolienne). Dans la vidéo, la nacelle est la pièce d’acier qui tient la génératrice et pivote sur le mât. Le wiki prend une cornière de 50 × 50 × 6 mm sur 206 mm et un tube de charnière de queue de 33,4 mm × 150 mm. Soudez au bout de la cornière le berceau de 140 × 8 mm, bien centré, d’équerre et par étapes pour limiter la déformation.',
      'On to the whole turbine (turbine view). In the video the nacelle is the steel part that holds the generator and swivels on the mast. The wiki takes a 50 × 50 × 6 mm angle iron 206 mm long and a 33.4 mm × 150 mm tail-hinge tube. Weld the 140 × 8 mm cradle to the end of the angle, well centred, square and in stages to limit distortion.',
    ),
    parts: ['nacelle-frame'],
    tools: [
      l('Poste à souder', 'Welder'),
      l('Équerre et serre-joints', 'Square and clamps'),
      l('Meuleuse', 'Angle grinder'),
    ],
    warning: l(
      'Soudage : espace protégé, masque, vêtements couvrants. Protégez vos yeux en piquant le laitier, et ne touchez pas les électrodes (plans).',
      'Welding: a screened space, mask, covering clothing. Protect your eyes when chipping slag, and do not touch live electrodes (plans).',
    ),
    duration: '≈ 4 h (est.)',
  },
  {
    id: 'yaw',
    scene: 'turbine',
    title: l('Souder le tube pivot et régler le décalage', 'Weld the pivot tube and set the offset'),
    text: l(
      'Soudez d’équerre le tube pivot de 42,2 mm de diamètre extérieur et de 100 mm de long sur la cornière. Dans la vidéo, ce tube est soudé sur la cornière de la nacelle. L’axe de l’alternateur doit rester décalé de 41 mm par rapport à l’axe du pivot : ce décalage est le moteur du repli de la machine.',
      'Weld the 42.2 mm outer-diameter, 100 mm long pivot tube square onto the angle. In the video this tube is welded on the nacelle’s angle. The alternator’s axis must stay offset 41 mm from the pivot axis: that offset is the engine of the machine’s furling.',
    ),
    parts: ['yaw-bearing'],
    tools: [l('Poste à souder', 'Welder'), l('Équerre', 'Square'), l('Pied à coulisse', 'Calipers')],
    tip: l(
      'Vérifiez le décalage de 41 mm avant de souder : une erreur ici change la vitesse de repli.',
      'Check the 41 mm offset before welding: an error here changes the furling speed.',
    ),
    duration: '≈ 2 h (est.)',
  },
  // ======================================================================================= the alternator world
  {
    id: 'shaft',
    scene: 'alternator',
    title: l('Visser la fusée et le stator sur le berceau', 'Screw the stub axle and the stator onto the cradle'),
    text: l(
      'Séparez la fusée fixe du moyeu de la cloche qui tourne, en gardant écrous et roulements. Vissez la fusée sur le berceau de la nacelle : dans la vidéo, c’est elle qui est fixée à la nacelle. Vissez ensuite le stator sur le même berceau par ses trois tiges, avec leurs écrous, sans les serrer à fond. Rien de tout cela ne tournera jamais.',
      'Separate the hub’s fixed stub axle from the rotating bell, keeping the nuts and bearings. Screw the stub axle onto the nacelle’s cradle: in the video, it is the stub that is fixed to the nacelle. Then screw the stator onto the same cradle by its three rods, with their nuts, without tightening them fully. None of this will ever turn.',
    ),
    parts: ['shaft'],
    tools: [l('Clés plates', 'Open-ended spanners'), l('Frein-filet', 'Thread-lock')],
    duration: '≈ 2 h (est.)',
  },
  {
    id: 'bearing-hub',
    scene: 'alternator',
    title: l('Monter le moyeu, puis le rotor à aimants', 'Fit the hub, then the magnet rotor'),
    text: l(
      'Meulez la cloche du moyeu jusqu’à sa plaque plate, puis montez-la sur la fusée avec ses roulements : serrez l’écrou, puis desserrez-le d’un quart de tour pour qu’elle tourne librement. Fixez le disque à aimants sur la cloche, bien à plat, avec quatre tiges filetées de 12 mm et de 140 mm et seize écrous. Ces tiges recevront aussi les pales.',
      'Grind the hub bell down to its flat plate, then fit it on the stub axle with its bearings: tighten the nut, then loosen it a quarter turn so that it turns freely. Fix the magnet disc on the bell, flat, with four 12 mm threaded rods 140 mm long and sixteen nuts. These rods will also take the blades.',
    ),
    parts: ['bearing-hub'],
    tools: [
      l('Meuleuse', 'Angle grinder'),
      l('Graisse et chiffons', 'Grease and rags'),
      l('Frein-filet', 'Thread-lock'),
    ],
    warning: l(
      'Masque et lunettes pour meuler. Approchez le disque à aimants du stator très lentement : l’attraction est brutale et brise la résine.',
      'Mask and goggles for grinding. Bring the magnet disc to the stator very slowly: the attraction is sudden and breaks the resin.',
    ),
    duration: '≈ 3 h (est.)',
  },
  {
    id: 'air-gap',
    scene: 'alternator',
    title: l('Régler l’entrefer', 'Set the air gap'),
    text: l(
      'Avec les écrous des trois tiges du stator, réglez l’entrefer à environ 1 mm, entre les aimants et la face du stator. Contrôlez à la main sur un tour complet : le disque ne doit rien frotter et l’espace doit rester régulier. Serrez enfin les écrous, et vérifiez que le moyeu tourne toujours librement.',
      'With the nuts of the stator’s three rods, set the air gap at about 1 mm, between the magnets and the stator face. Check by hand over a full turn: the disc must rub nothing and the gap must stay even. Finally tighten the nuts, and check that the hub still turns freely.',
    ),
    parts: ['air-gap'],
    tools: [
      l('Jauge d’épaisseur ou cales', 'Feeler gauge or shims'),
      l('Clés plates', 'Open-ended spanners'),
      l('Frein-filet', 'Thread-lock'),
    ],
    tip: l(
      'Laissez de la marge pour l’usure des roulements : la fiabilité passe avant la performance (plans).',
      'Leave a margin for bearing wear: reliability comes before performance (plans).',
    ),
    duration: '≈ 2 h (est.)',
  },
  // ======================================================================================= the turbine world
  {
    id: 'alternator-on-frame',
    scene: 'turbine',
    title: l('Contrôler l’alternateur monté sur la nacelle', 'Check the alternator mounted on the nacelle'),
    text: l(
      'L’alternateur est monté sur le berceau du cadre : fusée, stator, moyeu, rotor. Contrôlez le décalage de 41 mm entre son axe et l’axe du pivot, et qu’aucun écrou n’a bougé. Faites passer le câble de sortie du stator, 60 cm de câble souple à trois conducteurs de 2,5 mm², le long du cadre et dans le tube pivot : après, il n’y aura plus de place pour les mains.',
      'The alternator is mounted on the frame’s cradle: stub axle, stator, hub, rotor. Check the 41 mm offset between its axis and the pivot axis, and that no nut has moved. Feed the stator’s output cable, 60 cm of flexible three-core 2.5 mm² cable, along the frame and into the pivot tube: afterwards there will be no room for hands.',
    ),
    parts: ['alternator'],
    tools: [
      l('Clés plates', 'Open-ended spanners'),
      l('Pied à coulisse', 'Calipers'),
      l('Câble souple à trois conducteurs', 'Flexible three-core cable'),
    ],
    duration: '≈ 1 h (est.)',
  },
  {
    id: 'bench-test',
    scene: 'turbine',
    title: l('Premier essai : est-ce qu’on a du jus ?', 'First test: have we got juice?'),
    text: l(
      'Montez la nacelle sur un mât d’essai et faites tourner le rotor à la main, à un tour par seconde, en mesurant la tension alternative entre deux phases : elle doit approcher 1,9 V (wiki). Sinon, contrôlez l’entrefer. Dans la vidéo, la question « est-ce qu’on a du jus ? » vient vers la fin ; le wiki place l’essai avant les pales et la queue, ce qui facilite la correction.',
      'Mount the nacelle on a test mast and turn the rotor by hand, at one turn per second, measuring the AC voltage between two phases: it must come close to 1.9 V (wiki). If not, check the air gap. In the video the question “have we got juice?” comes near the end; the wiki puts the test before the blades and the tail, which makes correcting easier.',
    ),
    parts: [],
    tools: [
      l('Multimètre en tension alternative', 'Multimeter on AC volts'),
      l('Mât d’essai ou établi solide', 'Test mast or sturdy bench'),
      l('Montre ou chronomètre', 'Watch or stopwatch'),
    ],
    tip: l(
      'Pour mesurer, un tour par seconde, c’est 60 tours par minute ; la tension varie avec la vitesse, ne vous attendez pas à un chiffre fixe.',
      'To measure, one turn per second is 60 turns per minute; the voltage varies with speed, so do not expect a fixed figure.',
    ),
    warning: l(
      'Dès les aimants posés, gardez les doigts loin du rotor et du stator ; ne court-circuitez jamais deux fils nus tenus à la main (plans).',
      'Once the magnets are in, keep fingers away from the rotor and stator; never short-circuit two bare wires held in the hand (plans).',
    ),
    duration: '≈ 1 h (est.)',
  },
  {
    id: 'rotor',
    scene: 'turbine',
    title: l('Monter le rotor sur les tiges', 'Fit the rotor on the rods'),
    text: l(
      'Présentez le rotor, pales et disque de moyeu de 9 mm, sur les quatre tiges : l’ajustement est serré, on peut devoir le chasser au maillet. Dès que les tiges dépassent, vissez un écrou, avec une rondelle, sur chacune et finissez de l’enfoncer avec eux. Vérifiez ensuite que les bouts de pale passent à la même trace, à 10 mm près : sinon, serrez davantage les écrous du côté en avance.',
      'Present the rotor, blades and 9 mm hub disc, onto the four rods: the fit is tight, and you may need to drive it on with a mallet. As soon as the rods show through, fit a nut, with a washer, on each and finish pushing it home with them. Then check that the blade tips follow the same track, within 10 mm: if not, tighten the nuts more on the leading side.',
    ),
    parts: ['rotor'],
    tools: [l('Maillet', 'Mallet'), l('Clés à fourche', 'Spanners'), l('Chaise ou repère fixe', 'Chair or fixed mark')],
    warning: l(
      'Pas de chocs violents sur l’alternateur : la coulée des aimants peut se briser (plans).',
      'No violent blows on the alternator: the magnet casting can break (plans).',
    ),
    duration: '≈ 1 h (est.)',
  },
  {
    id: 'balance',
    scene: 'turbine',
    title: l('Équilibrer le rotor', 'Balance the rotor'),
    text: l(
      'Montez la machine à 1,5 m du sol, dans un endroit abrité du vent. Lâchez le rotor : il se met dans une position préférée, centre de gravité en bas. Fixez provisoirement un contrepoids de plomb du côté opposé, tournez de 90° et ajustez jusqu’à ce que le rotor ne penche plus d’aucun côté. Vissez enfin les poids à demeure sur les pales pour qu’ils ne s’envolent pas.',
      'Set the machine up 1.5 m above the floor, in a place sheltered from the wind. Let go of the rotor: it settles in a preferred position, centre of gravity down. Fix a lead counterweight temporarily on the opposite side, turn by 90° and adjust until the rotor no longer leans either way. Finally screw the weights securely to the blades so that they cannot fly off.',
    ),
    parts: [],
    tools: [
      l('Chaise ou support stable', 'Chair or stable stand'),
      l('Plomb de couverture', 'Lead flashing'),
      l('Vis', 'Screws'),
    ],
    tip: l(
      'On équilibre à l’atelier, pas sur le terrain : le moindre vent fausse la mesure (plans).',
      'Balance in the workshop, not in the field: the slightest wind spoils the measurement (plans).',
    ),
    duration: '≈ 2 h (est.)',
  },
  {
    id: 'tail-hinge',
    scene: 'turbine',
    title: l('Souder la charnière inclinée de la queue', 'Weld the tail’s inclined hinge'),
    text: l(
      'Soudez la platine, coupée à 20°, sur le tube intérieur de 33,4 mm, puis sur le pivot : l’axe de la charnière fait 20° avec la verticale et, vu de dessus, 55° avec l’axe du rotor. Le tube extérieur de 42,2 mm coulisse dessus, fermé par une plaque. Taillez l’encoche qui limite la course de la queue à environ 95°, de 80° du plan du rotor jusqu’à presque parallèle aux pales.',
      'Weld the plate, cut at 20°, onto the 33.4 mm inner tube, then onto the pivot: the hinge axis is 20° from the vertical and, seen from above, 55° to the rotor axis. The 42.2 mm outer tube slides over it, closed by a plate. Cut the notch that limits the tail swing to about 95°, from 80° to the rotor plane up to nearly parallel to the blades.',
    ),
    parts: ['tail-hinge'],
    tools: [
      l('Poste à souder', 'Welder'),
      l('Rapporteur ou gabarit à 20° et 55°', 'Protractor or 20° and 55° jig'),
      l('Scie à métaux, meuleuse', 'Hacksaw, grinder'),
    ],
    warning: l(
      'La queue impose de fortes charges sur cette pièce : une soudure de bonne qualité est indispensable (plans).',
      'The tail puts heavy loads on this part: a good-quality weld is essential (plans).',
    ),
    duration: '≈ 3 h (est.)',
  },
  {
    id: 'tail-boom',
    scene: 'turbine',
    title: l('Souder le bras de queue', 'Weld the tail boom'),
    text: l(
      'Coupez le bras, un tube de 33,4 mm (700 mm dans le wiki, 500 mm dans les plans), en gueule de loup à 110° pour qu’il s’ajuste sur le tube extérieur de la charnière, puis soudez-le très solidement. Posez la queue sur son pivot et réglez la butée. Ensuite seulement, soudez le support du safran, une cornière de 250 mm dans le wiki, pour le mettre d’aplomb.',
      'Cut the boom, a 33.4 mm tube (700 mm in the wiki, 500 mm in the plans), as a bird’s mouth at 110° so that it fits the hinge’s outer tube, then weld it very strongly. Set the tail on its pivot and adjust the stop. Only then weld the vane support, a 250 mm angle in the wiki, to make it upright.',
    ),
    parts: ['tail-boom'],
    tools: [l('Poste à souder', 'Welder'), l('Meuleuse', 'Angle grinder'), l('Équerre', 'Square')],
    duration: '≈ 2 h (est.)',
  },
  {
    id: 'tail-vane',
    scene: 'turbine',
    title: l('Découper et fixer le safran', 'Cut and fit the tail vane'),
    text: l(
      'Découpez le safran dans du contreplaqué extérieur de 6 mm : environ 0,1 m² (le wiki propose un triangle de 300 mm de haut sur 600 mm de base). Arrondissez les angles, poncez, peignez bords compris, puis boulonnez-le au support du bras. Son poids règle la vitesse du repli : la vidéo la situe vers 10 m/s, quand les pales se mettent progressivement parallèles au vent.',
      'Cut the vane from 6 mm exterior plywood: about 0.1 m² (the wiki suggests a triangle 300 mm high on a 600 mm base). Round the corners, sand, paint edges included, then bolt it to the boom’s support. Its weight sets the furling speed: the video puts it at about 10 m/s, when the blades gradually turn parallel to the wind.',
    ),
    parts: ['tail-vane'],
    tools: [
      l('Scie sauteuse', 'Jigsaw'),
      l('Boulons et écrous', 'Bolts and nuts'),
      l('Peinture extérieure', 'Exterior paint'),
    ],
    tip: l(
      'Plus lourd, le safran se replie plus tard ; plus léger, plus tôt : gardez un peu de plomb pour affiner sur le terrain.',
      'Heavier, the vane folds later; lighter, earlier: keep a little lead to fine-tune in the field.',
    ),
    duration: '≈ 2 h (est.)',
  },
  {
    id: 'wire-loop',
    scene: 'turbine',
    title: l('Former la boucle de câble', 'Form the cable loop'),
    text: l(
      'Formez à la sortie du tube pivot une boucle de câble souple, qui laisse la machine tourner sans tirer sur les fils. Marquez les trois fils, puis vérifiez qu’aucun ne peut se coincer entre la nacelle et le haut du mât. Fermez l’interrupteur de freinage avant de lever la machine : la machine est prête, la suite est le guide d’installation.',
      'Form, at the outlet of the pivot tube, a loop of flexible cable that lets the machine turn without pulling on the wires. Mark the three wires, then check that none can get trapped between the nacelle and the top of the mast. Close the brake switch before raising the machine: the machine is ready, the installation guide comes next.',
    ),
    parts: ['wire-loop'],
    tools: [
      l('Câble souple à trois conducteurs', 'Flexible three-core cable'),
      l('Ruban, cosses serties', 'Tape, crimped lugs'),
      l('Pince à sertir', 'Crimping tool'),
    ],
    warning: l(
      'Un fil coincé entre la nacelle et le mât se tord, se dénude, puis fait un court-circuit (Tripalium).',
      'A wire trapped between the nacelle and the mast twists, strips, then short-circuits (Tripalium).',
    ),
    duration: '≈ 2 h (est.)',
  },
];
