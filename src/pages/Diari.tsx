import { useMemo, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useRutes } from '../store/useRutes';
import type { Ruta } from '../types/ruta';
import { EmptyState } from '../components/EmptyState';

function BarraEdicio({
  textareaRef,
  value,
  setValue,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  setValue: (s: string) => void;
}) {
  function inserirFormat(prefix: string, sufix: string = '') {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = value.slice(start, end);
    const nou = value.slice(0, start) + prefix + sel + sufix + value.slice(end);
    setValue(nou);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    });
  }

  const botons = [
    { label: 'N', title: 'Negreta', pre: '**', suf: '**' },
    { label: 'C', title: 'Cursiva', pre: '_', suf: '_' },
    { label: '—', title: 'Separador', pre: '\n---\n', suf: '' },
    { label: '·', title: 'Punt de llista', pre: '\n- ', suf: '' },
  ];

  return (
    <div className="mb-1 flex gap-1">
      {botons.map((b) => (
        <button
          key={b.label}
          type="button"
          title={b.title}
          onMouseDown={(e) => {
            e.preventDefault();
            inserirFormat(b.pre, b.suf);
          }}
          className="rounded border border-[var(--border)] px-2 py-0.5 text-xs font-bold text-[var(--text-secondary)] transition-colors hover:bg-[var(--superficie-muted)]"
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function RenderNota({ text }: { text: string }) {
  const html = escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\n/g, '<br/>');

  return (
    <div
      className="prose-sm text-sm leading-relaxed text-[var(--text-secondary)] [&_li]:my-0.5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function Diari() {
  const { rutes, updateRuta } = useRutes();
  const [rutaEditant, setRutaEditant] = useState<string | null>(null);
  const [textEdicio, setTextEdicio] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [desant, setDesant] = useState(false);
  const [mostrarSenseNota, setMostrarSenseNota] = useState(false);

  const rutesAmbNotes = useMemo(
    () =>
      rutes
        .filter((r) => r.notes && r.notes.trim().length > 0)
        .sort((a, b) => b.data.localeCompare(a.data)),
    [rutes]
  );

  const rutesSenseNota = useMemo(
    () => rutes.filter((r) => !r.notes || r.notes.trim() === '').sort((a, b) => b.data.localeCompare(a.data)),
    [rutes]
  );

  function obrirEdicio(ruta: Ruta) {
    setRutaEditant(ruta.id);
    setTextEdicio(ruta.notes ?? '');
  }

  function desarNota() {
    if (!rutaEditant) return;
    setDesant(true);
    updateRuta(rutaEditant, { notes: textEdicio });
    setTimeout(() => {
      setDesant(false);
      setRutaEditant(null);
    }, 400);
  }

  const rutaActual = rutes.find((r) => r.id === rutaEditant);

  return (
    <div>
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">Memòria</p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">Diari de rutes</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {rutesAmbNotes.length} entrades · {rutesSenseNota.length} rutes sense nota
        </p>
      </section>

      {rutesAmbNotes.length === 0 ? (
        <EmptyState
          titol="Encara no has escrit cap nota"
          descripcio="Clica «+ Afegir nota» a qualsevol ruta (secció de sota) per començar el teu diari de rutes."
        />
      ) : (
        <div className="relative mb-8 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--border)] md:before:left-[15px]">
          {rutesAmbNotes.map((ruta) => {
            const foto = ruta.fotos?.[0];
            const data = new Date(ruta.data + 'T12:00:00').toLocaleDateString('ca-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <article key={ruta.id} className="app-card relative ml-0 flex flex-col gap-3 pl-8 md:pl-10">
                <div
                  className="absolute left-0 top-4 h-3 w-3 rounded-full border-2 border-[var(--accent)] bg-[var(--bg-card)] md:left-1 md:top-5 md:h-3.5 md:w-3.5"
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/rutes/${ruta.id}`}
                      className="text-base font-semibold text-[var(--text-primary)] no-underline hover:text-[var(--accent)]"
                    >
                      {ruta.nom}
                    </Link>
                    <p className="mt-0.5 text-xs capitalize text-[var(--text-muted)]">{data}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => obrirEdicio(ruta)}
                    className="shrink-0 rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Editar
                  </button>
                </div>

                {foto && (
                  <img
                    src={foto.url}
                    alt={foto.caption ?? ruta.nom}
                    className="max-h-48 w-full rounded-lg object-cover"
                  />
                )}

                <RenderNota text={ruta.notes!} />

                <div className="mt-1 flex gap-3 border-t border-[var(--border)] pt-2 text-[11px] text-[var(--text-muted)]">
                  {ruta.distanciaKm != null && <span>{ruta.distanciaKm} km</span>}
                  {ruta.desnivellMetres != null && <span>{ruta.desnivellMetres} m desn.</span>}
                  {ruta.tipus && <span className="capitalize">{ruta.tipus}</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="app-card">
        <button
          type="button"
          onClick={() => setMostrarSenseNota((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-medium text-[var(--text-primary)]"
        >
          <span>
            Rutes sense nota
            <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">({rutesSenseNota.length})</span>
          </span>
          <span className="text-[var(--text-muted)]">{mostrarSenseNota ? '▲' : '▼'}</span>
        </button>

        {mostrarSenseNota && (
          <div className="mt-3 space-y-2">
            {rutesSenseNota.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between border-b border-[var(--border)] py-2 last:border-0"
              >
                <div>
                  <Link to={`/rutes/${r.id}`} className="text-sm text-[var(--text-primary)] no-underline hover:text-[var(--accent)]">
                    {r.nom}
                  </Link>
                  <span className="ml-2 text-xs text-[var(--text-muted)]">{r.data}</span>
                </div>
                <button
                  type="button"
                  onClick={() => obrirEdicio(r)}
                  className="rounded bg-[var(--accent)]/10 px-2 py-1 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
                >
                  + Afegir nota
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {rutaEditant != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setRutaEditant(null)}
          role="presentation"
        >
          <div
            className="app-card mx-4 flex max-h-[80vh] w-full max-w-lg flex-col gap-3 overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">{rutaActual?.nom}</h2>
              <button
                type="button"
                onClick={() => setRutaEditant(null)}
                className="text-lg leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Tancar"
              >
                ×
              </button>
            </div>

            <BarraEdicio textareaRef={textareaRef} value={textEdicio} setValue={setTextEdicio} />

            <textarea
              ref={textareaRef}
              value={textEdicio}
              onChange={(e) => setTextEdicio(e.target.value)}
              placeholder="Escriu les teves notes, records o anècdotes d'aquesta ruta..."
              className="min-h-[200px] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRutaEditant(null)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)]"
              >
                Cancel·lar
              </button>
              <button
                type="button"
                onClick={desarNota}
                disabled={desant}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60"
              >
                {desant ? 'Desant...' : 'Desar nota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
