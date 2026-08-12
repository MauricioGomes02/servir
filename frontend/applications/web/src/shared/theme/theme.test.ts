import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, readThemePreference, setThemePreference } from './theme';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true })),
  );
});

describe('theme preference', () => {
  it('follows the system preference by default', () => {
    applyTheme(readThemePreference());
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('persists an explicit preference', () => {
    setThemePreference('light');
    expect(readThemePreference()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
