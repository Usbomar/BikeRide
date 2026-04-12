import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, Polyline } from 'react-leaflet';
import { useRutes } from '../store/useRutes';
import type { Ruta, TipusRuta } from '../types/ruta';
import { COMARCA_COORDS } from '../data/comarques-coords';
import { EmptyState } from '../components/EmptyState';

/**
 * Sortida habitual de les rutes: carrer Calassanç Duran, Sabadell [lat, lng].
 * Els destins es modelen com el centre de la comarca del camp `zona` (vegeu COMARCA_COORDS).
 */
const PUNT_SORTIDA_SABADELL: [number, number] = [41.5435, 2.1092];

type FiltreTipus = 'tots' | 'mtb' | 'carretera' | 'gravel';

const FILTRES: { id: FiltreTipus; label: string }[] = [
  { id: 'tots', label: 'Tots' },
  { id: 'mtb', label: 'MTB' },
  { id: 'carretera', label: 'Carretera' },
  { id: 'gravel', label: 'Gravel' },
];

function offsetCoord(base: [number, number], index: number, total: number): [number, number] {
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI;
  const r = total > 1 ? 0.018 : 0;
  return [base[0] + r * Math.sin(angle), base[1] + r * Math.cos(angle)];
}

function colorPerTipus(tipus: TipusRuta | undefined): string {
  if (tipus === 'carretera') return '#378ADD';
  if (tipus === 'mtb') return 'var(--accent)';
  if (tipus === 'gravel') return 'var(--accent2)';
  return '#888780';
}

export default function Mapa() {
  const { rutes } = useRutes();
  const [filtreTipus, setFiltreTipus] = useState<FiltreTipus>('tots');
  const leafletDisponible = typeof window !== 'undefined';

  const statsPerComarca = useMemo(() => {
    const map = new Map<string, { count: number; km: number; desnivell: number; rutes: Ruta[] }>();
    for (const r of rutes) {
      const zona = r.zona?.trim();
      if (!zona || !COMARCA_COORDS[zona]) continue;
      const prev = map.get(zona) ?? { count: 0, km: 0, desnivell: 0, rutes: [] as Ruta[] };
      map.set(zona, {
        count: prev.count + 1,
        km: prev.km + (r.distanciaKm ?? 0),
        desnivell: prev.desnivell + (r.desnivellMetres ?? 0),
        rutes: [...prev.rutes, r],
      });
    }
    return map;
  }, [rutes]);

  const maxCount = Math.max(
    ...Array.from(statsPerComarca.values()).map((s) => s.count),
    1
  );

  const rutesPerMarcadors = useMemo(() => {
    const ambZona = rutes.filter((r) => {
      const z = r.zona?.trim();
      return z != null && COMARCA_COORDS[z] != null;
    });
    if (filtreTipus === 'tots') return ambZona;
    return ambZona.filter((r) => r.tipus === filtreTipus);
  }, [rutes, filtreTipus]);

  const rutesPerComarcaIndex = useMemo(() => {
    const byZona = new Map<string, Ruta[]>();
    for (const r of rutesPerMarcadors) {
      const z = r.zona!.trim();
      const arr = byZona.get(z) ?? [];
      arr.push(r);
      byZona.set(z, arr);
    }
    return byZona;
  }, [rutesPerMarcadors]);

  const comarquesExplorades = statsPerComarca.size;

  const zonasUniques = useMemo(() => {
    const set = new Set<string>();
    for (const r of rutesPerMarcadors) {
      const z = r.zona?.trim();
      if (z && COMARCA_COORDS[z]) set.add(z);
    }
    return [...set].sort();
  }, [rutesPerMarcadors]);

  const clauZonas = useMemo(() => zonasUniques.join('|'), [zonasUniques]);

  const [tracBiciPerComarca, setTracBiciPerComarca] = useState<Record<string, [number, number][] | null>>({});

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    const [lat0, lng0] = PUNT_SORTIDA_SABADELL;

    function extreureCoordenadesGeoJSON(data: {
      routes?: { geometry?: { type?: string; coordinates?: [number, number][] } }[];
    }): [number, number][] | null {
      const coords = data.routes?.[0]?.geometry?.coordinates;
      if (!coords?.length) return null;
      return coords.map((c) => [c[1], c[0]] as [number, number]);
    }

    async function fetchRutaBici(comarca: string) {
      const dest = COMARCA_COORDS[comarca];
      if (!dest) return;
      const [lat1, lng1] = dest;
      const base = `https://router.project-osrm.org/route/v1`;
      const urls = [
        `${base}/cycling/${lng0},${lat0};${lng1},${lat1}?overview=full&geometries=geojson`,
        `${base}/foot/${lng0},${lat0};${lng1},${lat1}?overview=full&geometries=geojson`,
      ];
      for (const url of urls) {
        try {
          const res = await fetch(url, { signal: ac.signal });
          if (!res.ok) continue;
          const data = (await res.json()) as Parameters<typeof extreureCoordenadesGeoJSON>[0];
          const leaflet = extreureCoordenadesGeoJSON(data);
          if (leaflet?.length) {
            if (!cancelled) {
              setTracBiciPerComarca((prev) => ({ ...prev, [comarca]: leaflet }));
            }
            return;
          }
        } catch {
          /* següent perfil o recta */
        }
      }
      const recta: [number, number][] = [
        [lat0, lng0],
        [lat1, lng1],
      ];
      if (!cancelled) {
        setTracBiciPerComarca((prev) => ({ ...prev, [comarca]: recta }));
      }
    }

    setTracBiciPerComarca({});
    (async () => {
      for (const com of zonasUniques) {
        if (cancelled) break;
        await fetchRutaBici(com);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [clauZonas]);

  return (
    <div>
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
          Activitat geogràfica
        </p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
          Mapa de rutes
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {rutes.length} rutes registrades · {comarquesExplorades} comarques explorades
        </p>
      </section>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTRES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltreTipus(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtreTipus === f.id
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--superficie-muted)] text-[var(--text-secondary)] border border-[var(--superficie)]/25 hover:bg-[var(--superficie-soft)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        className="w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
        style={{ height: 520 }}
      >
        {rutes.length === 0 ? (
          <div className="flex h-full min-h-[520px] items-center justify-center px-4">
            <EmptyState
              compact
              titol="Encara no hi ha rutes al mapa"
              descripcio="Afegeix rutes amb comarca de destí per veure-les al mapa."
              accio={{ label: 'Nova ruta', to: '/nova-ruta' }}
            />
          </div>
        ) : !leafletDisponible ? (
          <div className="flex h-full min-h-[520px] items-center justify-center">
            <p className="text-sm text-[var(--text-muted)]">Carregant mapa…</p>
          </div>
        ) : (
          <MapContainer
            center={[41.6, 2.0]}
            zoom={10}
            className="h-[520px] w-full z-0"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <CircleMarker
              center={PUNT_SORTIDA_SABADELL}
              radius={9}
              pathOptions={{
                fillColor: 'var(--accent2)',
                fillOpacity: 0.95,
                color: '#fff',
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <span className="text-xs font-medium">Sortida: Calassanç Duran, Sabadell</span>
              </Tooltip>
            </CircleMarker>
            {zonasUniques.map((comarca) => {
              const positions = tracBiciPerComarca[comarca];
              if (!positions || positions.length < 2) return null;
              return (
                <Polyline
                  key={`trace-${comarca}`}
                  positions={positions}
                  pathOptions={{
                    color: colorPerTipus(
                      rutesPerMarcadors.find((r) => r.zona?.trim() === comarca)?.tipus
                    ),
                    weight: 3,
                    opacity: 0.72,
                    lineJoin: 'round',
                  }}
                />
              );
            })}
            {Array.from(statsPerComarca.entries()).map(([comarca, stats]) => {
              const coords = COMARCA_COORDS[comarca];
              if (!coords) return null;
              const ratio = stats.count / maxCount;
              return (
                <CircleMarker
                  key={`comarca-${comarca}`}
                  center={coords}
                  radius={28 + stats.count * 4}
                  pathOptions={{
                    fillColor: `rgba(29, 158, 117, ${ratio * 0.6 + 0.15})`,
                    fillOpacity: 1,
                    color: 'var(--accent-hover)',
                    weight: 1.5,
                    opacity: ratio * 0.8 + 0.2,
                  }}
                >
                  <Tooltip sticky>
                    <div className="text-xs">
                      <strong>{comarca}</strong>
                      <br />
                      {stats.count} rutes · {stats.km.toFixed(1)} km · {stats.desnivell} m desnivell
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
            {rutesPerMarcadors.map((ruta) => {
              const zona = ruta.zona!.trim();
              const base = COMARCA_COORDS[zona]!;
              const grup = rutesPerComarcaIndex.get(zona) ?? [];
              const idx = grup.findIndex((x) => x.id === ruta.id);
              const pos = offsetCoord(base, Math.max(idx, 0), grup.length);
              return (
                <CircleMarker
                  key={ruta.id}
                  center={pos}
                  radius={7}
                  pathOptions={{
                    fillColor: colorPerTipus(ruta.tipus),
                    fillOpacity: 0.9,
                    color: '#fff',
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px] text-sm">
                      <Link
                        to={`/rutes/${ruta.id}`}
                        className="mb-1 block font-medium text-[var(--accent)] no-underline hover:underline"
                      >
                        {ruta.nom}
                      </Link>
                      <p className="mb-2 text-xs text-[var(--text-muted)]">
                        {new Date(ruta.data).toLocaleDateString('ca-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="mb-3 text-xs text-[var(--text-secondary)]">
                        {ruta.distanciaKm != null ? `${ruta.distanciaKm.toFixed(1)} km` : '— km'} ·{' '}
                        {ruta.desnivellMetres != null ? `${ruta.desnivellMetres} m` : '— m'} ·{' '}
                        {ruta.tipus ?? '—'}
                      </p>
                      <button
                        type="button"
                        className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
                        onClick={() => {
                          window.location.assign(`/rutes/${ruta.id}`);
                        }}
                      >
                        Veure detall
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: 'var(--accent)' }} />
          MTB
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: '#378ADD' }} />
          Carretera
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: 'var(--accent2)' }} />
          Gravel
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: '#888780' }} />
          Altre
        </span>
        <span className="hidden text-[var(--text-muted)] sm:inline" aria-hidden>
          |
        </span>
        <span className="inline-flex w-full items-center gap-2 sm:w-auto">
          <span className="text-[var(--text-muted)]">Menys activitat</span>
          <span
            className="h-3 min-w-[120px] flex-1 rounded-full sm:flex-initial"
            style={{
              background: 'linear-gradient(to right, rgba(29, 158, 117, 0.15), rgba(29, 158, 117, 0.85))',
            }}
          />
          <span className="text-[var(--text-muted)]">Més activitat</span>
        </span>
      </div>
    </div>
  );
}
