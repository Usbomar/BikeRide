import { useEffect, useMemo, useState } from 'react';
import { useRutes } from '../store/useRutes';
import { EmptyState } from '../components/EmptyState';

type MetricaRepte = 'km' | 'desnivell' | 'sortides';

interface RepteBase {
  id: string;
  titol: string;
  descripcio: string;
  metrica: MetricaRepte;
  objectiu: number;
  icona: 'roda' | 'muntanya' | 'sortida' | 'velocitat' | 'estrella';
  color: 'accent' | 'accent2';
}

interface ReptePersonalitzat extends RepteBase {
  personalitzat: true;
}

const REPTES_PREDEFINITS: RepteBase[] = [
  {
    id: 'repte-1000km',
    titol: '1.000 km acumulats',
    descripcio: 'Arriba als 1.000 km totals registrats.',
    metrica: 'km',
    objectiu: 1000,
    icona: 'roda',
    color: 'accent',
  },
  {
    id: 'repte-10000m',
    titol: '10.000 m de desnivell',
    descripcio: 'Acumula 10.000 metres de desnivell en total.',
    metrica: 'desnivell',
    objectiu: 10000,
    icona: 'muntanya',
    color: 'accent2',
  },
  {
    id: 'repte-50sortides',
    titol: '50 sortides',
    descripcio: 'Completa 50 sortides registrades.',
    metrica: 'sortides',
    objectiu: 50,
    icona: 'sortida',
    color: 'accent',
  },
  {
    id: 'repte-500km',
    titol: '500 km acumulats',
    descripcio: 'Primer gran fita: 500 km totals.',
    metrica: 'km',
    objectiu: 500,
    icona: 'roda',
    color: 'accent2',
  },
  {
    id: 'repte-5000m',
    titol: '5.000 m de desnivell',
    descripcio: 'La meitat del gran repte de desnivell.',
    metrica: 'desnivell',
    objectiu: 5000,
    icona: 'muntanya',
    color: 'accent',
  },
  {
    id: 'repte-25sortides',
    titol: '25 sortides',
    descripcio: 'Un quart de centenar de sortides.',
    metrica: 'sortides',
    objectiu: 25,
    icona: 'sortida',
    color: 'accent2',
  },
];

function IconaRepte({ tipus, size = 24 }: { tipus: RepteBase['icona']; size?: number }) {
  const s = size;
  if (tipus === 'roda') {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="9" />
        <line x1="12" y1="15" x2="12" y2="22" />
        <line x1="2" y1="12" x2="9" y2="12" />
        <line x1="15" y1="12" x2="22" y2="12" />
      </svg>
    );
  }
  if (tipus === 'muntanya') {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3,20 9,8 14,14 17,10 21,20" />
        <line x1="3" y1="20" x2="21" y2="20" />
      </svg>
    );
  }
  if (tipus === 'sortida') {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,8 16,12 12,16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    );
  }
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

function valorPerRepte(repte: RepteBase, valorActual: { km: number; desnivell: number; sortides: number }) {
  return valorActual[repte.metrica];
}

function TarjetaRepte({
  repte,
  valor,
  assolit,
  celebrant,
}: {
  repte: RepteBase | ReptePersonalitzat;
  valor: number;
  assolit: boolean;
  celebrant: boolean;
}) {
  const pct = Math.min((valor / repte.objectiu) * 100, 100);
  const colorVar = repte.color === 'accent' ? 'var(--accent)' : 'var(--accent2)';

  return (
    <div
      className={`app-card relative overflow-hidden transition-all duration-300 ${
        celebrant ? 'ring-2 ring-[var(--accent)]' : ''
      } ${assolit ? 'opacity-100' : 'opacity-90'}`}
    >
      {assolit && (
        <div className="absolute right-0 top-0 rounded-bl-lg bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
          Assolit
        </div>
      )}

      <div className="mb-3 flex items-start gap-3">
        <div
          className="shrink-0 rounded-lg p-2"
          style={{ background: `${colorVar}18`, color: colorVar }}
        >
          <IconaRepte tipus={repte.icona} size={22} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight text-[var(--text-primary)]">{repte.titol}</h3>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{repte.descripcio}</p>
        </div>
      </div>

      <div className="mb-1.5 flex items-end justify-between">
        <span className="text-xs text-[var(--text-muted)]">
          {repte.metrica === 'km'
            ? `${valor} km`
            : repte.metrica === 'desnivell'
              ? `${valor.toLocaleString('ca-ES')} m`
              : `${valor} sortides`}
        </span>
        <span className="text-xs font-bold" style={{ color: colorVar }}>
          {Math.round(pct)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: assolit ? `linear-gradient(90deg, ${colorVar}, var(--accent2))` : colorVar,
          }}
        />
      </div>

      <div className="mt-1.5 text-[10px] text-[var(--text-muted)]">
        Objectiu:{' '}
        {repte.metrica === 'km'
          ? `${repte.objectiu} km`
          : repte.metrica === 'desnivell'
            ? `${repte.objectiu.toLocaleString('ca-ES')} m`
            : `${repte.objectiu} sortides`}
      </div>

      {celebrant && (
        <div className="pointer-events-none absolute inset-0 animate-ping rounded-xl opacity-20 ring-4 ring-[var(--accent)]" />
      )}
    </div>
  );
}

function setsIguals(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) {
    if (!b.has(x)) return false;
  }
  return true;
}

export default function Reptes() {
  const { rutes } = useRutes();

  const [reptesCustom, setReptesCustom] = useState<ReptePersonalitzat[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bikeride-reptes-custom') ?? '[]') as ReptePersonalitzat[];
    } catch {
      return [];
    }
  });

  const [celebrant, setCelebrant] = useState<string | null>(null);
  const [modalObert, setModalObert] = useState(false);
  const [nouTitol, setNouTitol] = useState('');
  const [nouMetrica, setNouMetrica] = useState<MetricaRepte>('km');
  const [nouObjectiu, setNouObjectiu] = useState('');

  const [reptesAssolits, setReptesAssolits] = useState<Set<string>>(() => {
    try {
      const arr = JSON.parse(localStorage.getItem('bikeride-reptes-assolits') ?? '[]') as string[];
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  const valorActual = useMemo(
    () => ({
      km: Math.round(rutes.reduce((s, r) => s + (r.distanciaKm ?? 0), 0) * 10) / 10,
      desnivell: rutes.reduce((s, r) => s + (r.desnivellMetres ?? 0), 0),
      sortides: rutes.length,
    }),
    [rutes]
  );

  useEffect(() => {
    const tots = [...REPTES_PREDEFINITS, ...reptesCustom];
    const nou = new Set(reptesAssolits);
    let firstNew: string | null = null;
    for (const repte of tots) {
      if (!nou.has(repte.id) && valorActual[repte.metrica] >= repte.objectiu) {
        nou.add(repte.id);
        if (firstNew == null) firstNew = repte.id;
      }
    }
    if (setsIguals(nou, reptesAssolits)) return;
    localStorage.setItem('bikeride-reptes-assolits', JSON.stringify([...nou]));
    const tid = window.setTimeout(() => {
      setReptesAssolits(nou);
      if (firstNew != null) {
        setCelebrant(firstNew);
        window.setTimeout(() => setCelebrant(null), 3500);
      }
    }, 0);
    return () => window.clearTimeout(tid);
  }, [valorActual, reptesCustom, reptesAssolits]);

  const totalReptes = REPTES_PREDEFINITS.length + reptesCustom.length;
  const nombreAssolits = useMemo(() => {
    const ids = new Set([...REPTES_PREDEFINITS.map((r) => r.id), ...reptesCustom.map((r) => r.id)]);
    return [...reptesAssolits].filter((id) => ids.has(id)).length;
  }, [reptesAssolits, reptesCustom]);

  const assolitsPredef = useMemo(
    () => REPTES_PREDEFINITS.filter((r) => reptesAssolits.has(r.id)),
    [reptesAssolits]
  );

  const enProgresPredef = useMemo(() => {
    return REPTES_PREDEFINITS.filter((r) => !reptesAssolits.has(r.id))
      .map((r) => ({
        repte: r,
        valor: valorPerRepte(r, valorActual),
        pct: Math.min((valorPerRepte(r, valorActual) / r.objectiu) * 100, 100),
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [reptesAssolits, valorActual]);

  if (rutes.length === 0) {
    return (
      <div>
        <section className="mb-6">
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">Objectius</p>
          <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
            Reptes i objectius
          </h1>
        </section>
        <EmptyState
          titol="Sense rutes encara"
          descripcio="Afegeix sortides per fer seguiment dels reptes."
          accio={{ label: 'Nova ruta', to: '/nova-ruta' }}
        />
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">Objectius</p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
          Reptes i objectius
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {nombreAssolits} de {totalReptes} reptes assolits
        </p>
      </section>

      <div className="mb-8 flex flex-wrap gap-3">
        <div className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2">
          <span className="text-lg font-bold text-[var(--accent)] tabular-nums">{valorActual.km}</span>
          <span className="ml-1.5 text-xs text-[var(--text-muted)]">km actuals</span>
        </div>
        <div className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2">
          <span className="text-lg font-bold text-[var(--accent)] tabular-nums">
            {valorActual.desnivell.toLocaleString('ca-ES')}
          </span>
          <span className="ml-1.5 text-xs text-[var(--text-muted)]">m desnivell</span>
        </div>
        <div className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2">
          <span className="text-lg font-bold text-[var(--accent)] tabular-nums">{valorActual.sortides}</span>
          <span className="ml-1.5 text-xs text-[var(--text-muted)]">sortides</span>
        </div>
      </div>

      {assolitsPredef.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Ja aconseguits</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assolitsPredef.map((repte) => (
              <TarjetaRepte
                key={repte.id}
                repte={repte}
                valor={valorPerRepte(repte, valorActual)}
                assolit
                celebrant={celebrant === repte.id}
              />
            ))}
          </div>
        </section>
      )}

      {enProgresPredef.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">En progrés</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enProgresPredef.map(({ repte }) => (
              <TarjetaRepte
                key={repte.id}
                repte={repte}
                valor={valorPerRepte(repte, valorActual)}
                assolit={false}
                celebrant={celebrant === repte.id}
              />
            ))}
          </div>
        </section>
      )}

      {reptesCustom.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Els teus reptes</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reptesCustom.map((repte) => (
              <TarjetaRepte
                key={repte.id}
                repte={repte}
                valor={valorPerRepte(repte, valorActual)}
                assolit={reptesAssolits.has(repte.id)}
                celebrant={celebrant === repte.id}
              />
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setModalObert(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:opacity-95"
      >
        ＋ Nou repte
      </button>

      {modalObert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setModalObert(false)}
          role="presentation"
        >
          <div className="app-card mx-4 w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Nou repte</h2>

            <label className="mb-1 block text-xs text-[var(--text-muted)]">Nom del repte</label>
            <input
              value={nouTitol}
              onChange={(e) => setNouTitol(e.target.value)}
              placeholder="Ex: 200 km aquest mes"
              className="mb-3 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
            />

            <label className="mb-1 block text-xs text-[var(--text-muted)]">Mètrica</label>
            <select
              value={nouMetrica}
              onChange={(e) => setNouMetrica(e.target.value as MetricaRepte)}
              className="mb-3 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              <option value="km">Km acumulats</option>
              <option value="desnivell">Desnivell acumulat (m)</option>
              <option value="sortides">Nombre de sortides</option>
            </select>

            <label className="mb-1 block text-xs text-[var(--text-muted)]">Objectiu</label>
            <input
              type="number"
              value={nouObjectiu}
              onChange={(e) => setNouObjectiu(e.target.value)}
              placeholder="Ex: 200"
              className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalObert(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)]"
              >
                Cancel·lar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!nouTitol.trim() || !nouObjectiu) return;
                  const num = Number(nouObjectiu);
                  if (!Number.isFinite(num) || num <= 0) return;
                  const nou: ReptePersonalitzat = {
                    id: `custom-${Date.now()}`,
                    titol: nouTitol.trim(),
                    descripcio: `Objectiu personalitzat: ${nouObjectiu} ${
                      nouMetrica === 'km' ? 'km' : nouMetrica === 'desnivell' ? 'm' : 'sortides'
                    }`,
                    metrica: nouMetrica,
                    objectiu: num,
                    icona: 'estrella',
                    color: 'accent',
                    personalitzat: true,
                  };
                  const actualitzats = [...reptesCustom, nou];
                  setReptesCustom(actualitzats);
                  localStorage.setItem('bikeride-reptes-custom', JSON.stringify(actualitzats));
                  setNouTitol('');
                  setNouObjectiu('');
                  setModalObert(false);
                }}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
              >
                Crear repte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
