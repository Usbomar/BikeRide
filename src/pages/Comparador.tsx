import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useRutes } from '../store/useRutes';
import type { Ruta } from '../types/ruta';

const COLORS_RUTA = ['#1D9E75', '#BA7517', '#378ADD'];

function ressaltarValors<K extends keyof Ruta>(
  rutes: Ruta[],
  key: K
): ('neutral' | 'max' | 'min')[] {
  const valors = rutes.map((r) => r[key] as number | undefined);
  const nums = valors.filter((v): v is number => v != null && v > 0);
  if (nums.length < 2) return valors.map(() => 'neutral');
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  return valors.map((v) =>
    v == null || v === 0 ? 'neutral' : v === max ? 'max' : v === min ? 'min' : 'neutral'
  );
}

function formatDurada(minuts: number | undefined): string {
  if (minuts == null || minuts <= 0) return '—';
  const h = Math.floor(minuts / 60);
  const m = Math.round(minuts % 60);
  return `${h}h ${m}min`;
}

function truncNom(nom: string, max: number): string {
  if (nom.length <= max) return nom;
  return nom.slice(0, max) + '…';
}

export default function Comparador() {
  const { rutes } = useRutes();
  const [seleccionades, setSeleccionades] = useState<string[]>([]);
  const [cerca, setCerca] = useState('');

  const rutesSeleccionades = useMemo(
    () =>
      seleccionades
        .map((id) => rutes.find((r) => r.id === id))
        .filter(Boolean) as Ruta[],
    [seleccionades, rutes]
  );

  const rutesFiltre = useMemo(
    () =>
      rutes
        .filter(
          (r) => r.nom.toLowerCase().includes(cerca.toLowerCase()) && !seleccionades.includes(r.id)
        )
        .slice(0, 8),
    [rutes, cerca, seleccionades]
  );

  function toggleRuta(id: string) {
    setSeleccionades((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  const hiHaComparativa = rutesSeleccionades.length >= 2;

  const highlightKm = useMemo(
    () => ressaltarValors(rutesSeleccionades, 'distanciaKm'),
    [rutesSeleccionades]
  );
  const highlightDesn = useMemo(
    () => ressaltarValors(rutesSeleccionades, 'desnivellMetres'),
    [rutesSeleccionades]
  );
  const highlightDurada = useMemo(
    () => ressaltarValors(rutesSeleccionades, 'duradaMinuts'),
    [rutesSeleccionades]
  );
  const highlightVel = useMemo(
    () => ressaltarValors(rutesSeleccionades, 'velocitatMaxima'),
    [rutesSeleccionades]
  );
  const highlightAlc = useMemo(
    () => ressaltarValors(rutesSeleccionades, 'alcadaMaximaMetres'),
    [rutesSeleccionades]
  );
  const highlightDif = useMemo(
    () => ressaltarValors(rutesSeleccionades, 'dificultat'),
    [rutesSeleccionades]
  );

  const dadesKm = useMemo(
    () =>
      rutesSeleccionades.map((r, i) => ({
        nom: r.nom.length > 12 ? r.nom.slice(0, 12) + '…' : r.nom,
        valor: r.distanciaKm ?? 0,
        color: COLORS_RUTA[i],
      })),
    [rutesSeleccionades]
  );

  const dadesDesn = useMemo(
    () =>
      rutesSeleccionades.map((r, i) => ({
        nom: r.nom.length > 12 ? r.nom.slice(0, 12) + '…' : r.nom,
        valor: r.desnivellMetres ?? 0,
        color: COLORS_RUTA[i],
      })),
    [rutesSeleccionades]
  );

  const dadesRadar = useMemo(() => {
    if (rutesSeleccionades.length < 2) return [];
    const rows: Array<{ metric: string; r0: number; r1: number; r2: number }> = [];

    const addRow = (label: string, get: (r: Ruta) => number | undefined) => {
      const raw = rutesSeleccionades.map((r) => get(r) ?? 0);
      const max = Math.max(...raw, 1e-9);
      const pct = raw.map((v) => Math.round((v / max) * 100));
      rows.push({
        metric: label,
        r0: pct[0] ?? 0,
        r1: pct[1] ?? 0,
        r2: pct[2] ?? 0,
      });
    };

    addRow('Km', (r) => r.distanciaKm ?? 0);
    addRow('Desnivell', (r) => r.desnivellMetres ?? 0);
    addRow('Durada', (r) => r.duradaMinuts ?? 0);
    addRow('Velocitat', (r) => r.velocitatMaxima ?? 0);
    addRow('Alçada', (r) => r.alcadaMaximaMetres ?? 0);

    return rows;
  }, [rutesSeleccionades]);

  function cellClass(h: 'neutral' | 'max' | 'min') {
    if (h === 'max') return 'bg-[rgba(29,158,117,0.12)] font-bold text-[#1D9E75]';
    if (h === 'min') return 'bg-[rgba(226,75,74,0.08)] font-bold text-[#E24B4A]';
    return 'text-[var(--text-secondary)]';
  }

  const maxSeleccio = seleccionades.length >= 3;

  return (
    <div>
      <p className="mb-0.5 text-xs font-medium uppercase tracking-wider text-[var(--accent)]">Anàlisi</p>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
        Comparador de rutes
      </h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        Compara fins a 3 rutes per km, desnivell i perfil.
      </p>

      <div className="mb-8 space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Seleccionades</p>
          {seleccionades.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Selecciona fins a 3 rutes per comparar.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {rutesSeleccionades.map((r, i) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-white"
                  style={{ backgroundColor: COLORS_RUTA[i] }}
                >
                  {truncNom(r.nom, 24)}
                  <button
                    type="button"
                    onClick={() => toggleRuta(r.id)}
                    className="rounded-full px-1 leading-none hover:opacity-80"
                    aria-label="Eliminar"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <input
            type="search"
            value={cerca}
            onChange={(e) => setCerca(e.target.value)}
            placeholder="Cerca una ruta..."
            className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <ul className="mt-2 max-w-md divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
            {rutesFiltre.map((r) => {
              const disabled = maxSeleccio;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && toggleRuta(r.id)}
                    className={`w-full px-3 py-2.5 text-left transition-colors ${
                      disabled
                        ? 'cursor-not-allowed opacity-40'
                        : 'hover:bg-[var(--superficie-muted)]'
                    }`}
                  >
                    <span className="block text-sm font-medium text-[var(--text-primary)]">{r.nom}</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {r.data} · {r.distanciaKm != null ? `${r.distanciaKm} km` : '—'} · {r.tipus ?? '—'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {seleccionades.length === 0 && (
        <div className="app-card mx-auto max-w-lg p-8 text-center text-sm text-[var(--text-secondary)]">
          Selecciona almenys 2 rutes per veure la comparativa. Pots triar fins a 3.
        </div>
      )}

      {seleccionades.length === 1 && (
        <div className="app-card mx-auto max-w-lg p-8 text-center text-sm text-[var(--text-secondary)]">
          Afegeix una ruta més per activar la comparativa.
        </div>
      )}

      {hiHaComparativa && (
        <div className="space-y-8">
          <section className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-card)]">
                  <th className="px-3 py-2 text-xs font-medium text-[var(--text-muted)]">Mètrica</th>
                  {rutesSeleccionades.map((r, i) => (
                    <th key={r.id} className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: COLORS_RUTA[i] }}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-[var(--text-primary)]">
                            {truncNom(r.nom, 16)}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">{r.data}</div>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]">
                  <td className="px-3 py-2 text-[var(--text-muted)]">Distància (km)</td>
                  {rutesSeleccionades.map((r, i) => (
                    <td key={r.id} className={`px-3 py-2 tabular-nums ${cellClass(highlightKm[i])}`}>
                      {r.distanciaKm != null && r.distanciaKm > 0 ? r.distanciaKm : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="px-3 py-2 text-[var(--text-muted)]">Desnivell (m)</td>
                  {rutesSeleccionades.map((r, i) => (
                    <td key={r.id} className={`px-3 py-2 tabular-nums ${cellClass(highlightDesn[i])}`}>
                      {r.desnivellMetres != null && r.desnivellMetres > 0 ? r.desnivellMetres : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="px-3 py-2 text-[var(--text-muted)]">Durada</td>
                  {rutesSeleccionades.map((r, i) => (
                    <td key={r.id} className={`px-3 py-2 ${cellClass(highlightDurada[i])}`}>
                      {formatDurada(r.duradaMinuts)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="px-3 py-2 text-[var(--text-muted)]">Velocitat màxima (km/h)</td>
                  {rutesSeleccionades.map((r, i) => (
                    <td key={r.id} className={`px-3 py-2 tabular-nums ${cellClass(highlightVel[i])}`}>
                      {r.velocitatMaxima != null && r.velocitatMaxima > 0 ? r.velocitatMaxima : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="px-3 py-2 text-[var(--text-muted)]">Alçada màxima (m)</td>
                  {rutesSeleccionades.map((r, i) => (
                    <td key={r.id} className={`px-3 py-2 tabular-nums ${cellClass(highlightAlc[i])}`}>
                      {r.alcadaMaximaMetres != null && r.alcadaMaximaMetres > 0 ? r.alcadaMaximaMetres : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="px-3 py-2 text-[var(--text-muted)]">Dificultat (1-5)</td>
                  {rutesSeleccionades.map((r, i) => (
                    <td key={r.id} className={`px-3 py-2 tabular-nums ${cellClass(highlightDif[i])}`}>
                      {r.dificultat != null && r.dificultat > 0 ? r.dificultat : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 text-[var(--text-muted)]">Comarca</td>
                  {rutesSeleccionades.map((r) => (
                    <td key={r.id} className="px-3 py-2 text-[var(--text-secondary)]">
                      {r.zona?.trim() || '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Comparativa visual</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="app-card">
                <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Km</p>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dadesKm} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="nom" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v: number) => [`${v} km`, 'Distància']}
                        contentStyle={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                        {dadesKm.map((_, i) => (
                          <Cell key={i} fill={COLORS_RUTA[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="app-card">
                <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Desnivell</p>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dadesDesn} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="nom" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v: number) => [`${v} m`, 'Desnivell']}
                        contentStyle={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                        {dadesDesn.map((_, i) => (
                          <Cell key={i} fill={COLORS_RUTA[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Perfil de ruta</h2>
            <div className="app-card">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={dadesRadar} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    {rutesSeleccionades.map((_, i) => (
                      <Radar
                        key={i}
                        name={`r${i}`}
                        dataKey={`r${i}`}
                        stroke={COLORS_RUTA[i]}
                        fill={COLORS_RUTA[i]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
                {rutesSeleccionades.map((r, i) => (
                  <span key={r.id} className="inline-flex items-center gap-1">
                    <span
                      className="mr-1 inline-block h-3 w-3 shrink-0 rounded-sm"
                      style={{ background: COLORS_RUTA[i] }}
                    />
                    {r.nom.length > 20 ? r.nom.slice(0, 20) + '…' : r.nom}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
