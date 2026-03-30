import { useState } from 'react';
import { useRutes } from '../store/useRutes';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getPeriodes, filtrarRutesPerPeriode, resumRutes, type Periode } from '../utils/informes';

const PERIODES: { value: Periode; label: string }[] = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

export default function Informes() {
  const { rutes } = useRutes();
  const [periode, setPeriode] = useState<Periode>('mensual');

  const araRef = new Date();
  const periodes = getPeriodes(periode);
  const dades = periodes.map((p) => {
    const r = filtrarRutesPerPeriode(rutes, p.start, p.end, araRef);
    const resum = resumRutes(r);
    return {
      label: p.label,
      enCurs: p.enCurs,
      km: Math.round(resum.distancia * 10) / 10,
      desnivell: resum.desnivell,
      sortides: resum.sortides,
      hores: Math.round((resum.durada / 60) * 10) / 10,
    };
  }).reverse();

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">Informes</h1>
      <p className="text-xs text-[var(--accent2)] mb-1">Distància i desnivell per període.</p>
      <p className="text-[10px] text-[var(--text-muted)] mb-4 max-w-xl">
        Els períodes en curs (etiqueta «En curs») només inclouen l’activitat registrada fins avui; la resta són totals del període ja tancat.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
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

      <div className="space-y-5">
        <div className="app-card">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Distància per període</h2>
          <p className="text-xs text-[var(--accent2)] mb-2">Km per període.</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dades} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                  formatter={(value: number) => [value, 'Km']}
                  labelFormatter={(label) => {
                    const row = dades.find((d) => d.label === label);
                    return row?.enCurs ? `${label} · fins avui` : label;
                  }}
                />
                <Bar dataKey="km" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Km" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="app-card">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Desnivell per període</h2>
          <p className="text-xs text-[var(--accent2)] mb-2">Metres acumulats per període.</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dades} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                  formatter={(value: number) => [value, 'm']}
                  labelFormatter={(label) => {
                    const row = dades.find((d) => d.label === label);
                    return row?.enCurs ? `${label} · fins avui` : label;
                  }}
                />
                <Bar dataKey="desnivell" fill="var(--superficie)" radius={[4, 4, 0, 0]} name="Desnivell (m)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[var(--bg-card)] border-b border-[var(--border)]">
                <th className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">Període / estat</th>
                <th className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">Km</th>
                <th className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">Desnivell</th>
                <th className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">Sortides</th>
                <th className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">Hores</th>
              </tr>
            </thead>
            <tbody>
              {dades.map((d) => (
                <tr key={d.label} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2 text-[var(--text-primary)]">
                    <span className="block">{d.label}</span>
                    {d.enCurs && (
                      <span className="mt-0.5 inline-block rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                        En curs · fins avui
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[var(--accent)] font-medium">{d.km} km</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{d.desnivell} m</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{d.sortides}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{d.hores} h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
