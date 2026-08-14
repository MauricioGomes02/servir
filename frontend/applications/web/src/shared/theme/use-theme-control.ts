import { nextTick, onBeforeUnmount, ref } from 'vue';
import { readThemePreference, setThemePreference, type ThemePreference } from './theme';

export const themeOptions: readonly ThemePreference[] = ['system', 'light', 'dark'];

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function useThemeControl() {
  const preference = ref(readThemePreference());
  const open = ref(false);
  let panel: HTMLElement | undefined;
  let trigger: HTMLButtonElement | undefined;

  function setPanel(value: unknown): void {
    panel = value instanceof HTMLElement ? value : undefined;
  }

  function setTrigger(value: unknown): void {
    trigger = value instanceof HTMLButtonElement ? value : undefined;
  }

  function chooseTheme(value: ThemePreference): void {
    preference.value = value;
    setThemePreference(value);
  }

  function focusTheme(value = preference.value): void {
    panel?.querySelector<HTMLInputElement>(`#theme-${value}`)?.focus();
  }

  async function openMenu(): Promise<void> {
    open.value = true;
    await nextTick();
    focusTheme();
  }

  function closeMenu(restoreFocus = false): void {
    open.value = false;
    if (restoreFocus) trigger?.focus();
  }

  function toggleMenu(): void {
    if (open.value) closeMenu(true);
    else void openMenu();
  }

  function onThemeKeydown(event: KeyboardEvent): void {
    const currentIndex = themeOptions.indexOf(preference.value);
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % themeOptions.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + themeOptions.length) % themeOptions.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = themeOptions.length - 1;
    }

    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextPreference = themeOptions[nextIndex];
    if (!nextPreference) return;
    chooseTheme(nextPreference);
    focusTheme(nextPreference);
  }

  function onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && open.value) {
      closeMenu(true);
      return;
    }

    if (
      event.altKey &&
      event.shiftKey &&
      event.key.toLowerCase() === 't' &&
      !isEditableTarget(event.target)
    ) {
      event.preventDefault();
      toggleMenu();
    }
  }

  document.addEventListener('keydown', onDocumentKeydown);
  onBeforeUnmount(() => document.removeEventListener('keydown', onDocumentKeydown));

  return {
    chooseTheme,
    closeMenu,
    onThemeKeydown,
    open,
    preference,
    setPanel,
    setTrigger,
    themeOptions,
    toggleMenu,
  };
}
