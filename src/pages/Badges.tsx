import { useMemo, useState } from 'react';
import { useRutes } from '../store/useRutes';
import type { Ruta } from '../types/ruta';

interface Badge {
  id: string;
  titol: string;
  descripcio: string;
  icona: BadgeIcona;
  color: 'accent' | 'accent2' | 'blau' | 'verd' | 'vermell';
  categoria: 'distancia' | 'desnivell' | 'sortides' | 'velocitat' | 'especial';
}

type BadgeIcona =
  | 'roda'
  | 'muntanya'
  | 'llamp'
  | 'estrella'
  | 'trofeu'
  | 'foc'
  | 'coet'
  | 'bandera'
  | 'pedal'
  | 'corona'
  | 'diamant'
  | 'escut'
  | 'target'
  | 'infinit'
  | 'globe';

const BADGES: Badge[] = [
  {
    id: 'primers-pedals',
    titol: 'Primers pedals',
    descripcio: 'Registra la primera ruta',
    icona: 'roda',
    color: 'accent',
    categoria: 'distancia',
  },
  {
    id: 'cent-km',
    titol: 'Centurió',
    descripcio: '100 km acumulats',
    icona: 'bandera',
    color: 'accent',
    categoria: 'distancia',
  },
  {
    id: 'cinc-cents-km',
    titol: 'Mig mil·leni',
    descripcio: '500 km acumulats',
    icona: 'coet',
    color: 'accent',
    categoria: 'distancia',
  },
  {
    id: 'mil-km',
    titol: 'Mil·lenari',
    descripcio: '1.000 km acumulats',
    icona: 'corona',
    color: 'accent',
    categoria: 'distancia',
  },
  {
    id: 'ruta-llarga',
    titol: 'El gran dia',
    descripcio: 'Una ruta de més de 50 km',
    icona: 'target',
    color: 'accent2',
    categoria: 'distancia',
  },
  {
    id: 'primer-desnivell',
    titol: 'Alpinista novell',
    descripcio: 'Supera els 300 m de desnivell en una ruta',
    icona: 'muntanya',
    color: 'accent2',
    categoria: 'desnivell',
  },
  {
    id: 'cinc-mil-m',
    titol: 'Escalador',
    descripcio: '5.000 m de desnivell acumulat',
    icona: 'muntanya',
    color: 'accent2',
    categoria: 'desnivell',
  },
  {
    id: 'deu-mil-m',
    titol: 'Everest',
    descripcio: '10.000 m de desnivell acumulat',
    icona: 'diamant',
    color: 'accent2',
    categoria: 'desnivell',
  },
  {
    id: 'desnivell-500',
    titol: 'Cim exigent',
    descripcio: 'Una ruta amb més de 500 m de desnivell',
    icona: 'foc',
    color: 'accent2',
    categoria: 'desnivell',
  },
  {
    id: 'deu-sortides',
    titol: 'Costum',
    descripcio: '10 sortides registrades',
    icona: 'pedal',
    color: 'accent',
    categoria: 'sortides',
  },
  {
    id: 'vint-cinc-sortides',
    titol: 'Aficionat',
    descripcio: '25 sortides registrades',
    icona: 'estrella',
    color: 'accent',
    categoria: 'sortides',
  },
  {
    id: 'cinquanta-sortides',
    titol: 'Veterà',
    descripcio: '50 sortides registrades',
    icona: 'trofeu',
    color: 'accent',
    categoria: 'sortides',
  },
  {
    id: 'tres-tipus',
    titol: 'Versàtil',
    descripcio: 'Rutes de 3 tipus de bicicleta diferents',
    icona: 'infinit',
    color: 'accent2',
    categoria: 'sortides',
  },
  {
    id: 'trenta-kmh',
    titol: 'Acceleració',
    descripcio: 'Velocitat màxima superior a 30 km/h',
    icona: 'llamp',
    color: 'blau',
    categoria: 'velocitat',
  },
  {
    id: 'quaranta-kmh',
    titol: 'Ràpid',
    descripcio: 'Velocitat màxima superior a 40 km/h',
    icona: 'llamp',
    color: 'blau',
    categoria: 'velocitat',
  },
  {
    id: 'cinquanta-kmh',
    titol: 'Llamp',
    descripcio: 'Velocitat màxima superior a 50 km/h',
    icona: 'coet',
    color: 'vermell',
    categoria: 'velocitat',
  },
  {
    id: 'consistent',
    titol: 'Consistent',
    descripcio: 'Velocitat màxima > 35 km/h en 5 rutes',
    icona: 'target',
    color: 'blau',
    categoria: 'velocitat',
  },
  {
    id: 'explorador',
    titol: 'Explorador',
    descripcio: 'Rutes a 3 comarques diferents',
    icona: 'globe',
    color: 'verd',
    categoria: 'especial',
  },
  {
    id: 'tot-terreny',
    titol: 'Tot terreny',
    descripcio: 'Almenys 1 ruta de cada tipus (MTB, carretera, gravel)',
    icona: 'escut',
    color: 'verd',
    categoria: 'especial',
  },
  {
    id: 'centenari-desnivell',
    titol: 'Centenari dels cims',
    descripcio: '100 sortides O 10.000m O 1.000km — el que arribi primer',
    icona: 'diamant',
    color: 'accent',
    categoria: 'especial',
  },
];

function calcularBadgesAssolits(rutes: Ruta[]): Set<string> {
  const assolits = new Set<string>();
  const totalKm = rutes.reduce((s, r) => s + (r.distanciaKm ?? 0), 0);
  const totalDesn = rutes.reduce((s, r) => s + (r.desnivellMetres ?? 0), 0);
  const totalSortides = rutes.length;
  const velMax = Math.max(0, ...rutes.map((r) => r.velocitatMaxima ?? 0));
  const tipus = new Set(rutes.map((r) => r.tipus).filter(Boolean));
  const comarques = new Set(rutes.map((r) => r.zona).filter(Boolean));
  const rutaMaxKm = Math.max(0, ...rutes.map((r) => r.distanciaKm ?? 0));
  const rutaMaxDesn = Math.max(0, ...rutes.map((r) => r.desnivellMetres ?? 0));
  const rutesVel35 = rutes.filter((r) => (r.velocitatMaxima ?? 0) > 35).length;

  if (totalSortides >= 1) assolits.add('primers-pedals');
  if (totalKm >= 100) assolits.add('cent-km');
  if (totalKm >= 500) assolits.add('cinc-cents-km');
  if (totalKm >= 1000) assolits.add('mil-km');
  if (rutaMaxKm >= 50) assolits.add('ruta-llarga');
  if (rutaMaxDesn >= 300) assolits.add('primer-desnivell');
  if (totalDesn >= 5000) assolits.add('cinc-mil-m');
  if (totalDesn >= 10000) assolits.add('deu-mil-m');
  if (rutaMaxDesn >= 500) assolits.add('desnivell-500');
  if (totalSortides >= 10) assolits.add('deu-sortides');
  if (totalSortides >= 25) assolits.add('vint-cinc-sortides');
  if (totalSortides >= 50) assolits.add('cinquanta-sortides');
  if (tipus.size >= 3) assolits.add('tres-tipus');
  if (velMax > 30) assolits.add('trenta-kmh');
  if (velMax > 40) assolits.add('quaranta-kmh');
  if (velMax > 50) assolits.add('cinquanta-kmh');
  if (rutesVel35 >= 5) assolits.add('consistent');
  if (comarques.size >= 3) assolits.add('explorador');
  if (tipus.has('mtb') && tipus.has('carretera') && tipus.has('gravel')) assolits.add('tot-terreny');
  if (totalSortides >= 100 || totalDesn >= 10000 || totalKm >= 1000) assolits.add('centenari-desnivell');

  return assolits;
}

function BadgeIconaSVG({ icona, size = 24 }: { icona: BadgeIcona; size?: number }) {
  const s = size;
  const common = {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (icona === 'roda') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="9" />
        <line x1="12" y1="15" x2="12" y2="22" />
        <line x1="2" y1="12" x2="9" y2="12" />
        <line x1="15" y1="12" x2="22" y2="12" />
      </svg>
    );
  }
  if (icona === 'muntanya') {
    return (
      <svg {...common}>
        <polyline points="3,20 9,8 14,14 17,10 21,20" />
        <line x1="3" y1="20" x2="21" y2="20" />
      </svg>
    );
  }
  if (icona === 'llamp') {
    return (
      <svg {...common}>
        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
      </svg>
    );
  }
  if (icona === 'estrella') {
    return (
      <svg {...common}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    );
  }
  if (icona === 'trofeu') {
    return (
      <svg {...common}>
        <path d="M8 21h8v-2H8v2zm-1-4h10a1 1 0 0 0 1-1v-1H7v1a1 1 0 0 0 1 1z" />
        <path d="M7 8V6a5 5 0 0 1 10 0v2" />
        <path d="M5 8h14v2a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z" />
      </svg>
    );
  }
  if (icona === 'foc') {
    return (
      <svg {...common}>
        <path d="M12 3c-1 4-4 5-4 9 0 3 2 6 4 7 2-1 4-4 4-7 0-4-3-5-4-9z" />
        <path d="M12 14c-1 1-1 2 0 3 1-1 1-2 0-3z" />
      </svg>
    );
  }
  if (icona === 'coet') {
    return (
      <svg {...common}>
        <path d="M4 14l8-10 2 6 6 2-10 8-6-6z" />
        <path d="M14 6l2 2" />
        <path d="M5 19l3-3" />
      </svg>
    );
  }
  if (icona === 'bandera') {
    return (
      <svg {...common}>
        <line x1="5" y1="3" x2="5" y2="21" />
        <path d="M5 5l12 4-12 4V5z" />
      </svg>
    );
  }
  if (icona === 'pedal') {
    return (
      <svg {...common}>
        <circle cx="8" cy="16" r="3" />
        <circle cx="16" cy="8" r="3" />
        <path d="M10.5 14.5l3-3" />
      </svg>
    );
  }
  if (icona === 'corona') {
    return (
      <svg {...common}>
        <path d="M4 10l3-5 5 3 5-3 3 5v8H4v-8z" />
        <path d="M4 18h16" />
      </svg>
    );
  }
  if (icona === 'diamant') {
    return (
      <svg {...common}>
        <polygon points="12,4 20,12 12,20 4,12" />
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="4" y1="12" x2="20" y2="12" />
      </svg>
    );
  }
  if (icona === 'escut') {
    return (
      <svg {...common}>
        <path d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z" />
      </svg>
    );
  }
  if (icona === 'target') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    );
  }
  if (icona === 'infinit') {
    return (
      <svg {...common}>
        <path d="M6.5 12a3.5 3.5 0 1 1 0-4 3 3 0 0 1 2.8 2h2.4a3 3 0 0 1 2.8-2 3.5 3.5 0 1 1 0 4 3 3 0 0 1-2.8-2h-2.4a3 3 0 0 1-2.8 2z" />
      </svg>
    );
  }
  if (icona === 'globe') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <ellipse cx="12" cy="12" rx="4" ry="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M4 8c3 1 13 1 16 0M4 16c3-1 13-1 16 0" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function colorBadge(color: Badge['color'], assolit: boolean) {
  if (!assolit) {
    return {
      bg: 'var(--superficie-muted)',
      icon: 'var(--text-muted)',
      ring: 'transparent',
    };
  }
  const map = {
    accent: { bg: 'var(--accent-soft)', icon: 'var(--accent)', ring: 'var(--accent)' },
    accent2: { bg: 'var(--accent2-soft)', icon: 'var(--accent2)', ring: 'var(--accent2)' },
    blau: { bg: 'rgba(55,138,221,0.12)', icon: '#378ADD', ring: '#378ADD' },
    verd: { bg: 'rgba(99,153,34,0.12)', icon: '#639922', ring: '#639922' },
    vermell: { bg: 'rgba(226,75,74,0.12)', icon: '#E24B4A', ring: '#E24B4A' },
  };
  return map[color];
}

function BadgeCard({
  badge,
  assolit,
  iconSize = 32,
}: {
  badge: Badge;
  assolit: boolean;
  iconSize?: number;
}) {
  const colors = colorBadge(badge.color, assolit);
  return (
    <div
      title={assolit ? badge.descripcio : `Bloquejat: ${badge.descripcio}`}
      className={`flex aspect-square min-h-[100px] flex-col items-center justify-center gap-2 rounded-xl p-4 text-center transition-all duration-200 ${
        assolit
          ? 'cursor-default border border-transparent hover:scale-105'
          : 'border border-dashed border-[var(--border)] opacity-45'
      }`}
      style={{
        background: colors.bg,
        boxShadow: assolit
          ? `0 0 0 1.5px color-mix(in srgb, ${colors.ring} 40%, transparent)`
          : 'none',
      }}
    >
      <div style={{ color: colors.icon }}>
        <BadgeIconaSVG icona={badge.icona} size={iconSize} />
      </div>
      <span
        className={`text-xs font-semibold leading-tight ${
          assolit ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
        }`}
      >
        {badge.titol}
      </span>
      {!assolit && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-[var(--text-muted)] opacity-50"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
    </div>
  );
}

const ORDRE_BADGE = new Map(BADGES.map((b, i) => [b.id, i]));

const FILTRES: { id: 'tots' | Badge['categoria']; label: string }[] = [
  { id: 'tots', label: 'Tots' },
  { id: 'distancia', label: 'Distància' },
  { id: 'desnivell', label: 'Desnivell' },
  { id: 'sortides', label: 'Sortides' },
  { id: 'velocitat', label: 'Velocitat' },
  { id: 'especial', label: 'Especial' },
];

export default function Badges() {
  const { rutes } = useRutes();
  const assolits = useMemo(() => calcularBadgesAssolits(rutes), [rutes]);
  const [filtre, setFiltre] = useState<'tots' | Badge['categoria']>('tots');

  const pctCompletat = Math.round((assolits.size / BADGES.length) * 100);

  const ultimsTres = useMemo(
    () => BADGES.filter((b) => assolits.has(b.id)).slice(0, 3),
    [assolits]
  );

  const badgesOrdenats = useMemo(() => {
    const base = filtre === 'tots' ? BADGES : BADGES.filter((b) => b.categoria === filtre);
    return [...base].sort((a, b) => {
      const ao = assolits.has(a.id) ? 0 : 1;
      const bo = assolits.has(b.id) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return (ORDRE_BADGE.get(a.id) ?? 0) - (ORDRE_BADGE.get(b.id) ?? 0);
    });
  }, [filtre, assolits]);

  return (
    <div>
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">Col·lecció</p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
          Badges i assoliments
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {assolits.size} de {BADGES.length} badges obtinguts
        </p>
      </section>

      <div className="mb-8">
        <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pctCompletat}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
            }}
          />
        </div>
        <p className="mt-2 text-center text-sm text-[var(--text-muted)]">{pctCompletat}% completat</p>
      </div>

      {ultimsTres.length >= 1 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Últims obtinguts</h2>
          <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
            {ultimsTres.map((b) => (
              <div key={b.id} className="w-[140px] sm:w-[160px]">
                <BadgeCard badge={b} assolit iconSize={48} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltre(f.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filtre === f.id
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--superficie-muted)] text-[var(--text-secondary)] border border-[var(--superficie)]/25 hover:bg-[var(--superficie-soft)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {badgesOrdenats.map((b) => (
          <BadgeCard key={b.id} badge={b} assolit={assolits.has(b.id)} />
        ))}
      </div>
    </div>
  );
}
