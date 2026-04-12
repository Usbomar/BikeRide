import { Link, useParams, useNavigate } from 'react-router-dom';
import { useRutes } from '../store/useRutes';
import { formatKm } from '../utils/format';

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('ca-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

export default function RutaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRuta, deleteRuta } = useRutes();
  const ruta = id ? getRuta(id) : null;

  if (!ruta) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)] mb-4">No s'ha trobat la ruta.</p>
        <Link to="/rutes" className="text-[var(--accent)] hover:underline">Tornar al llistat</Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('Segur que vols eliminar aquesta ruta?')) {
      deleteRuta(ruta.id);
      navigate('/rutes');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/rutes" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] no-underline">
          ← Rutes
        </Link>
        <div className="flex gap-2">
          <Link
            to={`/rutes/${ruta.id}/editar`}
            className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--superficie)] border border-[var(--superficie)]/45 bg-[var(--superficie-muted)] hover:bg-[var(--superficie-soft)] no-underline"
          >
            Editar
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            Eliminar
          </button>
        </div>
      </div>

      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
          Detall de la ruta
        </p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">{ruta.nom}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{formatDate(ruta.data)}</p>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {ruta.distanciaKm != null && (
          <div className="app-card">
            <div className="text-xl font-semibold text-[var(--accent)]">{formatKm(ruta.distanciaKm)}</div>
            <div className="text-xs text-[var(--text-muted)]">Distància</div>
          </div>
        )}
        {ruta.duradaMinuts != null && (
          <div className="app-card">
            <div className="text-xl font-semibold text-[var(--text-primary)]">
              {Math.floor(ruta.duradaMinuts / 60)}h {ruta.duradaMinuts % 60}min
            </div>
            <div className="text-xs text-[var(--text-muted)]">Durada</div>
          </div>
        )}
        {ruta.desnivellMetres != null && (
          <div className="app-card">
            <div className="text-xl font-semibold text-[var(--text-primary)]">{ruta.desnivellMetres} m</div>
            <div className="text-xs text-[var(--text-muted)]">Desnivell</div>
          </div>
        )}
        {ruta.velocitatMitjana != null && (
          <div className="app-card">
            <div className="text-xl font-semibold text-[var(--text-primary)]">{ruta.velocitatMitjana} km/h</div>
            <div className="text-xs text-[var(--text-muted)]">Vel. mitjana</div>
          </div>
        )}
        {ruta.velocitatMaxima != null && (
          <div className="app-card">
            <div className="text-xl font-semibold text-[var(--text-primary)]">{ruta.velocitatMaxima} km/h</div>
            <div className="text-xs text-[var(--text-muted)]">Vel. màxima</div>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-6 text-sm">
        {ruta.tipus && (
          <p><span className="text-[var(--text-muted)]">Tipus:</span> <span className="text-[var(--text-primary)]">{ruta.tipus}</span></p>
        )}
        {ruta.zona && (
          <p><span className="text-[var(--text-muted)]">Comarca:</span> <span className="text-[var(--text-primary)]">{ruta.zona}</span></p>
        )}
        {ruta.dificultat != null && (
          <p><span className="text-[var(--text-muted)]">Dificultat:</span> <span className="text-[var(--text-primary)]">{ruta.dificultat}/5</span></p>
        )}
        {ruta.alcadaMaximaMetres != null && (
          <p><span className="text-[var(--text-muted)]">Alçada màxima:</span> <span className="text-[var(--text-primary)]">{ruta.alcadaMaximaMetres} m</span></p>
        )}
        {ruta.notes && (
          <div className="app-card">
            <div className="text-[var(--text-muted)] mb-1">Notes</div>
            <p className="text-[var(--text-primary)] whitespace-pre-wrap">{ruta.notes}</p>
          </div>
        )}
      </div>

      {ruta.mapes.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Mapes / plànols</h2>
          <div className="grid grid-cols-1 gap-4">
            {ruta.mapes.map((img) => (
              <div key={img.id} className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
                <img src={img.url} alt={img.caption ?? 'Mapa'} className="w-full h-auto max-h-[400px] object-contain" />
                {img.caption && <p className="px-4 py-2 text-sm text-[var(--text-muted)]">{img.caption}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {ruta.fotos.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Fotos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {ruta.fotos.map((img) => (
              <div key={img.id} className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
                <img src={img.url} alt={img.caption ?? 'Foto'} className="w-full aspect-square object-cover" />
                {img.caption && <p className="px-3 py-2 text-xs text-[var(--text-muted)]">{img.caption}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
