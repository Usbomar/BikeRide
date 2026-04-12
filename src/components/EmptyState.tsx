import { Link } from 'react-router-dom';

export interface EmptyStateProps {
  titol: string;
  descripcio?: string;
  accio?: { label: string; to: string };
  /** Per reduir padding dins de cards (ex. rànquings). */
  compact?: boolean;
}

export function EmptyState({ titol, descripcio, accio, compact }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-20'}`}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)]">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      </div>
      <h3 className="mb-1 text-base font-semibold text-[var(--text-primary)]">{titol}</h3>
      {descripcio && <p className="mb-4 max-w-xs text-sm text-[var(--text-muted)]">{descripcio}</p>}
      {accio && (
        <Link
          to={accio.to}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white no-underline transition-colors hover:bg-[var(--accent-hover)]"
        >
          {accio.label}
        </Link>
      )}
    </div>
  );
}
