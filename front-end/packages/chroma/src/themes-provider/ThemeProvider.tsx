import * as React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  resolvedTheme: 'light',
  setTheme: () => {},
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// Memoized media query for system preference
const darkModeQuery =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

function getSystemTheme(): 'light' | 'dark' {
  return darkModeQuery?.matches ? 'dark' : 'light';
}

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme;
}

function applyThemeToDOM(theme: Theme): void {
  if (typeof window === 'undefined') return;

  const root = window.document.documentElement;
  const resolved = getResolvedTheme(theme);

  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.setAttribute('data-theme', 'blue');
  root.setAttribute('data-mode', resolved);
  
  // Apply dark class to data-theme element for SCSS selector matching
  if (resolved === 'dark') {
    root.classList.add('dark');
  }
}

function safeLocalStorage(key: string, value?: string): string | null {
  try {
    if (value !== undefined) {
      localStorage.setItem(key, value);
      return value;
    }
    return localStorage.getItem(key);
  } catch {
    // Handle private browsing or quota exceeded
    return null;
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'sf-ui-theme',
}: ThemeProviderProps): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    const stored = safeLocalStorage(storageKey) as Theme | null;
    return stored || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return getResolvedTheme(theme);
  });

  // Handle system theme changes
  useEffect((): (() => void) | void => {
    if (theme !== 'system' || !darkModeQuery) return;

    const handleChange = (e: MediaQueryListEvent): void => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
      applyThemeToDOM(theme);
    };

    darkModeQuery.addEventListener('change', handleChange);
    return () => darkModeQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme to DOM
  useEffect((): void => {
    applyThemeToDOM(theme);
    setResolvedTheme(getResolvedTheme(theme));
  }, [theme]);

  const setTheme = useCallback(
    (newTheme: Theme): void => {
      safeLocalStorage(storageKey, newTheme);
      setThemeState(newTheme);
    },
    [storageKey]
  );

  const value = useMemo(
    () => ({
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme]
  );

  console.log('value', value);

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = (): ThemeProviderState => {

  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
