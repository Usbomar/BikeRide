import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { useRutes } from '../store/useRutes';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { resumRutes } from '../utils/informes';
import { totalHores, distribucioPerTipus, distribucioPerComarca } from '../utils/estadistiques';
import type { Ruta, TipusRuta } from '../types/ruta';

const TIPUS_LABEL: Record<TipusRuta | 'no especificat', string> = {
  carretera: 'Carretera',
  mtb: 'MTB',
  urbà: 'Urbà',
  gravel: 'Gravel',
  altre: 'Altre',
  'no especificat': '—',
};

function dillunsDe(d: Date): Date {
  const r = new Date(d);
  const dia = r.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  r.setDate(r.getDate() + diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

function clauSetmana(d: Date): string {
  const dl = dillunsDe(d);
  return `${dl.getFullYear()}-${String(dl.getMonth() + 1).padStart(2, '0')}-${String(dl.getDate()).padStart(2, '0')}`;
}

function calcularStreaks(rutes: Ruta[]): {
  streakActual: number;
  record: number;
} {
  const setmanes = new Set(rutes.map((r) => clauSetmana(new Date(r.data + 'T12:00:00'))));
  const sorted = Array.from(setmanes).sort().reverse();
  if (sorted.length === 0) {
    return { streakActual: 0, record: 0 };
  }

  const avui = new Date();
  const setmanaAvui = clauSetmana(avui);
  const setmanaPassada = clauSetmana(new Date(avui.getTime() - 7 * 24 * 60 * 60 * 1000));

  const iniciaDesde = setmanes.has(setmanaAvui)
    ? setmanaAvui
    : setmanes.has(setmanaPassada)
      ? setmanaPassada
      : null;

  let streakActual = 0;
  if (iniciaDesde) {
    let cursor = new Date(iniciaDesde + 'T12:00:00');
    while (setmanes.has(clauSetmana(cursor))) {
      streakActual++;
      cursor = new Date(cursor.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  let record = 0;
  let actual = 0;
  const sortedAsc = Array.from(setmanes).sort();
  for (let i = 0; i < sortedAsc.length; i++) {
    if (i === 0) {
      actual = 1;
      record = Math.max(record, actual);
      continue;
    }
    const prev = new Date(sortedAsc[i - 1] + 'T12:00:00');
    const curr = new Date(sortedAsc[i] + 'T12:00:00');
    const diff = Math.round((curr.getTime() - prev.getTime()) / (7 * 24 * 60 * 60 * 1000));
    actual = diff === 1 ? actual + 1 : 1;
    record = Math.max(record, actual);
  }
  record = Math.max(record, actual, streakActual);

  return { streakActual, record };
}

function IconaPlus() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconaTrofeu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M8 21h8M12 17v4M6 3h12v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V3z" />
      <path d="M6 8H4a2 2 0 0 0 2 2M18 8h2a2 2 0 0 1-2 2" />
    </svg>
  );
}

function IconaMapa() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  );
}

function IconaTarget() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

const ACCESSOS = [
  { to: '/nova-ruta', label: 'Nova ruta', icona: 'plus' as const },
  { to: '/rankings', label: 'Rànquings', icona: 'trofeu' as const },
  { to: '/mapa', label: 'Mapa', icona: 'mapa' as const },
  { to: '/reptes', label: 'Reptes', icona: 'target' as const },
];

function IconaAcces(t: (typeof ACCESSOS)[number]['icona']) {
  switch (t) {
    case 'plus':
      return <IconaPlus />;
    case 'trofeu':
      return <IconaTrofeu />;
    case 'mapa':
      return <IconaMapa />;
    case 'target':
      return <IconaTarget />;
  }
}

function MiniBarra({ pct }: { pct: number }) {
  const w = Math.min(100, Math.max(0, pct));
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
      <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${w}%` }} />
    </div>
  );
}

export default function Dashboard() {
  const { rutes } = useRutes();

  const stats = useMemo(() => {
    const total = resumRutes(rutes);
    const hores = totalHores(rutes);
    const mitjanaPerSortida =
      rutes.length > 0 && total.distancia > 0 ? (total.distancia / rutes.length).toFixed(1) : '—';
    return {
      distancia: total.distancia,
      desnivell: total.desnivell,
      sortides: total.sortides,
      hores,
      mitjanaPerSortida,
    };
  }, [rutes]);

  const dadesEvolucio = useMemo(() => {
    const avui = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(avui.getFullYear(), avui.getMonth() - 11 + i, 1);
      const any = d.getFullYear();
      const mes = d.getMonth();
      const km = rutes
        .filter((r) => {
          const rd = new Date(r.data + 'T12:00:00');
          return rd.getFullYear() === any && rd.getMonth() === mes;
        })
        .reduce((s, r) => s + (r.distanciaKm ?? 0), 0);
      return {
        label: d.toLocaleDateString('ca-ES', {
          month: 'short',
          year: '2-digit',
        }),
        km: Math.round(km * 10) / 10,
        esMesActual: i === 11,
      };
    });
  }, [rutes]);

  const { millorMesKm, mesActualKm, mesPassatKm, tendencia, millorMesEvolucio } = useMemo(() => {
    const mm = Math.max(...dadesEvolucio.map((d) => d.km), 1);
    const actual = dadesEvolucio[11]?.km ?? 0;
    const passat = dadesEvolucio[10]?.km ?? 0;
    const tend =
      passat > 0 ? Math.round(((actual - passat) / passat) * 100) : 0;
    let best = dadesEvolucio[0];
    for (const row of dadesEvolucio) {
      if (row.km > (best?.km ?? 0)) best = row;
    }
    return {
      millorMesKm: mm,
      mesActualKm: actual,
      mesPassatKm: passat,
      tendencia: tend,
      millorMesEvolucio: best && best.km > 0 ? best : null,
    };
  }, [dadesEvolucio]);

  const { streakActual, record: streakRecord } = useMemo(() => calcularStreaks(rutes), [rutes]);

  const insights = useMemo(() => {
    const list: { text: string; color: 'accent' | 'accent2' }[] = [];

    const comarca = distribucioPerComarca(rutes)[0];
    if (comarca) {
      list.push({
        text: `${comarca.comarca} és la teva comarca favorita amb ${comarca.vegades} sortides`,
        color: 'accent',
      });
    }

    const rutaLlarga = [...rutes].sort((a, b) => (b.distanciaKm ?? 0) - (a.distanciaKm ?? 0))[0];
    if (rutaLlarga && (rutaLlarga.distanciaKm ?? 0) > 0) {
      list.push({
        text: `La teva ruta més llarga: ${rutaLlarga.nom} (${rutaLlarga.distanciaKm} km)`,
        color: 'accent2',
      });
    }

    const perTipus = [...distribucioPerTipus(rutes)].sort((a, b) => b.count - a.count)[0];
    if (perTipus && rutes.length > 0) {
      list.push({
        text: `Prefereixes ${TIPUS_LABEL[perTipus.tipus]}: ${perTipus.count} de ${rutes.length} rutes`,
        color: 'accent',
      });
    }

    return list.slice(0, 3);
  }, [rutes]);

  const rutesRecents = useMemo(
    () => [...rutes].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 3),
    [rutes]
  );

  const mitjanaNum =
    stats.mitjanaPerSortida !== '—' ? parseFloat(stats.mitjanaPerSortida) : 0;
  const pctMitjana = (mitjanaNum / millorMesKm) * 100;
  const pctMesActual = (mesActualKm / millorMesKm) * 100;
  const pctMillorMesCard = millorMesEvolucio ? (millorMesEvolucio.km / millorMesKm) * 100 : 0;
  const pctStreak = streakRecord > 0 ? Math.min(100, (streakActual / streakRecord) * 100) : streakActual > 0 ? 100 : 0;

  const refMesActual = dadesEvolucio.find((d) => d.esMesActual)?.label;

  return (
    <div className="space-y-10">
      <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
            {new Date().toLocaleDateString('ca-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
            Benvingut de nou
          </h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">{stats.sortides} sortides registrades</p>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="p-6 md:border-r md:border-[var(--border)]">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Distància total</div>
            <div className="text-5xl font-black tabular-nums leading-none text-[var(--accent)]">
              {stats.distancia.toFixed(1)}
            </div>
            <div className="mt-1 text-sm text-[var(--text-muted)]">km</div>
          </div>
          <div className="p-6 md:border-r md:border-[var(--border)]">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Desnivell acumulat</div>
            <div className="text-5xl font-black tabular-nums leading-none text-[var(--text-primary)]">
              {(stats.desnivell / 1000).toFixed(2)}
            </div>
            <div className="mt-1 text-sm text-[var(--text-muted)]">mil metres</div>
          </div>
          <div className="p-6">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Temps en moviment</div>
            <div className="text-5xl font-black tabular-nums leading-none text-[var(--text-primary)]">
              {Math.floor(stats.hores)}
            </div>
            <div className="mt-1 text-sm text-[var(--text-muted)]">
              hores · {stats.sortides} sortides
            </div>
          </div>
        </div>
      </section>

      <section className="app-card">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Evolució — últims 12 mesos</span>
          <span className="text-xs text-[var(--text-muted)]">km</span>
        </div>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dadesEvolucio} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientKm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v} km`, '']}
                labelFormatter={(l) => l}
              />
              <Area
                type="monotone"
                dataKey="km"
                stroke="var(--accent)"
                strokeWidth={2.5}
                fill="url(#gradientKm)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--accent)' }}
              />
              {refMesActual != null && (
                <ReferenceLine
                  x={refMesActual}
                  stroke="var(--accent2)"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="app-card flex flex-col p-4">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Km aquest mes</div>
            <div className="mt-1 text-2xl font-black tabular-nums text-[var(--accent)]">{mesActualKm.toFixed(1)}</div>
            {mesPassatKm > 0 && (
              <div
                className={`mt-0.5 text-xs font-medium ${
                  tendencia >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {tendencia >= 0 ? '↑' : '↓'} {tendencia >= 0 ? '+' : ''}
                {tendencia}% vs mes anterior
              </div>
            )}
            <MiniBarra pct={pctMesActual} />
          </div>

          <div className="app-card flex flex-col p-4">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Mitjana km / sortida
            </div>
            <div className="mt-1 text-2xl font-black tabular-nums text-[var(--text-primary)]">
              {stats.mitjanaPerSortida}
              {stats.mitjanaPerSortida !== '—' ? <span className="text-sm font-semibold text-[var(--text-muted)]"> km</span> : null}
            </div>
            <MiniBarra pct={pctMitjana} />
          </div>

          <div className="app-card flex flex-col p-4">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Millor mes</div>
            {millorMesEvolucio ? (
              <>
                <div className="mt-1 text-lg font-bold leading-tight text-[var(--text-primary)]">
                  {millorMesEvolucio.label}
                </div>
                <div className="text-sm font-black tabular-nums text-[var(--accent2)]">{millorMesEvolucio.km} km</div>
              </>
            ) : (
              <div className="mt-1 text-sm text-[var(--text-muted)]">—</div>
            )}
            <MiniBarra pct={pctMillorMesCard} />
          </div>

          <div className="app-card flex flex-col p-4">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Streak setmanal</div>
            <div className="mt-1 text-2xl font-black tabular-nums text-[var(--text-primary)]">{streakActual}</div>
            <div className="text-[10px] text-[var(--text-muted)]">setmanes · rècord {streakRecord}</div>
            <MiniBarra pct={pctStreak} />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Últimes sortides</h2>
          <Link
            to="/rutes"
            className="text-xs font-medium text-[var(--accent)] no-underline hover:underline"
          >
            Veure totes →
          </Link>
        </div>
        <div className="space-y-2">
          {rutesRecents.length === 0 ? (
            <EmptyState
              compact
              titol="Encara no hi ha rutes recents"
              descripcio="Les teves últimes sortides apareixeran aquí."
              accio={{ label: 'Afegir ruta', to: '/nova-ruta' }}
            />
          ) : (
            rutesRecents.map((r) => (
              <Link
                to={`/rutes/${r.id}`}
                key={r.id}
                className="app-card group flex items-center gap-4 no-underline transition-colors hover:border-[var(--accent)]/50"
              >
                <div
                  className="w-1 shrink-0 self-stretch rounded-full"
                    style={{
                    background:
                      r.tipus === 'mtb'
                        ? 'var(--accent)'
                        : r.tipus === 'carretera'
                          ? '#378ADD'
                          : r.tipus === 'gravel'
                            ? 'var(--accent2)'
                            : 'var(--border)',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                    {r.nom}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {new Date(r.data + 'T12:00:00').toLocaleDateString('ca-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                    {r.zona ? ` · ${r.zona}` : ''}
                  </div>
                </div>
                <div className="flex shrink-0 gap-4 text-right">
                  {r.distanciaKm != null && (
                    <div>
                      <div className="text-sm font-bold text-[var(--accent)]">{r.distanciaKm} km</div>
                      <div className="text-[10px] text-[var(--text-muted)]">dist.</div>
                    </div>
                  )}
                  {r.desnivellMetres != null && (
                    <div>
                      <div className="text-sm font-bold text-[var(--text-secondary)]">{r.desnivellMetres} m</div>
                      <div className="text-[10px] text-[var(--text-muted)]">desn.</div>
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Sobre les teves rutes</h2>
        {insights.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Afegeix més rutes per veure insights.</p>
        ) : (
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <div
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    background: ins.color === 'accent' ? 'var(--accent)' : 'var(--accent2)',
                  }}
                />
                <span>{ins.text}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ACCESSOS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="app-card group flex flex-col items-center gap-2 py-4 text-center no-underline transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5"
            >
              <div className="text-[var(--accent)]">{IconaAcces(a.icona)}</div>
              <span className="text-xs font-medium text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent)]">
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
