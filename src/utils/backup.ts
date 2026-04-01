import type { Ruta, ImatgeRuta } from '../types/ruta';

/** Format de fitxer JSON de còpia completa (rutes + opcionalment configuració). */
export const BIKERIDE_BACKUP_VERSION = 1;

export interface BikeRideBackupFile {
  bikerideExportVersion: number;
  exportedAt: string;
  rutes: Ruta[];
  /** Objecte de configuració (es fusiona amb valors per defecte a la importació). */
  config?: Record<string, unknown>;
}

function isImatgeRuta(x: unknown): x is ImatgeRuta {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.url === 'string';
}

function isRuta(x: unknown): x is Ruta {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.data !== 'string' || typeof o.nom !== 'string') return false;
  if (typeof o.createdAt !== 'string' || typeof o.updatedAt !== 'string') return false;
  if (!Array.isArray(o.mapes) || !Array.isArray(o.fotos)) return false;
  if (!o.mapes.every(isImatgeRuta) || !o.fotos.every(isImatgeRuta)) return false;
  return true;
}

export function parseBikeRideBackup(raw: unknown): { ok: true; data: BikeRideBackupFile } | { ok: false; error: string } {
  if (raw === null || typeof raw !== 'object') {
    return { ok: false, error: 'El fitxer no és un objecte JSON vàlid.' };
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj.bikerideExportVersion !== 'number' || obj.bikerideExportVersion < 1) {
    return { ok: false, error: 'Falta bikerideExportVersion o no és compatible.' };
  }
  if (!Array.isArray(obj.rutes)) {
    return { ok: false, error: 'Falta l’array «rutes».' };
  }
  const rutes: Ruta[] = [];
  for (let i = 0; i < obj.rutes.length; i++) {
    if (!isRuta(obj.rutes[i])) {
      return { ok: false, error: `La ruta índex ${i} no té el format esperat (id, data, nom, mapes, fotos, dates).` };
    }
    rutes.push(obj.rutes[i] as Ruta);
  }

  const exportedAt = typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString();

  let config: Record<string, unknown> | undefined;
  if (obj.config !== undefined && obj.config !== null) {
    if (typeof obj.config !== 'object' || Array.isArray(obj.config)) {
      return { ok: false, error: 'El camp «config» no és vàlid.' };
    }
    config = obj.config as Record<string, unknown>;
  }

  return {
    ok: true,
    data: {
      bikerideExportVersion: obj.bikerideExportVersion,
      exportedAt,
      rutes,
      config,
    },
  };
}

export function buildBackupFile(rutes: Ruta[], config: Record<string, unknown>): string {
  const payload: BikeRideBackupFile = {
    bikerideExportVersion: BIKERIDE_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    rutes,
    config,
  };
  return JSON.stringify(payload, null, 2);
}

export function triggerDownloadJson(filename: string, json: string) {
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
