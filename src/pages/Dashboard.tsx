import { Link } from 'react-router-dom';
import { useRutes } from '../store/useRutes';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  getPeriodes,
  filtrarRutesPerPeriode,
  filtrarRutesAquestMesFinsAvui,
  resumRutes,
} from '../utils/informes';
import { totalHores, getMesPassat } from '../utils/estadistiques';
import { formatKm } from '../utils/format';

function formatDate(s: string) {
  const d = new Date(s);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('ca-ES', { month: 'short' });
  const year = String(d.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
}

export default function Dashboard() {
  const { rutes, config } = useRutes();

  const araRef = new Date();
  const periodes = getPeriodes('mensual', 1);
  const dadesMes = periodes.map((p) => {
    const r = filtrarRutesPerPeriode(rutes, p.start, p.end, araRef);
    const resum = resumRutes(r);
    return {
      label: p.label.slice(0, 3),
      mes: p.label,
      enCurs: p.enCurs,
      km: Math.round(resum.distancia * 10) / 10,
      sortides: resum.sortides,
      hores: Math.round((resum.durada / 60) * 10) / 10,
    };
  }).reverse();

  const total = resumRutes(rutes);
  const horesTotals = totalHores(rutes);
  const aquestMes = resumRutes(filtrarRutesAquestMesFinsAvui(rutes, araRef));
  const { start: startPassat, end: endPassat } = getMesPassat(1);
  const mesPassat = resumRutes(filtrarRutesPerPeriode(rutes, startPassat, endPassat, araRef));

  const tendenciaKm = mesPassat.distancia > 0
    ? Math.round(((aquestMes.distancia - mesPassat.distancia) / mesPassat.distancia) * 100)
    : 0;
  const ultimesRutes = [...rutes]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5);

  const mitjanaPerSortida = rutes.length > 0 && total.distancia > 0
    ? (total.distancia / rutes.length).toFixed(1)
    : '—';

  const blocsOrdenats = [...config.dashboardLayout.blocs].sort((a, b) => a.ordre - b.ordre);

  const renderBloc = (id: typeof config.dashboardLayout.blocs[number]['id']) => {
    if (id === 'kpis') {
      return (
        <section key="kpis">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="app-card border-l-4 border-l-[var(--accent)]">
              <div className="text-xl font-bold text-[var(--accent)] tabular-nums">{total.distancia.toFixed(1)}</div>
              <div className="text-xs font-medium text-[var(--text-muted)]">km totals</div>
            </div>
            <div className="app-card border-l-4 border-l-[var(--accent2)]">
              <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{total.sortides}</div>
              <div className="text-xs font-medium text-[var(--accent2)]">sortides</div>
            </div>
            <div className="app-card border-l-4 border-l-[var(--accent)]">
              <div className="text-xl font-bold text-[var(--accent)] tabular-nums">{horesTotals.toFixed(1)}</div>
              <div className="text-xs font-medium text-[var(--text-muted)]">hores</div>
            </div>
            <div className="app-card border-l-4 border-l-[var(--accent2)]">
              <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{total.desnivell.toLocaleString('ca-ES')}</div>
              <div className="text-xs font-medium text-[var(--accent2)]">m desnivell</div>
            </div>
            <div className="app-card border-l-4 border-l-[var(--accent)]">
              <div className="text-xl font-bold text-[var(--accent)] tabular-nums">{aquestMes.distancia.toFixed(1)}</div>
              <div className="text-xs font-medium text-[var(--text-muted)]">aquest mes (km)</div>
              <div className="text-[10px] text-[var(--accent2)]/90">acumulat fins avui</div>
              {mesPassat.distancia > 0 && (
                <span className={`text-xs ${tendenciaKm >= 0 ? 'text-emerald-600' : 'text-[var(--text-muted)]'}`}>
                  {tendenciaKm >= 0 ? '+' : ''}{tendenciaKm}%
                </span>
              )}
            </div>
            <div className="app-card border-l-4 border-l-[var(--accent2)]">
              <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{mitjanaPerSortida}</div>
              <div className="text-xs font-medium text-[var(--accent2)]">km/sortida</div>
            </div>
          </div>
        </section>
      );
    }

    if (id === 'grafica') {
      return (
        <section key="grafica" className="app-card">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-0.5">Evolució mensual</h2>
          <p className="text-[10px] text-[var(--text-muted)] mb-1">
            El mes en curs mostra el que has registrat fins avui; la resta, el total del mes tancat.
          </p>
          <div className="h-52 mt-2">
            {dadesMes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadesMes} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradKm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                    formatter={(value: number, name: string) => [name === 'km' ? `${value} km` : value, name === 'km' ? 'Distància' : 'Sortides']}
                    labelFormatter={(label) => {
                      const row = dadesMes.find((d) => d.label === label);
                      const base = row?.mes ?? label;
                      return row?.enCurs ? `${base} (fins avui)` : base;
                    }}
                  />
                  <Area type="monotone" dataKey="km" stroke="var(--accent)" strokeWidth={2} fill="url(#gradKm)" name="km" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-xs">
                Afegeix rutes per veure l'evolució
              </div>
            )}
          </div>
        </section>
      );
    }

    if (id === 'ultimes') {
      return (
        <section key="ultimes" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 app-card">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Últimes rutes</h2>
            {ultimesRutes.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">Encara no hi ha rutes.</p>
            ) : (
              <ul className="space-y-1">
                {ultimesRutes.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/rutes/${r.id}`}
                      className="flex items-center justify-between gap-3 py-2 px-2 rounded-lg hover:bg-[var(--bg)]/50 transition-colors no-underline group"
                    >
                      <span className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] text-sm truncate">
                        {r.nom}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] shrink-0">{formatDate(r.data)}</span>
                      <span className="text-xs text-[var(--text-secondary)] shrink-0">
                        {r.distanciaKm != null ? formatKm(r.distanciaKm) : ''}{' '}
                        {r.desnivellMetres != null ? `· ${r.desnivellMetres} m` : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/nova-ruta"
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm text-white bg-[var(--accent)] hover:opacity-95 no-underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nova ruta
            </Link>
            <Link
              to="/rutes"
              className="flex items-center justify-center py-3 rounded-xl font-medium text-sm text-[var(--text-primary)] border border-[var(--superficie)]/35 bg-[var(--superficie-muted)] hover:bg-[var(--superficie-soft)] no-underline"
            >
              Totes les rutes
            </Link>
            <Link
              to="/rankings"
              className="flex items-center justify-center py-3 rounded-xl font-medium text-sm text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--accent2-soft)] hover:text-[var(--accent2)] hover:border-[var(--accent2)]/40 no-underline transition-colors"
            >
              Rànquings
            </Link>
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <section className="text-center md:text-left">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)] mb-0.5">Quadre de comandament</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] tracking-tight mb-1">Cada kilòmetre compta</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-xl">Resum de la teva activitat i accés ràpid.</p>
      </section>
      {blocsOrdenats.map((b) => renderBloc(b.id))}
    </div>
  );
}
