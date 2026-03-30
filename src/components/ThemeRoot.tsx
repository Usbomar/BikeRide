import { useEffect, type ReactNode } from 'react';
import { useRutes } from '../store/useRutes';

function darkenHex(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ThemeRoot({ children }: { children: ReactNode }) {
  const { config } = useRutes();

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', config.tema);
    document.documentElement.setAttribute('data-preset', config.preset);
    document.documentElement.setAttribute('data-densitat', config.densitat);
    document.documentElement.setAttribute('data-mida-lletra', config.midaLletra);
    document.documentElement.setAttribute('data-cantonades', config.cantonades);
    document.documentElement.setAttribute('data-amplada', config.ampladaContingut);
    document.documentElement.setAttribute('data-animacions', config.animacions);
    document.documentElement.setAttribute('data-contrast', config.contrast);
    document.documentElement.setAttribute('data-vora-targetes', config.voraTargetes);
    const maxWidth = config.ampladaContingut === 'estret' ? '42rem' : config.ampladaContingut === 'ampli' ? '90rem' : '72rem';
    document.documentElement.style.setProperty('--app-max-width', maxWidth);
    document.documentElement.style.setProperty('--accent', config.colorAccent);
    document.documentElement.style.setProperty('--accent-hover', darkenHex(config.colorAccent, 20));
    document.documentElement.style.setProperty('--accent-soft', hexToRgba(config.colorAccent, 0.08));
    document.documentElement.style.setProperty('--accent2', config.colorAccent2);
    document.documentElement.style.setProperty('--accent2-hover', darkenHex(config.colorAccent2, 20));
    document.documentElement.style.setProperty('--accent2-soft', hexToRgba(config.colorAccent2, 0.12));
    document.documentElement.style.setProperty('--superficie', config.colorSuperficie);
    document.documentElement.style.setProperty('--superficie-hover', darkenHex(config.colorSuperficie, 22));
    document.documentElement.style.setProperty('--superficie-soft', hexToRgba(config.colorSuperficie, 0.14));
    document.documentElement.style.setProperty('--superficie-muted', hexToRgba(config.colorSuperficie, 0.07));
  }, [config]);

  return <>{children}</>;
}
