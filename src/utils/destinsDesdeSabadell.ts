/**
 * Distàncies orientatives per carretera des de Sabadell (km arrodonits).
 * Revisió manual tipus Google Maps; només per a la visualització lúdica del dashboard.
 */

export type DestiSabadell = {
  nom: string;
  km: number;
  pais: string;
};

export type SectorDestins = {
  id: string;
  /** Etiqueta curta en català (direcció aproximada). */
  direccio: string;
  /** Ordenat per km ascendent. */
  destins: DestiSabadell[];
};

/** Corredors disjunts; dins de cadascú, la ciutat més llunyana assolible amb crèdit T és l’última amb km ≤ T. */
export const SECTORS_DES_SABADELL: SectorDestins[] = [
  {
    id: 'levant',
    direccio: 'Levant (Mediterrani)',
    destins: [
      { nom: 'Tarragona', km: 105, pais: 'Espanya' },
      { nom: 'Castelló de la Plana', km: 248, pais: 'Espanya' },
      { nom: 'València', km: 358, pais: 'Espanya' },
      { nom: 'Alacant', km: 505, pais: 'Espanya' },
      { nom: 'Múrcia', km: 645, pais: 'Espanya' },
    ],
  },
  {
    id: 'interior',
    direccio: 'Interior (Aragó / Madrid)',
    destins: [
      { nom: 'Lleida', km: 155, pais: 'Espanya' },
      { nom: 'Osca', km: 245, pais: 'Espanya' },
      { nom: 'Saragossa', km: 308, pais: 'Espanya' },
      { nom: 'Madrid', km: 628, pais: 'Espanya' },
    ],
  },
  {
    id: 'nord_fr',
    direccio: 'Nord (França / Bèlgica)',
    destins: [
      { nom: 'Perpinyà', km: 172, pais: 'França' },
      { nom: 'Montpellier', km: 295, pais: 'França' },
      { nom: 'Marsella', km: 425, pais: 'França' },
      { nom: 'Lió', km: 535, pais: 'França' },
      { nom: 'París', km: 945, pais: 'França' },
      { nom: 'Brussel·les', km: 1280, pais: 'Bèlgica' },
    ],
  },
  {
    id: 'nord_oest',
    direccio: 'Nord-oest (País Basc / Galícia)',
    destins: [
      { nom: 'Pamplona', km: 425, pais: 'Espanya' },
      { nom: 'Vitòria', km: 485, pais: 'Espanya' },
      { nom: 'Bilbao', km: 535, pais: 'Espanya' },
      { nom: 'Oviedo', km: 785, pais: 'Espanya' },
      { nom: 'Santiago de Compostel·la', km: 985, pais: 'Espanya' },
      { nom: 'La Corunya', km: 1005, pais: 'Espanya' },
    ],
  },
  {
    id: 'sud',
    direccio: 'Sud (Andalusia)',
    destins: [
      { nom: 'Granada', km: 915, pais: 'Espanya' },
      { nom: 'Màlaga', km: 1005, pais: 'Espanya' },
      { nom: 'Sevilla', km: 1055, pais: 'Espanya' },
      { nom: 'Cadis', km: 1140, pais: 'Espanya' },
    ],
  },
  {
    id: 'sud_oest_portugal',
    direccio: 'Sud-oest (Portugal)',
    destins: [
      { nom: 'Coïmbra', km: 1080, pais: 'Portugal' },
      { nom: 'Porto', km: 1180, pais: 'Portugal' },
      { nom: 'Lisboa', km: 1230, pais: 'Portugal' },
    ],
  },
  {
    id: 'europa_sud',
    direccio: 'Itàlia / Alps',
    destins: [
      { nom: 'Torí', km: 780, pais: 'Itàlia' },
      { nom: 'Milà', km: 1020, pais: 'Itàlia' },
      { nom: 'Gènova', km: 880, pais: 'Itàlia' },
      { nom: 'Roma', km: 1450, pais: 'Itàlia' },
    ],
  },
  {
    id: 'europa_centre',
    direccio: 'Europa central (Alemanya)',
    destins: [
      { nom: 'Munic', km: 1180, pais: 'Alemanya' },
      { nom: 'Stuttgart', km: 1120, pais: 'Alemanya' },
      { nom: 'Frankfurt', km: 1340, pais: 'Alemanya' },
      { nom: 'Berlín', km: 1820, pais: 'Alemanya' },
    ],
  },
];

function millorDestiAlSector(sector: SectorDestins, kmTotal: number): DestiSabadell | null {
  let millor: DestiSabadell | null = null;
  for (const d of sector.destins) {
    if (d.km <= kmTotal) millor = d;
    else break;
  }
  return millor;
}

export type AproximacioKm = {
  direccio: string;
  desti: DestiSabadell;
  /** kmTotals − km fins al destí (com més petit, millor s’aprofita el crèdit). */
  residualKm: number;
};

/**
 * Les 3 direccions on una ciutat assolible amb `kmTotal` queda més a prop d’esgotar el crèdit
 * (residual més petit entre sectors que tenen almenys un destí vàlid).
 */
export function tresMillorsAproximacionsDesSabadell(kmTotal: number): AproximacioKm[] {
  if (kmTotal <= 0) return [];

  const candidats: AproximacioKm[] = [];
  for (const sector of SECTORS_DES_SABADELL) {
    const desti = millorDestiAlSector(sector, kmTotal);
    if (!desti) continue;
    candidats.push({
      direccio: sector.direccio,
      desti,
      residualKm: kmTotal - desti.km,
    });
  }

  candidats.sort((a, b) => a.residualKm - b.residualKm);
  return candidats.slice(0, 3);
}
