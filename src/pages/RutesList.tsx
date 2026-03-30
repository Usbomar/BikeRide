import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRutes } from '../store/useRutes';
import { formatKm } from '../utils/format';

function formatDate(s: string) {
  const d = new Date(s);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

export default function RutesList() {
  const { rutes, config, setConfig, deleteRuta } = useRutes();
  const [filtreTipus, setFiltreTipus] = useState<string>('');

  const { rutesList } = config;

  const ordenades = useMemo(() => {
    const list = filtreTipus ? rutes.filter((r) => r.tipus === filtreTipus) : [...rutes];
    const { sortBy, sortDirection } = rutesList;
    const factor = sortDirection === 'asc' ? 1 : -1;

    const getValue = (r: any) => {
      switch (sortBy) {
        case 'data':
          return new Date(r.data).getTime();
        case 'nom':
          return r.nom?.toLowerCase() ?? '';
        case 'tipus':
          return r.tipus ?? '';
        case 'zona':
          return r.zona ?? '';
        case 'distancia':
          return r.distanciaKm ?? 0;
        case 'durada':
          return r.duradaMinuts ?? 0;
        case 'desnivell':
          return r.desnivellMetres ?? 0;
        case 'alcadaMaxima':
          return r.alcadaMaximaMetres ?? 0;
        case 'velocitatMaxima':
          return r.velocitatMaxima ?? 0;
        default:
          return 0;
      }
    };

    return [...list].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb) * factor;
      }
      if (va < vb) return -1 * factor;
      if (va > vb) return 1 * factor;
      return 0;
    });
  }, [rutes, filtreTipus, rutesList]);

  const toggleSort = (column: typeof rutesList.sortBy) => {
    setConfig({
      rutesList: {
        ...rutesList,
        sortBy: column,
        sortDirection:
          rutesList.sortBy === column && rutesList.sortDirection === 'asc' ? 'desc' : 'asc',
      },
    });
  };

  const toggleColumnVisibility = (column: (typeof rutesList.visibleColumns)[number]) => {
    const current = rutesList.visibleColumns;
    const isVisible = current.includes(column);

    // Assegurem que com a mínim data i nom sempre es veuen
    if (isVisible && (column === 'data' || column === 'nom')) return;

    const next = isVisible
      ? current.filter((c) => c !== column)
      : [...current, column];

    setConfig({
      rutesList: {
        ...rutesList,
        visibleColumns: next,
      },
    });
  };

  const isVisible = (column: (typeof rutesList.visibleColumns)[number]) =>
    rutesList.visibleColumns.includes(column);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Rutes</h1>
        <Link
          to="/nova-ruta"
          className="px-4 py-2 rounded-lg font-medium text-white bg-[var(--accent)] hover:opacity-90 transition-opacity no-underline"
        >
          Nova ruta
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm text-[var(--accent2)]">
          Tipus:
          <select
            value={filtreTipus}
            onChange={(e) => setFiltreTipus(e.target.value)}
            className="px-2 py-1 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text-primary)]"
          >
            <option value="">Tots</option>
            <option value="carretera">Carretera</option>
            <option value="mtb">MTB</option>
            <option value="urbà">Urbà</option>
            <option value="gravel">Gravel</option>
            <option value="altre">Altre</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="font-medium">Camps visibles:</span>
          {[
            { id: 'data', label: 'Data' },
            { id: 'nom', label: 'Nom' },
            { id: 'tipus', label: 'Tipus' },
            { id: 'zona', label: 'Comarca' },
            { id: 'distancia', label: 'Km' },
            { id: 'durada', label: 'Temps' },
            { id: 'desnivell', label: 'Desnivell' },
            { id: 'alcadaMaxima', label: 'Alçada màx.' },
            { id: 'velocitatMaxima', label: 'Velocitat màx.' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleColumnVisibility(c.id as any)}
              className={`px-2 py-1 rounded-full border text-xs font-medium transition-colors ${
                isVisible(c.id as any)
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'border-[var(--superficie)]/30 text-[var(--text-muted)] bg-[var(--superficie-muted)] hover:bg-[var(--superficie-soft)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {ordenades.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-6">Encara no hi ha rutes. Afegeix la primera des de «Nova ruta».</p>
      ) : (
        <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--superficie-muted)]">
                  {isVisible('data') && (
                    <th
                      className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                      onClick={() => toggleSort('data')}
                    >
                      Data
                    </th>
                  )}
                  {isVisible('nom') && (
                    <th
                      className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                      onClick={() => toggleSort('nom')}
                    >
                      Nom
                    </th>
                  )}
                  {isVisible('tipus') && (
                    <th
                      className="px-3 py-2 text-xs font-medium text-[var(--accent2)] cursor-pointer select-none"
                      onClick={() => toggleSort('tipus')}
                    >
                      Tipus
                    </th>
                  )}
                  {isVisible('zona') && (
                    <th
                      className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                      onClick={() => toggleSort('zona')}
                    >
                      Comarca
                    </th>
                  )}
                  {isVisible('distancia') && (
                    <th
                      className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                      onClick={() => toggleSort('distancia')}
                    >
                      Km
                    </th>
                  )}
                  {isVisible('durada') && (
                    <th
                      className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                      onClick={() => toggleSort('durada')}
                    >
                      Temps
                    </th>
                  )}
                  {isVisible('desnivell') && (
                    <th
                      className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                      onClick={() => toggleSort('desnivell')}
                    >
                      Desnivell
                    </th>
                  )}
                  {isVisible('alcadaMaxima') && (
                    <th
                      className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                      onClick={() => toggleSort('alcadaMaxima')}
                    >
                      Alçada màx.
                    </th>
                  )}
                  {isVisible('velocitatMaxima') && (
                    <th
                      className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                      onClick={() => toggleSort('velocitatMaxima')}
                    >
                      Velocitat màx.
                    </th>
                  )}
                  <th className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)] w-20"></th>
                </tr>
              </thead>
              <tbody>
                {ordenades.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]/30">
                    {isVisible('data') && (
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{formatDate(r.data)}</td>
                    )}
                    {isVisible('nom') && (
                      <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{r.nom}</td>
                    )}
                    {isVisible('tipus') && (
                      <td className="px-3 py-2 text-[var(--text-muted)]">{r.tipus ?? '—'}</td>
                    )}
                    {isVisible('zona') && (
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{r.zona ?? '—'}</td>
                    )}
                    {isVisible('distancia') && (
                      <td className="px-3 py-2 text-[var(--text-primary)]">
                        {r.distanciaKm != null ? formatKm(r.distanciaKm) : '—'}
                      </td>
                    )}
                    {isVisible('durada') && (
                      <td className="px-3 py-2 text-[var(--text-secondary)]">
                        {r.duradaMinuts != null
                          ? `${Math.floor(r.duradaMinuts / 60)}h ${r.duradaMinuts % 60}min`
                          : '—'}
                      </td>
                    )}
                    {isVisible('desnivell') && (
                      <td className="px-3 py-2 text-[var(--text-secondary)]">
                        {r.desnivellMetres != null ? `${r.desnivellMetres} m` : '—'}
                      </td>
                    )}
                    {isVisible('alcadaMaxima') && (
                      <td className="px-3 py-2 text-[var(--text-secondary)]">
                        {r.alcadaMaximaMetres != null ? `${r.alcadaMaximaMetres} m` : '—'}
                      </td>
                    )}
                    {isVisible('velocitatMaxima') && (
                      <td className="px-3 py-2 text-[var(--text-secondary)]">
                        {r.velocitatMaxima != null ? `${r.velocitatMaxima.toFixed(1)} km/h` : '—'}
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/rutes/${r.id}/editar`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
                          title="Editar ruta"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Vols eliminar la ruta "${r.nom}"?`)) {
                              deleteRuta(r.id);
                            }
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Eliminar ruta"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                        <Link
                          to={`/rutes/${r.id}`}
                          className="text-sm text-[var(--accent)] hover:underline"
                        >
                          Detall
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
