import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRutes } from '../store/useRutes';
import ImageUpload from '../components/ImageUpload';
import type { TipusRuta } from '../types/ruta';

const TIPUS_OPCIONS: { value: TipusRuta; label: string }[] = [
  { value: 'carretera', label: 'Carretera' },
  { value: 'mtb', label: 'MTB' },
  { value: 'urbà', label: 'Urbà' },
  { value: 'gravel', label: 'Gravel' },
  { value: 'altre', label: 'Altre' },
];

/** Comarques de Catalunya (ordre alfabètic) */
const COMARQUES_CATALUNYA: string[] = [
  'Alt Camp',
  'Alt Empordà',
  'Alt Penedès',
  'Alt Urgell',
  'Alta Ribagorça',
  'Anoia',
  'Bages',
  'Baix Camp',
  'Baix Ebre',
  'Baix Empordà',
  'Baix Llobregat',
  'Baix Penedès',
  'Barcelonès',
  'Berguedà',
  'Cerdanya',
  'Conca de Barberà',
  'Garraf',
  'Garrigues',
  'Garrotxa',
  'Gironès',
  'Maresme',
  'Montsià',
  'Noguera',
  'Osona',
  'Pallars Jussà',
  'Pallars Sobirà',
  'Pla d\'Urgell',
  'Pla de l\'Estany',
  'Priorat',
  'Ribera d\'Ebre',
  'Ripollès',
  'Segarra',
  'Segrià',
  'Selva',
  'Solsonès',
  'Tarragonès',
  'Terra Alta',
  'Urgell',
  'Val d\'Aran',
  'Vallès Occidental',
  'Vallès Oriental',
];

const emptyForm = {
  data: new Date().toISOString().slice(0, 10),
  nom: '',
  distanciaKm: undefined as number | undefined,
  duradaMinuts: undefined as number | undefined,
  desnivellMetres: undefined as number | undefined,
  alcadaMaximaMetres: undefined as number | undefined,
  tipus: undefined as TipusRuta | undefined,
  zona: '',
  dificultat: undefined as number | undefined,
  velocitatMitjana: undefined as number | undefined,
  velocitatMaxima: undefined as number | undefined,
  notes: '',
  mapes: [] as { id: string; url: string; caption?: string }[],
  fotos: [] as { id: string; url: string; caption?: string }[],
};

const inputClass = "w-full px-2.5 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";
const labelClass = "block text-xs font-medium text-[var(--text-secondary)] mb-0.5";

export default function RutaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRuta, addRuta, updateRuta } = useRutes();
  const [form, setForm] = useState(emptyForm);

  const isEdit = Boolean(id);
  const ruta = id ? getRuta(id) : null;

  useEffect(() => {
    if (!ruta) return;
    const next = {
      data: ruta.data.slice(0, 10),
      nom: ruta.nom,
      distanciaKm: ruta.distanciaKm,
      duradaMinuts: ruta.duradaMinuts,
      desnivellMetres: ruta.desnivellMetres,
      alcadaMaximaMetres: ruta.alcadaMaximaMetres,
      tipus: ruta.tipus,
      zona: ruta.zona ?? '',
      dificultat: ruta.dificultat,
      velocitatMitjana: ruta.velocitatMitjana,
      velocitatMaxima: ruta.velocitatMaxima,
      notes: ruta.notes ?? '',
      mapes: ruta.mapes ?? [],
      fotos: ruta.fotos ?? [],
    };
    queueMicrotask(() => setForm(next));
  }, [ruta]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && id) {
      updateRuta(id, { ...form, mapes: form.mapes, fotos: form.fotos });
    } else {
      addRuta({ ...form, mapes: form.mapes, fotos: form.fotos });
    }
    navigate('/rutes');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">
          {isEdit ? 'Editar ruta' : 'Nova ruta'}
        </p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
          {isEdit ? 'Revisa la sortida' : 'Afegeix una sortida'}
        </h1>
      </section>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Identificació */}
        <fieldset className="app-card space-y-3">
          <legend className="text-sm font-semibold text-[var(--text-primary)]">Identificació</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Data</label>
              <input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Nom de la ruta</label>
              <input type="text" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="ex. Volta al Collserola" className={inputClass} required />
            </div>
          </div>
        </fieldset>

        {/* 2. Context */}
        <fieldset className="app-card space-y-3">
          <legend className="text-sm font-semibold text-[var(--text-primary)]">Context</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Tipus</label>
              <select value={form.tipus ?? ''} onChange={(e) => setForm((f) => ({ ...f, tipus: (e.target.value || undefined) as TipusRuta }))} className={inputClass}>
                <option value="">—</option>
                {TIPUS_OPCIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Comarca de destí</label>
              <select value={form.zona} onChange={(e) => setForm((f) => ({ ...f, zona: e.target.value }))} className={inputClass}>
                <option value="">— Triar comarca —</option>
                {COMARQUES_CATALUNYA.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Dificultat (1-5)</label>
              <input type="number" min={1} max={5} value={form.dificultat ?? ''} onChange={(e) => setForm((f) => ({ ...f, dificultat: e.target.value ? Number(e.target.value) : undefined }))} className={inputClass} />
            </div>
          </div>
        </fieldset>

        {/* 3. Mètriques principals */}
        <fieldset className="app-card space-y-3">
          <legend className="text-sm font-semibold text-[var(--text-primary)]">Mètriques principals</legend>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Distància (km)</label>
              <input type="number" step={0.01} min={0} value={form.distanciaKm ?? ''} onChange={(e) => setForm((f) => ({ ...f, distanciaKm: e.target.value ? Number(e.target.value) : undefined }))} className={inputClass} placeholder="ex. 1,22" />
            </div>
            <div>
              <label className={labelClass}>Durada (min)</label>
              <input type="number" min={0} value={form.duradaMinuts ?? ''} onChange={(e) => setForm((f) => ({ ...f, duradaMinuts: e.target.value ? Number(e.target.value) : undefined }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Desnivell (m)</label>
              <input type="number" min={0} value={form.desnivellMetres ?? ''} onChange={(e) => setForm((f) => ({ ...f, desnivellMetres: e.target.value ? Number(e.target.value) : undefined }))} className={inputClass} />
            </div>
          </div>
        </fieldset>

        {/* 4. Rendiment */}
        <fieldset className="app-card space-y-3">
          <legend className="text-sm font-semibold text-[var(--text-primary)]">Rendiment</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Velocitat mitjana (km/h)</label>
              <input type="number" step={0.1} min={0} value={form.velocitatMitjana ?? ''} onChange={(e) => setForm((f) => ({ ...f, velocitatMitjana: e.target.value ? Number(e.target.value) : undefined }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Velocitat màxima (km/h)</label>
              <input type="number" step={0.1} min={0} value={form.velocitatMaxima ?? ''} onChange={(e) => setForm((f) => ({ ...f, velocitatMaxima: e.target.value ? Number(e.target.value) : undefined }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Alçada màxima (m)</label>
              <input type="number" min={0} value={form.alcadaMaximaMetres ?? ''} onChange={(e) => setForm((f) => ({ ...f, alcadaMaximaMetres: e.target.value ? Number(e.target.value) : undefined }))} className={inputClass} />
            </div>
          </div>
        </fieldset>

        {/* 5. Notes */}
        <fieldset className="app-card space-y-2">
          <legend className="text-sm font-semibold text-[var(--text-primary)]">Notes</legend>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputClass} resize-y`} />
        </fieldset>

        {/* 6. Multimèdia */}
        <fieldset className="app-card space-y-3">
          <legend className="text-sm font-semibold text-[var(--text-primary)]">Mapes i fotos</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUpload label="Mapes / plànols (imatge)" value={form.mapes} onChange={(mapes) => setForm((f) => ({ ...f, mapes }))} />
            <ImageUpload label="Fotos del recorregut" value={form.fotos} onChange={(fotos) => setForm((f) => ({ ...f, fotos }))} />
          </div>
        </fieldset>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--accent)] hover:opacity-90">
            {isEdit ? 'Desar' : 'Afegir ruta'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/rutes')}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-primary)] border border-[var(--superficie)]/35 bg-[var(--superficie-muted)] hover:bg-[var(--superficie-soft)]"
          >
            Cancel·lar
          </button>
        </div>
      </form>
    </div>
  );
}
