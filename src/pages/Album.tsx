import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRutes } from '../store/useRutes';

interface FotoAlbum {
  id: string;
  rutaId: string;
  url: string;
  caption?: string;
  rutaNom: string;
  data: string;
}

type TabAlbum = 'composicio' | 'visor';

/** Estils de composició (graella / mosaic) */
type ModeComposicio =
  | 'perRuta'
  | 'compacta'
  | 'amplia'
  | 'collage'
  | 'paisatge'
  | 'peu';

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

const BTN_ARROW =
  'absolute top-1/2 -translate-y-1/2 z-10 w-[2.8125rem] h-[2.8125rem] rounded-full bg-[var(--bg-card)]/90 border-2 border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] flex items-center justify-center shadow-sm';

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

/** Mosaic tipus Google Fotos: barres i columnes segons proporció i variació */
function spanCollage(
  index: number,
  ar: number | null
): { col: number; row: number } {
  if (ar == null || !Number.isFinite(ar) || ar <= 0) {
    const m = index % 6;
    if (m === 0) return { col: 6, row: 3 };
    if (m === 1) return { col: 3, row: 2 };
    return { col: 3, row: 2 };
  }
  if (index % 8 === 0) return { col: 6, row: 3 };
  if (ar > 1.2) return { col: 5, row: 2 };
  if (ar < 0.82) return { col: 2, row: 3 };
  if (ar > 1) return { col: 4, row: 2 };
  return { col: 3, row: 2 };
}

function spanPaisatge(ar: number | null): { col: number; row: number } {
  if (ar == null) return { col: 3, row: 2 };
  if (ar > 1.05) return { col: 4, row: 2 };
  if (ar < 0.95) return { col: 2, row: 3 };
  return { col: 3, row: 2 };
}

function spanPeu(ar: number | null): { col: number; row: number } {
  if (ar == null) return { col: 3, row: 2 };
  if (ar < 0.95) return { col: 3, row: 3 };
  if (ar > 1.05) return { col: 4, row: 2 };
  return { col: 2, row: 2 };
}

function useIsMdUp() {
  const [ok, setOk] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  );
  useEffect(() => {
    const m = window.matchMedia('(min-width: 768px)');
    const fn = () => setOk(m.matches);
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, []);
  return ok;
}

/** Converteix spans pensats per a 12 columnes a 6 columnes en pantalla estreta */
function spanResponsive(col12: number, row: number, isMd: boolean): { col: number; row: number } {
  if (isMd) return { col: Math.min(12, col12), row };
  const c = Math.max(2, Math.min(6, Math.ceil(col12 / 2)));
  return { col: c, row };
}

const MODES: { id: ModeComposicio; label: string; hint: string }[] = [
  { id: 'perRuta', label: 'Per ruta', hint: 'Agrupades per sortida i data' },
  { id: 'compacta', label: 'Petites', hint: 'Graella densa' },
  { id: 'amplia', label: 'Grans', hint: 'Miniatures grans' },
  { id: 'collage', label: 'Collage', hint: 'Mosaic tipus Google Fotos' },
  { id: 'paisatge', label: 'Apaisades', hint: 'Destaca horitzontals' },
  { id: 'peu', label: 'De peu', hint: 'Destaca verticals' },
];

export default function Album() {
  const { rutes } = useRutes();
  const isMdUp = useIsMdUp();

  const { fotosOrdenades, grupsPerRuta } = useMemo(() => {
    const ambFotos = rutes.filter((r) => (r.fotos?.length ?? 0) > 0);
    const rutesOrdenades = [...ambFotos].sort((a, b) => {
      const ta = new Date(a.data).getTime();
      const tb = new Date(b.data).getTime();
      if (tb !== ta) return tb - ta;
      return a.nom.localeCompare(b.nom, 'ca');
    });

    const flat: FotoAlbum[] = rutesOrdenades.flatMap((r) =>
      (r.fotos ?? []).map((f) => ({
        id: f.id,
        rutaId: r.id,
        url: f.url,
        caption: f.caption,
        rutaNom: r.nom,
        data: r.data,
      }))
    );

    const grups = rutesOrdenades.map((r) => ({
      rutaId: r.id,
      rutaNom: r.nom,
      data: r.data,
      fotos: (r.fotos ?? []).map((f) => ({
        id: f.id,
        rutaId: r.id,
        url: f.url,
        caption: f.caption,
        rutaNom: r.nom,
        data: r.data,
      })),
    }));

    return { fotosOrdenades: flat, grupsPerRuta: grups };
  }, [rutes]);

  const [tab, setTab] = useState<TabAlbum>('composicio');
  const [modeComposicio, setModeComposicio] = useState<ModeComposicio>('collage');
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [aspectes, setAspectes] = useState<Record<string, number>>({});

  const setAspect = useCallback((id: string, w: number, h: number) => {
    if (w <= 0 || h <= 0) return;
    setAspectes((prev) => {
      const ar = w / h;
      if (prev[id] === ar) return prev;
      return { ...prev, [id]: ar };
    });
  }, []);

  const foto = fotosOrdenades[index];

  const next = () => {
    if (fotosOrdenades.length === 0) return;
    setIndex((i) => (i + 1) % fotosOrdenades.length);
  };

  const prev = () => {
    if (fotosOrdenades.length === 0) return;
    setIndex((i) => (i - 1 + fotosOrdenades.length) % fotosOrdenades.length);
  };

  const obrirVisorAmbIndex = (i: number) => {
    setIndex(i);
    setTab('visor');
  };

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

  const indexGlobal = (rutaId: string, fotoId: string) =>
    fotosOrdenades.findIndex((f) => f.rutaId === rutaId && f.id === fotoId);

  const renderThumb = (f: FotoAlbum, gi: number, extraClass: string) => (
    <button
      key={`${f.rutaId}-${f.id}`}
      type="button"
      onClick={() => obrirVisorAmbIndex(gi)}
      className={`group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-sm transition-all hover:ring-2 hover:ring-[var(--accent)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${extraClass}`}
      title={`${f.rutaNom} — obrir al visor`}
    >
      <img
        src={f.url}
        alt={f.caption || f.rutaNom}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        loading="lazy"
        onLoad={(e) => {
          const el = e.currentTarget;
          setAspect(f.id, el.naturalWidth, el.naturalHeight);
        }}
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-2 py-2 text-left opacity-0 transition-opacity group-hover:opacity-100">
        <span className="line-clamp-1 text-[11px] font-medium text-white">{f.rutaNom}</span>
        {f.caption && <span className="line-clamp-1 text-[10px] text-white/85">{f.caption}</span>}
      </span>
    </button>
  );

  return (
    <div className="space-y-4">
      <section>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)] mb-0.5">Galeria</p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight mb-1">Àlbum</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Composició amb diversos estils (tipus Google Fotos) o visor per passar fotos.
        </p>
      </section>

      {fotosOrdenades.length === 0 ? (
        <div className="app-card py-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">Encara no hi ha fotos a les rutes.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
            <button
              type="button"
              onClick={() => setTab('composicio')}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === 'composicio'
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]/40'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--superficie-soft)]'
              }`}
            >
              Composició
            </button>
            <button
              type="button"
              onClick={() => setTab('visor')}
              className={`px-5 py-2.5 rounded-t-lg text-base font-semibold border-b-2 -mb-px transition-colors ${
                tab === 'visor'
                  ? 'border-[var(--accent2)] text-[var(--accent2)] bg-[var(--accent2-soft)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--accent2)] hover:bg-[var(--accent2-soft)]/60'
              }`}
            >
              Passar fotos
            </button>
          </div>

          {tab === 'composicio' && (
            <>
              <div className="app-card py-3">
                <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">Estil de composició</p>
                <div className="flex flex-wrap gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModeComposicio(m.id)}
                      title={m.hint}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                        modeComposicio === m.id
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'border-[var(--superficie)]/30 text-[var(--text-secondary)] bg-[var(--superficie-muted)] hover:bg-[var(--superficie-soft)]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">{MODES.find((x) => x.id === modeComposicio)?.hint}</p>
              </div>

              {modeComposicio === 'perRuta' && (
                <section className="space-y-6">
                  {grupsPerRuta.map((grup) => (
                    <div key={grup.rutaId} className="app-card">
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{grup.rutaNom}</h2>
                        <span className="text-xs text-[var(--accent2)]">{formatDate(grup.data)}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {grup.fotos.map((f) => {
                          const gi = indexGlobal(grup.rutaId, f.id);
                          return renderThumb(f, gi, 'aspect-square');
                        })}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {modeComposicio === 'compacta' && (
                <section className="app-card">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-1.5">
                    {fotosOrdenades.map((f, i) => renderThumb(f, i, 'aspect-square min-h-0'))}
                  </div>
                </section>
              )}

              {modeComposicio === 'amplia' && (
                <section className="app-card">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                    {fotosOrdenades.map((f, i) => renderThumb(f, i, 'aspect-[4/3] min-h-[200px] md:min-h-[260px]'))}
                  </div>
                </section>
              )}

              {(modeComposicio === 'collage' || modeComposicio === 'paisatge' || modeComposicio === 'peu') && (
                <section className="app-card overflow-hidden">
                  <div
                    className="grid grid-cols-6 md:grid-cols-12 [grid-auto-rows:minmax(72px,auto)] md:[grid-auto-rows:minmax(88px,auto)]"
                    style={{ gridAutoFlow: 'dense', gap: modeComposicio === 'collage' ? '10px' : undefined }}
                  >
                    {fotosOrdenades.map((f, i) => {
                      const gi = i;
                      const ar = aspectes[f.id] ?? null;
                      let col12 = 3;
                      let row = 2;
                      if (modeComposicio === 'collage') {
                        const s = spanCollage(i, ar);
                        col12 = s.col;
                        row = s.row;
                      } else if (modeComposicio === 'paisatge') {
                        const s = spanPaisatge(ar);
                        col12 = s.col;
                        row = s.row;
                      } else {
                        const s = spanPeu(ar);
                        col12 = s.col;
                        row = s.row;
                      }
                      const { col, row: r } = spanResponsive(col12, row, isMdUp);
                      return (
                        <button
                          key={`${f.rutaId}-${f.id}`}
                          type="button"
                          onClick={() => obrirVisorAmbIndex(gi)}
                          className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-sm transition-all hover:ring-2 hover:ring-[var(--accent)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[72px] md:min-h-[88px]"
                          style={{
                            gridColumn: `span ${col} / span ${col}`,
                            gridRow: `span ${r} / span ${r}`,
                          }}
                          title={`${f.rutaNom} — obrir al visor`}
                        >
                          <img
                            src={f.url}
                            alt={f.caption || f.rutaNom}
                            className="h-full w-full object-contain bg-[var(--bg-card)] transition-transform duration-300 group-hover:scale-[1.01]"
                            loading="lazy"
                            onLoad={(e) => {
                              const el = e.currentTarget;
                              setAspect(f.id, el.naturalWidth, el.naturalHeight);
                            }}
                          />
                          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="line-clamp-1 text-[10px] text-white">{f.rutaNom}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[10px] text-[var(--text-muted)]">
                    Les mides del mosaic s’ajusten quan es carrega cada foto (proporció apaisada o de peu).
                  </p>
                </section>
              )}
            </>
          )}

          {tab === 'visor' && foto && (
            <section className="app-card">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-[var(--text-muted)]">
                  Foto {index + 1} de {fotosOrdenades.length}
                </div>
                <div className="text-xs text-[var(--accent2)] font-medium">
                  {foto.rutaNom} · {formatDate(foto.data)}
                </div>
              </div>

              <div
                className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg)]"
                onMouseDown={(e) => onDragStart(e.clientX)}
                onMouseUp={(e) => onDragEnd(e.clientX)}
                onMouseLeave={() => setDragStartX(null)}
                onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
                onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
              >
                <button type="button" onClick={prev} className={`${BTN_ARROW} left-2`} title="Foto anterior">
                  <ChevronLeft />
                </button>
                <img
                  src={foto.url}
                  alt={foto.caption || foto.rutaNom}
                  className="w-full max-h-[70vh] object-contain bg-[var(--bg)]"
                />
                <button type="button" onClick={next} className={`${BTN_ARROW} right-2`} title="Foto següent">
                  <ChevronRight />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[var(--text-secondary)]">{foto.caption || 'Sense descripció'}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--superficie)]/35 text-[var(--text-primary)] bg-[var(--superficie-muted)] hover:bg-[var(--superficie-soft)]"
                  >
                    Ampliar
                  </button>
                  <a
                    href={foto.url}
                    download={`${safeFileName(foto.rutaNom)}-${index + 1}.jpg`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[var(--accent)] hover:opacity-90 no-underline"
                  >
                    Descarregar
                  </a>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {expanded && foto && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div className="relative max-w-6xl w-full">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute right-2 top-2 z-10 w-9 h-9 rounded-full bg-black/60 text-white border border-white/30"
              title="Tancar"
            >
              ✕
            </button>
            <img
              src={foto.url}
              alt={foto.caption || foto.rutaNom}
              className="w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
