/** Formata distància en km amb 2 decimals i separador decimal en català (ex. 1,22 km) */
export function formatKm(km: number): string {
  return `${km.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`;
}
