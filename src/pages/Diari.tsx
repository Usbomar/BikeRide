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
      className="diari-nota prose-sm max-w-none text-[15px] leading-[1.65] text-[var(--text-primary)] [&_em]:text-[var(--text-secondary)] [&_hr]:my-4 [&_hr]:border-[var(--border)] [&_li]:my-1 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-[var(--text-primary)]"
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
      <section className="mb-8">
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
        <div className="mb-10 space-y-8">
          {rutesAmbNotes.map((ruta) => {
            const foto = ruta.fotos?.[0];
            const d = new Date(ruta.data + 'T12:00:00');
            const dataLlarga = d.toLocaleDateString('ca-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            const mesCurt = d.toLocaleDateString('ca-ES', { month: 'short' });
            const any = d.getFullYear();

            return (
              <article
                key={ruta.id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-0 sm:flex-row sm:items-stretch">
                  <div className="flex shrink-0 flex-row items-center gap-3 border-b border-[var(--border)] bg-[linear-gradient(135deg,var(--accent-soft),transparent_55%)] px-4 py-3 sm:w-28 sm:flex-col sm:justify-center sm:border-b-0 sm:border-r sm:px-3 sm:py-5">
                    <span className="text-2xl font-black tabular-nums leading-none text-[var(--accent)] sm:text-3xl">
                      {d.getDate()}
                    </span>
                    <div className="flex flex-col sm:items-center sm:text-center">
                      <span className="text-[11px] font-semibold capitalize text-[var(--text-secondary)]">{mesCurt}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{any}</span>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)]/80 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[11px] capitalize leading-tight text-[var(--text-muted)] sm:hidden">{dataLlarga}</p>
                        <Link
                          to={`/rutes/${ruta.id}`}
                          className="mt-0.5 block text-lg font-bold leading-snug tracking-tight text-[var(--text-primary)] no-underline transition-colors hover:text-[var(--accent)] sm:mt-0"
                        >
                          {ruta.nom}
                        </Link>
                        <p className="mt-0.5 hidden text-xs capitalize text-[var(--text-muted)] sm:block">{dataLlarga}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => obrirEdicio(ruta)}
                        className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        Editar nota
                      </button>
                    </div>

                    {foto && (
                      <div className="border-b border-[var(--border)]/60">
                        <img
                          src={foto.url}
                          alt={foto.caption ?? ruta.nom}
                          className="max-h-56 w-full object-cover sm:max-h-64"
                        />
                      </div>
                    )}

                    <div className="px-4 pb-4 pt-4">
                      <div className="rounded-xl border border-[var(--border)]/50 bg-[var(--superficie-muted)]/35 px-4 py-3.5">
                        <RenderNota text={ruta.notes!} />
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--border)] px-4 py-3">
                      {ruta.distanciaKm != null && (
                        <span className="inline-flex items-center rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                          {ruta.distanciaKm} km
                        </span>
                      )}
                      {ruta.desnivellMetres != null && (
                        <span className="inline-flex items-center rounded-full bg-[var(--superficie-muted)] px-2.5 py-0.5 text-[11px] text-[var(--text-secondary)]">
                          {ruta.desnivellMetres} m desn.
                        </span>
                      )}
                      {ruta.tipus && (
                        <span className="inline-flex items-center rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[11px] capitalize text-[var(--text-muted)]">
                          {ruta.tipus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
        <button
          type="button"
          onClick={() => setMostrarSenseNota((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--superficie-muted)]/50"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
              {rutesSenseNota.length}
            </span>
            Rutes sense nota
          </span>
          <span className="text-lg leading-none text-[var(--text-muted)]">{mostrarSenseNota ? '▲' : '▼'}</span>
        </button>

        {mostrarSenseNota && (
          <div className="border-t border-[var(--border)] px-2 pb-3 pt-1">
            {rutesSenseNota.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 rounded-xl px-2 py-2.5 transition-colors hover:bg-[var(--superficie-muted)]/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    to={`/rutes/${r.id}`}
                    className="text-sm font-medium text-[var(--text-primary)] no-underline hover:text-[var(--accent)]"
                  >
                    {r.nom}
                  </Link>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{r.data}</span>
                </div>
                <button
                  type="button"
                  onClick={() => obrirEdicio(r)}
                  className="shrink-0 self-start rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:self-center"
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
