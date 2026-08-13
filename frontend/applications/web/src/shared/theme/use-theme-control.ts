import { onBeforeUnmount, ref } from 'vue';
import { readThemePreference, setThemePreference, type ThemePreference } from './theme';

export function useThemeControl() {
  const preference = ref(readThemePreference());
  const open = ref(false);
  let trigger: HTMLButtonElement | undefined;

  function setTrigger(value: unknown): void {
    trigger = value instanceof HTMLButtonElement ? value : undefined;
  }

  function chooseTheme(value: ThemePreference): void {
    preference.value = value;
    setThemePreference(value);
  }

  function closeMenu(restoreFocus = false): void {
    open.value = false;
    if (restoreFocus) trigger?.focus();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && open.value) closeMenu(true);
  }

  document.addEventListener('keydown', onKeydown);
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));

  return { chooseTheme, closeMenu, open, preference, setTrigger };
}
