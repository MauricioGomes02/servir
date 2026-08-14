# Design System

Contratos de interação e apresentação compartilhados pela aplicação web. Cada componente documentado preserva semântica, comportamento, acessibilidade, estados, usos e antiusos; aparência é consequência desse contrato.

- [Button](button.md)
- [Referência visual e de experiências](servir-ux-ui-reference.md)

## Ícones

O frontend usa uma única família de ícones outline, `@lucide/vue`, sempre por meio da fachada `AppIcon`. Essa fronteira mantém nomes orientados ao produto, peso visual uniforme e permite trocar a implementação sem espalhar dependência da biblioteca pelas experiências.

- adicionar o ícone à fachada antes de consumi-lo;
- manter `aria-hidden="true"` quando ele apenas reforçar um texto ou quando o controle já tiver nome acessível;
- usar um nome acessível explícito em controles compostos somente por ícone;
- não desenhar SVGs isolados nem misturar famílias para resolver uma tela local;
- não usar ícone como único canal para estado, significado ou ação ambígua.

Atalhos de teclado precisam ser opcionais, visíveis perto do recurso, ignorados durante edição de texto e acompanhados por um fluxo normal de foco. Configurações de aparência usam `Alt+Shift+T`; ao abrir, o foco vai para a opção selecionada, setas e `Home`/`End` percorrem as opções e `Escape` fecha restaurando o foco no acionador.

Os [mockups de referência](assets/) comunicam direção visual e hierarquia, não o estado implementado. Domínio, contratos disponíveis e o guia de experiência continuam soberanos; nenhum dado ou destino conceitual deve ser criado apenas para reproduzir uma imagem.
