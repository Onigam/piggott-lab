// The text of the side panel while nothing is selected in a world: `{ title, text }` per world, for the lead to wire in
// src/lab.ts (`scenes[i].overview = { ...OVERVIEWS.site, actions: [...] }`; the actions are the lead's, with the `goX` strings of
// src/i18n/ui.ts). Bold on part names, what to look at, how to start; a blank line is a paragraph break. The tone of the series.
// Numbers: reported figures only (the video, the wiki, the plans) or the model's, said as such. The label says 200 W (nominal, the wind
// speed is not given); the model finds about 60 W at 12 m/s.
import type { L } from '@onigam/lab-kit/i18n';
import { l } from '@onigam/lab-kit/i18n';
import type { WorldId } from '../part-ids';
import { FIG } from './figures';
import { nEn, nFr } from './units';

const w12 = { fr: nFr(FIG.w12[0], FIG.w12[1]), en: nEn(FIG.w12[0], FIG.w12[1]) };

export const OVERVIEWS: Record<WorldId, { title: L; text: L }> = {
  site: {
    title: l('Une éolienne Piggott, à quoi ça sert ?', 'What is a Piggott turbine for?'),
    text: l(
      `Une **éolienne Piggott** transforme le vent en électricité pour **charger une batterie 12 V**, sans réseau : trois pales de bois taillées à la main, un alternateur sans réducteur, une queue qui la replie dans la tempête. C’est la machine de la vidéo de Low-tech Lab : 1,20 m de diamètre, 200 W annoncés (valeur nominale, vent non précisé) ; le modèle du labo trouve environ ${w12.fr} W à 12 m/s.\n\nLe **site** montre ce qui l’entoure : le **mât** haubané sur son **pied articulé**, les **arbres et obstacles** qui brouillent le vent, le **câble** vers le **local technique** (interrupteur de freinage, redresseur, fusible, régulateur, délesteur et batterie, qui ont leur vue), la **maison**. **Pour commencer** : « Voir l’éolienne », puis **Simulation** pour changer le vent. **Pour voir comment c’est fait** : **Montage** et **Installation**. Reconstitution pédagogique indépendante, pas un plan de construction : un stage avec un formateur reste la meilleure école.`,
      `A **Piggott turbine** turns the wind into electricity to **charge a 12 V battery**, off the grid: three hand-carved wooden blades, a gearless alternator, a tail that folds it away in a storm. It is the machine of the Low-tech Lab video: 1.20 m across, 200 W rated (a nominal value, wind speed not given); the lab’s model finds about ${w12.en} W at 12 m/s.\n\nThe **site** shows what surrounds it: the guyed **tower** on its **hinged base**, the **trees and obstacles** that disturb the wind, the **cable** to the **technical room** (brake switch, rectifier, fuse, charge controller, dump load and battery, which have their own view), the **house**. **To start**: “See the turbine”, then **Simulation** to change the wind. **To see how it is made**: **Assembly** and **Installation**. An independent educational reconstruction, not a construction plan: a course with a trainer remains the best school.`,
    ),
  },
  shed: {
    title: l('Le local technique', 'The technical room'),
    text: l(
      'Le courant de la machine arrive ici par le **câble** et traverse, dans l’ordre, quatre appareils fixés sur un panneau : l’**interrupteur de freinage**, le **redresseur** qui change les trois fils alternatifs en courant continu, le **fusible** et le **régulateur de charge**. Il finit dans la **batterie** 12 V posée au sol, qui garde l’énergie pour les jours sans vent. Quand elle est pleine, le régulateur envoie le surplus au **délesteur**, une résistance qui chauffe.\n\n**À regarder** : activez **Flux** pour suivre le courant, puis lancez « Batterie pleine » dans la **Simulation** : le délesteur rougit. Le barreau de lumières au-dessus de la batterie dit sa charge ; fermez l’interrupteur de freinage et la manette s’abaisse. **Attention** : une batterie au plomb dégage un gaz qui s’enflamme, et aucun outil ne se pose en travers de ses bornes.',
      'The machine’s current arrives here through the **cable** and goes, in order, through four devices fixed on a board: the **brake switch**, the **rectifier** that turns the three AC wires into direct current, the **fuse** and the **charge controller**. It ends in the 12 V **battery** on the floor, which keeps the energy for windless days. When the battery is full, the controller sends the surplus to the **dump load**, a resistor that heats up.\n\n**What to look at**: switch on **Flows** to follow the current, then run “Full battery” in the **Simulation**: the dump load glows. The row of lights above the battery shows its charge; close the brake switch and the lever drops. **Careful**: a lead-acid battery gives off a gas that can ignite, and no tool is ever laid across its terminals.',
    ),
  },
  turbine: {
    title: l('La machine', 'The machine'),
    text: l(
      'Au sommet du mât : le **rotor** de trois pales, l’**alternateur**, le **cadre de nacelle** qui porte le tout, le **pivot d’orientation** sur le mât et la **queue** (charnière inclinée, bras et safran). Le rotor et l’alternateur ont chacun leur vue : cliquez-les, puis « Voir les pales » ou « Voir l’alternateur ».\n\n**À regarder** : l’axe de l’alternateur est décalé de 41 mm du pivot, si bien que la poussée du vent cherche à tourner la machine hors du vent. La queue, sur sa **charnière inclinée**, la retient jusqu’à environ 10 m/s, puis cède : lancez « Tempête » dans la **Simulation** et regardez-la se replier. La **boucle de câble** laisse la machine tourner sans pincer les fils.',
      'At the top of the mast: the three-bladed **rotor**, the **alternator**, the **nacelle frame** that carries everything, the **yaw bearing** on the mast and the **tail** (inclined hinge, boom and vane). The rotor and the alternator each have their own view: click them, then “See the blades” or “See the alternator”.\n\n**What to look at**: the alternator’s axis is offset 41 mm from the pivot, so the wind thrust constantly tries to turn the machine out of the wind. The tail, on its **inclined hinge**, holds it up to about 10 m/s, then yields: run “Storm” in the **Simulation** and watch it fold. The **cable loop** lets the machine turn without pinching the wires.',
    ),
  },
  alternator: {
    title: l('L’alternateur', 'The alternator'),
    text: l(
      'Le courant naît ici. Des **aimants néodyme** collés sur un **disque d’acier** tournent devant un **stator** de six **bobines** noyées dans la résine : à chaque passage d’un aimant, la tension change de sens. Les bobines sont reliées en **étoile**, en trois phases. La **fusée** du moyeu est fixe, vissée sur le berceau de la nacelle, avec le stator et ses trois **tiges filetées** ; le **moyeu à roulements** tourne sur la fusée et porte le disque par quatre longues tiges. L’**entrefer**, environ 1 mm, se règle aux écrous du stator.\n\n**À regarder** : l’**éclaté**, les deux **moules** où l’on coule la résine, et l’essai du wiki à un tour par seconde, environ 1,9 V entre phases. **Attention** : ces aimants se plaquent sur l’acier avec une force qui écrase les doigts. Un seul rotor sur cette machine de 1,2 m ; deux rotors, c’est la grande machine de 2,4 m des plans.',
      'Current is born here. **Neodymium magnets** glued on a **steel disc** turn in front of a **stator** of six **coils** embedded in resin: each time a magnet passes, the voltage changes direction. The coils are joined in a **star**, in three phases. The hub’s **stub axle** is fixed, screwed onto the nacelle’s cradle, with the stator and its three **threaded rods**; the **bearing hub** turns on the stub axle and carries the disc by four long rods. The **air gap**, about 1 mm, is set at the stator nuts.\n\n**What to look at**: the **explode** view, the two **moulds** in which the resin is cast, and the wiki’s test at one turn per second, about 1.9 V between phases. **Careful**: these magnets snap onto steel with a force that crushes fingers. A single rotor on this 1.2 m machine; two rotors belong to the plans’ large 2.4 m machine.',
    ),
  },
  blades: {
    title: l('Les pales', 'The blades'),
    text: l(
      'Trois **pales** de 600 mm, taillées à la main dans un **plateau de bois** tendre. Chacune suit six **sections** (les gabarits) : large et épaisse au pied, étroite et mince au bout, et tordue. La **face au vent** est presque plate, le **dos** arrondi comme une aile. Les pales se vissent sur le **disque de moyeu**, à 120° les unes des autres.\n\n**À regarder** : activez la **Transparence** pour voir les sections, et comparez le pied (153 mm de large, 49 mm d’épaisseur) au bout (55 mm, 6 mm). **Pour commencer** : le mode **Montage** taille les trois pales, puis les assemble. Dans la **Simulation**, la vitesse spécifique et le Cp disent ce que ces pales donnent réellement une fois freinées par l’alternateur.',
      'Three 600 mm **blades**, hand-carved from a softwood **timber blank**. Each follows six **sections** (the templates): wide and thick at the root, narrow and thin at the tip, and twisted. The **windward face** is nearly flat, the **back** curved like a wing. The blades are screwed onto the **hub disc**, 120° apart.\n\n**What to look at**: switch on **X-ray** to see the sections, and compare the root (153 mm wide, 49 mm thick) with the tip (55 mm, 6 mm). **To start**: **Assembly** mode carves the three blades, then assembles them. In the **Simulation**, the tip speed ratio and the Cp say what these blades really give once the alternator holds them back.',
    ),
  },
};
