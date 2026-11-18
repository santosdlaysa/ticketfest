interface PasswordVisibilityToggleProps {
  visible: boolean;
  onToggle: () => void;
  label: string;
}

export function PasswordVisibilityToggle({ visible, onToggle, label }: PasswordVisibilityToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
      aria-pressed={visible}
      className="absolute right-3 top-8 rounded p-1 text-lumera-muted transition-colors hover:text-lumera-luminoso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {visible ? (
          <>
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 8.7 4.5 9.5 6-.3.6-1.3 2-3.1 3.6" />
            <path d="M6.2 6.2C3.9 7.6 2.7 9.8 2.5 11c.8 1.5 4.3 6 9.5 6 1.1 0 2.1-.2 3-.6" />
          </>
        ) : (
          <>
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
            <circle cx="12" cy="12" r="2.5" />
          </>
        )}
      </svg>
    </button>
  );
}
