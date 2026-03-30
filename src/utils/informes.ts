import type { Ruta } from '../types/ruta';

export type Periode = 'mensual' | 'trimestral' | 'semestral' | 'anual';

/** Període amb indicador si encara està obert al calendari (dades fins avui). */
export type ItemPeriode = { start: Date; end: Date; label: string; enCurs: boolean };

function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** Data de ruta (YYYY-MM-DD) com a inici del dia en hora local (evita desfases UTC). */
export function parseDataRuta(isoDate: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  const d = new Date(isoDate);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/** Fi efectiu del període per filtrar rutes: tot el darrer dia si ja ha passat; si no, fins ara (progrés registrat). */
export function fiPeriodeEfectiu(end: Date, ara: Date = new Date()): Date {
  const ultimDia = endOfLocalDay(end);
  return ara.getTime() <= ultimDia.getTime() ? ara : ultimDia;
}

export function periodeEsEnCurs(start: Date, end: Date, ara: Date = new Date()): boolean {
  const fiCal = endOfLocalDay(end);
  return ara >= start && ara <= fiCal;
}

function getStartEnd(any: number, periode: Periode, index: number): { start: Date; end: Date; label: string } {
  if (periode === 'mensual') {
    const start = new Date(any, index, 1);
    const end = new Date(any, index + 1, 0);
    return { start, end, label: start.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' }) };
  }
  if (periode === 'trimestral') {
    const start = new Date(any, index * 3, 1);
    const end = new Date(any, index * 3 + 3, 0);
    const trim = index + 1;
    return { start, end, label: `T${trim} ${any}` };
  }
  if (periode === 'semestral') {
    const start = new Date(any, index * 6, 1);
    const end = new Date(any, index * 6 + 6, 0);
    return { start, end, label: index === 0 ? `Gen–Jun ${any}` : `Jul–Des ${any}` };
  }
  const start = new Date(any, 0, 1);
  const end = new Date(any, 11, 31);
  return { start, end, label: String(any) };
}

export function getPeriodes(periode: Periode, anysEnrere: number = 2): ItemPeriode[] {
  const result: ItemPeriode[] = [];
  const anyActual = new Date().getFullYear();
  const ara = new Date();
  for (let a = anyActual; a >= anyActual - anysEnrere; a--) {
    const count = periode === 'mensual' ? 12 : periode === 'trimestral' ? 4 : periode === 'semestral' ? 2 : 1;
    for (let i = periode === 'anual' ? 0 : count - 1; i >= 0; i--) {
      const item = getStartEnd(a, periode, i);
      // Inclou el període en curs (mes/trimestre/any actual); només exclou els que encara no han començat.
      if (item.start > ara) continue;
      const enCurs = periodeEsEnCurs(item.start, item.end, ara);
      result.push({ ...item, enCurs });
    }
  }
  return result.slice(0, 24);
}

/**
 * Rutes amb data dins [start, fi efectiu], on la fi és el mínim entre «ara» i l’últim dia del període (inclusiu).
 * El període en curs només compta activitat registrada fins al moment actual.
 */
export function filtrarRutesPerPeriode(rutes: Ruta[], start: Date, end: Date, ara: Date = new Date()): Ruta[] {
  const fi = fiPeriodeEfectiu(end, ara);
  return rutes.filter((r) => {
    const d = parseDataRuta(r.data);
    return d >= start && d <= fi;
  });
}

export function resumRutes(rutes: Ruta[]) {
  const distancia = rutes.reduce((s, r) => s + (r.distanciaKm ?? 0), 0);
  const durada = rutes.reduce((s, r) => s + (r.duradaMinuts ?? 0), 0);
  const desnivell = rutes.reduce((s, r) => s + (r.desnivellMetres ?? 0), 0);
  return { distancia, durada, desnivell, sortides: rutes.length };
}

/** Rutes del mes natural actual amb data fins al moment `ara` (progrés registrat). */
export function filtrarRutesAquestMesFinsAvui(rutes: Ruta[], ara: Date = new Date()): Ruta[] {
  const inici = new Date(ara.getFullYear(), ara.getMonth(), 1);
  return filtrarRutesPerPeriode(rutes, inici, ara, ara);
}
