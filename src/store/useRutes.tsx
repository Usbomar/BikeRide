import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Ruta } from '../types/ruta';
import { buildBackupFile, triggerDownloadJson, type BikeRideBackupFile } from '../utils/backup';

const STORAGE_KEY = 'bikeride-rutes';
const CONFIG_KEY = 'bikeride-config';

function loadRutes(): Ruta[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return [];
    return JSON.parse(s);
  } catch {
    return [];
  }
}

function saveRutes(rutes: Ruta[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rutes));
}

export type Densitat = 'compact' | 'normal';
export type MidaLletra = 'petit' | 'normal' | 'gran';
export type Cantonades = 'suau' | 'normal' | 'marcat';
export type AmpladaContingut = 'estret' | 'normal' | 'ampli';
export type Animacions = 'normal' | 'reduides';
export type Contrast = 'normal' | 'alt';
export type VoraTargetes = 'subtil' | 'normal' | 'marcada';

export type ThemePreset = 'default' | 'neo' | 'retro' | 'terminal';

export type DashboardBlocId = 'kpis' | 'grafica' | 'ultimes';

export interface DashboardBlocLayout {
  id: DashboardBlocId;
  ordre: number;
}

export interface DashboardLayoutConfig {
  blocs: DashboardBlocLayout[];
}

export type RutaFormBlocId =
  | 'identificacio'
  | 'context'
  | 'metriques'
  | 'rendiment'
  | 'notes'
  | 'multimedia';

export interface RutaFormBlocLayout {
  id: RutaFormBlocId;
  ordre: number;
  visible: boolean;
}

export interface RutaFormLayoutConfig {
  blocs: RutaFormBlocLayout[];
}

export type RankingsBlocId =
  | 'resum'
  | 'podis'
  | 'principals'
  | 'records'
  | 'comarques'
  | 'topBarres'
  | 'altres';

export interface RankingsBlocLayout {
  id: RankingsBlocId;
  ordre: number;
  visible: boolean;
}

export interface RankingsLayoutConfig {
  blocs: RankingsBlocLayout[];
}

export type RutesListColumn =
  | 'data'
  | 'nom'
  | 'tipus'
  | 'zona'
  | 'distancia'
  | 'durada'
  | 'desnivell'
  | 'alcadaMaxima'
  | 'velocitatMaxima';

export type RutesListSortDirection = 'asc' | 'desc';

export interface RutesListConfig {
  visibleColumns: RutesListColumn[];
  sortBy: RutesListColumn;
  sortDirection: RutesListSortDirection;
}

export interface Configuracio {
  tema: 'clar' | 'fosc';
  preset: ThemePreset;
  colorAccent: string;
  colorAccent2: string;
  /** Color de superfície: fons de botons secundaris, taques suaus, àrees reomplertes (a part dels dos accents). */
  colorSuperficie: string;
  densitat: Densitat;
  midaLletra: MidaLletra;
  cantonades: Cantonades;
  ampladaContingut: AmpladaContingut;
  animacions: Animacions;
  contrast: Contrast;
  voraTargetes: VoraTargetes;
  dashboardLayout: DashboardLayoutConfig;
  rutaFormLayout: RutaFormLayoutConfig;
  rankingsLayout: RankingsLayoutConfig;
  rutesList: RutesListConfig;
}

const defaultConfig: Configuracio = {
  tema: 'clar',
  preset: 'default',
  colorAccent: '#0d9488',
  colorAccent2: '#ea580c',
  colorSuperficie: '#6366f1',
  densitat: 'normal',
  midaLletra: 'normal',
  cantonades: 'normal',
  ampladaContingut: 'normal',
  animacions: 'normal',
  contrast: 'normal',
  voraTargetes: 'normal',
  dashboardLayout: {
    blocs: [
      { id: 'kpis', ordre: 1 },
      { id: 'grafica', ordre: 2 },
      { id: 'ultimes', ordre: 3 },
    ],
  },
  rutaFormLayout: {
    blocs: [
      { id: 'identificacio', ordre: 1, visible: true },
      { id: 'context', ordre: 2, visible: true },
      { id: 'metriques', ordre: 3, visible: true },
      { id: 'rendiment', ordre: 4, visible: true },
      { id: 'notes', ordre: 5, visible: true },
      { id: 'multimedia', ordre: 6, visible: true },
    ],
  },
  rankingsLayout: {
    blocs: [
      { id: 'resum', ordre: 1, visible: true },
      { id: 'podis', ordre: 2, visible: true },
      { id: 'principals', ordre: 3, visible: true },
      { id: 'records', ordre: 4, visible: true },
      { id: 'comarques', ordre: 5, visible: true },
      { id: 'topBarres', ordre: 6, visible: true },
      { id: 'altres', ordre: 7, visible: true },
    ],
  },
  rutesList: {
    visibleColumns: [
      'data',
      'nom',
      'tipus',
      'zona',
      'distancia',
      'durada',
      'desnivell',
      'alcadaMaxima',
      'velocitatMaxima',
    ],
    sortBy: 'data',
    sortDirection: 'desc',
  },
};

function loadConfig(): Configuracio {
  try {
    const s = localStorage.getItem(CONFIG_KEY);
    if (!s) return defaultConfig;
    return { ...defaultConfig, ...JSON.parse(s) };
  } catch {
    return defaultConfig;
  }
}

function saveConfig(c: Configuracio) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
}

export type ImportBackupMode = 'replace' | 'merge';

export interface ImportBackupOptions {
  mode: ImportBackupMode;
  /** Si és cert, s’aplica la configuració del fitxer (tema, colors, layouts…). */
  includeConfig: boolean;
}

interface RutesContextValue {
  rutes: Ruta[];
  addRuta: (r: Omit<Ruta, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRuta: (id: string, r: Partial<Ruta>) => void;
  deleteRuta: (id: string) => void;
  getRuta: (id: string) => Ruta | undefined;
  config: Configuracio;
  setConfig: (c: Partial<Configuracio>) => void;
  /** Descarrega un JSON amb totes les rutes (text i imatges en base64) i la configuració actual. */
  downloadBackup: () => void;
  /** Importa un fitxer creat amb «Descarregar còpia». */
  importBackup: (data: BikeRideBackupFile, options: ImportBackupOptions) => void;
}

const RutesContext = createContext<RutesContextValue | null>(null);

export function RutesProvider({ children }: { children: ReactNode }) {
  const [rutes, setRutes] = useState<Ruta[]>(loadRutes);
  const [config, setConfigState] = useState<Configuracio>(loadConfig);

  const persistRutes = useCallback((next: Ruta[]) => {
    setRutes(next);
    saveRutes(next);
  }, []);

  const addRuta = useCallback((r: Omit<Ruta, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const nova: Ruta = {
      ...r,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    persistRutes([...rutes, nova]);
  }, [rutes, persistRutes]);

  const updateRuta = useCallback((id: string, patch: Partial<Ruta>) => {
    const next = rutes.map((x) =>
      x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x
    );
    persistRutes(next);
  }, [rutes, persistRutes]);

  const deleteRuta = useCallback((id: string) => {
    persistRutes(rutes.filter((x) => x.id !== id));
  }, [rutes, persistRutes]);

  const getRuta = useCallback((id: string) => rutes.find((x) => x.id === id), [rutes]);

  const setConfig = useCallback((c: Partial<Configuracio>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...c };
      saveConfig(next);
      return next;
    });
  }, []);

  const downloadBackup = useCallback(() => {
    const json = buildBackupFile(rutes, { ...config } as Record<string, unknown>);
    const name = `bikeride-export-${new Date().toISOString().slice(0, 10)}.json`;
    triggerDownloadJson(name, json);
  }, [rutes, config]);

  const importBackup = useCallback(
    (data: BikeRideBackupFile, options: ImportBackupOptions) => {
      if (options.mode === 'replace') {
        persistRutes(data.rutes);
      } else {
        const map = new Map(rutes.map((r) => [r.id, r]));
        for (const r of data.rutes) {
          map.set(r.id, r);
        }
        persistRutes([...map.values()]);
      }
      if (options.includeConfig && data.config) {
        const next = { ...defaultConfig, ...data.config } as Configuracio;
        setConfigState(next);
        saveConfig(next);
      }
    },
    [rutes, persistRutes]
  );

  const value = useMemo<RutesContextValue>(
    () => ({
      rutes,
      addRuta,
      updateRuta,
      deleteRuta,
      getRuta,
      config,
      setConfig,
      downloadBackup,
      importBackup,
    }),
    [rutes, addRuta, updateRuta, deleteRuta, getRuta, config, setConfig, downloadBackup, importBackup]
  );

  return <RutesContext.Provider value={value}>{children}</RutesContext.Provider>;
}

export function useRutes() {
  const ctx = useContext(RutesContext);
  if (!ctx) throw new Error('useRutes must be used within RutesProvider');
  return ctx;
}
