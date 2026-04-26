import { useEffect, useMemo, useState } from 'react';

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    windspeed_10m_max: number[];
    weathercode: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    windspeed_10m: number[];
    weathercode: number[];
  };
}

interface UbicacioMeteo {
  nom: string;
  lat: number;
  lng: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const UBICACIO_INICIAL: UbicacioMeteo = {
  nom: 'Barberà del Vallès',
  lat: 41.5085,
  lng: 2.1274,
};

function buildMeteoUrl({ lat, lng }: UbicacioMeteo): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode',
    hourly: 'temperature_2m,precipitation,windspeed_10m,weathercode',
    timezone: 'Europe/Madrid',
    forecast_days: '7',
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

async function cercaMunicipiCatalunya(text: string): Promise<UbicacioMeteo | null> {
  const query = text.trim();
  if (!query) return null;

  const params = new URLSearchParams({
    q: `${query}, Catalunya, Spain`,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'es',
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as NominatimResult[];
  const first = data[0];
  if (!first) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { nom: query, lat, lng };
}

function descripcioMeteo(code: number): {
  label: string;
  icona: 'sol' | 'nuvolat' | 'boira' | 'pluja' | 'neu' | 'tempesta';
} {
  if (code === 0) return { label: 'Cel clar', icona: 'sol' };
  if (code <= 2) return { label: 'Parcialment ennuvolat', icona: 'nuvolat' };
  if (code === 3) return { label: 'Cobert', icona: 'nuvolat' };
  if (code <= 49) return { label: 'Boira', icona: 'boira' };
  if (code <= 67) return { label: 'Pluja', icona: 'pluja' };
  if (code <= 77) return { label: 'Neu', icona: 'neu' };
  if (code <= 82) return { label: 'Aiguaneu', icona: 'pluja' };
  return { label: 'Tempesta', icona: 'tempesta' };
}

function MeteoIcona({ tipus, size = 24 }: { tipus: ReturnType<typeof descripcioMeteo>['icona']; size?: number }) {
  const s = size;
  const c = { stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (tipus === 'sol') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" {...c}>
        <circle cx="12" cy="12" r="4" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 12 + Math.cos(rad) * 7;
          const y1 = 12 + Math.sin(rad) * 7;
          const x2 = 12 + Math.cos(rad) * 10;
          const y2 = 12 + Math.sin(rad) * 10;
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </svg>
    );
  }
  if (tipus === 'nuvolat') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" {...c}>
        <circle cx="8" cy="10" r="3" opacity={0.5} />
        <path d="M6 16h12a4 4 0 0 0 0-8 4 4 0 0 0-7.5-1.5A4 4 0 0 0 6 16z" />
      </svg>
    );
  }
  if (tipus === 'boira') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" {...c}>
        <path d="M4 8c2 1 4-1 6 0s4-1 6 0 4-1 6 0" />
        <path d="M3 12c2 1 5-1 7 0s5-1 7 0 5-1 7 0" />
        <path d="M4 16c2 1 4-1 6 0s4-1 6 0 4-1 6 0" />
      </svg>
    );
  }
  if (tipus === 'pluja') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" {...c}>
        <path d="M7 18h10a4 4 0 0 0 0-8 4 4 0 0 0-7.5-1.5A4 4 0 0 0 7 18z" />
        <line x1="9" y1="20" x2="9" y2="22" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="15" y1="20" x2="15" y2="22" />
      </svg>
    );
  }
  if (tipus === 'neu') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" {...c}>
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 12 + Math.cos(rad) * 2;
          const y1 = 12 + Math.sin(rad) * 2;
          const x2 = 12 + Math.cos(rad) * 7;
          const y2 = 12 + Math.sin(rad) * 7;
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" {...c}>
      <path d="M7 16h10a4 4 0 0 0 0-8 4 4 0 0 0-7.5-1.5A4 4 0 0 0 7 16z" />
      <polygon points="12,14 10,20 12,18 14,20" />
    </svg>
  );
}

function semaforo(
  tempMax: number,
  precipitacio: number,
  vent: number
): { estat: 'verd' | 'groc' | 'vermell'; text: string } {
  if (precipitacio > 3 || vent > 45 || tempMax < 5) {
    return { estat: 'vermell', text: 'No recomanat' };
  }
  if (precipitacio > 0.5 || vent > 30 || tempMax < 10) {
    return { estat: 'groc', text: 'Condicions acceptables' };
  }
  return { estat: 'verd', text: 'Bon dia per pedalar' };
}

const colorSemaforo = {
  verd: { bg: 'var(--accent-soft)', text: 'var(--accent-hover)', dot: 'var(--accent)' },
  groc: { bg: 'var(--accent2-soft)', text: 'var(--accent2-hover)', dot: 'var(--accent2)' },
  vermell: { bg: 'rgba(226,75,74,0.10)', text: '#A32D2D', dot: '#E24B4A' },
};

type DiaProps = {
  data: string;
  tempMax: number;
  tempMin: number;
  precipitacio: number;
  vent: number;
  weathercode: number;
  esCapSetmana: boolean;
  seleccionat?: boolean;
  onSelect?: () => void;
};

function DiaCard({
  data,
  tempMax,
  tempMin,
  precipitacio,
  vent,
  weathercode,
  esCapSetmana,
  seleccionat = false,
  onSelect,
}: DiaProps) {
  const desc = descripcioMeteo(weathercode);
  const sem = semaforo(tempMax, precipitacio, vent);
  const colors = colorSemaforo[sem.estat];
  const diaSemana = new Date(data + 'T12:00:00').toLocaleDateString('ca-ES', { weekday: 'long' });
  const diaNum = new Date(data + 'T12:00:00').toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`app-card flex min-h-0 flex-col gap-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/45 ${
        esCapSetmana ? 'min-h-[220px]' : ''
      } ${seleccionat ? 'ring-2 ring-[var(--accent)]/55' : esCapSetmana ? 'ring-1 ring-[var(--accent)]/30' : ''}`}
      style={esCapSetmana ? { background: colors.bg } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold capitalize text-[var(--text-primary)]">{diaSemana}</div>
          <div className="text-[11px] text-[var(--text-muted)]">{diaNum}</div>
        </div>
        {esCapSetmana && (
          <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-semibold text-white">
            Cap de setmana
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="text-[var(--accent)]">
          <MeteoIcona tipus={desc.icona} size={28} />
        </div>
        <span className="text-xs text-[var(--text-secondary)]">{desc.label}</span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black text-[var(--text-primary)]">{Math.round(tempMax)}°</span>
        <span className="text-sm text-[var(--text-muted)]">/ {Math.round(tempMin)}°</span>
      </div>

      <div className="grid grid-cols-2 gap-1 text-[11px] text-[var(--text-secondary)]">
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0C19 10 12 2 12 2z" />
          </svg>
          {precipitacio.toFixed(1)} mm
        </div>
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 6a3 3 0 0 1 6 0c0 3-6 3-6 9" />
            <path d="M6 12h12" />
            <path d="M6 18h8a3 3 0 0 0 0-6" />
          </svg>
          {Math.round(vent)} km/h
        </div>
      </div>

      <div className="mt-auto flex items-center gap-1.5 border-t border-[var(--border)] pt-1">
        <div className="h-2 w-2 rounded-full" style={{ background: colors.dot }} />
        <span className="text-[11px] font-medium" style={{ color: colors.text }}>
          {sem.text}
        </span>
      </div>
    </button>
  );
}

interface TramDia {
  etiqueta: string;
  hora: string;
  temperatura: number;
  precipitacio: number;
  vent: number;
  weathercode: number;
}

const HORES_TRAMS = [
  { etiqueta: 'Matí', hora: '06:00' },
  { etiqueta: 'Migdia', hora: '12:00' },
  { etiqueta: 'Tarda', hora: '18:00' },
  { etiqueta: 'Nit', hora: '21:00' },
] as const;

function tramsMeteoDia(meteo: OpenMeteoResponse, data: string): TramDia[] {
  return HORES_TRAMS.flatMap(({ etiqueta, hora }) => {
    const idx = meteo.hourly.time.findIndex((t) => t === `${data}T${hora}`);
    if (idx < 0) return [];
    return [
      {
        etiqueta,
        hora,
        temperatura: meteo.hourly.temperature_2m[idx],
        precipitacio: meteo.hourly.precipitation[idx],
        vent: meteo.hourly.windspeed_10m[idx],
        weathercode: meteo.hourly.weathercode[idx],
      },
    ];
  });
}

function DetallDia({ dia, trams }: { dia: DiaProps; trams: TramDia[] }) {
  const dataLlarga = new Date(dia.data + 'T12:00:00').toLocaleDateString('ca-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <section className="app-card mb-8 border border-[var(--accent)]/20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold capitalize text-[var(--text-primary)]">Detall del {dataLlarga}</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Condicions estimades per parts del dia</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {trams.map((tram) => {
          const desc = descripcioMeteo(tram.weathercode);
          return (
            <div key={`${dia.data}-${tram.hora}`} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">{tram.etiqueta}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{tram.hora}</div>
                </div>
                <div className="text-[var(--accent)]">
                  <MeteoIcona tipus={desc.icona} size={24} />
                </div>
              </div>
              <div className="text-xl font-black text-[var(--text-primary)]">{Math.round(tram.temperatura)}°</div>
              <div className="mt-1 text-[11px] text-[var(--text-secondary)]">{desc.label}</div>
              <div className="mt-3 grid gap-1 text-[11px] text-[var(--text-secondary)]">
                <span>{tram.precipitacio.toFixed(1)} mm pluja</span>
                <span>{Math.round(tram.vent)} km/h vent</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function millorDiaCapSetmana(dies: DiaProps[]): DiaProps | null {
  if (dies.length === 0) return null;
  const ordre = { verd: 0, groc: 1, vermell: 2 };
  const ambSem = dies.map((d) => ({
    d,
    sem: semaforo(d.tempMax, d.precipitacio, d.vent),
  }));
  ambSem.sort((a, b) => ordre[a.sem.estat] - ordre[b.sem.estat]);
  return ambSem[0]?.d ?? null;
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-xl bg-[var(--border)]" />
      ))}
    </>
  );
}

export default function Meteo() {
  const [meteo, setMeteo] = useState<OpenMeteoResponse | null>(null);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const [dataSeleccionada, setDataSeleccionada] = useState<string | null>(null);
  const [ubicacio, setUbicacio] = useState<UbicacioMeteo>(UBICACIO_INICIAL);
  const [ciutatInput, setCiutatInput] = useState(UBICACIO_INICIAL.nom);
  const [cercantCiutat, setCercantCiutat] = useState(false);
  const [errorCiutat, setErrorCiutat] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      setCarregant(true);
      setError(null);
    });
    fetch(buildMeteoUrl(ubicacio))
      .then((r) => {
        if (!r.ok) throw new Error('HTTP');
        return r.json();
      })
      .then((data: OpenMeteoResponse) => {
        if (cancelled) return;
        if (!data?.daily?.time?.length) throw new Error('Dades incompletes');
        setMeteo(data);
        setCarregant(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("No s'ha pogut obtenir la previsió.");
        setCarregant(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trigger, ubicacio]);

  const buscarCiutat = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCiutat(null);
    setCercantCiutat(true);
    try {
      const next = await cercaMunicipiCatalunya(ciutatInput);
      if (!next) {
        setErrorCiutat('No s’ha trobat aquest municipi. Prova amb el nom complet.');
        return;
      }
      setUbicacio(next);
      setDataSeleccionada(null);
    } catch (error) {
      console.error('BikeRide: no s’ha pogut cercar la ciutat', error);
      setErrorCiutat('No s’ha pogut cercar la ciutat. Torna-ho a provar.');
    } finally {
      setCercantCiutat(false);
    }
  };

  const dies = useMemo(() => {
    if (!meteo) return [];
    return meteo.daily.time.map((data, i) => ({
      data,
      tempMax: meteo.daily.temperature_2m_max[i],
      tempMin: meteo.daily.temperature_2m_min[i],
      precipitacio: meteo.daily.precipitation_sum[i],
      vent: meteo.daily.windspeed_10m_max[i],
      weathercode: meteo.daily.weathercode[i],
      esCapSetmana: [0, 6].includes(new Date(data + 'T12:00:00').getDay()),
    }));
  }, [meteo]);

  useEffect(() => {
    if (dies.length === 0) return;
    if (dataSeleccionada && dies.some((d) => d.data === dataSeleccionada)) return;
    setDataSeleccionada(dies[0].data);
  }, [dataSeleccionada, dies]);

  const diesLaboral = useMemo(
    () => dies.filter((d) => {
      const wd = new Date(d.data + 'T12:00:00').getDay();
      return wd >= 1 && wd <= 5;
    }),
    [dies]
  );

  const diesCapSetmana = useMemo(
    () => dies.filter((d) => {
      const wd = new Date(d.data + 'T12:00:00').getDay();
      return wd === 0 || wd === 6;
    }),
    [dies]
  );

  const millorDia = useMemo(() => millorDiaCapSetmana(diesCapSetmana), [diesCapSetmana]);
  const diaSeleccionat = useMemo(
    () => dies.find((d) => d.data === dataSeleccionada) ?? dies[0] ?? null,
    [dataSeleccionada, dies]
  );
  const tramsSeleccionats = useMemo(
    () => (meteo && diaSeleccionat ? tramsMeteoDia(meteo, diaSeleccionat.data) : []),
    [diaSeleccionat, meteo]
  );

  return (
    <div>
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">Planificació</p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
          Previsió del temps
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{ubicacio.nom} · 7 dies</p>
      </section>

      <form onSubmit={buscarCiutat} className="app-card mb-6 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Municipi de Catalunya</label>
          <input
            type="text"
            value={ciutatInput}
            onChange={(e) => setCiutatInput(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            placeholder="ex. Girona, Manresa, Vic..."
          />
          {errorCiutat && <p className="mt-1 text-xs text-[#A32D2D]">{errorCiutat}</p>}
        </div>
        <button
          type="submit"
          disabled={cercantCiutat || ciutatInput.trim().length === 0}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {cercantCiutat ? 'Cercant…' : 'Veure temps'}
        </button>
      </form>

      {carregant && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <SkeletonCards count={5} />
          </div>
          <div>
            <div className="mb-2 h-4 w-40 animate-pulse rounded bg-[var(--border)]" />
            <div className="grid grid-cols-2 gap-3">
              <SkeletonCards count={2} />
            </div>
          </div>
        </div>
      )}

      {error && !carregant && (
        <div className="app-card mb-6 flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          <button
            type="button"
            onClick={() => setTrigger((t) => t + 1)}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {!carregant && !error && meteo && (
        <>
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Dies laborables</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {diesLaboral.map((d) => (
                <DiaCard
                  key={d.data}
                  {...d}
                  esCapSetmana={false}
                  seleccionat={diaSeleccionat?.data === d.data}
                  onSelect={() => setDataSeleccionada(d.data)}
                />
              ))}
            </div>
          </div>

          {diesCapSetmana.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Cap de setmana</h2>
              {millorDia && (
                <p className="mb-3 text-sm text-[var(--text-secondary)]">
                  Millor dia per pedalar aquest cap de setmana:{' '}
                  <span className="font-medium text-[var(--accent)]">
                    {new Date(millorDia.data + 'T12:00:00').toLocaleDateString('ca-ES', { weekday: 'long' })}
                  </span>
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {diesCapSetmana.map((d) => (
                  <DiaCard
                    key={d.data}
                    {...d}
                    esCapSetmana
                    seleccionat={diaSeleccionat?.data === d.data}
                    onSelect={() => setDataSeleccionada(d.data)}
                  />
                ))}
              </div>
            </div>
          )}

          {diaSeleccionat && tramsSeleccionats.length > 0 && (
            <DetallDia dia={diaSeleccionat} trams={tramsSeleccionats} />
          )}
        </>
      )}

      <p className="text-[10px] text-[var(--text-muted)]">
        Dades: Open-Meteo (open-meteo.com) · Actualitzat en carregar la pàgina.
      </p>
    </div>
  );
}
