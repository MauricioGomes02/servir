# Button

## Objetivo

Button representa uma ação pontual ou mudança de estado. O usuário deve reconhecer que o elemento é interativo, prever o resultado, atingir o alvo, perceber foco e pressão, receber feedback e executar a ação por ponteiro, toque, teclado ou tecnologia assistiva.

Clareza, previsibilidade, acessibilidade e feedback têm prioridade sobre decoração. Cor, radius e sombra reforçam o contrato; não o definem.

## Escolha do elemento

| Componente | Usar quando | Não usar quando |
| --- | --- | --- |
| Button | Executa ação ou muda estado. | A intenção principal é navegar. |
| Link | Navega para outro recurso ou URL. | Executa somente uma ação local. |
| Toggle ou switch | Controla estado persistente ligado/desligado. | Executa ação pontual. |
| Checkbox | Seleciona opções independentes. | A seleção deve produzir ação imediata. |
| Radio | Escolhe uma opção mutuamente exclusiva. | As escolhas são independentes. |
| Tab | Alterna seções relacionadas no mesmo contexto. | Executa uma ação. |
| Menu trigger | Revela opções ou ações. | É a ação principal do contexto. |

A aparência não muda a semântica. Um `RouterLink` pode compartilhar tokens visuais de ação, mas não se torna Button. `div` e `span` clicáveis não substituem `<button>` sem necessidade técnica real.

## Anatomia

- **Hit area:** região clicável ou tocável, potencialmente maior que a forma visual.
- **Container:** superfície que comunica affordance, prioridade e risco.
- **Label:** nome visível e previsível da ação.
- **Ícone:** reforço opcional do significado.
- **Estado:** default, hover, focus-visible, pressed, disabled e loading; success e error pertencem ao fluxo quando necessários.
- **Feedback:** confirmação de recebimento, progresso e resultado.
- **Semântica:** elemento nativo, nome acessível e comportamento correto.

## Labels e conteúdo

- Preferir verbo e objeto: “Criar ministério”, “Salvar alterações”, “Excluir atividade”.
- Evitar “OK”, “Sim”, “Não”, “Confirmar” e “Continuar” quando forem ambíguos.
- Descrever o resultado esperado e usar a linguagem do usuário.
- O label corresponde exatamente ao comportamento.
- A largura se adapta à tradução; ações críticas não são truncadas a ponto de perder significado.
- Ícones são familiares e consistentes e não substituem labels em ações importantes.
- Icon-only é exceção, exige contexto inequívoco e nome acessível. Tooltip é complemento, nunca a única explicação.

## Hierarquia e variantes

| Variante | Uso | Antiuso |
| --- | --- | --- |
| `primary` | Ação principal do contexto. | Tornar toda ação visualmente dominante. |
| `secondary` | Ação relevante que não deve dominar. | Representar uma ação de risco. |
| `tertiary` | Ação de baixa ênfase ou apoio. | Esconder uma ação necessária à tarefa. |
| `destructive` | Ação explícita com risco ou perda. | Usar somente para chamar atenção. |

Prioridade, frequência, risco e contexto determinam hierarquia; não existe regra cega de exatamente um primary por página. O mesmo significado usa a mesma variante, e variantes permanecem poucas e intencionais.

## Tamanhos, alvo e posicionamento

| Tamanho | Altura inicial | Uso |
| --- | --- | --- |
| `small` | 36px | Contextos densos, preservando distância entre alvos. |
| `medium` | 44px | Uso geral. |
| `large` | 48px | CTA e conforto adicional, especialmente mobile. |

O mínimo WCAG 2.2 de 24 por 24 CSS px possui condições e exceções; não é o alvo universal ideal. O produto prefere 40–48px quando o contexto permite. Controles pequenos não ficam adjacentes sem espaçamento suficiente.

A ação fica próxima do conteúdo que modifica ou confirma. Ações críticas e frequentes permanecem acessíveis; ações secundárias de baixa frequência podem usar revelação progressiva. `fullWidth` é apropriado quando melhora alcance e leitura, especialmente em telas estreitas.

## Estados de interação

| Estado | Contrato |
| --- | --- |
| Default | Comunica disponibilidade e hierarquia. |
| Hover | Indica apontamento com mudança sutil; nunca é requisito de uso. |
| Focus-visible | Mostra inequivocamente a posição do teclado. |
| Pressed | Confirma imediatamente a ativação. |
| Disabled | Comunica indisponibilidade sem ocultar contexto necessário. |
| Loading | Confirma recebimento e impede duplicação quando apropriado. |

O ciclo esperado é intenção, ação, feedback e resultado. Operações lentas mostram progresso. Operações não idempotentes impedem duplicação quando necessário. Loading preserva o label visível, evita mudança brusca de largura e expõe `aria-busy`. Success e error são comunicados pelo fluxo consumidor, que também oferece recuperação.

Operações reversíveis devem considerar “Desfazer” em vez de confirmação excessiva. Animação comunica estado, não decoração.

## Ações destrutivas

- Usar label explícito, como “Excluir atividade”.
- Comunicar consequências relevantes antes da ação quando necessário.
- Usar cor de perigo como reforço, nunca como único indicador.
- Preferir reversibilidade quando tecnicamente possível.
- Não transformar toda exclusão em modal se desfazer for mais eficiente.
- Não usar confirmshaming, urgência artificial ou outros dark patterns.

## Acessibilidade

- Usar `<button>` para ações.
- Garantir nome acessível e ativação nativa por teclado.
- Manter `:focus-visible` claro; nunca remover outline sem alternativa equivalente.
- Não depender somente de cor.
- Validar contraste, zoom, aumento de texto e labels longos.
- Preservar target size e espaçamento adequados.
- Respeitar `prefers-reduced-motion`.
- Garantir que overlays, headers fixos e modais não ocultem o foco.
- Icon-only exige nome acessível obrigatório.

## Aparência e tokens

Tokens centralizam altura, padding, gap, radius e motion. Tipografia é legível; whitespace separa ações; sombras são opcionais; cores expressam hierarquia e semântica. O componente não depende de largura fixa.

```text
button-height-small       36px
button-height-medium      44px
button-height-large       48px
button-padding-inline     20px
button-gap                8px
button-radius             linguagem visual do produto
button-motion-duration    160ms
```

Valores são pontos de partida calibrados aos tokens do Servir e precisam continuar válidos em temas claro e escuro.

## Contrato implementado

```ts
type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type ButtonSize = 'small' | 'medium' | 'large';

interface AppButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}
```

O slot padrão contém o label. Slots `leading` e `trailing` aceitam ícones decorativos que reforçam o texto. Icon-only não integra este contrato enquanto não houver consumidor real que justifique uma variante com accessible name obrigatório.

## Checklist de implementação e revisão

### Semântica e conteúdo

- [ ] É realmente uma ação, e não navegação ou seleção?
- [ ] O comportamento corresponde ao significado?
- [ ] O label descreve o resultado com verbo e objeto quando apropriado?
- [ ] Labels longos e traduções preservam significado?
- [ ] Icon-only, quando excepcionalmente usado, possui nome acessível?

### Interação e feedback

- [ ] Default, hover, focus-visible e pressed são distintos?
- [ ] Disabled e loading são semanticamente diferentes?
- [ ] Loading impede duplicação quando necessário e preserva o label?
- [ ] O usuário percebe quando a ação foi recebida e concluída?
- [ ] Erro permite recuperação e reversibilidade foi considerada?

### Acessibilidade

- [ ] Funciona por teclado e leitor de tela?
- [ ] Foco permanece visível e não fica oculto?
- [ ] Contraste e target size foram verificados?
- [ ] Funciona com zoom e aumento de texto?
- [ ] Movimento reduzido é respeitado?

### Hierarquia e UI

- [ ] Variante comunica prioridade e risco sem depender somente de cor?
- [ ] A ação está próxima de seu contexto?
- [ ] Tipografia, spacing, radius e ícones seguem os tokens?
- [ ] Estados são reconhecíveis sem exagero visual?
- [ ] O componente permanece consistente com os demais usos?

## Critérios de aceite

O usuário sabe o que acontecerá, encontra e atinge o botão facilmente, usa-o por teclado ou tecnologia assistiva, percebe ativação e processamento, entende o resultado e consegue recuperar-se de falhas. Testes cobrem semântica, variantes, tamanhos, disabled, loading, prevenção de duplicação, labels longos e acessibilidade dos estados críticos.

## Referências

Esta especificação incorpora integralmente o documento Button Design System fornecido ao Servir e seus fundamentos em WCAG 2.2, heurísticas de Nielsen, Lei de Fitts e padrões consolidados de sistemas de design. Referências externas orientam critérios; não substituem o contexto e a linguagem visual do produto.
