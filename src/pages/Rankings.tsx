import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRutes } from '../store/useRutes';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { Ruta } from '../types/ruta';
import { estadistiquesGlobals, distribucioPerComarca, totalHores } from '../utils/estadistiques';
import { filtrarRutesAquestMesFinsAvui, resumRutes } from '../utils/informes';
import { formatKm } from '../utils/format';
import { EmptyState } from '../components/EmptyState';

const COLORS = ['var(--accent)', 'var(--accent2)', 'var(--superficie)', '#059669', '#0f766e', '#64748b'];

const PODIUM_HEIGHTS: Record<1 | 2 | 3, string> = {
  1: 'min-h-[180px]',
  2: 'min-h-[120px]',
  3: 'min-h-[100px]',
};

function CrownIcon() {
  return (
    <svg
      className="mb-1 shrink-0 text-white"
      width="48"
      height="28"
      viewBox="0 0 48 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 22 L12 6 L18 12 L24 4 L30 12 L36 6 L44 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function PodiumItem({
  ruta,
  value,
  format,
  position,
}: {
  ruta: Ruta;
  value: number;
  format: (n: number) => string;
  position: 1 | 2 | 3;
}) {
  const labels = { 1: '1r', 2: '2n', 3: '3r' } as const;
  const h = PODIUM_HEIGHTS[position];

  if (position === 1) {
    return (
      <div className="flex flex-1 flex-col items-center justify-end min-w-0 max-w-[220px]">
        <CrownIcon />
        <div
          className={`flex w-full flex-col items-center justify-end rounded-t-2xl bg-[var(--accent)] px-4 pb-5 pt-3 text-center text-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.35)] ${h}`}
        >
          <span className="text-4xl font-bold leading-none">{labels[1]}</span>
          <Link
            to={`/rutes/${ruta.id}`}
            className="mt-2 w-full truncate text-lg font-bold text-white no-underline hover:underline"
          >
            {ruta.nom}
          </Link>
          <span className="mt-2 text-3xl font-black tabular-nums">{format(value)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-end min-w-0 max-w-[160px]">
      <div
        className={`flex w-full flex-col items-center justify-end rounded-t-xl bg-[var(--accent-soft)] px-3 pb-4 pt-3 text-center ${h}`}
      >
        <span className="text-2xl font-bold text-[var(--accent)]">{labels[position]}</span>
        <Link
          to={`/rutes/${ruta.id}`}
          className="mt-1.5 w-full truncate text-sm font-medium text-[var(--accent)] no-underline hover:underline"
        >
          {ruta.nom}
        </Link>
        <span className="mt-2 text-xl font-bold tabular-nums text-[var(--accent)]">{format(value)}</span>
      </div>
    </div>
  );
}

function IconLightning() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[var(--accent)]">
      <path
        d="M13 2L4 14h7l-1 8 10-12h-6l3-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function IconMountain() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[var(--accent)]">
      <path
        d="M3 20 L10 8 L14 14 L18 6 L21 20 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function Rankings() {
  const { rutes, config } = useRutes();
  const stats = useMemo(() => estadistiquesGlobals(rutes), [rutes]);
  const perComarca = useMemo(() => distribucioPerComarca(rutes), [rutes]);
  const resumMesActual = useMemo(() => {
    const ara = new Date();
    const list = filtrarRutesAquestMesFinsAvui(rutes, ara);
    return resumRutes(list);
  }, [rutes]);
  const horesMesActual = useMemo(() => {
    const ara = new Date();
    return totalHores(filtrarRutesAquestMesFinsAvui(rutes, ara));
  }, [rutes]);

  const perDistancia = useMemo(
    () =>
      [...rutes]
        .filter((r) => r.distanciaKm != null && r.distanciaKm > 0)
        .sort((a, b) => (b.distanciaKm ?? 0) - (a.distanciaKm ?? 0))
        .slice(0, 10),
    [rutes]
  );
  const perDesnivell = useMemo(
    () =>
      [...rutes]
        .filter((r) => r.desnivellMetres != null && r.desnivellMetres > 0)
        .sort((a, b) => (b.desnivellMetres ?? 0) - (a.desnivellMetres ?? 0))
        .slice(0, 10),
    [rutes]
  );
  const perDurada = useMemo(
    () =>
      [...rutes]
        .filter((r) => r.duradaMinuts != null && r.duradaMinuts > 0)
        .sort((a, b) => (b.duradaMinuts ?? 0) - (a.duradaMinuts ?? 0))
        .slice(0, 10),
    [rutes]
  );
  const perVelocitatMax = useMemo(
    () =>
      [...rutes]
        .filter((r) => r.velocitatMaxima != null && r.velocitatMaxima > 0)
        .sort((a, b) => (b.velocitatMaxima ?? 0) - (a.velocitatMaxima ?? 0))
        .slice(0, 10),
    [rutes]
  );
  const perAlcada = useMemo(
    () =>
      [...rutes]
        .filter((r) => r.alcadaMaximaMetres != null && r.alcadaMaximaMetres > 0)
        .sort((a, b) => (b.alcadaMaximaMetres ?? 0) - (a.alcadaMaximaMetres ?? 0))
        .slice(0, 10),
    [rutes]
  );

  const maxKm = perDistancia[0]?.distanciaKm ?? 1;
  const maxDesnivell = perDesnivell[0]?.desnivellMetres ?? 1;
  const maxDurada = perDurada[0]?.duradaMinuts ?? 1;

  const Block = ({
    title,
    items,
    format,
    valueKey,
    maxVal,
  }: {
    title: string;
    items: Ruta[];
    format: (r: Ruta) => string;
    valueKey: 'distanciaKm' | 'desnivellMetres' | 'duradaMinuts' | 'velocitatMaxima' | 'alcadaMaximaMetres';
    maxVal: number;
  }) => (
    <div className="app-card">
      <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
      {items.length === 0 ? (
        <EmptyState compact titol="Sense dades" />
      ) : (
        <ol className="space-y-3 list-none m-0 p-0">
          {items.flatMap((r, i) => {
            const val = r[valueKey] as number | undefined;
            const num = typeof val === 'number' ? val : 0;
            const pct = i === 0 ? 100 : maxVal > 0 ? (num / maxVal) * 100 : 0;
            const pos = i + 1;
            const rankClass =
              pos === 1
                ? 'text-2xl font-black text-[var(--accent)] tabular-nums w-9 shrink-0 text-right'
                : pos <= 3
                  ? 'text-lg font-bold text-[var(--accent)]/70 tabular-nums w-9 shrink-0 text-right'
                  : 'text-sm text-[var(--text-muted)] tabular-nums w-9 shrink-0 text-right';

            const row = (
              <li key={r.id} className="flex items-center gap-3">
                <span className={rankClass}>{pos}</span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/rutes/${r.id}`}
                    className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] no-underline truncate block"
                  >
                    {r.nom}
                  </Link>
                  <div className="mt-1.5 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold text-[var(--accent)] shrink-0 tabular-nums">{format(r)}</span>
              </li>
            );

            if (i === 2 && items.length > 3) {
              return [
                row,
                <li key="__altres__" className="flex items-center gap-2 list-none py-1" aria-hidden>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Altres</span>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                </li>,
              ];
            }
            return [row];
          })}
        </ol>
      )}
    </div>
  );

  const pieDataComarca = perComarca.map((c) => ({
    name: c.comarca,
    value: c.vegades,
    km: c.km,
    desnivell: c.desnivell,
  }));

  const blocsOrdenats = config.rankingsLayout.blocs
    .slice()
    .sort((a, b) => a.ordre - b.ordre)
    .filter((b) => b.visible);

  const renderBloc = (id: typeof config.rankingsLayout.blocs[number]['id']) => {
    if (id === 'resum') {
      return (
        <section key="resum">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Resum global</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="app-card border-l-4 border-l-[var(--accent)]">
              <div className="text-xl font-bold text-[var(--accent)] tabular-nums">
                {stats.distancia.toFixed(1)}
              </div>
              <div className="text-xs text-[var(--text-muted)]">km</div>
            </div>
            <div className="app-card border-l-4 border-l-[var(--accent2)]">
              <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                {stats.sortides}
              </div>
              <div className="text-xs text-[var(--accent2)]">sortides</div>
            </div>
            <div className="app-card border-l-4 border-l-[var(--accent)]">
              <div className="text-xl font-bold text-[var(--accent)] tabular-nums">
                {stats.hores}
              </div>
              <div className="text-xs text-[var(--text-muted)]">hores</div>
            </div>
            <div className="app-card border-l-4 border-l-[var(--accent2)]">
              <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                {stats.mitjanaKmPerSortida}
              </div>
              <div className="text-xs text-[var(--accent2)]">km/sortida</div>
            </div>
            <div className="app-card border-l-4 border-l-[var(--accent)]">
              <div className="text-xl font-bold text-[var(--accent)] tabular-nums">
                {stats.desnivell.toLocaleString('ca-ES')}
              </div>
              <div className="text-xs text-[var(--text-muted)]">m desn.</div>
            </div>
            <div className="app-card border-l-4 border-l-[var(--accent2)]">
              <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                {stats.mitjanaDesnivellPerSortida}
              </div>
              <div className="text-xs text-[var(--accent2)]">m desn./sortida</div>
            </div>
          </div>
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] mt-4 mb-2">
            Mes en curs (fins avui)
          </h3>
          <p className="text-[10px] text-[var(--text-muted)] mb-2">
            Mateix criteri que als informes: només activitat registrada en el mes natural actual.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="app-card border border-[var(--superficie)]/25 bg-[var(--superficie-muted)]">
              <div className="text-lg font-bold text-[var(--accent)] tabular-nums">
                {resumMesActual.distancia.toFixed(1)}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">km</div>
            </div>
            <div className="app-card border border-[var(--superficie)]/25 bg-[var(--superficie-muted)]">
              <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                {resumMesActual.sortides}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">sortides</div>
            </div>
            <div className="app-card border border-[var(--superficie)]/25 bg-[var(--superficie-muted)]">
              <div className="text-lg font-bold text-[var(--accent)] tabular-nums">
                {Math.round(horesMesActual * 10) / 10}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">hores</div>
            </div>
            <div className="app-card border border-[var(--superficie)]/25 bg-[var(--superficie-muted)]">
              <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                {resumMesActual.desnivell.toLocaleString('ca-ES')}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">m desn.</div>
            </div>
          </div>
        </section>
      );
    }

    if (id === 'podis' && perDistancia.length >= 3) {
      return (
        <section key="podis">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Podis · Top 3 distància</h2>
          <div
            className="rounded-2xl px-4 py-6 md:px-8 md:py-8"
            style={{
              background:
                'radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 3%, transparent) 0%, transparent 65%)',
            }}
          >
            <div className="flex items-end justify-center gap-2 md:gap-6 max-w-3xl mx-auto">
              <PodiumItem
                ruta={perDistancia[1]}
                value={perDistancia[1].distanciaKm ?? 0}
                format={(n) => formatKm(n)}
                position={2}
              />
              <PodiumItem
                ruta={perDistancia[0]}
                value={perDistancia[0].distanciaKm ?? 0}
                format={(n) => formatKm(n)}
                position={1}
              />
              <PodiumItem
                ruta={perDistancia[2]}
                value={perDistancia[2].distanciaKm ?? 0}
                format={(n) => formatKm(n)}
                position={3}
              />
            </div>
          </div>
        </section>
      );
    }

    if (id === 'principals') {
      return (
        <section key="principals">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Rànquings principals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Block
              title="Top 10 distància"
              items={perDistancia}
              format={(r) => formatKm(r.distanciaKm ?? 0)}
              valueKey="distanciaKm"
              maxVal={maxKm}
            />
            <Block
              title="Top 10 desnivell"
              items={perDesnivell}
              format={(r) => `${r.desnivellMetres} m`}
              valueKey="desnivellMetres"
              maxVal={maxDesnivell}
            />
            <Block
              title="Top 10 durada"
              items={perDurada}
              format={(r) =>
                `${Math.floor((r.duradaMinuts ?? 0) / 60)}h ${(r.duradaMinuts ?? 0) % 60}min`
              }
              valueKey="duradaMinuts"
              maxVal={maxDurada}
            />
          </div>
        </section>
      );
    }

    if (id === 'records') {
      const rutaVel = stats.rutaVelocitatMax;
      const rutaAlc = stats.rutaAlcadaMax;
      const teVel = stats.velocitatMaxima != null && rutaVel != null;
      const teAlc = stats.alcadaMaxima != null && rutaAlc != null;
      return (
        <section key="records">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Rècords absoluts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teVel && rutaVel && (
              <div
                className="app-card rounded-2xl border border-[var(--border)] p-6 flex flex-col gap-3"
                style={{
                  background:
                    'linear-gradient(to bottom, color-mix(in srgb, var(--accent) 5%, transparent), transparent)',
                }}
              >
                <IconLightning />
                <div className="text-5xl font-black text-[var(--accent)] tabular-nums leading-none">
                  {stats.velocitatMaxima} <span className="text-3xl">km/h</span>
                </div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] m-0">Velocitat màxima</p>
                <Link
                  to={`/rutes/${rutaVel.id}`}
                  className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] no-underline truncate"
                >
                  {rutaVel.nom}
                </Link>
              </div>
            )}
            {teAlc && rutaAlc && (
              <div
                className="app-card rounded-2xl border border-[var(--border)] p-6 flex flex-col gap-3"
                style={{
                  background:
                    'linear-gradient(to bottom, color-mix(in srgb, var(--accent) 5%, transparent), transparent)',
                }}
              >
                <IconMountain />
                <div className="text-5xl font-black text-[var(--accent)] tabular-nums leading-none">
                  {stats.alcadaMaxima} <span className="text-3xl">m</span>
                </div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] m-0">Alçada màxima</p>
                <Link
                  to={`/rutes/${rutaAlc.id}`}
                  className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] no-underline truncate"
                >
                  {rutaAlc.nom}
                </Link>
              </div>
            )}
            {!teVel && !teAlc && (
              <p className="text-sm text-[var(--text-muted)] col-span-2">
                Afegeix velocitat o alçada màxima a les rutes.
              </p>
            )}
          </div>
        </section>
      );
    }

    if (id === 'comarques' && perComarca.length > 0) {
      return (
        <section key="comarques">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Estadístiques per comarques
          </h2>
          <p className="text-xs text-[var(--accent2)] mb-2">
            Nombre de vegades que has anat a cada comarca i km totals.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="app-card">
              <h3 className="text-xs font-semibold text-[var(--accent2)] mb-2">
                Vegades per comarca
              </h3>
              <div className="h-56 flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataComarca}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {pieDataComarca.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(
                        value: number,
                        _name: string,
                        props: { payload?: { km?: number; desnivell?: number } }
                      ) => [
                        `${value} vegades${
                          props.payload?.km != null ? ` · ${props.payload.km.toFixed(2)} km` : ''
                        }${
                          props.payload?.desnivell != null && props.payload.desnivell > 0
                            ? ` · ${props.payload.desnivell} m`
                            : ''
                        }`,
                        'Vegades',
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="app-card overflow-x-auto">
              <h3 className="text-xs font-semibold text-[var(--accent2)] mb-2">
                Taula per comarca
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-1.5 pr-2 text-[var(--text-secondary)] font-medium">
                      Comarca
                    </th>
                    <th className="text-right py-1.5 px-2 text-[var(--accent2)] font-medium">
                      Vegades
                    </th>
                    <th className="text-right py-1.5 px-2 text-[var(--text-secondary)] font-medium">
                      Km
                    </th>
                    <th className="text-right py-1.5 pl-2 text-[var(--text-secondary)] font-medium">
                      Desnivell
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {perComarca.map((c) => (
                    <tr key={c.comarca} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-1.5 pr-2 text-[var(--text-primary)]">{c.comarca}</td>
                      <td className="py-1.5 px-2 text-right text-[var(--accent)] font-medium">
                        {c.vegades}
                      </td>
                      <td className="py-1.5 px-2 text-right text-[var(--text-secondary)]">
                        {c.km.toLocaleString('ca-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-1.5 pl-2 text-right text-[var(--text-secondary)]">
                        {c.desnivell.toLocaleString('ca-ES')} m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      );
    }

    if (id === 'altres') {
      return (
        <section key="altres">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Altres rànquings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Block
              title="Top 10 velocitat màxima"
              items={perVelocitatMax}
              format={(r) => `${r.velocitatMaxima} km/h`}
              valueKey="velocitatMaxima"
              maxVal={perVelocitatMax[0]?.velocitatMaxima ?? 1}
            />
            <Block
              title="Top 10 alçada màxima"
              items={perAlcada}
              format={(r) => `${r.alcadaMaximaMetres} m`}
              valueKey="alcadaMaximaMetres"
              maxVal={perAlcada[0]?.alcadaMaximaMetres ?? 1}
            />
          </div>
        </section>
      );
    }

    return null;
  };

  if (rutes.length === 0) {
    return (
      <div>
        <section className="mb-6">
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
            Rànquings i estadístiques
          </p>
          <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
            Els teus rècords i tendències
          </h1>
        </section>
        <EmptyState
          titol="Encara no hi ha rutes"
          descripcio="Afegeix sortides per veure rànquings i podis."
          accio={{ label: 'Nova ruta', to: '/nova-ruta' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
          Rànquings i estadístiques
        </p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
          Els teus rècords i tendències
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Ordenat per rellevància: el més important primer.
        </p>
      </section>
      {blocsOrdenats.map((b) => renderBloc(b.id))}
    </div>
  );
}
