/**
 * Theme utilities for managing theme state
 */

export type ColorTheme = "blue";
export type ThemeMode = "light" | "dark";

export const COLOR_THEMES = [
  { value: "blue", label: "Blue", emoji: "🔵" },
] as const satisfies ReadonlyArray<{
  value: ColorTheme;
  label: string;
  emoji: string;
}>;

export type ColorThemeOption = (typeof COLOR_THEMES)[number];

// Memoized set for O(1) color theme validation
const COLOR_THEME_SET = new Set<string>(COLOR_THEMES.map((t) => t.value));

function isColorTheme(value: string | null): value is ColorTheme {
  return value !== null && COLOR_THEME_SET.has(value);
}

function safeLocalStorage(key: string, value?: string): string | null {
  try {
    if (value !== undefined) {
      localStorage.setItem(key, value);
      return value;
    }
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getAvailableColorThemes(): ReadonlyArray<ColorThemeOption> {
  return COLOR_THEMES;
}

export function applyColorTheme(theme: ColorTheme): void {
  if (typeof window === "undefined") return;
  window.document.documentElement.setAttribute("data-theme", theme);
}

export function initializeColorTheme(
  storageKey = "sf-color-theme",
  defaultTheme: ColorTheme = "blue"
): ColorTheme {
  if (typeof window === "undefined") return defaultTheme;

  const stored = safeLocalStorage(storageKey);
  const fromDom = window.document.documentElement.getAttribute("data-theme");

  const theme =
    (isColorTheme(stored) && stored) ||
    (isColorTheme(fromDom) && fromDom) ||
    defaultTheme;
  applyColorTheme(theme);
  return theme;
}

export function setColorTheme(
  theme: ColorTheme,
  storageKey = "sf-color-theme"
): void {
  if (typeof window === "undefined") return;
  safeLocalStorage(storageKey, theme);
  applyColorTheme(theme);
}

/**
 * Get the current resolved theme from DOM
 * @returns 'light' or 'dark' (never 'system')
 */
export function getResolvedTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  const root = window.document.documentElement;
  return root.classList.contains("dark") ? "dark" : "light";
}
