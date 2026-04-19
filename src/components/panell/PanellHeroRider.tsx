/** Silueta decorativa central (colors del tema via currentColor / opacitats). */
export default function PanellHeroRider({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 220"
      className={className}
      fill="none"
      aria-hidden
    >
      <ellipse cx="140" cy="198" rx="118" ry="10" fill="currentColor" fillOpacity="0.08" />
      <path
        d="M20 165 Q 70 120 140 135 T 260 150 L 260 200 L 20 200 Z"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <path
        d="M0 175 L 40 130 L 90 150 L 140 110 L 200 140 L 240 125 L 280 160 L 280 220 L 0 220 Z"
        fill="currentColor"
        fillOpacity="0.04"
      />
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55">
        <circle cx="118" cy="72" r="14" />
        <path d="M118 86 L 108 118 L 95 155 M108 118 L 132 128 L 145 118 M95 155 L 78 168 M95 155 L 118 168" />
        <circle cx="78" cy="172" r="16" />
        <circle cx="132" cy="172" r="16" />
        <path d="M132 128 L 165 95 L 188 108" />
        <path d="M78 172 L 58 172 M132 172 L 152 172" strokeOpacity="0.4" />
      </g>
      <path
        d="M175 88 L 210 75 L 225 95 L 195 108 Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
    </svg>
  );
}
