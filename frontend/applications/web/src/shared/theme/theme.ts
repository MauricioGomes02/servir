export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'servir.theme';

export function readThemePreference(): ThemePreference {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function applyTheme(preference: ThemePreference): void {
  const resolved =
    preference === 'system'
      ? matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function setThemePreference(preference: ThemePreference): void {
  if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, preference);
  applyTheme(preference);
}

export function initializeTheme(): void {
  const preference = readThemePreference();
  applyTheme(preference);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (readThemePreference() === 'system') applyTheme('system');
  });
}
