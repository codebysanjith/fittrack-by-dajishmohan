'use client';

import { useState, useEffect } from 'react';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'segmented';
  className?: string;
}

export default function ThemeToggle({
  variant = 'pill',
  className = '',
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('fittrack_theme') as 'dark' | 'light' | null;
    const initialTheme = saved || (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    document.documentElement.setAttribute('data-theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('fittrack_theme', newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) {
    // Render placeholder to avoid layout shift before client hydrate
    return (
      <div className={`h-8 w-20 rounded-full bg-[var(--bg-hover)] opacity-50 ${className}`} />
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
        className={`p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-all ${className}`}
        title={`Switch to ${theme === 'dark' ? 'White' : 'Dark'} mode`}
        aria-label="Toggle dark and white mode"
      >
        {theme === 'dark' ? (
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="hidden sm:inline text-[11px]">Light</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <svg className="w-4 h-4 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span className="hidden sm:inline text-[11px]">Dark</span>
          </span>
        )}
      </button>
    );
  }

  // Segmented Pill Switcher (Dark | White)
  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm ${className}`}
      role="group"
      aria-label="Theme selection"
    >
      <button
        type="button"
        onClick={() => toggleTheme('dark')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          theme === 'dark'
            ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <svg className="w-3.5 h-3.5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <span>Dark</span>
      </button>

      <button
        type="button"
        onClick={() => toggleTheme('light')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          theme === 'light'
            ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>White</span>
      </button>
    </div>
  );
}
