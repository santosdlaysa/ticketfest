import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeToggleProps {
  showLabel?: boolean;
}

const THEME_STORAGE_KEY = 'lumera-theme';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    theme === 'dark' ? '#0A0A0B' : '#F7F5FA'
  );
}

export function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme: Theme = savedTheme === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
    applyTheme(initialTheme);

    const syncTheme = () => {
      const nextTheme: Theme = window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
      setTheme(nextTheme);
    };
    window.addEventListener('lumera-theme-change', syncTheme);
    return () => window.removeEventListener('lumera-theme-change', syncTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    setTheme(nextTheme);
    window.dispatchEvent(new Event('lumera-theme-change'));
  };

  const targetLabel = theme === 'light' ? 'escuro' : 'claro';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Mudar para o tema ${targetLabel}`}
      title={`Mudar para o tema ${targetLabel}`}
      className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-lg border border-lumera-border bg-lumera-surface px-2 text-lumera-luminoso transition-colors hover:bg-lumera-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      {theme === 'light' ? (
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      )}
      {showLabel && <span className="text-sm font-medium">Tema {targetLabel}</span>}
    </button>
  );
}
