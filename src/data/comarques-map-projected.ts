/**
 * Límits comarcals projectats des de GeoJSON (41 comarques, ~comarca oficial).
 * Font dades: comarques-compressed.geojson (IDESCAT / derivats; veure comarques-catalunya.geojson capçalera si s’afegeix).
 */
import comarquesRaw from './comarques-catalunya.json';
import { geoMercator, geoPath } from 'd3-geo';
import type { FeatureCollection } from 'geojson';

export interface ComarcaMapa {
  id: string;
  nom: string;
  path: string;
  labelX: number;
  labelY: number;
}

const MAP_W = 960;
const MAP_H = 780;

function idDesDelNom(nom: string): string {
  return nom
    .replace(/'/g, '')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const fc = comarquesRaw as FeatureCollection;
const projection = geoMercator().fitExtent(
  [
    [2, 2],
    [MAP_W - 2, MAP_H - 2],
  ],
  fc
);

const path = geoPath(projection);

export const COMARQUES_MAP_VIEW = { w: MAP_W, h: MAP_H } as const;

export const COMARQUES_MAPA: ComarcaMapa[] = fc.features.map((f) => {
  const nom = (f.properties as { nom_comar: string }).nom_comar;
  const d = path(f);
  const [labelX, labelY] = path.centroid(f);
  return {
    id: idDesDelNom(nom),
    nom,
    path: d ?? '',
    labelX,
    labelY,
  };
});
