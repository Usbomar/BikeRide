import type { Ruta, TipusRuta } from '../types/ruta';
import { resumRutes } from './informes';

export function totalHores(rutes: Ruta[]): number {
  return rutes.reduce((s, r) => s + (r.duradaMinuts ?? 0) / 60, 0);
}

export function estadistiquesGlobals(rutes: Ruta[]) {
  const resum = resumRutes(rutes);
  const hores = totalHores(rutes);
  const n = rutes.length;
  const ambDistancia = rutes.filter((r) => (r.distanciaKm ?? 0) > 0);
  const ambDesnivell = rutes.filter((r) => (r.desnivellMetres ?? 0) > 0);
  const ambVelocitat = rutes.filter((r) => (r.velocitatMaxima ?? 0) > 0);
  const ambAlcada = rutes.filter((r) => (r.alcadaMaximaMetres ?? 0) > 0);

  const mitjanaKm = ambDistancia.length ? ambDistancia.reduce((s, r) => s + (r.distanciaKm ?? 0), 0) / ambDistancia.length : 0;
  const mitjanaDesnivell = ambDesnivell.length ? ambDesnivell.reduce((s, r) => s + (r.desnivellMetres ?? 0), 0) / ambDesnivell.length : 0;
  const mitjanaDurada = n ? resum.durada / n : 0;

  const velocitatMaxima = ambVelocitat.length ? Math.max(...ambVelocitat.map((r) => r.velocitatMaxima ?? 0)) : null;
  const rutaVelocitatMax = ambVelocitat.length ? ambVelocitat.reduce((best, r) => ((r.velocitatMaxima ?? 0) > (best?.velocitatMaxima ?? 0) ? r : best)) : null;
  const alcadaMaxima = ambAlcada.length ? Math.max(...ambAlcada.map((r) => r.alcadaMaximaMetres ?? 0)) : null;
  const rutaAlcadaMax = ambAlcada.length ? ambAlcada.reduce((best, r) => ((r.alcadaMaximaMetres ?? 0) > (best?.alcadaMaximaMetres ?? 0) ? r : best)) : null;

  return {
    ...resum,
    hores: Math.round(hores * 10) / 10,
    sortides: n,
    mitjanaKmPerSortida: Math.round(mitjanaKm * 10) / 10,
    mitjanaDesnivellPerSortida: Math.round(mitjanaDesnivell),
    mitjanaDuradaMinuts: Math.round(mitjanaDurada),
    velocitatMaxima: velocitatMaxima != null ? Math.round(velocitatMaxima * 10) / 10 : null,
    rutaVelocitatMax,
    alcadaMaxima,
    rutaAlcadaMax,
  };
}

export function distribucioPerTipus(rutes: Ruta[]): { tipus: TipusRuta | 'no especificat'; count: number; km: number }[] {
  const tipus: (TipusRuta | 'no especificat')[] = ['carretera', 'mtb', 'urbà', 'gravel', 'altre', 'no especificat'];
  return tipus.map((t) => {
    const filtrades = t === 'no especificat'
      ? rutes.filter((r) => !r.tipus)
      : rutes.filter((r) => r.tipus === t);
    const km = filtrades.reduce((s, r) => s + (r.distanciaKm ?? 0), 0);
    return { tipus: t, count: filtrades.length, km: Math.round(km * 10) / 10 };
  }).filter((x) => x.count > 0);
}

/** Agrupa rutes per comarca: nombre de vegades (sortides) al destí, km i desnivell totals */
export function distribucioPerComarca(rutes: Ruta[]): { comarca: string; vegades: number; km: number; desnivell: number }[] {
  const map = new Map<string, { vegades: number; km: number; desnivell: number }>();
  for (const r of rutes) {
    const key = r.zona?.trim() || 'Sense comarca';
    const prev = map.get(key) ?? { vegades: 0, km: 0, desnivell: 0 };
    map.set(key, {
      vegades: prev.vegades + 1,
      km: prev.km + (r.distanciaKm ?? 0),
      desnivell: prev.desnivell + (r.desnivellMetres ?? 0),
    });
  }
  return Array.from(map.entries())
    .map(([comarca, d]) => ({
      comarca,
      vegades: d.vegades,
      km: Math.round(d.km * 100) / 100,
      desnivell: d.desnivell,
    }))
    .filter((x) => x.vegades > 0)
    .sort((a, b) => b.vegades - a.vegades);
}

export function getMesPassat(offset: number = 1): { start: Date; end: Date } {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start, end };
}
