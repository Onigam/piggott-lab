import * as THREE from 'three';
import { MAT } from '@onigam/lab-kit/three';

// The lab's timber. The kit's wood colours were tuned under ACES; under the Neutral curve of the paper studio (kit 0.5, `PAPER_STUDIO`)
// they come out as a strong orange. These are the same woods with less saturation: they read as pine, plywood and oak in the studio's
// warm light (docs/picture.md). The kit's materials are made the usual way and only recoloured, so everything else about them stays.
const recolour = (m: THREE.MeshStandardMaterial, color: number): THREE.MeshStandardMaterial => {
  m.color.setHex(color);
  return m;
};

export const TIMBER = {
  wood: () => recolour(MAT.wood(), 0x9a8560),
  woodLight: () => recolour(MAT.woodLight(), 0xb7a78a),
  woodDark: () => recolour(MAT.woodDark(), 0x786247),
  osb: () => recolour(MAT.osb(), 0xbaa88c),
} as const;
