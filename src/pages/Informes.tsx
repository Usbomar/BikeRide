import { useMemo, useState } from 'react';
import { useRutes } from '../store/useRutes';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { Ruta } from '../types/ruta';
import { getPeriodes, filtrarRutesPerPeriode, resumRutes, type Periode } from '../utils/informes';
import { EmptyState } from '../components/EmptyState';

const PERIODES: { value: Periode; label: string }[] = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

type FilaPeriode = {
  label: string;
  enCurs: boolean;
  km: number;
  desnivell: number;
  sortides: number;
  hores: number;
  rutaDestacada: Ruta | null;
};

function formatAxisLabel(label: string, periode: Periode): string {
  if (periode !== 'mensual') return label;
  const y = label.match(/(\d{4})/);
  const yy = y ? y[1].slice(-2) : '';
  const words = label.match(/[a-zà-ú]+/gi) ?? [];
  const monthWord = words.find((w) => !/^(de|del)$/i.test(w)) ?? label;
  const abbr = monthWord.replace(/^d'/i, '').slice(0, 3).toLowerCase();
  return yy ? `${abbr} ${yy}` : label;
}

function pctCanvi(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual === 0 ? null : 100;
  return Math.round(((actual - anterior) / anterior) * 1000) / 10;
}

function TrendText({ actual, anterior }: { actual: number; anterior: number | undefined }) {
  if (anterior === undefined) return null;
  const p = pctCanvi(actual, anterior);
  if (p === null || p === 0) return null;
  const cls = p > 0 ? 'text-[#059669]' : 'text-[#dc2626]';
  const sign = p > 0 ? '+' : '';
  return (
    <span className={`text-xs font-medium ${cls}`}>
      {sign}
      {p}% vs anterior
    </span>
  );
}

function InformesTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: FilaPeriode }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div
      className="rounded-lg border border-[var(--border)] px-3 py-2 shadow-sm"
      style={{
        backgroundColor: 'var(--bg-card)',
        fontSize: 12,
      }}
    >
      <p className="m-0 mb-1 font-semibold text-[var(--text-primary)]">{row.label}</p>
      {row.enCurs && (
        <p className="m-0 mb-2 text-[11px] text-[var(--text-muted)]">En curs · fins avui</p>
      )}
      <ul className="m-0 list-none space-y-0.5 p-0 text-[var(--text-secondary)]">
        <li>
          <span className="text-[var(--text-muted)]">Km: </span>
          <span className="font-medium text-[var(--text-primary)]">{row.km}</span>
        </li>
        <li>
          <span className="text-[var(--text-muted)]">Desnivell: </span>
          <span className="font-medium text-[var(--text-primary)]">{row.desnivell} m</span>
        </li>
        <li>
          <span className="text-[var(--text-muted)]">Sortides: </span>
          <span className="font-medium text-[var(--text-primary)]">{row.sortides}</span>
        </li>
        <li>
          <span className="text-[var(--text-muted)]">Hores: </span>
          <span className="font-medium text-[var(--text-primary)]">{row.hores} h</span>
        </li>
      </ul>
    </div>
  );
}

function truncRutaNom(nom: string, max = 20): string {
  if (nom.length <= max) return nom;
  return nom.slice(0, max) + '…';
}

function velMitjanaKmH(km: number, hores: number): string {
  if (hores <= 0) return '—';
  const v = km / hores;
  return `${v.toFixed(1)} km/h`;
}

export default function Informes() {
  const { rutes } = useRutes();
  const [periode, setPeriode] = useState<Periode>('mensual');

  const dades = useMemo((): FilaPeriode[] => {
    const araRef = new Date();
    const periodes = getPeriodes(periode);
    return periodes
      .map((p) => {
        const r = filtrarRutesPerPeriode(rutes, p.start, p.end, araRef);
        const resum = resumRutes(r);
        let rutaDestacada: Ruta | null = null;
        if (r.length > 0) {
          rutaDestacada = r.reduce((best, x) =>
            (x.distanciaKm ?? 0) > (best.distanciaKm ?? 0) ? x : best
          );
        }
        return {
          label: p.label,
          enCurs: p.enCurs,
          km: Math.round(resum.distancia * 10) / 10,
          desnivell: resum.desnivell,
          sortides: resum.sortides,
          hores: Math.round((resum.durada / 60) * 10) / 10,
          rutaDestacada,
        };
      })
      .reverse();
  }, [rutes, periode]);

  const kpiActual = dades.length >= 2 ? dades[dades.length - 2] : dades.length === 1 ? dades[0] : null;
  const kpiAnterior = dades.length >= 3 ? dades[dades.length - 3] : undefined;

  const indexMillorPeriode = useMemo(() => {
    let best = -1;
    let bestKm = -1;
    dades.forEach((d, i) => {
      if (d.enCurs) return;
      if (d.km > bestKm) {
        bestKm = d.km;
        best = i;
      }
    });
    return best;
  }, [dades]);

  if (rutes.length === 0) {
    return (
      <div>
        <section className="mb-6">
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
            Estadístiques
          </p>
          <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">Informes</h1>
        </section>
        <EmptyState
          titol="Sense dades per analitzar"
          descripcio="Afegeix rutes per veure l’evolució per període."
          accio={{ label: 'Nova ruta', to: '/nova-ruta' }}
        />
      </div>
    );
  }

  return (
    <div>
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">Estadístiques</p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">Informes</h1>
      </section>

      <div className="flex flex-wrap gap-2 mb-6">
        {PERIODES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriode(p.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              periode === p.value
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--superficie-muted)] text-[var(--text-secondary)] border border-[var(--superficie)]/25 hover:bg-[var(--superficie-soft)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {kpiActual && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-[var(--accent)]/25 bg-[linear-gradient(145deg,var(--accent-soft),transparent_65%)] p-4">
            <div className="text-xs text-[var(--text-muted)] mb-1">km</div>
            <div className="text-2xl font-bold text-[var(--accent)] tabular-nums">{kpiActual.km}</div>
            <div className="mt-1 min-h-[1.25rem]">
              <TrendText actual={kpiActual.km} anterior={kpiAnterior?.km} />
            </div>
          </div>
          <div className="rounded-xl border border-[var(--accent2)]/25 bg-[linear-gradient(145deg,var(--accent2-soft),transparent_65%)] p-4">
            <div className="text-xs text-[var(--text-muted)] mb-1">desnivell</div>
            <div className="text-2xl font-bold text-[var(--accent2)] tabular-nums">{kpiActual.desnivell}</div>
            <div className="mt-1 min-h-[1.25rem]">
              <TrendText actual={kpiActual.desnivell} anterior={kpiAnterior?.desnivell} />
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--accent-soft)_35%,var(--superficie-muted))] p-4">
            <div className="text-xs text-[var(--text-muted)] mb-1">sortides</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{kpiActual.sortides}</div>
            <div className="mt-1 min-h-[1.25rem]">
              <TrendText actual={kpiActual.sortides} anterior={kpiAnterior?.sortides} />
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--accent2-soft)_28%,var(--superficie-muted))] p-4">
            <div className="text-xs text-[var(--text-muted)] mb-1">hores</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{kpiActual.hores}</div>
            <div className="mt-1 min-h-[1.25rem]">
              <TrendText actual={kpiActual.hores} anterior={kpiAnterior?.hores} />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="app-card ring-1 ring-[var(--accent)]/10">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Evolució per període</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dades} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tickFormatter={(v) => formatAxisLabel(String(v), periode)}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  fontSize={11}
                />
                <YAxis
                  yAxisId="km"
                  tick={{ fill: 'var(--accent)', fontSize: 11 }}
                  fontSize={11}
                  tickFormatter={(v) => `${v} km`}
                />
                <YAxis
                  yAxisId="desn"
                  orientation="right"
                  tick={{ fill: 'var(--accent2)', fontSize: 11 }}
                  fontSize={11}
                  tickFormatter={(v) => `${v} m`}
                />
                <Tooltip
                  content={(props) => (
                    <InformesTooltipContent active={props.active} payload={props.payload} />
                  )}
                />
                <Bar
                  yAxisId="km"
                  dataKey="km"
                  fill="var(--accent)"
                  fillOpacity={0.55}
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  radius={[4, 4, 0, 0]}
                  name="Km"
                />
                <Line
                  yAxisId="desn"
                  type="monotone"
                  dataKey="desnivell"
                  stroke="var(--accent2)"
                  strokeWidth={2.5}
                  dot={{ fill: 'var(--accent2)', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Desnivell"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[var(--bg-card)] border-b border-[var(--border)]">
                <th className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">Període</th>
                <th className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">Km</th>
                <th className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">Desnivell</th>
                <th className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">Sortides</th>
                <th className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">Hores</th>
                <th className="hidden px-3 py-2 text-xs font-medium text-[var(--text-secondary)] md:table-cell">
                  Vel. mitjana
                </th>
                <th className="hidden px-3 py-2 text-xs font-medium text-[var(--text-secondary)] md:table-cell">
                  Ruta destacada
                </th>
              </tr>
            </thead>
            <tbody>
              {dades.map((d, i) => {
                const esMillor = i === indexMillorPeriode && indexMillorPeriode >= 0;
                const nomDest =
                  d.rutaDestacada != null ? truncRutaNom(d.rutaDestacada.nom) : '—';
                return (
                  <tr key={`${d.label}-${i}`} className="border-b border-[var(--border)] last:border-0">
                    <td
                      className={`px-3 py-2 text-[var(--text-primary)] ${
                        esMillor ? 'border-l-[3px] border-l-[var(--accent)] pl-[9px]' : ''
                      } ${esMillor ? 'font-medium' : ''}`}
                    >
                      <span className="block">{d.label}</span>
                      {d.enCurs && (
                        <span className="mt-0.5 block text-[10px] font-medium text-[var(--accent)]">
                          En curs · fins avui
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-3 py-2 tabular-nums ${
                        esMillor ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {d.km} km
                    </td>
                    <td className="px-3 py-2 text-[var(--text-secondary)] tabular-nums">{d.desnivell} m</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)] tabular-nums">{d.sortides}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)] tabular-nums">{d.hores} h</td>
                    <td className="hidden px-3 py-2 text-[var(--text-secondary)] tabular-nums md:table-cell">
                      {velMitjanaKmH(d.km, d.hores)}
                    </td>
                    <td className="hidden px-3 py-2 text-[var(--text-secondary)] md:table-cell">
                      {nomDest}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
