/**
 * Límits comarcals projectats des de GeoJSON (41 comarques).
 * Amb comarques visitades, el mapa fa zoom al seu àmbit (no cal veure tot Catalunya).
 */
import comarquesRaw from './comarques-catalunya.json';
import { geoMercator, geoPath } from 'd3-geo';
import type { Feature, FeatureCollection, MultiPolygon } from 'geojson';

/** El GeoJSON d’origen duplica algunes comarques en diverses features (p. ex. Barcelonès); es fusionen en un sol polígon. */
function fusionaPerNomComar(raw: FeatureCollection): FeatureCollection {
  const byNom = new Map<string, Feature[]>();
  for (const f of raw.features) {
    const nom = (f.properties as { nom_comar: string }).nom_comar;
    const arr = byNom.get(nom);
    if (arr) arr.push(f);
    else byNom.set(nom, [f]);
  }
  const features: Feature[] = [];
  for (const [, list] of byNom) {
    if (list.length === 1) {
      features.push(list[0]);
      continue;
    }
    const poligons: number[][][][] = [];
    for (const f of list) {
      const g = f.geometry;
      if (g.type === 'MultiPolygon') {
        poligons.push(...g.coordinates);
      } else if (g.type === 'Polygon') {
        poligons.push(g.coordinates);
      }
    }
    const geometry: MultiPolygon = { type: 'MultiPolygon', coordinates: poligons };
    features.push({
      type: 'Feature',
      properties: list[0].properties,
      geometry,
    });
  }
  return { type: 'FeatureCollection', features };
}

export interface ComarcaMapa {
  id: string;
  nom: string;
  path: string;
  labelX: number;
  labelY: number;
}

export interface ComarcaReferencia {
  id: string;
  nom: string;
}

const MAP_W = 960;
const MAP_H = 780;
const MAP_PAD = 32;

const fc = fusionaPerNomComar(comarquesRaw as FeatureCollection);

export function idDesDelNom(nom: string): string {
  return nom
    .replace(/'/g, '')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Llista estable (id + nom) per a selectors, targetes i recompte — independent del zoom del mapa. */
export const COMARQUES_REFERENCIA: ComarcaReferencia[] = fc.features
  .map((f) => {
    const nom = (f.properties as { nom_comar: string }).nom_comar;
    return { id: idDesDelNom(nom), nom };
  })
  .sort((a, b) => a.nom.localeCompare(b.nom, 'ca'));

export const COMARQUES_MAP_VIEW = { w: MAP_W, h: MAP_H } as const;

/**
 * Projecta totes les comarques; el zoom (Mercator) s’ajusta a les visitades si n’hi ha.
 */
export function buildComarquesMapModel(visitadesIds: ReadonlySet<string>): {
  view: { w: number; h: number };
  comarques: ComarcaMapa[];
} {
  let geoPerAjust: FeatureCollection = fc;
  if (visitadesIds.size > 0) {
    const focus = fc.features.filter((f) =>
      visitadesIds.has(idDesDelNom((f.properties as { nom_comar: string }).nom_comar))
    );
    if (focus.length > 0) {
      geoPerAjust = { type: 'FeatureCollection', features: focus };
    }
  }

  const projection = geoMercator().fitExtent(
    [
      [MAP_PAD, MAP_PAD],
      [MAP_W - MAP_PAD, MAP_H - MAP_PAD],
    ],
    geoPerAjust as FeatureCollection
  );

  const path = geoPath(projection);

  const comarques: ComarcaMapa[] = fc.features.map((f) => {
    const nom = (f.properties as { nom_comar: string }).nom_comar;
    const d = path(f as Feature);
    const [labelX, labelY] = path.centroid(f as Feature);
    return {
      id: idDesDelNom(nom),
      nom,
      path: d ?? '',
      labelX,
      labelY,
    };
  });

  return {
    view: { w: MAP_W, h: MAP_H },
    comarques,
  };
}
