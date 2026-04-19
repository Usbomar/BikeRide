import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

const NAV_GRUPS = [
  {
    label: 'Les meves rutes',
    description: 'Les teves sortides, diari i fotos',
    items: [
      { to: '/rutes', label: 'Les rutes' },
      { to: '/diari', label: 'Diari' },
      { to: '/album', label: 'Àlbum' },
    ],
  },
  {
    label: 'Mètriques i informes',
    description: 'Xifres, rànquings i comparatives',
    items: [
      { to: '/panell', label: 'Panell' },
      { to: '/informes', label: 'Informes' },
      { to: '/rankings', label: 'Rànquings' },
      { to: '/any-vs-any', label: 'Any vs Any' },
      { to: '/heatmap', label: 'Heatmap' },
      { to: '/comparador', label: 'Comparador' },
    ],
  },
  {
    label: 'Mapa i territori',
    description: 'Mapa, comarques i temps',
    items: [
      { to: '/mapa', label: 'Mapa' },
      { to: '/comarques', label: 'Comarques' },
      { to: '/meteo', label: 'Meteo' },
    ],
  },
  {
    label: 'Reptes i joc',
    description: 'Motivació i reptes',
    items: [
      { to: '/reptes', label: 'Reptes' },
      { to: '/badges', label: 'Badges' },
      { to: '/streak', label: 'Streak' },
    ],
  },
] as const;

type GrupNav = (typeof NAV_GRUPS)[number];

function IconaConfig() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function IconaHamburger() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export default function Layout() {
  const location = useLocation();
  const [grupObert, setGrupObert] = useState<string | null>(null);
  const [menuMobilObert, setMenuMobilObert] = useState(false);
  const navDesktopRef = useRef<HTMLDivElement>(null);

  function estaActiu(grup: GrupNav): boolean {
    return grup.items.some(
      (item) =>
        location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
    );
  }

  useEffect(() => {
    queueMicrotask(() => setMenuMobilObert(false));
  }, [location.pathname]);

  useEffect(() => {
    if (!grupObert) return;
    function handleClick(e: MouseEvent) {
      if (navDesktopRef.current && !navDesktopRef.current.contains(e.target as Node)) {
        setGrupObert(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [grupObert]);

  const navLinkIniciClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'text-[var(--accent)]'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur">
        <div className="mx-auto flex items-center justify-between gap-3 px-3 py-2" style={{ maxWidth: 'var(--app-max-width)' }}>
          <Link to="/" className="shrink-0 text-lg font-medium text-[var(--text-primary)] no-underline">
            BikeRiders
          </Link>

          <div className="relative hidden min-w-0 flex-1 items-center gap-1 md:flex">
            <div ref={navDesktopRef} className="relative flex items-center gap-1">
              {NAV_GRUPS.map((grup) => (
                <div key={grup.label} className="relative">
                  <button
                    type="button"
                    onClick={() => setGrupObert(grupObert === grup.label ? null : grup.label)}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      estaActiu(grup)
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    aria-expanded={grupObert === grup.label}
                    aria-haspopup="true"
                  >
                    {grup.label}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points={grupObert === grup.label ? '18,15 12,9 6,15' : '6,9 12,15 18,9'} />
                    </svg>
                  </button>

                  {grupObert === grup.label && (
                    <div className="app-card absolute left-0 top-full z-50 mt-1 min-w-[200px] border border-[var(--border)] p-1 shadow-lg">
                      {grup.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setGrupObert(null)}
                          className={({ isActive }) =>
                            `block rounded-lg px-3 py-2 text-sm transition-colors ${
                              isActive
                                ? 'bg-[var(--accent)]/10 font-medium text-[var(--accent)]'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--superficie-muted)] hover:text-[var(--text-primary)]'
                            }`
                          }
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="min-w-0 flex-1" aria-hidden />

            <Link
              to="/nova-ruta"
              className="flex h-[44px] min-w-[122px] shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[var(--accent2)] px-4 text-xs font-bold text-white no-underline transition-colors hover:bg-[var(--accent2-hover)]"
            >
              Nova ruta
            </Link>

            <Link
              to="/configuracio"
              className={`rounded-lg p-2 transition-colors ${
                location.pathname === '/configuracio'
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)] hover:text-[var(--text-primary)]'
              }`}
              title="Configuració"
              aria-label="Configuració"
            >
              <IconaConfig />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1 md:hidden">
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)] hover:text-[var(--text-primary)]"
              onClick={() => setMenuMobilObert(true)}
              aria-label="Obrir menú de navegació"
              aria-expanded={menuMobilObert}
            >
              <IconaHamburger />
            </button>

            <Link
              to="/configuracio"
              className={`rounded-lg p-2 transition-colors ${
                location.pathname === '/configuracio'
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)] hover:text-[var(--text-primary)]'
              }`}
              title="Configuració"
              aria-label="Configuració"
            >
              <IconaConfig />
            </Link>
          </div>
        </div>
      </header>

      {menuMobilObert && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[100] cursor-default bg-black/40 md:hidden"
            aria-label="Tancar menú"
            onClick={() => setMenuMobilObert(false)}
          />
          <aside
            className="fixed left-0 top-0 z-[101] flex h-full w-[min(100%,20rem)] flex-col bg-[var(--bg-card)] shadow-xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegació"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <span className="text-base font-semibold text-[var(--text-primary)]">BikeRiders</span>
              <button
                type="button"
                className="rounded-lg p-2 text-lg leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                onClick={() => setMenuMobilObert(false)}
                aria-label="Tancar"
              >
                ×
              </button>
            </div>
            <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
              <Link
                to="/nova-ruta"
                onClick={() => setMenuMobilObert(false)}
                className="mb-5 flex w-full items-center justify-center whitespace-nowrap rounded-xl bg-[var(--accent2)] px-4 py-3 text-sm font-bold text-white no-underline transition-colors hover:bg-[var(--accent2-hover)]"
              >
                Nova ruta
              </Link>

              <div className="mb-4">
                <NavLink to="/" end onClick={() => setMenuMobilObert(false)} className={navLinkIniciClass}>
                  Inici
                </NavLink>
              </div>

              {NAV_GRUPS.map((grup) => (
                <div key={grup.label} className="mb-6 last:mb-0">
                  <div className="mb-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      {grup.label}
                    </div>
                    {grup.description ? (
                      <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">{grup.description}</p>
                    ) : null}
                  </div>
                  <ul className="space-y-0.5">
                    {grup.items.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={() => setMenuMobilObert(false)}
                          className={({ isActive }) =>
                            `block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                              isActive
                                ? 'bg-[var(--accent)]/10 font-medium text-[var(--accent)]'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--superficie-muted)] hover:text-[var(--text-primary)]'
                            }`
                          }
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="mt-auto border-t border-[var(--border)] pt-4">
                <Link
                  to="/configuracio"
                  onClick={() => setMenuMobilObert(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-colors ${
                    location.pathname === '/configuracio'
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--superficie-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <IconaConfig />
                  Configuració
                </Link>
              </div>
            </nav>
          </aside>
        </>
      )}

      <main
        className="box-border w-full flex-1 px-3"
        style={{
          maxWidth: 'var(--app-max-width)',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingTop: 'var(--app-space-section)',
          paddingBottom: 'var(--app-space-section)',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
