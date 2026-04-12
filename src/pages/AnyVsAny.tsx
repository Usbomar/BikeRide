import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
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
} from 'recharts';
import { useRutes } from '../store/useRutes';
import type { Ruta } from '../types/ruta';
import { EmptyState } from '../components/EmptyState';

const MESOS_LABELS = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];

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

  const defaultA = anysDisponibles[0] ?? new Date().getFullYear();
  const defaultB =
    anysDisponibles.length >= 2 ? anysDisponibles[1] : defaultA - 1;

  const anyA =
    overrideA != null && anysDisponibles.includes(overrideA) ? overrideA : defaultA;
  const anyB =
    overrideB != null && anysDisponibles.includes(overrideB) ? overrideB : defaultB;

  const dadesBarres = useMemo(() => {
    const mA = resumPerMes(rutes, anyA);
    const mB = resumPerMes(rutes, anyB);
    return MESOS_LABELS.map((label, i) => ({
      label,
      kmA: Math.round(mA[i].km * 10) / 10,
      kmB: Math.round(mB[i].km * 10) / 10,
      desnA: mA[i].desnivell,
      desnB: mB[i].desnivell,
    }));
  }, [rutes, anyA, anyB]);

  const totalsA = useMemo(() => {
    const rs = rutes.filter((r) => new Date(r.data).getFullYear() === anyA);
    return {
      km: Math.round(rs.reduce((s, r) => s + (r.distanciaKm ?? 0), 0) * 10) / 10,
      desnivell: rs.reduce((s, r) => s + (r.desnivellMetres ?? 0), 0),
      sortides: rs.length,
      hores: Math.round((rs.reduce((s, r) => s + (r.duradaMinuts ?? 0), 0) / 60) * 10) / 10,
    };
  }, [rutes, anyA]);

  const totalsB = useMemo(() => {
    const rs = rutes.filter((r) => new Date(r.data).getFullYear() === anyB);
    return {
      km: Math.round(rs.reduce((s, r) => s + (r.distanciaKm ?? 0), 0) * 10) / 10,
      desnivell: rs.reduce((s, r) => s + (r.desnivellMetres ?? 0), 0),
      sortides: rs.length,
      hores: Math.round((rs.reduce((s, r) => s + (r.duradaMinuts ?? 0), 0) / 60) * 10) / 10,
    };
  }, [rutes, anyB]);

  const dadesRadar = useMemo(() => {
    const maxKm = Math.max(totalsA.km, totalsB.km, 1);
    const maxDesn = Math.max(totalsA.desnivell, totalsB.desnivell, 1);
    const maxSort = Math.max(totalsA.sortides, totalsB.sortides, 1);
    const maxHores = Math.max(totalsA.hores, totalsB.hores, 1);
    return [
      {
        metric: 'Km',
        A: Math.round((totalsA.km / maxKm) * 100),
        B: Math.round((totalsB.km / maxKm) * 100),
      },
      {
        metric: 'Desnivell',
        A: Math.round((totalsA.desnivell / maxDesn) * 100),
        B: Math.round((totalsB.desnivell / maxDesn) * 100),
      },
      {
        metric: 'Sortides',
        A: Math.round((totalsA.sortides / maxSort) * 100),
        B: Math.round((totalsB.sortides / maxSort) * 100),
      },
      {
        metric: 'Hores',
        A: Math.round((totalsA.hores / maxHores) * 100),
        B: Math.round((totalsB.hores / maxHores) * 100),
      },
    ];
  }, [totalsA, totalsB]);

  const kpis = [
    { label: 'Km totals', a: totalsA.km, b: totalsB.km, unit: 'km', accent: true },
    { label: 'Desnivell', a: totalsA.desnivell, b: totalsB.desnivell, unit: 'm', accent: false },
    { label: 'Sortides', a: totalsA.sortides, b: totalsB.sortides, unit: '', accent: false },
    { label: 'Hores', a: totalsA.hores, b: totalsB.hores, unit: 'h', accent: false },
  ] as const;

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
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
          Comparativa anual
        </p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">Any vs Any</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Compara volum i patró mensual entre dos anys naturals.
        </p>
      </section>

      <div className="flex items-center gap-4 flex-wrap justify-center">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Any A</label>
          <select
            value={anyA}
            onChange={(e) => setOverrideA(Number(e.target.value))}
            className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-lg font-bold text-[var(--accent)]"
          >
            {anysDisponibles.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <span className="mt-4 text-2xl font-black text-[var(--text-muted)]">VS</span>
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Any B</label>
          <select
            value={anyB}
            onChange={(e) => setOverrideB(Number(e.target.value))}
            className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-lg font-bold text-[var(--text-primary)]"
          >
            {anysDisponibles.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="app-card flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{kpi.label}</span>
            <div className="flex items-end gap-3">
              <span
                className={`text-2xl font-black ${
                  kpi.accent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
                }`}
              >
                {kpi.a}
                {kpi.unit}
              </span>
              <span className="mb-0.5 text-sm text-[var(--text-muted)]">
                vs {kpi.b}
                {kpi.unit}
              </span>
            </div>
            <span
              className={`text-sm font-medium ${
                kpi.a >= kpi.b ? 'text-[#059669]' : 'text-[#dc2626]'
              }`}
            >
              {pct(kpi.a, kpi.b)} vs {anyB}
            </span>
          </div>
        ))}
      </div>

      <div className="app-card">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Km per mes — {anyA} vs {anyB}
        </h2>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadesBarres} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
              <YAxis
                fontSize={11}
                tick={{ fill: 'var(--text-muted)' }}
                tickFormatter={(v) => `${v} km`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
                formatter={(value: number, name: string) => [
                  `${value} km`,
                  name === 'a' ? String(anyA) : String(anyB),
                ]}
              />
              <Bar
                dataKey="kmA"
                name="a"
                fill="var(--accent)"
                fillOpacity={0.85}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="kmB"
                name="b"
                fill="var(--accent2)"
                fillOpacity={0.85}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-[var(--text-secondary)]">
          <span>
            <span
              className="mr-1 inline-block h-3 w-3 rounded-sm"
              style={{ background: 'var(--accent)' }}
            />
            {anyA}
          </span>
          <span>
            <span
              className="mr-1 inline-block h-3 w-3 rounded-sm"
              style={{ background: 'var(--accent2)' }}
            />
            {anyB}
          </span>
        </div>
      </div>

      <div className="app-card">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Desnivell per mes — {anyA} vs {anyB}
        </h2>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadesBarres} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
              <YAxis
                fontSize={11}
                tick={{ fill: 'var(--text-muted)' }}
                tickFormatter={(v) => `${v} m`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
                formatter={(value: number, name: string) => [
                  `${value} m`,
                  name === 'a' ? String(anyA) : String(anyB),
                ]}
              />
              <Bar
                dataKey="desnA"
                name="a"
                fill="var(--accent)"
                fillOpacity={0.85}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="desnB"
                name="b"
                fill="var(--accent2)"
                fillOpacity={0.85}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-[var(--text-secondary)]">
          <span>
            <span
              className="mr-1 inline-block h-3 w-3 rounded-sm"
              style={{ background: 'var(--accent)' }}
            />
            {anyA}
          </span>
          <span>
            <span
              className="mr-1 inline-block h-3 w-3 rounded-sm"
              style={{ background: 'var(--accent2)' }}
            />
            {anyB}
          </span>
        </div>
      </div>

      <div className="app-card">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Perfil comparatiu — {anyA} vs {anyB}
        </h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={dadesRadar} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name={String(anyA)}
                dataKey="A"
                stroke="var(--accent)"
                fill="var(--accent)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Radar
                name={String(anyB)}
                dataKey="B"
                stroke="var(--accent2)"
                fill="var(--accent2)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-[var(--text-secondary)]">
          <span>
            <span
              className="mr-1 inline-block h-3 w-3 rounded-sm"
              style={{ background: 'var(--accent)' }}
            />
            {anyA}
          </span>
          <span>
            <span
              className="mr-1 inline-block h-3 w-3 rounded-sm"
              style={{ background: 'var(--accent2)' }}
            />
            {anyB}
          </span>
        </div>
      </div>
    </div>
  );
}
