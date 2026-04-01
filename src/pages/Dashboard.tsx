import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRutes } from '../store/useRutes';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  getPeriodes,
  filtrarRutesPerPeriode,
  filtrarRutesAquestMesFinsAvui,
  resumRutes,
} from '../utils/informes';
import { totalHores, getMesPassat, distribucioPerTipus } from '../utils/estadistiques';
import type { TipusRuta } from '../types/ruta';
import { formatKm } from '../utils/format';

function formatDate(s: string) {
  const d = new Date(s);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('ca-ES', { month: 'short' });
  const year = String(d.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
}

const TIPUS_LABEL: Record<TipusRuta | 'no especificat', string> = {
  carretera: 'Carretera',
  mtb: 'MTB',
  urbà: 'Urbà',
  gravel: 'Gravel',
  altre: 'Altre',
  'no especificat': '—',
};

function tipusSegColor(i: number): string {
  if (i % 3 === 0) return 'var(--accent)';
  if (i % 3 === 1) return 'var(--accent2)';
  return 'var(--superficie)';
}

export default function Dashboard() {
  const { rutes, config } = useRutes();

  const data = useMemo(() => {
    const ara = new Date();
    const periodes = getPeriodes('mensual', 1);
    const dadesMes = periodes
      .map((p) => {
        const r = filtrarRutesPerPeriode(rutes, p.start, p.end, ara);
        const resum = resumRutes(r);
        return {
          label: p.label.slice(0, 3),
          mes: p.label,
          enCurs: p.enCurs,
          km: Math.round(resum.distancia * 10) / 10,
          sortides: resum.sortides,
          hores: Math.round((resum.durada / 60) * 10) / 10,
        };
      })
      .reverse();

    const total = resumRutes(rutes);
    const horesTotals = totalHores(rutes);
    const aquestMes = resumRutes(filtrarRutesAquestMesFinsAvui(rutes, ara));
    const { start: startPassat, end: endPassat } = getMesPassat(1);
    const mesPassat = resumRutes(filtrarRutesPerPeriode(rutes, startPassat, endPassat, ara));

    const tendenciaKm =
      mesPassat.distancia > 0
        ? Math.round(((aquestMes.distancia - mesPassat.distancia) / mesPassat.distancia) * 100)
        : 0;

    const mitjanaPerSortida =
      rutes.length > 0 && total.distancia > 0 ? (total.distancia / rutes.length).toFixed(1) : '—';

    let millorMes: { mes: string; km: number } | null = null;
    for (const row of dadesMes) {
      if (row.km > 0 && (!millorMes || row.km > millorMes.km)) {
        millorMes = { mes: row.mes, km: row.km };
      }
    }

    const ambDist = rutes.filter((r) => (r.distanciaKm ?? 0) > 0);
    const rutaMesLlarga =
      ambDist.length > 0
        ? ambDist.reduce((a, b) => ((a.distanciaKm ?? 0) >= (b.distanciaKm ?? 0) ? a : b))
        : null;

    const distTipus = distribucioPerTipus(rutes);
    const kmTipusTotal = distTipus.reduce((s, x) => s + x.km, 0);
    const tipusBar =
      kmTipusTotal > 0
        ? distTipus.map((x) => ({
            tipus: x.tipus,
            km: x.km,
            pct: (x.km / kmTipusTotal) * 100,
          }))
        : [];

    const ultimesRutes = [...rutes]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5);

    return {
      ara,
      dadesMes,
      total,
      horesTotals,
      aquestMes,
      mesPassat,
      tendenciaKm,
      mitjanaPerSortida,
      millorMes,
      rutaMesLlarga,
      tipusBar,
      ultimesRutes,
    };
  }, [rutes]);

  const {
    dadesMes,
    total,
    horesTotals,
    aquestMes,
    mesPassat,
    tendenciaKm,
    mitjanaPerSortida,
    millorMes,
    rutaMesLlarga,
    tipusBar,
    ultimesRutes,
  } = data;

  const blocsOrdenats = [...config.dashboardLayout.blocs].sort((a, b) => a.ordre - b.ordre);

  const renderBloc = (id: (typeof config.dashboardLayout.blocs)[number]['id']) => {
    if (id === 'kpis') {
      return (
        <section key="kpis" className="app-card space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Distància acumulada</p>
            <p className="mt-1 text-4xl md:text-5xl font-semibold tabular-nums text-[var(--accent)] tracking-tight">
              {total.distancia.toFixed(1)}
              <span className="text-lg md:text-xl font-medium text-[var(--text-muted)] ml-1.5">km</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-4 pt-2 border-t border-[var(--border)]">
            <div>
              <p className="text-[11px] text-[var(--accent2)] font-medium">Sortides</p>
              <p className="text-xl font-semibold tabular-nums text-[var(--text-primary)]">{total.sortides}</p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--superficie)] font-medium">Temps en moviment</p>
              <p className="text-xl font-semibold tabular-nums text-[var(--text-primary)]">{horesTotals.toFixed(1)} h</p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--accent2)] font-medium">Desnivell</p>
              <p className="text-xl font-semibold tabular-nums text-[var(--text-primary)]">
                {total.desnivell.toLocaleString('ca-ES')} m
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--superficie)] font-medium">Mitjana / sortida</p>
              <p className="text-xl font-semibold tabular-nums text-[var(--text-primary)]">{mitjanaPerSortida} km</p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--superficie-muted)]/50 px-4 py-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-[var(--text-muted)]">Aquest mes (fins avui)</p>
                <p className="text-2xl font-semibold tabular-nums text-[var(--accent)]">{aquestMes.distancia.toFixed(1)} km</p>
              </div>
              {mesPassat.distancia > 0 && (
                <p className={`text-sm font-medium tabular-nums ${tendenciaKm >= 0 ? 'text-[var(--accent2)]' : 'text-[var(--text-muted)]'}`}>
                  {tendenciaKm >= 0 ? '↑' : '↓'} {tendenciaKm >= 0 ? '+' : ''}
                  {tendenciaKm}% <span className="text-[var(--text-muted)] font-normal">vs mes anterior</span>
                </p>
              )}
            </div>
          </div>

          {tipusBar.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-[var(--text-muted)] mb-2">Km per tipus de bicicleta</p>
              <div className="flex h-2.5 w-full rounded-full overflow-hidden gap-px bg-[var(--border)]/60">
                {tipusBar.map((seg, i) => (
                  <div
                    key={String(seg.tipus)}
                    className="min-w-[2px] transition-[width] duration-300"
                    style={{ width: `${seg.pct}%`, background: tipusSegColor(i) }}
                    title={`${TIPUS_LABEL[seg.tipus]}: ${seg.km} km (${Math.round(seg.pct)}%)`}
                  />
                ))}
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--text-secondary)]">
                {tipusBar.map((seg, i) => (
                  <li key={String(seg.tipus)} className="flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full shrink-0" style={{ background: tipusSegColor(i) }} />
                    {TIPUS_LABEL[seg.tipus]} · {seg.km} km
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      );
    }

    if (id === 'grafica') {
      return (
        <section key="grafica" className="app-card">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-0.5">Evolució mensual</h2>
          <p className="text-[10px] text-[var(--text-muted)] mb-1">
            El mes en curs mostra el que has registrat fins avui; la resta, el total del mes tancat.
          </p>
          <div className="h-52 mt-2">
            {dadesMes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadesMes} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradKm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                    formatter={(value: number, name: string) => [
                      name === 'km' ? `${value} km` : value,
                      name === 'km' ? 'Distància' : 'Sortides',
                    ]}
                    labelFormatter={(label) => {
                      const row = dadesMes.find((d) => d.label === label);
                      const base = row?.mes ?? label;
                      return row?.enCurs ? `${base} (fins avui)` : base;
                    }}
                  />
                  <Area type="monotone" dataKey="km" stroke="var(--accent)" strokeWidth={2} fill="url(#gradKm)" name="km" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-xs">
                Afegeix rutes per veure l'evolució
              </div>
            )}
          </div>
        </section>
      );
    }

    if (id === 'ultimes') {
      return (
        <section key="ultimes" className="space-y-2">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 min-w-0 app-card !py-2.5 !px-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 tracking-tight">
                Últimes sortides
              </h2>
              {ultimesRutes.length === 0 ? (
                <p className="text-[11px] text-[var(--text-muted)]">Encara no hi ha rutes.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]/60">
                  {ultimesRutes.map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`/rutes/${r.id}`}
                        className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0 py-1.5 sm:items-center rounded-md -mx-1 px-1 hover:bg-[var(--superficie-soft)] transition-colors no-underline group leading-tight"
                      >
                        <div className="min-w-0 flex flex-wrap items-center gap-x-1.5 gap-y-0">
                          <span className="text-[11px] text-[var(--text-muted)] tabular-nums shrink-0">
                            {formatDate(r.data)}
                          </span>
                          <span className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] text-sm truncate">
                            {r.nom}
                          </span>
                          {r.tipus && (
                            <span className="text-[9px] px-1 py-px rounded bg-[var(--accent2-soft)] text-[var(--accent2)] font-medium shrink-0 leading-none">
                              {TIPUS_LABEL[r.tipus]}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] tabular-nums sm:text-right shrink-0">
                          {r.distanciaKm != null ? formatKm(r.distanciaKm) : '—'}
                          {r.desnivellMetres != null ? ` · ${r.desnivellMetres} m` : ''}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-1.5 shrink-0 lg:w-48">
              <Link
                to="/nova-ruta"
                className="flex flex-1 items-center justify-center gap-1.5 py-2 rounded-lg font-semibold text-sm text-white bg-[var(--accent)] hover:opacity-95 no-underline"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Nova ruta
              </Link>
              <Link
                to="/rutes"
                className="flex flex-1 items-center justify-center py-2 rounded-lg font-medium text-sm text-[var(--text-primary)] border border-[var(--superficie)]/35 bg-[var(--superficie-muted)] hover:bg-[var(--superficie-soft)] no-underline"
              >
                Totes les rutes
              </Link>
              <Link
                to="/rankings"
                className="flex flex-1 items-center justify-center py-2 rounded-lg font-medium text-sm text-[var(--accent2)] border border-[var(--accent2)]/35 bg-[var(--accent2-soft)]/30 hover:bg-[var(--accent2-soft)] no-underline transition-colors"
              >
                Rànquings
              </Link>
            </div>
          </div>
        </section>
      );
    }

    return null;
  };

  const teRutes = rutes.length > 0;
  const insightLine =
    teRutes && (millorMes || rutaMesLlarga) ? (
      <p className="text-sm text-[var(--text-secondary)] max-w-2xl mt-2 leading-relaxed">
        {millorMes && (
          <>
            <span className="text-[var(--text-muted)]">Millor mes en km: </span>
            <span className="text-[var(--text-primary)] font-medium">{millorMes.mes}</span>
            <span className="text-[var(--text-muted)]"> ({millorMes.km} km)</span>
          </>
        )}
        {millorMes && rutaMesLlarga && <span className="text-[var(--text-muted)]"> · </span>}
        {rutaMesLlarga && (
          <>
            <span className="text-[var(--text-muted)]">Ruta més llarga: </span>
            <Link
              to={`/rutes/${rutaMesLlarga.id}`}
              className="font-medium text-[var(--accent)] hover:underline"
            >
              {rutaMesLlarga.nom}
            </Link>
            <span className="text-[var(--text-muted)]"> ({formatKm(rutaMesLlarga.distanciaKm!)})</span>
          </>
        )}
      </p>
    ) : null;

  return (
    <div className="space-y-8">
      <section className="text-center md:text-left">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)] mb-0.5">Resum</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] tracking-tight mb-1">
          Activitat
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-xl">
          {teRutes ? (
            <>
              <span className="font-medium text-[var(--text-primary)] tabular-nums">{total.sortides}</span>
              {total.sortides === 1 ? ' sortida' : ' sortides'} registrades
              <span className="text-[var(--text-muted)]"> · dades fins avui</span>
            </>
          ) : (
            <>
              Encara no tens sortides.{' '}
              <Link to="/nova-ruta" className="text-[var(--accent)] font-medium hover:underline">
                Afegeix la primera
              </Link>
            </>
          )}
        </p>
        {insightLine}
      </section>
      {blocsOrdenats.map((b) => renderBloc(b.id))}
    </div>
  );
}
