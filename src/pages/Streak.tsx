import { useMemo } from 'react';
import { useRutes } from '../store/useRutes';
import { EmptyState } from '../components/EmptyState';
import type { Ruta } from '../types/ruta';

function dillunsDe(d: Date): Date {
  const r = new Date(d);
  const dia = r.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  r.setDate(r.getDate() + diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

function clauSetmana(d: Date): string {
  const dl = dillunsDe(d);
  return `${dl.getFullYear()}-${String(dl.getMonth() + 1).padStart(2, '0')}-${String(dl.getDate()).padStart(2, '0')}`;
}

function calcularStreaks(rutes: Ruta[]): {
  streakActual: number;
  record: number;
  setmanesAmbActivitat: Set<string>;
} {
  const setmanes = new Set(rutes.map((r) => clauSetmana(new Date(r.data + 'T12:00:00'))));

  const sorted = Array.from(setmanes).sort().reverse();
  if (sorted.length === 0) {
    return { streakActual: 0, record: 0, setmanesAmbActivitat: setmanes };
  }

  const avui = new Date();
  const setmanaAvui = clauSetmana(avui);
  const setmanaPassada = clauSetmana(new Date(avui.getTime() - 7 * 24 * 60 * 60 * 1000));

  const iniciaDesde = setmanes.has(setmanaAvui)
    ? setmanaAvui
    : setmanes.has(setmanaPassada)
      ? setmanaPassada
      : null;

  let streakActual = 0;
  if (iniciaDesde) {
    let cursor = new Date(iniciaDesde + 'T12:00:00');
    while (setmanes.has(clauSetmana(cursor))) {
      streakActual++;
      cursor = new Date(cursor.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  let record = 0;
  let actual = 0;
  const sortedAsc = Array.from(setmanes).sort();
  for (let i = 0; i < sortedAsc.length; i++) {
    if (i === 0) {
      actual = 1;
      record = Math.max(record, actual);
      continue;
    }
    const prev = new Date(sortedAsc[i - 1] + 'T12:00:00');
    const curr = new Date(sortedAsc[i] + 'T12:00:00');
    const diff = Math.round((curr.getTime() - prev.getTime()) / (7 * 24 * 60 * 60 * 1000));
    actual = diff === 1 ? actual + 1 : 1;
    record = Math.max(record, actual);
  }
  record = Math.max(record, actual, streakActual);

  return { streakActual, record, setmanesAmbActivitat: setmanes };
}

function Flama({ streak }: { streak: number }) {
  const escala = Math.min(1 + streak * 0.08, 1.6);
  const color1 = streak >= 5 ? '#E85D24' : 'var(--accent2)';
  const color2 = streak >= 5 ? '#F2A623' : '#EF9F27';
  const color3 = streak >= 5 ? '#FCDE5A' : '#FAC775';

  return (
    <div
      style={{
        transform: `scale(${escala})`,
        transformOrigin: 'bottom center',
        transition: 'transform 0.5s ease',
      }}
    >
      <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes flamejant {
            0%,100% { d: path('M40,95 C20,80 10,65 15,45 C18,30 25,20 32,28 C28,15 35,5 40,8 C45,5 52,15 48,28 C55,20 62,30 65,45 C70,65 60,80 40,95 Z'); }
            50% { d: path('M40,95 C18,78 8,62 14,42 C17,27 24,17 33,26 C29,12 37,3 40,6 C43,3 51,12 47,26 C56,17 63,27 66,42 C72,62 62,78 40,95 Z'); }
          }
          @keyframes flamejant2 {
            0%,100% { d: path('M40,85 C25,70 22,55 28,40 C32,28 38,22 40,30 C42,22 48,28 52,40 C58,55 55,70 40,85 Z'); }
            50% { d: path('M40,85 C23,68 20,52 27,38 C31,26 37,20 40,28 C43,20 49,26 53,38 C60,52 57,68 40,85 Z'); }
          }
          .flama-ext { animation: flamejant 1.8s ease-in-out infinite; }
          .flama-int { animation: flamejant2 1.4s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .flama-ext, .flama-int { animation: none; }
          }
        `}</style>

        <path
          className="flama-ext"
          d="M40,95 C20,80 10,65 15,45 C18,30 25,20 32,28 C28,15 35,5 40,8 C45,5 52,15 48,28 C55,20 62,30 65,45 C70,65 60,80 40,95 Z"
          fill={color1}
        />

        <path
          className="flama-int"
          d="M40,85 C25,70 22,55 28,40 C32,28 38,22 40,30 C42,22 48,28 52,40 C58,55 55,70 40,85 Z"
          fill={color2}
        />

        <ellipse cx="40" cy="65" rx="8" ry="14" fill={color3} opacity={0.7} />
      </svg>
    </div>
  );
}

export default function Streak() {
  const { rutes } = useRutes();
  const { streakActual, record, setmanesAmbActivitat } = useMemo(() => calcularStreaks(rutes), [rutes]);

  const ultimesSetmanes = useMemo(() => {
    const avui = new Date();
    const setmanes: { clau: string; label: string; teActivitat: boolean }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(avui.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const clau = clauSetmana(d);
      const dl = dillunsDe(d);
      const label = dl.toLocaleDateString('ca-ES', {
        day: 'numeric',
        month: 'short',
      });
      setmanes.push({
        clau,
        label,
        teActivitat: setmanesAmbActivitat.has(clau),
      });
    }
    return setmanes;
  }, [setmanesAmbActivitat]);

  const msg =
    streakActual === 0
      ? 'Comença la teva ratxa aquesta setmana!'
      : streakActual < 3
        ? 'Bon inici! Mantén el ritme.'
        : streakActual < 6
          ? 'Ja enganxa! No ho deixis anar.'
          : streakActual < 10
            ? 'Impressionant constància!'
            : 'Llegenda del ciclisme. Increïble.';

  if (rutes.length === 0) {
    return (
      <div>
        <section className="mb-6">
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">Constància</p>
          <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
            Streak setmanal
          </h1>
        </section>
        <EmptyState
          titol="Sense dades de rutes"
          descripcio="Afegeix sortides per veure la teva ratxa setmanal."
          accio={{ label: 'Nova ruta', to: '/nova-ruta' }}
        />
      </div>
    );
  }

  return (
    <div>
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">Constància</p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
          Streak setmanal
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Setmanes consecutives amb almenys una sortida
        </p>
      </section>

      <div className="mb-10 flex flex-col items-center">
        <Flama streak={streakActual} />
        <div className="mt-2 text-center">
          <div className="text-8xl font-black leading-none text-[var(--accent)]">{streakActual}</div>
          <div className="mt-1 text-lg text-[var(--text-secondary)]">
            setmana{streakActual !== 1 ? 'es' : ''} consecutiva{streakActual !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="app-card flex flex-col gap-1 p-4 text-center">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Rècord màxim</div>
          <div className="text-4xl font-black text-[var(--accent2)]">{record}</div>
          <div className="text-sm text-[var(--text-secondary)]">setmanes</div>
        </div>
        <div className="app-card flex flex-col gap-1 p-4 text-center">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Total setmanes amb activitat</div>
          <div className="text-4xl font-black text-[var(--accent)]">{setmanesAmbActivitat.size}</div>
          <div className="text-sm text-[var(--text-secondary)]">setmanes</div>
        </div>
      </div>

      <p className="mb-8 text-center text-sm font-medium italic text-[var(--accent)]">{msg}</p>

      <div className="mb-4">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Últimes 12 setmanes</h2>
        <div className="flex flex-wrap gap-2">
          {ultimesSetmanes.map((s, i) => (
            <div key={s.clau} className="flex flex-col items-center gap-1">
              <div
                className="h-10 w-10 rounded-lg transition-all duration-300"
                style={{
                  background: s.teActivitat
                    ? i >= 10
                      ? 'var(--accent)'
                      : 'rgba(29,158,117,0.55)'
                    : 'var(--border)',
                }}
                title={`Setmana del ${s.label}: ${s.teActivitat ? 'amb sortida' : 'sense sortida'}`}
              />
              <span className="w-10 text-center text-[9px] leading-tight text-[var(--text-muted)]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {streakActual > 0 && (
        <p className="text-center text-xs text-[var(--text-muted)]">
          La ratxa es manté si fas almenys una sortida cada setmana (de dilluns a diumenge).
        </p>
      )}
    </div>
  );
}
