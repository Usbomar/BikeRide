import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRutes } from '../store/useRutes';
import { resumRutes } from '../utils/informes';
import { formatKm } from '../utils/format';
import type { Ruta } from '../types/ruta';
import { EmptyState } from '../components/EmptyState';
import PanellHeroRider from '../components/panell/PanellHeroRider';

function formatDurada(minuts: number): string {
  const h = Math.floor(minuts / 60);
  const m = Math.round(minuts % 60);
  if (h <= 0) return `${m} min`;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function millorPer(
  rutes: Ruta[],
  puntuacio: (r: Ruta) => number,
  teValor: (r: Ruta) => boolean
): Ruta | null {
  const ok = rutes.filter(teValor);
  if (ok.length === 0) return null;
  return ok.reduce((a, b) => (puntuacio(b) > puntuacio(a) ? b : a));
}

function dataLlarga(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('ca-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function Panell() {
  const { rutes } = useRutes();

  const resum = useMemo(() => resumRutes(rutes), [rutes]);

  const primeraData = useMemo(() => {
    const d = [...rutes].map((r) => r.data).sort()[0];
    return d ?? null;
  }, [rutes]);

  const darreraData = useMemo(() => {
    const d = [...rutes].map((r) => r.data).sort().at(-1);
    return d ?? null;
  }, [rutes]);

  const rutaDistancia = useMemo(
    () => millorPer(rutes, (r) => r.distanciaKm ?? 0, (r) => (r.distanciaKm ?? 0) > 0),
    [rutes]
  );
  const rutaDesnivell = useMemo(
    () => millorPer(rutes, (r) => r.desnivellMetres ?? 0, (r) => (r.desnivellMetres ?? 0) > 0),
    [rutes]
  );
  const rutaVelMax = useMemo(
    () => millorPer(rutes, (r) => r.velocitatMaxima ?? 0, (r) => (r.velocitatMaxima ?? 0) > 0),
    [rutes]
  );
  const rutaVelMitjana = useMemo(
    () => millorPer(rutes, (r) => r.velocitatMitjana ?? 0, (r) => (r.velocitatMitjana ?? 0) > 0),
    [rutes]
  );
  const rutaDurada = useMemo(
    () => millorPer(rutes, (r) => r.duradaMinuts ?? 0, (r) => (r.duradaMinuts ?? 0) > 0),
    [rutes]
  );
  const rutaAlcada = useMemo(
    () => millorPer(rutes, (r) => r.alcadaMaximaMetres ?? 0, (r) => (r.alcadaMaximaMetres ?? 0) > 0),
    [rutes]
  );

  const blocsRecords = useMemo(
    () =>
      [
        {
          titol: 'Distància màxima (una sortida)',
          ruta: rutaDistancia,
          valor:
            rutaDistancia != null
              ? formatKm(rutaDistancia.distanciaKm ?? 0)
              : '—',
        },
        {
          titol: 'Desnivell màxim',
          ruta: rutaDesnivell,
          valor:
            rutaDesnivell != null
              ? `${Math.round(rutaDesnivell.desnivellMetres ?? 0).toLocaleString('ca-ES')} m`
              : '—',
        },
        {
          titol: 'Velocitat màxima (pic)',
          ruta: rutaVelMax,
          valor:
            rutaVelMax != null
              ? `${(rutaVelMax.velocitatMaxima ?? 0).toLocaleString('ca-ES', { maximumFractionDigits: 1 })} km/h`
              : '—',
        },
        {
          titol: 'Millor mitjana de velocitat',
          ruta: rutaVelMitjana,
          valor:
            rutaVelMitjana != null
              ? `${(rutaVelMitjana.velocitatMitjana ?? 0).toLocaleString('ca-ES', { maximumFractionDigits: 1 })} km/h`
              : '—',
        },
        {
          titol: 'Durada màxima',
          ruta: rutaDurada,
          valor: rutaDurada != null ? formatDurada(rutaDurada.duradaMinuts ?? 0) : '—',
        },
        {
          titol: 'Alçada màxima',
          ruta: rutaAlcada,
          valor:
            rutaAlcada != null
              ? `${Math.round(rutaAlcada.alcadaMaximaMetres ?? 0).toLocaleString('ca-ES')} m`
              : '—',
        },
      ] as const,
    [rutaDistancia, rutaDesnivell, rutaVelMax, rutaVelMitjana, rutaDurada, rutaAlcada]
  );

  const rutesMesLlargues = useMemo(() => {
    return [...rutes]
      .filter((r) => (r.distanciaKm ?? 0) > 0)
      .sort((a, b) => (b.distanciaKm ?? 0) - (a.distanciaKm ?? 0))
      .slice(0, 10);
  }, [rutes]);

  const maxKmBar = rutesMesLlargues[0]?.distanciaKm ?? 1;

  if (rutes.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-[var(--accent)]">Mètriques i informes</p>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Panell</h1>
        </header>
        <EmptyState titol="Encara no hi ha dades" descripcio="Afegeix rutes per veure rècords i rànquings al panell." accio={{ label: 'Nova ruta', to: '/nova-ruta' }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent)]">Mètriques i informes</p>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Panell</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Rècords personals i rutes més llargues · {resum.sortides} sortides ·{' '}
          {formatKm(resum.distancia)} acumulats
        </p>
      </header>

      {/* Metadades + hero xifres + il·lustració */}
      <section className="overflow-hidden rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)]">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="flex flex-wrap gap-3 text-xs md:flex-col md:gap-2">
            {primeraData && (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Primera sortida</div>
                <div className="mt-0.5 font-semibold text-[var(--text-primary)]">{dataLlarga(primeraData)}</div>
              </div>
            )}
            {darreraData && (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Darrera sortida</div>
                <div className="mt-0.5 font-semibold text-[var(--text-primary)]">{dataLlarga(darreraData)}</div>
              </div>
            )}
          </div>

          <div className="relative flex min-h-[160px] items-center justify-center text-[var(--accent)] lg:-my-4 lg:min-w-[200px]">
            <PanellHeroRider className="h-44 w-full max-w-[260px] drop-shadow-md md:h-52" />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-end lg:flex-col lg:items-end">
            <div className="text-center sm:text-right">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent2)]">Distància total</div>
              <div className="mt-1 text-4xl font-black tabular-nums leading-none text-[var(--accent)] md:text-5xl">
                {resum.distancia.toLocaleString('ca-ES', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm font-medium text-[var(--text-muted)]">km</div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)]">Sortides</div>
              <div className="mt-1 text-4xl font-black tabular-nums leading-none text-[var(--accent2)] md:text-5xl">{resum.sortides}</div>
              <div className="text-sm font-medium text-[var(--text-muted)]">registres</div>
            </div>
          </div>
        </div>
      </section>

      {/* Rècords */}
      <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-6">
        <h2 className="mb-4 inline-block rounded-md bg-[var(--accent)]/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
          Rècords per categoria
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {blocsRecords.map((b, i) => (
            <div
              key={b.titol}
              className={`flex flex-col rounded-xl border border-[var(--border)] p-4 ${
                i % 2 === 0 ? 'bg-[var(--accent)]/[0.06]' : 'bg-[var(--accent2)]/[0.06]'
              }`}
            >
              <div className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-[var(--text-muted)]">{b.titol}</div>
              <div
                className={`mt-2 text-2xl font-black tabular-nums ${
                  i % 2 === 0 ? 'text-[var(--accent)]' : 'text-[var(--accent2)]'
                }`}
              >
                {b.valor}
              </div>
              {b.ruta ? (
                <Link
                  to={`/rutes/${b.ruta.id}`}
                  className="mt-2 truncate text-sm font-medium text-[var(--text-secondary)] no-underline hover:text-[var(--accent)] hover:underline"
                >
                  {b.ruta.nom}
                </Link>
              ) : (
                <span className="mt-2 text-sm text-[var(--text-muted)]">—</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Rutes més llargues */}
      <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-6">
        <h2 className="mb-4 inline-block rounded-md bg-[var(--accent2)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent2)]">
          Rutes més llargues
        </h2>
        {rutesMesLlargues.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Cap ruta amb distància registrada.</p>
        ) : (
          <ul className="space-y-3">
            {rutesMesLlargues.map((r, idx) => {
              const km = r.distanciaKm ?? 0;
              const pct = Math.max(8, Math.round((km / maxKmBar) * 100));
              const c = idx % 2 === 0 ? 'var(--accent)' : 'var(--accent2)';
              return (
                <li key={r.id} className="min-w-0">
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="shrink-0 font-bold tabular-nums text-[var(--text-muted)]">{idx + 1}.</span>
                    <Link to={`/rutes/${r.id}`} className="min-w-0 flex-1 truncate font-semibold text-[var(--text-primary)] no-underline hover:text-[var(--accent)] hover:underline">
                      {r.nom}
                    </Link>
                    <span className="shrink-0 tabular-nums font-bold text-[var(--text-secondary)]">{formatKm(km)}</span>
                  </div>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-[var(--border)]">
                    <div
                      className="rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: c }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
