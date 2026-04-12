import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRutes } from '../store/useRutes';
import { EmptyState } from '../components/EmptyState';
import type { Ruta } from '../types/ruta';
import { COMARQUES_SVG } from '../data/comarques-svg';

function normZona(z: string): string {
  return z.trim().toLowerCase();
}

function statsForNom(
  statsPerComarca: Map<string, { count: number; km: number; desnivell: number }>,
  nomComarca: string
): { count: number; km: number; desnivell: number } | undefined {
  const direct = statsPerComarca.get(nomComarca);
  if (direct) return direct;
  const n = normZona(nomComarca);
  for (const [k, v] of statsPerComarca) {
    if (normZona(k) === n) return v;
  }
  return undefined;
}

function rutesPerComarca(rutes: Ruta[], nomComarca: string) {
  const n = normZona(nomComarca);
  return rutes.filter((r) => r.zona && normZona(r.zona) === n);
}

function IconCadenat() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block shrink-0 opacity-70"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="1" />
      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
    </svg>
  );
}

export default function Comarques() {
  const { rutes } = useRutes();
  const [comarcaSeleccionada, setComarcaSeleccionada] = useState<string | null>(null);

  const visitades = useMemo(() => {
    const set = new Set<string>();
    rutes.forEach((r) => {
      if (r.zona) {
        const match = COMARQUES_SVG.find((c) => c.nom.toLowerCase() === r.zona!.trim().toLowerCase());
        if (match) set.add(match.id);
      }
    });
    return set;
  }, [rutes]);

  const statsPerComarca = useMemo(() => {
    const map = new Map<string, { count: number; km: number; desnivell: number }>();
    rutes.forEach((r) => {
      const key = r.zona?.trim() || '';
      if (!key) return;
      const prev = map.get(key) ?? { count: 0, km: 0, desnivell: 0 };
      map.set(key, {
        count: prev.count + 1,
        km: prev.km + (r.distanciaKm ?? 0),
        desnivell: prev.desnivell + (r.desnivellMetres ?? 0),
      });
    });
    return map;
  }, [rutes]);

  const maxCount = useMemo(
    () => Math.max(...Array.from(statsPerComarca.values()).map((s) => s.count), 1),
    [statsPerComarca]
  );

  const comarcaSeleccionadaMeta = useMemo(
    () => (comarcaSeleccionada ? COMARQUES_SVG.find((c) => c.id === comarcaSeleccionada) : null),
    [comarcaSeleccionada]
  );

  const rutesSeleccionades = useMemo(() => {
    if (!comarcaSeleccionadaMeta) return [];
    return rutesPerComarca(rutes, comarcaSeleccionadaMeta.nom).sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }, [rutes, comarcaSeleccionadaMeta]);

  const statsSeleccionada = comarcaSeleccionadaMeta
    ? statsForNom(statsPerComarca, comarcaSeleccionadaMeta.nom)
    : undefined;

  const cardsOrdenades = useMemo(() => {
    const visitadesList = COMARQUES_SVG.filter((c) => visitades.has(c.id)).sort((a, b) => {
      const ca = statsForNom(statsPerComarca, a.nom)?.count ?? 0;
      const cb = statsForNom(statsPerComarca, b.nom)?.count ?? 0;
      return cb - ca;
    });
    const noVisitades = COMARQUES_SVG.filter((c) => !visitades.has(c.id)).sort((a, b) =>
      a.nom.localeCompare(b.nom, 'ca')
    );
    return [...visitadesList, ...noVisitades];
  }, [visitades, statsPerComarca]);

  if (rutes.length === 0) {
    return (
      <div>
        <section className="mb-6">
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
            Territori explorat
          </p>
          <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">Comarques</h1>
        </section>
        <EmptyState
          titol="Sense dades al mapa de comarques"
          descripcio="Afegeix rutes amb comarca de destí per veure l’exploració."
          accio={{ label: 'Nova ruta', to: '/nova-ruta' }}
        />
      </div>
    );
  }

  return (
    <div>
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
          Territori explorat
        </p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">Comarques</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {visitades.size} comarques explorades de {COMARQUES_SVG.length}
        </p>
      </section>

      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="w-full max-w-lg flex-1 mx-auto lg:mx-0">
          <svg viewBox="0 0 400 500" className="w-full max-w-lg mx-auto">
            {COMARQUES_SVG.map((comarca) => {
              const isVisited = visitades.has(comarca.id);
              const stats = statsForNom(statsPerComarca, comarca.nom);
              const ratio = stats ? stats.count / maxCount : 0;
              const fillColor = isVisited
                ? `rgba(29, 158, 117, ${0.25 + ratio * 0.65})`
                : 'var(--border)';

              return (
                <g
                  key={comarca.id}
                  className="cursor-pointer group"
                  onClick={() =>
                    setComarcaSeleccionada(comarcaSeleccionada === comarca.id ? null : comarca.id)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setComarcaSeleccionada(comarcaSeleccionada === comarca.id ? null : comarca.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <path
                    d={comarca.path}
                    fill={fillColor}
                    stroke="var(--bg-card)"
                    strokeWidth={1.5}
                    className="transition-all duration-200 group-hover:brightness-110"
                  />
                  {isVisited && stats != null && (
                    <text
                      x={comarca.labelX}
                      y={comarca.labelY}
                      fontSize={7}
                      textAnchor="middle"
                      fill="var(--accent-hover)"
                      fontWeight={500}
                      className="pointer-events-none select-none"
                    >
                      {stats.count}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="w-full min-w-0 flex-1 lg:max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 lg:sticky lg:top-24">
          {!comarcaSeleccionadaMeta ? (
            <p className="text-sm text-[var(--text-muted)]">Clica una comarca per veure el detall</p>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                {comarcaSeleccionadaMeta.nom}
              </h2>
              {statsSeleccionada && (
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Sortides</p>
                    <p className="text-xl font-bold text-[var(--accent)] tabular-nums">{statsSeleccionada.count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Km</p>
                    <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                      {statsSeleccionada.km.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Desnivell</p>
                    <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                      {statsSeleccionada.desnivell}
                    </p>
                  </div>
                </div>
              )}
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Rutes</p>
              <ul className="m-0 max-h-64 list-none space-y-2 overflow-y-auto p-0">
                {rutesSeleccionades.length === 0 ? (
                  <li className="text-xs text-[var(--text-muted)]">Sense rutes en aquesta comarca.</li>
                ) : (
                  rutesSeleccionades.map((ruta) => (
                    <li key={ruta.id}>
                      <Link
                        to={`/rutes/${ruta.id}`}
                        className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-[var(--accent)] no-underline hover:underline"
                      >
                        <span className="font-medium text-[var(--text-primary)]">{ruta.nom}</span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(ruta.data).toLocaleDateString('ca-ES')} ·{' '}
                          {ruta.distanciaKm != null ? `${ruta.distanciaKm.toFixed(1)} km` : '—'}
                        </span>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Comarques explorades · {visitades.size} de {COMARQUES_SVG.length}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {cardsOrdenades.map((comarca) => {
            const visited = visitades.has(comarca.id);
            const stats = statsForNom(statsPerComarca, comarca.nom);
            const ratio = stats ? stats.count / maxCount : 0;

            if (!visited) {
              return (
                <div
                  key={comarca.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--superficie-muted)]/40 p-3 opacity-50"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-[var(--text-muted)]">{comarca.nom}</span>
                    <IconCadenat />
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">Encara no explorada</p>
                </div>
              );
            }

            return (
              <div
                key={comarca.id}
                className="rounded-lg border border-[var(--border)] p-3 transition-shadow hover:shadow-sm"
                style={{
                  backgroundColor: `rgba(29, 158, 117, ${0.05 + ratio * 0.1})`,
                  borderLeftWidth: 3,
                  borderLeftColor: `color-mix(in srgb, var(--accent) ${Math.round(40 + ratio * 60)}%, transparent)`,
                }}
              >
                <p className="mb-1 text-sm font-semibold text-[var(--text-primary)]">{comarca.nom}</p>
                {stats && (
                  <>
                    <p className="mb-2 text-2xl font-bold text-[var(--accent)] tabular-nums">{stats.count}</p>
                    <p className="mb-2 text-xs text-[var(--text-secondary)]">
                      {stats.km.toFixed(1)} km · {stats.desnivell} m desn.
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
