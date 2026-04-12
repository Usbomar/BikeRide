import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRutes } from '../store/useRutes';
import { EmptyState } from '../components/EmptyState';

interface FotoAlbum {
  id: string;
  rutaId: string;
  url: string;
  caption?: string;
  rutaNom: string;
  data: string;
}

function formatDate(s: string) {
  const d = new Date(s);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function safeFileName(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function ChevronLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Album() {
  const { rutes } = useRutes();

  const fotosOrdenades = useMemo(() => {
    const ambFotos = rutes.filter((r) => (r.fotos?.length ?? 0) > 0);
    const rutesOrdenades = [...ambFotos].sort((a, b) => {
      const ta = new Date(a.data).getTime();
      const tb = new Date(b.data).getTime();
      if (tb !== ta) return tb - ta;
      return a.nom.localeCompare(b.nom, 'ca');
    });

    return rutesOrdenades.flatMap((r) =>
      (r.fotos ?? []).map((f) => ({
        id: f.id,
        rutaId: r.id,
        url: f.url,
        caption: f.caption,
        rutaNom: r.nom,
        data: r.data,
      }))
    );
  }, [rutes]);

  const grupsPerMes = useMemo(() => {
    const map = new Map<
      string,
      {
        clau: string;
        label: string;
        any: number;
        fotos: FotoAlbum[];
      }
    >();

    fotosOrdenades.forEach((f) => {
      const d = new Date(f.data + 'T12:00:00');
      const clau = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('ca-ES', {
        month: 'long',
        year: 'numeric',
      });
      const any = d.getFullYear();
      const prev = map.get(clau) ?? { clau, label, any, fotos: [] };
      prev.fotos.push(f);
      map.set(clau, prev);
    });

    return Array.from(map.values()).sort((a, b) => b.clau.localeCompare(a.clau));
  }, [fotosOrdenades]);

  const anysDisponibles = useMemo(
    () =>
      Array.from(new Set(fotosOrdenades.map((f) => new Date(f.data + 'T12:00:00').getFullYear()))).sort(
        (a, b) => b - a
      ),
    [fotosOrdenades]
  );

  const [anyFiltre, setAnyFiltre] = useState<number | null>(null);

  const grupsVisibles = useMemo(
    () => (anyFiltre ? grupsPerMes.filter((g) => g.any === anyFiltre) : grupsPerMes),
    [grupsPerMes, anyFiltre]
  );

  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [, setAspectes] = useState<Record<string, number>>({});

  const setAspect = useCallback((id: string, w: number, h: number) => {
    if (w <= 0 || h <= 0) return;
    setAspectes((prev) => {
      const ar = w / h;
      if (prev[id] === ar) return prev;
      return { ...prev, [id]: ar };
    });
  }, []);

  const foto = fotosOrdenades[index];

  const next = useCallback(() => {
    if (fotosOrdenades.length === 0) return;
    setIndex((i) => (i + 1) % fotosOrdenades.length);
  }, [fotosOrdenades.length]);

  const prev = useCallback(() => {
    if (fotosOrdenades.length === 0) return;
    setIndex((i) => (i - 1 + fotosOrdenades.length) % fotosOrdenades.length);
  }, [fotosOrdenades.length]);

  const onDragStart = (x: number) => {
    setDragStartX(x);
  };

  const onDragEnd = (x: number) => {
    if (dragStartX == null) return;
    const delta = x - dragStartX;
    const threshold = 50;
    if (delta <= -threshold) next();
    if (delta >= threshold) prev();
    setDragStartX(null);
  };

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expanded, next, prev]);

  return (
    <div>
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
            Galeria
          </p>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Àlbum</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {fotosOrdenades.length} fotos · {grupsPerMes.length} mesos
          </p>
        </div>
        {fotosOrdenades.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {anysDisponibles.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAnyFiltre(a === anyFiltre ? null : a)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  anyFiltre === a
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border)] bg-[var(--superficie-muted)] text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)]'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </section>

      {fotosOrdenades.length === 0 ? (
        <EmptyState
          titol="Encara no hi ha fotos"
          descripcio="Afegeix fotos des del formulari de cada ruta per omplir la galeria."
          accio={{ label: 'Anar a rutes', to: '/rutes' }}
        />
      ) : (
        <>
          {grupsVisibles.map((grup) => (
            <section key={grup.clau} className="mb-10">
              <div className="mb-3 flex items-baseline gap-3">
                <h2 className="text-lg font-bold capitalize text-[var(--text-primary)]">{grup.label}</h2>
                <span className="text-xs text-[var(--text-muted)]">
                  {grup.fotos.length} foto{grup.fotos.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gridAutoRows: '140px',
                }}
              >
                {grup.fotos.map((f, i) => {
                  const esPrimera = i === 0 && grup.fotos.length >= 3;
                  return (
                    <button
                      key={`${f.rutaId}-${f.id}`}
                      type="button"
                      onClick={() => {
                        const gi = fotosOrdenades.findIndex((x) => x.id === f.id && x.rutaId === f.rutaId);
                        setIndex(gi);
                        setExpanded(true);
                      }}
                      className="group relative overflow-hidden rounded-lg bg-[var(--bg-card)] transition-all duration-200 hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      style={esPrimera ? { gridColumn: 'span 2', gridRow: 'span 2' } : {}}
                    >
                      <img
                        src={f.url}
                        alt={f.caption || f.rutaNom}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onLoad={(e) => {
                          const el = e.currentTarget;
                          setAspect(f.id, el.naturalWidth, el.naturalHeight);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <p className="truncate text-[10px] font-medium leading-tight text-white">{f.rutaNom}</p>
                        <p className="truncate text-[9px] text-white/75">{formatDate(f.data)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}

      {expanded && foto && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          onClick={() => setExpanded(false)}
          role="presentation"
        >
          <div
            className="flex shrink-0 items-center justify-between px-6 py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-sm font-semibold text-white">{foto.rutaNom}</p>
              <p className="mt-0.5 text-xs text-white/50">
                {new Date(foto.data + 'T12:00:00').toLocaleDateString('ca-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {foto.caption ? ` · ${foto.caption}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">
                {index + 1} / {fotosOrdenades.length}
              </span>
              <a
                href={foto.url}
                download={`${safeFileName(foto.rutaNom)}-${index + 1}.jpg`}
                onClick={(e) => e.stopPropagation()}
                className="text-white/60 no-underline transition-colors hover:text-white"
                title="Descarregar"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-16" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft />
            </button>
            <div
              className="flex max-h-full max-w-full items-center justify-center"
              onMouseDown={(e) => onDragStart(e.clientX)}
              onMouseUp={(e) => onDragEnd(e.clientX)}
              onMouseLeave={() => setDragStartX(null)}
              onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
              onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
            >
              <img
                src={foto.url}
                alt={foto.caption || foto.rutaNom}
                className="max-h-full max-w-full select-none rounded-lg object-contain"
                style={{ maxHeight: 'calc(100vh - 180px)' }}
                draggable={false}
              />
            </div>
            <button
              type="button"
              onClick={next}
              className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight />
            </button>
          </div>

          <div className="flex shrink-0 gap-2 overflow-x-auto px-6 py-3" onClick={(e) => e.stopPropagation()}>
            {fotosOrdenades.map((f2, i2) => (
              <button
                key={`${f2.rutaId}-${f2.id}`}
                type="button"
                onClick={() => setIndex(i2)}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-md transition-all duration-150 ${
                  i2 === index ? 'scale-110 ring-2 ring-white' : 'opacity-50 hover:opacity-80'
                }`}
              >
                <img src={f2.url} alt={f2.rutaNom} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
