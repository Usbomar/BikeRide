/**
 * Redueix imatges abans d’emmagatzemar-les en base64 (localStorage té poc marge).
 * Escala el costat llarg a com a molt maxEdge px i comprimeix a JPEG o WebP.
 */
export async function compressImageFileToDataUrl(
  file: File,
  options: { maxEdge?: number; quality?: number } = {}
): Promise<string> {
  const maxEdge = options.maxEdge ?? 1600;
  const quality = options.quality ?? 0.82;

  const bitmap = await createImageBitmap(file);
  try {
    const w = bitmap.width;
    const h = bitmap.height;
    if (w === 0 || h === 0) {
      throw new Error('Imatge sense dimensions');
    }
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tw, th);
    ctx.drawImage(bitmap, 0, 0, tw, th);

    const webp = canvas.toDataURL('image/webp', quality);
    if (webp.startsWith('data:image/webp')) {
      return webp;
    }
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    bitmap.close?.();
  }
}
