import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
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
import { tresMillorsAproximacionsDesSabadell, type AproximacioKm } from '../utils/destinsDesdeSabadell';
import type { Ruta, TipusRuta } from '../types/ruta';

const TIPUS_LABEL: Record<TipusRuta | 'no especificat', string> = {
  carretera: 'Carretera',
  mtb: 'MTB',
  urbà: 'Urbà',
  gravel: 'Gravel',
  altre: 'Altre',
  'no especificat': '—',
};

type PortadaFotoMode = 'cover' | 'contain';

function modePortadaFoto(ratio: number | undefined): PortadaFotoMode {
  if (ratio === undefined) return 'cover';
  return ratio < 0.9 || ratio > 1.9 ? 'contain' : 'cover';
}

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

function MiniBarra({ pct }: { pct: number }) {
  const w = Math.min(100, Math.max(0, pct));
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
      <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${w}%` }} />
    </div>
  );
}

function SliderPortadaFotos({ ruta, intervalMs }: { ruta: Ruta; intervalMs: number }) {
  const fotos = ruta.fotos ?? [];
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fotoRatios, setFotoRatios] = useState<Record<string, number>>({});

  useEffect(() => {
    if (fotos.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % fotos.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [fotos.length, paused, intervalMs]);

  const dataFmt = new Date(ruta.data + 'T12:00:00').toLocaleDateString('ca-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Link
        to={`/album?rutaId=${encodeURIComponent(ruta.id)}&fotoId=${encodeURIComponent(fotos[idx]?.id ?? '')}`}
        className="relative block min-h-[240px] flex-1 overflow-hidden bg-[var(--superficie-muted)] no-underline"
        aria-label={`Obrir foto ${idx + 1} del viatge ${ruta.nom} a l'àlbum`}
      >
        {fotos.map((f, i) => {
          const mode = modePortadaFoto(fotoRatios[f.id]);
          const visibleClass = i === idx ? 'z-[1] opacity-100' : 'z-0 opacity-0';
          const alt = f.caption || `${ruta.nom} — foto ${i + 1}`;
          const loading = i === 0 ? 'eager' : 'lazy';
          const onLoad = (event: SyntheticEvent<HTMLImageElement>) => {
            const img = event.currentTarget;
            if (img.naturalHeight === 0) return;
            const ratio = img.naturalWidth / img.naturalHeight;
            setFotoRatios((prev) => (prev[f.id] === ratio ? prev : { ...prev, [f.id]: ratio }));
          };

          if (mode === 'contain') {
            return (
              <div
                key={f.id}
                className={`absolute inset-0 h-full w-full bg-[var(--bg)] transition-opacity duration-700 ease-out ${visibleClass}`}
              >
                <img
                  src={f.url}
                  alt={alt}
                  className="relative z-[1] h-full w-full object-contain"
                  loading={loading}
                  onLoad={onLoad}
                />
              </div>
            );
          }

          return (
            <img
              key={f.id}
              src={f.url}
              alt={alt}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out ${visibleClass}`}
              loading={loading}
              onLoad={onLoad}
            />
          );
        })}
        <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.18)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-10" />
        <div className="pointer-events-none absolute bottom-2 left-3 z-[3] rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-medium text-white">
          {idx + 1} / {fotos.length}
        </div>
        {fotos.length > 1 && (
          <div className="pointer-events-auto absolute bottom-2 left-0 right-0 z-[3] flex justify-center gap-1.5">
            {fotos.map((f, i) => (
              <button
                key={f.id}
                type="button"
                aria-label={`Foto ${i + 1}`}
                aria-current={i === idx ? 'true' : undefined}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </Link>
      <div className="border-t border-[var(--border)] px-4 py-2">
        <p className="truncate text-xs text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-primary)]">{ruta.nom}</span>
          {' · '}
          <span>{dataFmt}</span>
        </p>
      </div>
    </div>
  );
}

function BarraRecorregutDesSabadell({
  kmTotal,
  aproximacions,
}: {
  kmTotal: number;
  aproximacions: AproximacioKm[];
}) {
  if (kmTotal <= 0 || aproximacions.length === 0) return null;

  const ciutatsOrdenades = [...aproximacions]
    .map((a) => ({ nom: a.desti.nom, km: a.desti.km }))
    .sort((x, y) => x.km - y.km);

  const punts: { nom: string; km: number }[] = [{ nom: 'Sabadell', km: 0 }, ...ciutatsOrdenades];

  return (
    <section className="app-card rounded-2xl border border-dashed border-[var(--accent)]/25 bg-[var(--bg-card)] p-4 md:p-5">
      <div className="relative px-0.5 pt-1">
        {/* Files d’etiquetes: parells a sobre de la barra, senars a sota, per reduir solapaments */}
        <div className="relative min-h-[2.85rem] w-full">
          {punts.map((p, i) => {
            const leftPct = i === 0 ? 0 : (p.km / kmTotal) * 100;
            if (i % 2 !== 0) return null;
            return (
              <div
                key={`lab-top-${p.nom}-${i}`}
                className="absolute bottom-0 max-w-[26%] text-center md:max-w-[22%]"
                style={{
                  left: i === 0 ? '0%' : `${leftPct}%`,
                  transform: i === 0 ? 'translateX(0)' : 'translateX(-50%)',
                }}
              >
                <div className="text-[11px] font-semibold leading-snug text-[var(--text-primary)] md:text-xs">{p.nom}</div>
                <div className="text-[10px] tabular-nums text-[var(--text-muted)]">{p.km} km</div>
              </div>
            );
          })}
        </div>

        <div className="relative z-[2] my-1 h-4 w-full">
          <div className="absolute left-0 right-0 top-1/2 h-3 w-full -translate-y-1/2 rounded-full bg-[var(--border)]" />
          {punts.map((p, i) => (
            <div
              key={`dot-${p.nom}-${i}`}
              className="absolute top-1/2 z-[3] h-3.5 w-3.5 rounded-full border-2 border-[var(--bg-card)] bg-[var(--accent)] shadow-md ring-2 ring-[var(--accent)]/35 md:h-4 md:w-4"
              style={{
                left: i === 0 ? '0%' : `${(p.km / kmTotal) * 100}%`,
                transform: i === 0 ? 'translate(0, -50%)' : 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        <div className="relative min-h-[2.85rem] w-full">
          {punts.map((p, i) => {
            const leftPct = i === 0 ? 0 : (p.km / kmTotal) * 100;
            if (i % 2 === 0) return null;
            return (
              <div
                key={`lab-bot-${p.nom}-${i}`}
                className="absolute top-0 max-w-[26%] text-center md:max-w-[22%]"
                style={{
                  left: `${leftPct}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="text-[11px] font-semibold leading-snug text-[var(--text-primary)] md:text-xs">{p.nom}</div>
                <div className="text-[10px] tabular-nums text-[var(--text-muted)]">{p.km} km</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { rutes, config } = useRutes();

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
      const mesLlarg = d.toLocaleDateString('ca-ES', { month: 'long' });
      const labelMesAny = `${mesLlarg.charAt(0).toUpperCase() + mesLlarg.slice(1)} ${d.getFullYear()}`;
      return {
        label: d.toLocaleDateString('ca-ES', {
          month: 'short',
          year: '2-digit',
        }),
        labelMesAny,
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
        text: `${comarca.comarca} és la vostra comarca favorita amb ${comarca.vegades} sortides`,
        color: 'accent',
      });
    }

    const rutaLlarga = [...rutes].sort((a, b) => (b.distanciaKm ?? 0) - (a.distanciaKm ?? 0))[0];
    if (rutaLlarga && (rutaLlarga.distanciaKm ?? 0) > 0) {
      list.push({
        text: `La vostra ruta més llarga: ${rutaLlarga.nom} (${rutaLlarga.distanciaKm} km)`,
        color: 'accent2',
      });
    }

    const perTipus = [...distribucioPerTipus(rutes)].sort((a, b) => b.count - a.count)[0];
    if (perTipus && rutes.length > 0) {
      list.push({
        text: `Preferiu ${TIPUS_LABEL[perTipus.tipus]}: ${perTipus.count} de ${rutes.length} de les vostres rutes`,
        color: 'accent',
      });
    }

    return list.slice(0, 3);
  }, [rutes]);

  const rutesRecents = useMemo(
    () => [...rutes].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 3),
    [rutes]
  );

  const ultimaSortida = useMemo(() => {
    if (rutes.length === 0) return null;
    return [...rutes].sort((a, b) => b.data.localeCompare(a.data))[0];
  }, [rutes]);

  /** Darrera ruta per data (`data`) que tingui almenys una foto. */
  const ultimaRutaAmbFotos = useMemo(() => {
    const amb = rutes.filter((r) => (r.fotos?.length ?? 0) > 0);
    if (amb.length === 0) return null;
    return [...amb].sort((a, b) => b.data.localeCompare(a.data))[0];
  }, [rutes]);

  const mitjanaNum =
    stats.mitjanaPerSortida !== '—' ? parseFloat(stats.mitjanaPerSortida) : 0;
  const pctMitjana = (mitjanaNum / millorMesKm) * 100;
  const pctMesActual = (mesActualKm / millorMesKm) * 100;
  const pctMillorMesCard = millorMesEvolucio ? (millorMesEvolucio.km / millorMesKm) * 100 : 0;
  const pctStreak = streakRecord > 0 ? Math.min(100, (streakActual / streakRecord) * 100) : streakActual > 0 ? 100 : 0;

  const refMesActual = dadesEvolucio.find((d) => d.esMesActual)?.label;

  const dataUltimaSortidaFmt =
    ultimaSortida != null
      ? new Date(ultimaSortida.data + 'T12:00:00').toLocaleDateString('ca-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '';

  const tresAproxKmSabadell = useMemo(
    () => tresMillorsAproximacionsDesSabadell(stats.distancia),
    [stats.distancia]
  );

  return (
    <div className="space-y-10">
      <section className="mb-8 py-2 md:py-6">
        <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center md:gap-8 lg:gap-10">
          <div className="flex w-full min-w-0 shrink-0 justify-start md:w-[min(34.5%,315px)] md:max-w-[min(34.5vw,360px)]">
            <img
              src="/bike-hero-portada.png"
              alt=""
              className="-scale-x-100 h-auto w-full max-h-[min(63.75vh,420px)] object-contain object-left sm:max-h-[min(60vh,390px)] md:max-h-[min(54vh,360px)] md:object-left lg:max-h-[min(52.5vh,390px)]"
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center py-2 text-right md:py-6">
            <p className="text-2xl font-black leading-tight tracking-tight text-[var(--text-secondary)] opacity-80 sm:text-3xl md:text-4xl">
              {new Date().toLocaleDateString('ca-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {ultimaSortida ? (
              <div className="mt-3 flex flex-col items-end gap-0.5 text-right text-blue-600 dark:text-blue-400">
                <p className="max-w-full text-sm font-semibold leading-snug">
                  <span className="text-blue-600 dark:text-blue-400">Darrera ruta: </span>
                  <Link
                    to={`/rutes/${ultimaSortida.id}`}
                    className="text-blue-600 no-underline hover:underline dark:text-blue-400"
                  >
                    &ldquo;{ultimaSortida.nom}&rdquo;
                  </Link>
                </p>
                <p className="max-w-full text-[13px] font-normal leading-snug text-blue-600/90 dark:text-blue-400/90">
                  {dataUltimaSortidaFmt}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">Encara no hi ha sortides</p>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[var(--border)] md:grid-cols-3">
          <div className="relative flex min-h-[140px] flex-col justify-between bg-[var(--accent)] p-7">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Distància total</div>
            <div>
              <div className="text-6xl font-black tabular-nums leading-none text-white">{stats.distancia.toFixed(0)}</div>
              <div className="mt-1 text-lg font-semibold text-white/70">km</div>
            </div>
          </div>

          <div className="flex min-h-[120px] flex-col justify-between border-t border-[var(--border)] p-7 md:border-l md:border-t-0">
            <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">Hores totals</div>
            <div>
              <div className="text-5xl font-black tabular-nums leading-none text-[var(--text-primary)]">
                {stats.hores.toLocaleString('ca-ES', { maximumFractionDigits: 1, minimumFractionDigits: 0 })}
              </div>
              <div className="mt-1 text-sm text-[var(--text-muted)]">hores invertides</div>
            </div>
          </div>

          <div className="flex min-h-[120px] flex-col justify-between border-t border-[var(--border)] p-7 md:border-l md:border-t-0">
            <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">Sortides</div>
            <div>
              <div className="text-5xl font-black tabular-nums leading-none text-[var(--text-primary)]">{stats.sortides}</div>
              <div className="mt-1 text-sm text-[var(--text-muted)]">registres</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="app-card overflow-hidden p-0 md:col-span-2">
          <div className="px-5 pb-2 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Evolució — últims 12 mesos</span>
              <span className="text-xs text-[var(--text-muted)]">km</span>
            </div>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height={160}>
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
          </div>

          <div className="border-t border-[var(--border)]" />

          <div className="grid grid-cols-2 divide-y divide-[var(--border)] md:grid-cols-4 md:divide-x md:divide-y-0">
            <div className="p-4">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Km aquest mes</div>
              <div className="mt-1.5 text-2xl font-black tabular-nums text-[var(--accent)]">{mesActualKm.toFixed(1)}</div>
              {mesPassatKm > 0 && (
                <div
                  className={`mt-0.5 text-[11px] font-semibold ${
                    tendencia >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                  }`}
                >
                  {tendencia >= 0 ? '↑' : '↓'}
                  {tendencia >= 0 ? '+' : ''}
                  {tendencia}%
                </div>
              )}
              <MiniBarra pct={pctMesActual} />
            </div>

            <div className="p-4">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Mitjana / sortida</div>
              <div className="mt-1.5 text-2xl font-black tabular-nums text-[var(--text-primary)]">
                {stats.mitjanaPerSortida}
                {stats.mitjanaPerSortida !== '—' && (
                  <span className="text-sm font-semibold text-[var(--text-muted)]"> km</span>
                )}
              </div>
              <MiniBarra pct={pctMitjana} />
            </div>

            <div className="p-4">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Millor mes</div>
              {millorMesEvolucio ? (
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-base font-bold leading-tight text-[var(--text-primary)]">
                    {millorMesEvolucio.labelMesAny}
                  </span>
                  <span className="text-sm font-black tabular-nums text-[var(--accent2)]">{millorMesEvolucio.km} km</span>
                </div>
              ) : (
                <div className="mt-1.5 text-sm text-[var(--text-muted)]">—</div>
              )}
              <MiniBarra pct={pctMillorMesCard} />
            </div>

            <div className="p-4">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Streak setmanal</div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-black tabular-nums text-[var(--text-primary)]">{streakActual}</span>
                <span className="text-xs text-[var(--text-muted)]">setm.</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">rècord {streakRecord}</div>
              <MiniBarra pct={pctStreak} />
            </div>
          </div>
        </div>
        {ultimaRutaAmbFotos != null && (ultimaRutaAmbFotos.fotos?.length ?? 0) > 0 && (
          <div className="h-full">
            <SliderPortadaFotos
              key={`inline-${ultimaRutaAmbFotos.id}`}
              ruta={ultimaRutaAmbFotos}
              intervalMs={Math.min(8, Math.max(1, config.portadaSliderIntervalSegons)) * 1000}
            />
          </div>
        )}
      </section>

      {stats.distancia > 0 && tresAproxKmSabadell.length > 0 && (
        <BarraRecorregutDesSabadell kmTotal={stats.distancia} aproximacions={tresAproxKmSabadell} />
      )}

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Últimes sortides</h2>
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
              descripcio="Les vostres últimes sortides apareixeran aquí."
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
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Sobre les vostres rutes</h2>
        {insights.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Afegeix més rutes per veure insights.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {insights.map((ins, i) => (
              <div key={i} className="app-card flex items-start gap-3 p-4">
                <div
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: ins.color === 'accent' ? 'var(--accent)' : 'var(--accent2)',
                  }}
                />
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{ins.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
