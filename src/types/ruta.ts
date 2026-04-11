export type TipusRuta = 'carretera' | 'mtb' | 'urbà' | 'gravel' | 'altre';

export interface ImatgeRuta {
  id: string;
  url: string; // base64 o URL
  caption?: string;
}

export interface Ruta {
  id: string;
  data: string; // ISO date (YYYY-MM-DD)
  nom: string;
  distanciaKm?: number;
  duradaMinuts?: number;
  desnivellMetres?: number;
  alcadaMaximaMetres?: number;
  tipus?: TipusRuta;
  zona?: string;
  /** Contingut GPX com a string, per a ús futur (p. ex. traça al mapa). */
  gpxData?: string;
  dificultat?: number; // 1-5
  velocitatMitjana?: number;
  velocitatMaxima?: number;
  notes?: string;
  mapes: ImatgeRuta[];
  fotos: ImatgeRuta[];
  createdAt: string;
  updatedAt: string;
}

export type PeriodeInforme = 'mensual' | 'trimestral' | 'semestral' | 'anual';

/** Subconjunt documentat; la configuració completa viu a useRutes. */
export interface Configuracio {
  tema: 'clar' | 'fosc';
  colorAccent: string;
  colorAccent2?: string;
  colorSuperficie?: string;
  fontSans: string;
}
