import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRutes } from '../store/useRutes';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { Ruta } from '../types/ruta';
import { estadistiquesGlobals, distribucioPerComarca, totalHores } from '../utils/estadistiques';
import { filtrarRutesAquestMesFinsAvui, resumRutes } from '../utils/informes';
import { formatKm } from '../utils/format';

const COLORS = ['var(--accent)', 'var(--accent2)', 'var(--superficie)', '#059669', '#0f766e', '#64748b'];

function PodiumItem({ ruta, value, format, position }: { ruta: Ruta; value: number; format: (n: number) => string; position: 1 | 2 | 3 }) {
  const heights = { 1: 'h-16', 2: 'h-14', 3: 'h-12' };
  const labels = { 1: '1r', 2: '2n', 3: '3r' };
  return (
    <div className="flex flex-col items-center flex-1">
      <Link to={`/rutes/${ruta.id}`} className="text-xs font-medium text-[var(--text-primary)] hover:text-[var(--accent)] no-underline truncate max-w-full text-center mb-1">
        {ruta.nom}
      </Link>
      <div className={`w-full max-w-[80px] rounded-t-lg bg-[var(--accent-soft)] flex items-end justify-center ${heights[position]}`}>
        <span className="text-sm font-bold text-[var(--accent)] mb-0.5">{format(value)}</span>
      </div>
      <span className="text-xs font-semibold text-[var(--text-muted)] mt-1">{labels[position]}</span>
    </div>
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

  const perDistancia = useMemo(() => [...rutes].filter((r) => r.distanciaKm != null && r.distanciaKm > 0).sort((a, b) => (b.distanciaKm ?? 0) - (a.distanciaKm ?? 0)).slice(0, 10), [rutes]);
  const perDesnivell = useMemo(() => [...rutes].filter((r) => r.desnivellMetres != null && r.desnivellMetres > 0).sort((a, b) => (b.desnivellMetres ?? 0) - (a.desnivellMetres ?? 0)).slice(0, 10), [rutes]);
  const perDurada = useMemo(() => [...rutes].filter((r) => r.duradaMinuts != null && r.duradaMinuts > 0).sort((a, b) => (b.duradaMinuts ?? 0) - (a.duradaMinuts ?? 0)).slice(0, 10), [rutes]);
  const perVelocitatMax = useMemo(() => [...rutes].filter((r) => r.velocitatMaxima != null && r.velocitatMaxima > 0).sort((a, b) => (b.velocitatMaxima ?? 0) - (a.velocitatMaxima ?? 0)).slice(0, 10), [rutes]);
  const perAlcada = useMemo(() => [...rutes].filter((r) => r.alcadaMaximaMetres != null && r.alcadaMaximaMetres > 0).sort((a, b) => (b.alcadaMaximaMetres ?? 0) - (a.alcadaMaximaMetres ?? 0)).slice(0, 10), [rutes]);

  const maxKm = perDistancia[0]?.distanciaKm ?? 1;
  const maxDesnivell = perDesnivell[0]?.desnivellMetres ?? 1;
  const maxDurada = perDurada[0]?.duradaMinuts ?? 1;

  const Block = ({ title, items, format, valueKey, maxVal }: { title: string; items: Ruta[]; format: (r: Ruta) => string; valueKey: 'distanciaKm' | 'desnivellMetres' | 'duradaMinuts' | 'velocitatMaxima' | 'alcadaMaximaMetres'; maxVal: number }) => (
    <div className="app-card">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{title}</h2>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">Sense dades</p>
      ) : (
        <ol className="space-y-2">
          {items.map((r, i) => {
            const val = r[valueKey] as number | undefined;
            const num = typeof val === 'number' ? val : 0;
            const pct = maxVal > 0 ? (num / maxVal) * 100 : 0;
            return (
              <li key={r.id} className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-medium w-5 text-xs">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <Link to={`/rutes/${r.id}`} className="text-[var(--text-primary)] hover:text-[var(--accent)] no-underline truncate block text-sm font-medium">
                    {r.nom}
                  </Link>
                  <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden mt-0.5">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-[var(--accent)] font-semibold shrink-0 text-xs">{format(r)}</span>
              </li>
            );
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
  const barDataTop = perDistancia.slice(0, 6).map((r) => ({
    nom: r.nom.length > 10 ? r.nom.slice(0, 10) + '…' : r.nom,
    km: r.distanciaKm ?? 0,
  }));

  const blocsOrdenats = config.rankingsLayout.blocs
    .slice()
    .sort((a, b) => a.ordre - b.ordre)
    .filter((b) => b.visible);

  const renderBloc = (id: typeof config.rankingsLayout.blocs[number]['id']) => {
    if (id === 'resum') {
      return (
        <section key="resum">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Resum global</h2>
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
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            Podis · Top 3 distància
          </h2>
          <div className="flex items-end justify-center gap-3 md:gap-6 app-card py-4">
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
        </section>
      );
    }

    if (id === 'principals') {
      return (
        <section key="principals">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            Rànquings principals
          </h2>
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
      return (
        <section key="records">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            Rècords personals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.velocitatMaxima != null && stats.rutaVelocitatMax && (
              <div className="app-card border-l-4 border-l-[var(--accent)]">
                <div className="text-xs text-[var(--text-muted)]">Velocitat màxima</div>
                <div className="text-xl font-bold text-[var(--accent)]">
                  {stats.velocitatMaxima} km/h
                </div>
                <Link
                  to={`/rutes/${stats.rutaVelocitatMax.id}`}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  {stats.rutaVelocitatMax.nom}
                </Link>
              </div>
            )}
            {stats.alcadaMaxima != null && stats.rutaAlcadaMax && (
              <div className="app-card border-l-4 border-l-[var(--accent2)]">
                <div className="text-xs text-[var(--accent2)]">Alçada màxima</div>
                <div className="text-xl font-bold text-[var(--text-primary)]">
                  {stats.alcadaMaxima} m
                </div>
                <Link
                  to={`/rutes/${stats.rutaAlcadaMax.id}`}
                  className="text-xs text-[var(--accent2)] hover:underline"
                >
                  {stats.rutaAlcadaMax.nom}
                </Link>
              </div>
            )}
            {stats.velocitatMaxima == null && stats.alcadaMaxima == null && (
              <p className="text-xs text-[var(--text-muted)] col-span-2">
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
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
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

    if (id === 'topBarres' && barDataTop.length > 0) {
      return (
        <section key="topBarres" className="app-card">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Top 6 per distància
          </h2>
          <div className="h-48 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barDataTop} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="nom"
                  width={72}
                  tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                  }}
                  formatter={(value: number) => [`${value} km`, 'Distància']}
                />
                <Bar dataKey="km" fill="var(--accent)" radius={[0, 4, 4, 0]} name="Km" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      );
    }

    if (id === 'altres') {
      return (
        <section key="altres">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            Altres rànquings
          </h2>
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

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)] mb-0.5">Rànquings i estadístiques</p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight mb-1">Els teus rècords i tendències</h1>
        <p className="text-sm text-[var(--text-secondary)]">Ordenat per rellevància: el més important primer.</p>
      </section>
      {blocsOrdenats.map((b) => renderBloc(b.id))}
    </div>
  );
}
