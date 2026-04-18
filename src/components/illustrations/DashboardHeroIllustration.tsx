/** Il·lustració decorativa per al panell (SVG, colors del tema via currentColor). */
export default function DashboardHeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 360 200"
      className={className}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="dashSky" x1="180" y1="0" x2="180" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.06" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="dashHill" x1="0" y1="200" x2="0" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect width="360" height="120" fill="url(#dashSky)" />
      <circle cx="286" cy="44" r="20" fill="currentColor" fillOpacity="0.18" />
      <path
        d="M0 118 Q 72 72 148 96 T 292 88 T 360 78 V 200 H 0 Z"
        fill="url(#dashHill)"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="1"
      />
      <path
        d="M0 148 Q 100 120 200 138 T 360 128 V 200 H 0 Z"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <path
        d="M32 172 L 188 138 L 312 166"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <g
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      >
        <circle cx="178" cy="126" r="7" />
        <path d="M178 133 L 170 150 M178 133 L 192 142 M170 150 L 156 162 M170 150 L 184 162" />
        <circle cx="156" cy="166" r="10" />
        <circle cx="184" cy="166" r="10" />
        <path d="M156 166 L 142 166 M184 166 L 198 166" strokeOpacity="0.35" />
      </g>
    </svg>
  );
}
