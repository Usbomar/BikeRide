import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRutes } from '../store/useRutes';
import { COMARQUES_SVG } from '../data/comarques-svg';

type StatsComarca = { count: number; km: number; desnivell: number };

function getStatsPerNom(map: Map<string, StatsComarca>, nomComarca: string): StatsComarca | undefined {
  const n = nomComarca.toLowerCase();
  for (const [k, v] of map) {
    if (k.trim().toLowerCase() === n) return v;
  }
  return undefined;
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
      className="shrink-0 text-[var(--text-muted)]"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
        const match = COMARQUES_SVG.find(
          (c) => c.nom.toLowerCase() === r.zona!.trim().toLowerCase()
        );
        if (match) set.add(match.id);
      }
    });
    return set;
  }, [rutes]);

  const statsPerComarca = useMemo(() => {
    const map = new Map<string, StatsComarca>();
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

  const seleccio = useMemo(
    () => (comarcaSeleccionada ? COMARQUES_SVG.find((c) => c.id === comarcaSeleccionada) : null),
    [comarcaSeleccionada]
  );

  const statsSeleccio = seleccio ? getStatsPerNom(statsPerComarca, seleccio.nom) : undefined;

  const rutesSeleccio = useMemo(() => {
    if (!seleccio) return [];
    const nom = seleccio.nom.toLowerCase();
    return rutes
      .filter((r) => r.zona?.trim().toLowerCase() === nom)
      .slice()
      .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  }, [rutes, seleccio]);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
        Territori explorat
      </p>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight mt-1 mb-1">
        Comarques
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        {visitades.size} comarques explorades de {COMARQUES_SVG.length}
      </p>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="w-full max-w-lg shrink-0 mx-auto lg:mx-0">
          <svg viewBox="0 0 400 500" className="w-full h-auto" role="img" aria-label="Mapa de comarques">
            {COMARQUES_SVG.map((comarca) => {
              const isVisited = visitades.has(comarca.id);
              const stats = getStatsPerNom(statsPerComarca, comarca.nom);
              const ratio = stats ? stats.count / maxCount : 0;
              const fillColor = isVisited
                ? `rgba(29, 158, 117, ${0.25 + ratio * 0.65})`
                : 'var(--border)';

              return (
                <g
                  key={comarca.id}
                  className="cursor-pointer group"
                  onClick={() =>
                    setComarcaSeleccionada(
                      comarcaSeleccionada === comarca.id ? null : comarca.id
                    )
                  }
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
                      fill={ratio > 0.5 ? '#085041' : '#0F6E56'}
                      fontWeight={500}
                    >
                      {stats.count}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          {seleccio ? (
            <>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">{seleccio.nom}</h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Sortides</div>
                  <div className="text-xl font-bold text-[var(--accent)] tabular-nums">
                    {statsSeleccio?.count ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Km totals</div>
                  <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                    {(statsSeleccio?.km ?? 0).toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Desnivell</div>
                  <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                    {statsSeleccio?.desnivell ?? 0} m
                  </div>
                </div>
              </div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Rutes</p>
              {rutesSeleccio.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] m-0">Cap ruta amb aquesta comarca.</p>
              ) : (
                <ul className="space-y-2 m-0 p-0 list-none">
                  {rutesSeleccio.map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`/rutes/${r.id}`}
                        className="flex flex-wrap items-baseline justify-between gap-2 text-sm no-underline hover:underline"
                      >
                        <span className="font-medium text-[var(--accent)]">{r.nom}</span>
                        <span className="text-xs text-[var(--text-muted)] tabular-nums">
                          {new Date(r.data).toLocaleDateString('ca-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          · {r.distanciaKm != null ? `${r.distanciaKm.toFixed(1)} km` : '—'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Clica una comarca per veure el detall</p>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Comarques explorades · {visitades.size} de {COMARQUES_SVG.length}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {COMARQUES_SVG.map((comarca) => {
            const isVisited = visitades.has(comarca.id);
            const stats = getStatsPerNom(statsPerComarca, comarca.nom);
            const ratio = stats ? stats.count / maxCount : 0;

            if (isVisited && stats) {
              return (
                <div
                  key={comarca.id}
                  className="rounded-lg border border-[var(--border)] p-3 overflow-hidden"
                  style={{
                    backgroundColor: `rgba(29, 158, 117, ${0.05 + ratio * 0.1})`,
                    borderLeftWidth: 3,
                    borderLeftStyle: 'solid',
                    borderLeftColor: `color-mix(in srgb, var(--accent) ${Math.round(45 + ratio * 55)}%, transparent)`,
                  }}
                >
                  <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">{comarca.nom}</div>
                  <div className="text-lg font-bold text-[var(--accent)] tabular-nums mb-1">{stats.count}</div>
                  <div className="text-xs text-[var(--text-secondary)] mb-2">
                    {stats.km.toFixed(1)} km · {stats.desnivell} m desn.
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={comarca.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--superficie-muted)]/50 p-3 opacity-50"
              >
                <div className="flex items-start gap-2 mb-2">
                  <IconCadenat />
                  <div className="text-sm font-medium text-[var(--text-muted)]">{comarca.nom}</div>
                </div>
                <p className="text-xs text-[var(--text-muted)] m-0">Encara no explorada</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
