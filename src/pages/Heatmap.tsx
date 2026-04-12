import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRutes } from '../store/useRutes';
import type { Ruta } from '../types/ruta';

const DIES_LABEL = ['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
const CELL = 12;
const GAP = 4;
const COL_W = CELL + GAP;

function formatDiaKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generarDiesAny(any: number): Date[][] {
  const first = new Date(any, 0, 1);
  const last = new Date(any, 11, 31);
  const dow = first.getDay();
  const monOffset = dow === 0 ? -6 : 1 - dow;
  const cur = new Date(first);
  cur.setDate(first.getDate() + monOffset);

  const setmanes: Date[][] = [];
  while (true) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    setmanes.push(week);
    if (week[6].getTime() >= last.getTime()) break;
  }
  return setmanes;
}

function colorCella(km: number, maxKm: number): string {
  if (km === 0) return 'var(--border)';
  const ratio = Math.min(km / maxKm, 1);
  if (ratio < 0.25) return 'rgba(29, 158, 117, 0.20)';
  if (ratio < 0.5) return 'rgba(29, 158, 117, 0.45)';
  if (ratio < 0.75) return 'rgba(29, 158, 117, 0.70)';
  return 'var(--accent)';
}

function mateixDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function Heatmap() {
  const { rutes } = useRutes();
  const anyActual = new Date().getFullYear();
  const [any, setAny] = useState(anyActual);
  const [diaSeleccionat, setDiaSeleccionat] = useState<string | null>(null);

  const anysDisponibles = useMemo(() => {
    const set = new Set([anyActual, ...rutes.map((r) => new Date(r.data).getFullYear())]);
    return Array.from(set).sort((a, b) => b - a);
  }, [rutes, anyActual]);

  const dadesPerDia = useMemo(() => {
    const map = new Map<string, { km: number; rutes: Ruta[] }>();
    rutes
      .filter((r) => new Date(r.data).getFullYear() === any)
      .forEach((r) => {
        const key = r.data.slice(0, 10);
        const prev = map.get(key) ?? { km: 0, rutes: [] };
        map.set(key, {
          km: prev.km + (r.distanciaKm ?? 0),
          rutes: [...prev.rutes, r],
        });
      });
    return map;
  }, [rutes, any]);

  const maxKm = useMemo(
    () => Math.max(1, ...Array.from(dadesPerDia.values()).map((d) => d.km)),
    [dadesPerDia]
  );

  const setmanes = useMemo(() => generarDiesAny(any), [any]);

  const etiquetesMesos = useMemo(() => {
    const etiquetes: { label: string; setmanaIdx: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const primer = new Date(any, m, 1);
      const si = setmanes.findIndex((setmana) =>
        setmana.some(
          (d) =>
            d.getFullYear() === primer.getFullYear() &&
            d.getMonth() === primer.getMonth() &&
            d.getDate() === 1
        )
      );
      if (si >= 0) {
        etiquetes.push({
          label: primer.toLocaleDateString('ca-ES', { month: 'short' }),
          setmanaIdx: si,
        });
      }
    }
    return etiquetes;
  }, [setmanes, any]);

  const rutesAny = useMemo(
    () => rutes.filter((r) => new Date(r.data).getFullYear() === any),
    [rutes, any]
  );

  const diesActius = dadesPerDia.size;

  const setmanesActives = useMemo(() => {
    const idxs = new Set<number>();
    for (const key of dadesPerDia.keys()) {
      const [y, mo, da] = key.split('-').map(Number);
      const day = new Date(y, mo - 1, da);
      const si = setmanes.findIndex((week) => week.some((d) => mateixDia(d, day)));
      if (si >= 0) idxs.add(si);
    }
    return idxs.size;
  }, [dadesPerDia, setmanes]);

  const kmTotals = useMemo(
    () => rutesAny.reduce((s, r) => s + (r.distanciaKm ?? 0), 0),
    [rutesAny]
  );

  const diaMaxKm = useMemo(() => {
    const entries = Array.from(dadesPerDia.entries());
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1].km - a[1].km)[0];
  }, [dadesPerDia]);

  const dadesDiaSeleccionat = diaSeleccionat ? dadesPerDia.get(diaSeleccionat) : undefined;
  const dataLlarga =
    diaSeleccionat != null
      ? new Date(diaSeleccionat + 'T12:00:00').toLocaleDateString('ca-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '';

  const labelColWidth = 24;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <section>
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
              Activitat
            </p>
            <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
              Heatmap anual
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Km per dia · estil contribucions
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)] md:hidden">
              Fes scroll horitzontal per veure tot l&apos;any.
            </p>
          </section>
        </div>
        <div className="flex flex-wrap gap-2">
          {anysDisponibles.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                setAny(a);
                setDiaSeleccionat(null);
              }}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                any === a
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--superficie)]/25 bg-[var(--superficie-muted)] text-[var(--text-secondary)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="app-card mb-6">
        <div
          className="relative mb-2 min-h-[18px]"
          style={{ paddingLeft: labelColWidth, width: 'max-content', minWidth: '100%' }}
        >
          {etiquetesMesos.map(({ label, setmanaIdx }) => (
            <span
              key={`${label}-${setmanaIdx}`}
              className="absolute top-0 text-[9px] capitalize text-[var(--text-muted)]"
              style={{ left: labelColWidth + setmanaIdx * COL_W }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1" style={{ width: 'max-content' }}>
            <div className="mr-1 flex flex-col gap-1">
              {DIES_LABEL.map((d) => (
                <div
                  key={d}
                  className="flex h-3 w-5 items-center text-[9px] text-[var(--text-muted)]"
                >
                  {d}
                </div>
              ))}
            </div>

            {setmanes.map((setmana, si) => (
              <div key={si} className="flex flex-col gap-1">
                {setmana.map((dia, di) => {
                  const key = formatDiaKey(dia);
                  const dades = dadesPerDia.get(key);
                  const esDiaDinsAny = dia.getFullYear() === any;
                  let color: string;
                  if (!esDiaDinsAny) color = 'transparent';
                  else if (dades) color = colorCella(dades.km, maxKm);
                  else color = 'var(--border)';

                  const title = esDiaDinsAny
                    ? dades
                      ? `${key}: ${dades.km.toFixed(1)} km · ${dades.rutes.length} ruta${
                          dades.rutes.length > 1 ? 's' : ''
                        }`
                      : `${key}: sense activitat`
                    : '';

                  return (
                    <div
                      key={`${si}-${di}`}
                      role={dades && esDiaDinsAny ? 'button' : undefined}
                      tabIndex={dades && esDiaDinsAny ? 0 : undefined}
                      className={`h-3 w-3 rounded-sm transition-opacity ${
                        esDiaDinsAny ? 'hover:opacity-70' : ''
                      } ${dades && esDiaDinsAny ? 'cursor-pointer' : 'cursor-default'}`}
                      style={{ background: color }}
                      title={title}
                      onClick={() => {
                        if (dades && esDiaDinsAny) {
                          setDiaSeleccionat(diaSeleccionat === key ? null : key);
                        }
                      }}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && dades && esDiaDinsAny) {
                          e.preventDefault();
                          setDiaSeleccionat(diaSeleccionat === key ? null : key);
                        }
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="app-card mb-6">
        {!diaSeleccionat || !dadesDiaSeleccionat ? (
          <p className="text-center text-sm text-[var(--text-muted)]">
            Clica un dia amb activitat per veure el detall
          </p>
        ) : (
          <>
            <p className="mb-4 capitalize text-sm font-semibold text-[var(--text-primary)]">
              {dataLlarga}
            </p>
            <ul className="m-0 list-none space-y-3 p-0">
              {dadesDiaSeleccionat.rutes.map((ruta) => (
                <li key={ruta.id}>
                  <Link
                    to={`/rutes/${ruta.id}`}
                    className="font-medium text-[var(--accent)] no-underline hover:underline"
                  >
                    {ruta.nom}
                  </Link>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {ruta.distanciaKm != null ? `${ruta.distanciaKm} km` : '—'} ·{' '}
                    {ruta.desnivellMetres != null ? `${ruta.desnivellMetres} m` : '—'} ·{' '}
                    {ruta.tipus ?? '—'}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="app-card py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Dies actius</p>
          <p className="text-xl font-bold text-[var(--accent)]">{diesActius}</p>
        </div>
        <div className="app-card py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Setmanes actives
          </p>
          <p className="text-xl font-bold text-[var(--accent)]">{setmanesActives}</p>
        </div>
        <div className="app-card py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Km totals</p>
          <p className="text-xl font-bold text-[var(--text-primary)]">{kmTotals.toFixed(1)}</p>
        </div>
        <div className="app-card py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Dia més actiu
          </p>
          <p className="text-xl font-bold text-[var(--text-primary)]">
            {diaMaxKm ? `${diaMaxKm[1].km.toFixed(1)} km` : '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
        <span>Menys</span>
        <span className="h-3 w-3 rounded-sm" style={{ background: 'rgba(29, 158, 117, 0.20)' }} />
        <span className="h-3 w-3 rounded-sm" style={{ background: 'rgba(29, 158, 117, 0.45)' }} />
        <span className="h-3 w-3 rounded-sm" style={{ background: 'rgba(29, 158, 117, 0.70)' }} />
        <span className="h-3 w-3 rounded-sm" style={{ background: 'var(--accent)' }} />
        <span>Més</span>
      </div>
    </div>
  );
}
