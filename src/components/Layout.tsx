import { Link, Outlet, useLocation } from 'react-router-dom';

const nav = [
  { to: '/', label: 'Inici' },
  { to: '/rutes', label: 'Rutes' },
  { to: '/nova-ruta', label: 'Nova ruta' },
  { to: '/informes', label: 'Informes' },
  { to: '/rankings', label: 'Rànquings' },
  { to: '/mapa', label: 'Mapa' },
  { to: '/comarques', label: 'Comarques' },
  { to: '/any-vs-any', label: 'Any vs Any' },
  { to: '/reptes', label: 'Reptes' },
  { to: '/badges', label: 'Badges' },
  { to: '/comparador', label: 'Comparador' },
  { to: '/album', label: 'Àlbum' },
  { to: '/configuracio', label: 'Configuració' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto px-3 py-2 flex items-center justify-between" style={{ maxWidth: 'var(--app-max-width)' }}>
          <Link to="/" className="text-lg font-medium text-[var(--text-primary)] no-underline">
            BikeRide
          </Link>
          <nav className="flex gap-1 flex-wrap justify-end">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-2 rounded-md text-sm no-underline transition-colors ${
                  location.pathname === to || (to === '/rutes' && location.pathname.startsWith('/rutes'))
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--superficie-soft)]'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full mx-auto px-3 box-border" style={{ maxWidth: 'var(--app-max-width)', paddingTop: 'var(--app-space-section)', paddingBottom: 'var(--app-space-section)' }}>
        <Outlet />
      </main>
    </div>
  );
}
