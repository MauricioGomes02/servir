<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue';
import { AppButton, AppIcon } from '@/shared/ui';
import { useI18n } from '@/shared/i18n';

const emit = defineEmits<{ opened: [] }>();
const { t } = useI18n();
const open = ref(false);
const trigger = ref<HTMLButtonElement>();
const panel = ref<HTMLElement>();

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

async function openHelp(): Promise<void> {
  emit('opened');
  open.value = true;
  await nextTick();
  panel.value?.querySelector<HTMLElement>('button')?.focus();
}

function closeHelp(restoreFocus = false): void {
  open.value = false;
  if (restoreFocus) trigger.value?.focus();
}

function toggleHelp(): void {
  if (open.value) closeHelp(true);
  else void openHelp();
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) {
    closeHelp(true);
    return;
  }

  if (event.key === '?' && !isEditableTarget(event.target) && !open.value) {
    event.preventDefault();
    void openHelp();
  }
}

document.addEventListener('keydown', onDocumentKeydown);
onBeforeUnmount(() => document.removeEventListener('keydown', onDocumentKeydown));
defineExpose({ close: () => closeHelp(false) });
</script>

<template>
  <div class="keyboard-help-control">
    <button
      id="keyboard-help-trigger"
      ref="trigger"
      class="icon-button"
      type="button"
      :aria-label="t('keyboard_help.open')"
      aria-haspopup="dialog"
      :aria-expanded="open"
      aria-controls="keyboard-help"
      @click="toggleHelp"
    >
      <AppIcon name="keyboard" />
    </button>
    <section
      v-if="open"
      id="keyboard-help"
      ref="panel"
      class="keyboard-help-panel"
      role="dialog"
      :aria-labelledby="'keyboard-help-title'"
      :aria-describedby="'keyboard-help-description'"
    >
      <header>
        <div>
          <p class="eyebrow">{{ t('keyboard_help.eyebrow') }}</p>
          <h2 id="keyboard-help-title">{{ t('keyboard_help.title') }}</h2>
        </div>
        <AppButton size="small" variant="tertiary" @click="closeHelp(true)">
          {{ t('keyboard_help.close') }}
        </AppButton>
      </header>
      <p id="keyboard-help-description">{{ t('keyboard_help.description') }}</p>
      <dl>
        <div>
          <dt><kbd>?</kbd></dt>
          <dd>{{ t('keyboard_help.open_command') }}</dd>
        </div>
        <div>
          <dt><kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd></dt>
          <dd>{{ t('keyboard_help.tab') }}</dd>
        </div>
        <div>
          <dt><kbd>Enter</kbd> / <kbd>Space</kbd></dt>
          <dd>{{ t('keyboard_help.activate') }}</dd>
        </div>
        <div>
          <dt><kbd>Esc</kbd></dt>
          <dd>{{ t('keyboard_help.escape') }}</dd>
        </div>
      </dl>
      <p class="keyboard-help-note">{{ t('keyboard_help.skip_links') }}</p>
    </section>
  </div>
</template>

<style src="./keyboard-help.css"></style>
