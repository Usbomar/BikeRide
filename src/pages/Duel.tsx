import { useMemo, useState } from 'react';
import { useRutes } from '../store/useRutes';
import type { Ruta } from '../types/ruta';
import { EmptyState } from '../components/EmptyState';

// TODO: connectar amb perfil d'usuari real (nom del ciclista A / convidat B)
const NOM_A = 'Tu';
const NOM_B = 'Company';
const COLOR_A = 'var(--accent)';
const COLOR_B = 'var(--accent2)';

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/** Dades sintètiques del company; mateix seed per ruta → mateix resultat. TODO: substituir per API / segon usuari. */
function dadesCompany(ruta: Ruta, camp: 'km' | 'desn'): number {
  const seed = ruta.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const r =
    camp === 'km'
      ? 0.8 + seededRandom(seed) * 0.4
      : 0.85 + seededRandom(seed + 1) * 0.3;
  const base = camp === 'km' ? (ruta.distanciaKm ?? 0) : (ruta.desnivellMetres ?? 0);
  return Math.round(base * r * 10) / 10;
}

type FilaMes = {
  mes: string;
  labelMes: string;
  kmA: number;
  desnA: number;
  sortidesA: number;
  kmB: number;
  desnB: number;
  sortidesB: number;
};

export default function Duel() {
  const { rutes } = useRutes();
  const [metrica, setMetrica] = useState<'km' | 'desnivell' | 'sortides'>('km');

  const dadesPerMes = useMemo(() => {
    const map = new Map<string, FilaMes>();

    rutes.forEach((r) => {
      const mes = r.data.slice(0, 7);
      const d = new Date(r.data + 'T00:00:00');
      const label = d
        .toLocaleDateString('ca-ES', { month: 'short', year: '2-digit' })
        .replace('. ', " '");

      const prev =
        map.get(mes) ??
        ({
          mes,
          labelMes: label,
          kmA: 0,
          desnA: 0,
          sortidesA: 0,
          kmB: 0,
          desnB: 0,
          sortidesB: 0,
        } satisfies FilaMes);

      map.set(mes, {
        ...prev,
        labelMes: prev.labelMes || label,
        kmA: Math.round((prev.kmA + (r.distanciaKm ?? 0)) * 10) / 10,
        desnA: prev.desnA + (r.desnivellMetres ?? 0),
        sortidesA: prev.sortidesA + 1,
        kmB: Math.round((prev.kmB + dadesCompany(r, 'km')) * 10) / 10,
        desnB: prev.desnB + dadesCompany(r, 'desn'),
        sortidesB: prev.sortidesB + 1,
      });
    });

    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [rutes]);

  const totals = useMemo(() => {
    const kmA = dadesPerMes.reduce((s, m) => s + m.kmA, 0);
    const kmB = dadesPerMes.reduce((s, m) => s + m.kmB, 0);
    const desnA = dadesPerMes.reduce((s, m) => s + m.desnA, 0);
    const desnB = dadesPerMes.reduce((s, m) => s + m.desnB, 0);
    const sortidesA = dadesPerMes.reduce((s, m) => s + m.sortidesA, 0);
    const sortidesB = dadesPerMes.reduce((s, m) => s + m.sortidesB, 0);
    return { kmA, kmB, desnA, desnB, sortidesA, sortidesB };
  }, [dadesPerMes]);

  const marcador = useMemo(() => {
    let guanyesA = 0;
    let guanyesB = 0;
    let empats = 0;
    dadesPerMes.forEach((m) => {
      const vA =
        metrica === 'km' ? m.kmA : metrica === 'desnivell' ? m.desnA : m.sortidesA;
      const vB =
        metrica === 'km' ? m.kmB : metrica === 'desnivell' ? m.desnB : m.sortidesB;
      if (vA > vB) guanyesA++;
      else if (vB > vA) guanyesB++;
      else empats++;
    });
    return { guanyesA, guanyesB, empats };
  }, [dadesPerMes, metrica]);

  const maxVal = useMemo(
    () =>
      Math.max(
        1,
        ...dadesPerMes.map((m) =>
          metrica === 'km'
            ? Math.max(m.kmA, m.kmB)
            : metrica === 'desnivell'
              ? Math.max(m.desnA, m.desnB)
              : Math.max(m.sortidesA, m.sortidesB)
        )
      ),
    [dadesPerMes, metrica]
  );

  if (rutes.length === 0) {
    return (
      <div>
        <section className="mb-6">
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">Rivalitat</p>
          <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
            Duel ciclistes
          </h1>
        </section>
        <EmptyState
          titol="Sense rutes encara"
          descripcio="Afegeix rutes per veure el duel entre ciclistes."
          accio={{ label: 'Nova ruta', to: '/nova-ruta' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">Rivalitat</p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
          Duel ciclistes
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Dades del company generades automàticament. {/* TODO: connectar perfil real */}
        </p>
      </section>

      <div className="app-card flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <div className="mb-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">{NOM_A}</div>
          <div className="text-5xl font-black" style={{ color: COLOR_A }}>
            {marcador.guanyesA}
          </div>
          <div className="text-xs text-[var(--text-muted)]">mesos guanyats</div>
        </div>

        <div className="shrink-0 text-center">
          <div className="text-2xl font-black text-[var(--text-muted)]">VS</div>
          {marcador.empats > 0 && (
            <div className="mt-1 text-[10px] text-[var(--text-muted)]">
              {marcador.empats} empat{marcador.empats > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="flex-1 text-center">
          <div className="mb-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">{NOM_B}</div>
          <div className="text-5xl font-black" style={{ color: COLOR_B }}>
            {marcador.guanyesB}
          </div>
          <div className="text-xs text-[var(--text-muted)]">mesos guanyats</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(
          [
            { label: 'Km totals', a: totals.kmA, b: totals.kmB, unit: 'km' },
            { label: 'Desnivell', a: totals.desnA, b: totals.desnB, unit: 'm' },
            { label: 'Sortides', a: totals.sortidesA, b: totals.sortidesB, unit: '' },
          ] as const
        ).map((kpi) => {
          const aGuanya = kpi.a >= kpi.b;
          const sum = kpi.a + kpi.b;
          const pctA = sum > 0 ? (kpi.a / sum) * 100 : 50;
          return (
            <div key={kpi.label} className="app-card">
              <div className="mb-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
                {kpi.label}
              </div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <span
                    className={`text-2xl font-black ${aGuanya ? '' : 'opacity-60'}`}
                    style={{ color: COLOR_A }}
                  >
                    {kpi.unit === 'km'
                      ? kpi.a.toLocaleString('ca-ES', { maximumFractionDigits: 1 })
                      : kpi.a.toLocaleString('ca-ES')}
                    {kpi.unit}
                  </span>
                  {aGuanya && <span className="ml-1 text-xs text-[#059669]">▲</span>}
                </div>
                <div className="text-right">
                  <span
                    className={`text-lg font-bold ${!aGuanya ? '' : 'opacity-60'}`}
                    style={{ color: COLOR_B }}
                  >
                    {kpi.unit === 'km'
                      ? kpi.b.toLocaleString('ca-ES', { maximumFractionDigits: 1 })
                      : kpi.b.toLocaleString('ca-ES')}
                    {kpi.unit}
                  </span>
                  {!aGuanya && <span className="ml-1 text-xs text-[#059669]">▲</span>}
                </div>
              </div>
              <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                <div className="h-full rounded-l-full" style={{ width: `${pctA}%`, background: COLOR_A }} />
                <div className="h-full rounded-r-full" style={{ width: `${100 - pctA}%`, background: `${COLOR_B}88` }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>{NOM_A}</span>
                <span>{NOM_B}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'km' as const, label: 'Km' },
            { id: 'desnivell' as const, label: 'Desnivell' },
            { id: 'sortides' as const, label: 'Sortides' },
          ]
        ).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setMetrica(p.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              metrica === p.id
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--superficie)]/25 bg-[var(--superficie-muted)] text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="app-card">
        <div className="mb-2 flex justify-between text-xs font-medium">
          <span style={{ color: COLOR_A }}>← {NOM_A}</span>
          <span style={{ color: COLOR_B }}>
            {NOM_B} →
          </span>
        </div>

        <div className="space-y-1">
          {dadesPerMes.map((m) => {
            const vA =
              metrica === 'km' ? m.kmA : metrica === 'desnivell' ? m.desnA : m.sortidesA;
            const vB =
              metrica === 'km' ? m.kmB : metrica === 'desnivell' ? m.desnB : m.sortidesB;
            return (
              <div key={m.mes} className="group flex h-7 items-center gap-0">
                <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-hidden pr-1">
                  <span className="text-[10px] tabular-nums text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100">
                    {metrica === 'km'
                      ? `${m.kmA} km`
                      : metrica === 'desnivell'
                        ? `${m.desnA} m`
                        : `${m.sortidesA}`}
                  </span>
                  <div
                    className="h-5 min-w-0 rounded-l-sm transition-all duration-500"
                    style={{
                      width: `${(vA / maxVal) * 100}%`,
                      background: vA >= vB ? COLOR_A : `${COLOR_A}66`,
                      maxWidth: '100%',
                    }}
                  />
                </div>

                <div className="w-14 shrink-0 text-center">
                  <span className="text-[10px] font-medium text-[var(--text-secondary)]">{m.labelMes}</span>
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden pl-1">
                  <div
                    className="h-5 min-w-0 rounded-r-sm transition-all duration-500"
                    style={{
                      width: `${(vB / maxVal) * 100}%`,
                      background: vB > vA ? COLOR_B : `${COLOR_B}66`,
                      maxWidth: '100%',
                    }}
                  />
                  <span className="text-[10px] tabular-nums text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100">
                    {metrica === 'km'
                      ? `${m.kmB} km`
                      : metrica === 'desnivell'
                        ? `${m.desnB} m`
                        : `${m.sortidesB}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
