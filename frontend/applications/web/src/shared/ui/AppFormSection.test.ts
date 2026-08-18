import { fireEvent, render, waitFor } from '@testing-library/vue';
import { defineComponent, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import AppFormSection from './AppFormSection.vue';

const FormSectionFixture = defineComponent({
  components: { AppFormSection },
  setup() {
    const open = ref(false);
    return { open };
  },
  template: `
    <button id="form-trigger" type="button" @click="open = true">Abrir formulário</button>
    <AppFormSection
      id="example-form"
      trigger-id="form-trigger"
      :open="open"
      title="Cadastrar membro"
      description="Informe os dados do membro."
    >
      <label for="member-name">Nome</label>
      <input id="member-name" />
      <template #actions>
        <button type="button" @click="open = false">Fechar formulário</button>
      </template>
    </AppFormSection>
  `,
});

describe('AppFormSection', () => {
  it('moves focus into the form when opened and restores it when closed', async () => {
    const view = render(FormSectionFixture);
    const trigger = view.getByRole('button', { name: 'Abrir formulário' });

    await fireEvent.click(trigger);
    await waitFor(() => expect(view.getByRole('textbox', { name: 'Nome' })).toHaveFocus());

    await fireEvent.click(view.getByRole('button', { name: 'Fechar formulário' }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
