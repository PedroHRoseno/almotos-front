export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "almotos-theme";

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean
): ResolvedTheme {
  if (preference === "system") return prefersDark ? "dark" : "light";
  return preference;
}

export function applyResolvedTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/** Roda no <head> antes da pintura para evitar flash do tema errado. */
export const THEME_BOOTSTRAP = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var p=s==='light'||s==='dark'||s==='system'?s:'system';var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=p==='system'?(d?'dark':'light'):p;var e=document.documentElement;e.classList.toggle('dark',r==='dark');e.style.colorScheme=r;}catch(e){}})();`;
