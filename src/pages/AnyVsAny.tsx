import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';
import { useRutes } from '../store/useRutes';
import type { Ruta } from '../types/ruta';
import { EmptyState } from '../components/EmptyState';

const MESOS_LABELS = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];

/** Paleta harmònica: accent del tema, accent2, teal intermedi (no arc de Sant Martí). */
const C_ANY = ['var(--accent)', 'var(--accent2)', '#0d9488'] as const;

function resumPerMes(rutes: Ruta[], year: number) {
  const mesos = Array.from({ length: 12 }, (_, i) => ({
    mes: i,
    km: 0,
    desnivell: 0,
    sortides: 0,
    hores: 0,
  }));
  rutes
    .filter((r) => new Date(r.data).getFullYear() === year)
    .forEach((r) => {
      const m = new Date(r.data).getMonth();
      mesos[m].km += r.distanciaKm ?? 0;
      mesos[m].desnivell += r.desnivellMetres ?? 0;
      mesos[m].sortides += 1;
      mesos[m].hores += (r.duradaMinuts ?? 0) / 60;
    });
  return mesos;
}

function totalsAny(rutes: Ruta[], year: number) {
  const rs = rutes.filter((r) => new Date(r.data).getFullYear() === year);
  return {
    km: Math.round(rs.reduce((s, r) => s + (r.distanciaKm ?? 0), 0) * 10) / 10,
    desnivell: rs.reduce((s, r) => s + (r.desnivellMetres ?? 0), 0),
    sortides: rs.length,
    hores: Math.round((rs.reduce((s, r) => s + (r.duradaMinuts ?? 0), 0) / 60) * 10) / 10,
  };
}

function millorMesKm(rutes: Ruta[], year: number): { label: string; km: number } | null {
  const m = resumPerMes(rutes, year);
  let bestI = 0;
  let bestKm = 0;
  for (let i = 0; i < 12; i++) {
    if (m[i].km > bestKm) {
      bestKm = m[i].km;
      bestI = i;
    }
  }
  if (bestKm <= 0) return null;
  return { label: MESOS_LABELS[bestI], km: Math.round(bestKm * 10) / 10 };
}

function pct(a: number, b: number): string {
  if (b === 0) return a > 0 ? '+100%' : '—';
  const d = Math.round(((a - b) / b) * 100);
  return d >= 0 ? `+${d}%` : `${d}%`;
}

export default function AnyVsAny() {
  const { rutes } = useRutes();

  const anysDisponibles = useMemo(() => {
    const set = new Set(rutes.map((r) => new Date(r.data).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [rutes]);

  const [overrideA, setOverrideA] = useState<number | null>(null);
  const [overrideB, setOverrideB] = useState<number | null>(null);
  const [overrideC, setOverrideC] = useState<number | null>(null);

  const defaultA = anysDisponibles[0] ?? new Date().getFullYear();
  const defaultB = anysDisponibles.length >= 2 ? anysDisponibles[1] : defaultA - 1;
  const defaultC = anysDisponibles.length >= 3 ? anysDisponibles[2] : defaultB;

  const anyA = overrideA != null && anysDisponibles.includes(overrideA) ? overrideA : defaultA;
  const anyB = overrideB != null && anysDisponibles.includes(overrideB) ? overrideB : defaultB;
  const potTercer = anysDisponibles.length >= 3;
  const anyC =
    potTercer && overrideC != null && anysDisponibles.includes(overrideC) ? overrideC : potTercer ? defaultC : null;

  const tA = useMemo(() => totalsAny(rutes, anyA), [rutes, anyA]);
  const tB = useMemo(() => totalsAny(rutes, anyB), [rutes, anyB]);
  const tC = useMemo(() => (anyC != null ? totalsAny(rutes, anyC) : null), [rutes, anyC]);

  const millorA = useMemo(() => millorMesKm(rutes, anyA), [rutes, anyA]);
  const millorB = useMemo(() => millorMesKm(rutes, anyB), [rutes, anyB]);
  const millorC = useMemo(() => (anyC != null ? millorMesKm(rutes, anyC) : null), [rutes, anyC]);

  const dadesBarres = useMemo(() => {
    const mA = resumPerMes(rutes, anyA);
    const mB = resumPerMes(rutes, anyB);
    const mC = anyC != null ? resumPerMes(rutes, anyC) : null;
    return MESOS_LABELS.map((label, i) => ({
      label,
      kmA: Math.round(mA[i].km * 10) / 10,
      kmB: Math.round(mB[i].km * 10) / 10,
      kmC: mC ? Math.round(mC[i].km * 10) / 10 : 0,
      desnA: mA[i].desnivell,
      desnB: mB[i].desnivell,
      desnC: mC ? mC[i].desnivell : 0,
    }));
  }, [rutes, anyA, anyB, anyC]);

  const dadesRadar = useMemo(() => {
    const caps = [tA, tB, ...(tC ? [tC] : [])];
    const maxKm = Math.max(...caps.map((c) => c.km), 1);
    const maxDesn = Math.max(...caps.map((c) => c.desnivell), 1);
    const maxSort = Math.max(...caps.map((c) => c.sortides), 1);
    const maxHores = Math.max(...caps.map((c) => c.hores), 1);
    const row = (metric: string, pick: (t: (typeof tA) & {}) => number, max: number) => {
      const base = { metric, A: Math.round((pick(tA) / max) * 100), B: Math.round((pick(tB) / max) * 100) };
      if (tC) return { ...base, C: Math.round((pick(tC) / max) * 100) };
      return base;
    };
    return [
      row('Km', (t) => t.km, maxKm),
      row('Desnivell', (t) => t.desnivell, maxDesn),
      row('Sortides', (t) => t.sortides, maxSort),
      row('Hores', (t) => t.hores, maxHores),
    ];
  }, [tA, tB, tC]);

  const taulaComparativa = useMemo(() => {
    const fila = (label: string, get: (t: typeof tA) => number | string, fmt?: (n: number) => string) => {
      const base = {
        label,
        a: typeof get(tA) === 'number' ? fmt?.(get(tA) as number) ?? String(get(tA)) : get(tA),
        b: typeof get(tB) === 'number' ? fmt?.(get(tB) as number) ?? String(get(tB)) : get(tB),
        c:
          tC != null
            ? typeof get(tC) === 'number'
              ? fmt?.(get(tC) as number) ?? String(get(tC))
              : get(tC)
            : '—',
      };
      return base;
    };
    const kmSort = (t: typeof tA) => (t.sortides > 0 ? t.km / t.sortides : 0);
    const desnKm = (t: typeof tA) => (t.km > 0 ? t.desnivell / t.km : 0);
    return [
      fila('Km totals', (t) => t.km, (n) => `${n.toFixed(n % 1 ? 1 : 0)} km`),
      fila('Sortides', (t) => t.sortides, (n) => String(Math.round(n))),
      fila('Km per sortida', kmSort, (n) => `${n.toFixed(1)} km`),
      fila('Desnivell acumulat', (t) => t.desnivell, (n) => `${Math.round(n)} m`),
      fila('Desnivell / km', desnKm, (n) => `${n.toFixed(1)} m/km`),
      fila('Hores en moviment', (t) => t.hores, (n) => `${n.toFixed(1)} h`),
    ];
  }, [tA, tB, tC]);

  if (anysDisponibles.length < 2) {
    return (
      <div>
        <section className="mb-6">
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
            Comparativa anual
          </p>
          <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">Any vs Any</h1>
        </section>
        <EmptyState
          titol="No hi ha prou anys per comparar"
          descripcio="Necessites rutes de com a mínim 2 anys naturals diferents."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[linear-gradient(135deg,var(--accent-soft),transparent_45%)] px-4 py-5 sm:px-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
          Comparativa anual
        </p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">Any vs Any</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Fins a 3 anys: volum, ritme mensual, perfil radar i indicadors derivats (km/sortida, desnivell/km).
        </p>
      </section>

      <div className="flex flex-wrap items-end justify-center gap-4 sm:gap-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Any 1</label>
          <select
            value={anyA}
            onChange={(e) => setOverrideA(Number(e.target.value))}
            className="cursor-pointer rounded-xl border-2 border-[var(--accent)]/35 bg-[var(--bg-card)] px-3 py-2 text-lg font-bold text-[var(--accent)] shadow-sm"
          >
            {anysDisponibles.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <span className="mb-2 text-xl font-black text-[var(--text-muted)]">·</span>
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Any 2</label>
          <select
            value={anyB}
            onChange={(e) => setOverrideB(Number(e.target.value))}
            className="cursor-pointer rounded-xl border-2 border-[var(--accent2)]/40 bg-[var(--bg-card)] px-3 py-2 text-lg font-bold text-[var(--accent2)] shadow-sm"
          >
            {anysDisponibles.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        {potTercer && (
          <>
            <span className="mb-2 text-xl font-black text-[var(--text-muted)]">·</span>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Any 3</label>
              <select
                value={anyC ?? anyB}
                onChange={(e) => setOverrideC(Number(e.target.value))}
                className="cursor-pointer rounded-xl border-2 border-[#0d9488]/45 bg-[var(--bg-card)] px-3 py-2 text-lg font-bold text-[#0d9488] shadow-sm"
              >
                {anysDisponibles.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Km totals', v: tA.km, o: tB.km, t: tC?.km, unit: 'km', c: 0 },
          { label: 'Desnivell', v: tA.desnivell, o: tB.desnivell, t: tC?.desnivell, unit: 'm', c: 1 },
          { label: 'Sortides', v: tA.sortides, o: tB.sortides, t: tC?.sortides, unit: '', c: 2 },
          { label: 'Hores', v: tA.hores, o: tB.hores, t: tC?.hores, unit: 'h', c: 0 },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl border border-[var(--border)] p-4 shadow-sm ${
              k.c === 0
                ? 'bg-[linear-gradient(180deg,var(--accent-soft),transparent)]'
                : k.c === 1
                  ? 'bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent2)_18%,transparent),transparent)]'
                  : 'bg-[var(--superficie-muted)]/40'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {k.label}
            </span>
            <div className="mt-2 space-y-1.5 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-black tabular-nums text-[var(--accent)]">
                  {k.v}
                  {k.unit}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">{anyA}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold tabular-nums text-[var(--accent2)]">
                  {k.o}
                  {k.unit}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">{anyB}</span>
              </div>
              {tC != null && k.t !== undefined && (
                <div className="flex items-baseline justify-between gap-2 border-t border-[var(--border)]/60 pt-1.5">
                  <span className="font-bold tabular-nums text-[#0d9488]">
                    {k.t}
                    {k.unit}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">{anyC}</span>
                </div>
              )}
            </div>
            <p className="mt-2 text-[11px] font-medium text-[var(--text-muted)]">
              {anyA} vs {anyB}:{' '}
              <span className={k.v >= k.o ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                {pct(k.v, k.o)}
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="border-b border-[var(--border)] bg-[var(--superficie-muted)]/30 px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Quadre comparatiu</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Mètriques derivades per detectar intensitat i esforç relatiu.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[520px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-3 font-semibold">Indicador</th>
                <th className="px-4 py-3 font-semibold text-[var(--accent)]">{anyA}</th>
                <th className="px-4 py-3 font-semibold text-[var(--accent2)]">{anyB}</th>
                {tC != null && <th className="px-4 py-3 font-semibold text-[#0d9488]">{anyC}</th>}
              </tr>
            </thead>
            <tbody>
              {taulaComparativa.map((row) => (
                <tr key={row.label} className="border-b border-[var(--border)]/70 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-[var(--text-secondary)]">{row.label}</td>
                  <td className="px-4 py-2.5 tabular-nums text-[var(--text-primary)]">{row.a}</td>
                  <td className="px-4 py-2.5 tabular-nums text-[var(--text-primary)]">{row.b}</td>
                  {tC != null && <td className="px-4 py-2.5 tabular-nums text-[var(--text-primary)]">{row.c}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`grid gap-3 ${tC != null ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {[
          { y: anyA, m: millorA, col: 'border-[var(--accent)]/50 bg-[var(--accent-soft)]/30' },
          { y: anyB, m: millorB, col: 'border-[var(--accent2)]/45 bg-[var(--accent2-soft)]/25' },
          ...(tC != null && anyC != null
            ? [{ y: anyC, m: millorC, col: 'border-[#0d9488]/45 bg-[#0d9488]/10' }]
            : []),
        ].map((x) => (
          <div key={x.y} className={`rounded-2xl border p-4 ${x.col}`}>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Millor mes · {x.y}
            </div>
            {x.m ? (
              <>
                <div className="mt-1 text-lg font-bold text-[var(--text-primary)]">{x.m.label}</div>
                <div className="text-sm font-black tabular-nums text-[var(--accent)]">{x.m.km} km</div>
              </>
            ) : (
              <div className="mt-1 text-sm text-[var(--text-muted)]">Sense dades</div>
            )}
          </div>
        ))}
      </div>

      <div className="app-card border-[var(--accent)]/15">
        <h2 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
          Evolució mensual de km (línies)
        </h2>
        <p className="mb-3 text-xs text-[var(--text-muted)]">Compara el ritme al llarg de l&apos;any: pics i mesos fluixos.</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dadesBarres} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
              <YAxis fontSize={11} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(v) => `${v}`} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="kmA" name={String(anyA)} stroke={C_ANY[0]} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="kmB" name={String(anyB)} stroke={C_ANY[1]} strokeWidth={2.5} dot={false} />
              {tC != null && (
                <Line type="monotone" dataKey="kmC" name={String(anyC)} stroke={C_ANY[2]} strokeWidth={2.5} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="app-card border-[var(--accent2)]/15">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Km per mes (barres agrupades)
        </h2>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadesBarres} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
              <YAxis fontSize={11} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(v) => `${v} km`} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="kmA" name={String(anyA)} fill={C_ANY[0]} fillOpacity={0.88} radius={[2, 2, 0, 0]} />
              <Bar dataKey="kmB" name={String(anyB)} fill={C_ANY[1]} fillOpacity={0.88} radius={[2, 2, 0, 0]} />
              {tC != null && (
                <Bar dataKey="kmC" name={String(anyC)} fill={C_ANY[2]} fillOpacity={0.88} radius={[2, 2, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="app-card">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Desnivell per mes</h2>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadesBarres} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
              <YAxis fontSize={11} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(v) => `${v} m`} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="desnA" name={String(anyA)} fill={C_ANY[0]} fillOpacity={0.75} radius={[2, 2, 0, 0]} />
              <Bar dataKey="desnB" name={String(anyB)} fill={C_ANY[1]} fillOpacity={0.75} radius={[2, 2, 0, 0]} />
              {tC != null && (
                <Bar dataKey="desnC" name={String(anyC)} fill={C_ANY[2]} fillOpacity={0.75} radius={[2, 2, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="app-card overflow-hidden border border-[var(--border)] bg-[linear-gradient(160deg,var(--accent-soft),transparent_55%)]">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Perfil comparatiu (radar)
        </h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={dadesRadar} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name={String(anyA)} dataKey="A" stroke={C_ANY[0]} fill={C_ANY[0]} fillOpacity={0.22} strokeWidth={2} />
              <Radar name={String(anyB)} dataKey="B" stroke={C_ANY[1]} fill={C_ANY[1]} fillOpacity={0.18} strokeWidth={2} />
              {tC != null && (
                <Radar name={String(anyC)} dataKey="C" stroke={C_ANY[2]} fill={C_ANY[2]} fillOpacity={0.16} strokeWidth={2} />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-[var(--text-muted)]">
          Escala 0–100 respecte al millor valor entre els anys seleccionats (per dimensió).
        </p>
      </div>
    </div>
  );
}
