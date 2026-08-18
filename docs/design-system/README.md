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

## Densidade

O Servir adota densidade **compacta confortável** para áreas operacionais. A interface deve se comportar como uma aplicação de uso frequente, preservando espaço para informação e ação sem reduzir legibilidade ou alvos de interação.

- títulos comunicam hierarquia sem dominar a viewport;
- cabeçalhos, filtros e listas usam os tokens compartilhados de bloco, seção, controle e linha;
- campos e botões mantêm altura confortável, enquanto linhas podem ser mais densas no desktop;
- superfícies, cards e estados vazios usam espaço conforme o conteúdo, não para preencher a página;
- o conteúdo utiliza a largura disponível antes de aumentar a altura da composição;
- espaços maiores separam regiões conceituais; elementos da mesma tarefa permanecem próximos;
- mobile preserva alvos de toque e reorganiza conteúdo em vez de apenas comprimir o desktop.

Os tokens `--page-block-gap`, `--section-block-gap`, `--control-height` e `--list-row-min-height` são a referência inicial. Páginas não devem recriar esses valores sem uma necessidade específica da experiência.

Buscas de coleções usam `AppSearchField`: label programática, ícone familiar, envio por `Enter` e limpeza explícita, sem um botão de busca redundante. `AppResourceList` e `AppResourceListItem` organizam coleções navegáveis por composição de conteúdo principal, metadados e ação. A linha inteira é o link, mas a ação textual continua visível para não depender de descoberta por hover.

`AppResourceSection` reúne cabeçalho, quantidade, controles, estados e conteúdo de uma coleção em uma região semântica única. A busca pertence à toolbar da coleção, não fica solta entre o cabeçalho da página e a lista. A região usa borda e divisores discretos, sem sombra decorativa; na ausência total de registros, controles sem efeito podem ser omitidos.

Controles usam `--control-radius` para um arredondamento sutil e consistente. A linguagem visual é formal com proximidade humana: campos, botões e buscas não usam formato de cápsula; `--radius-full` fica reservado a ícones circulares, avatares e indicadores cuja forma tenha significado. Controles de busca ocultam a decoração nativa do navegador quando oferecem uma ação de limpeza própria, evitando affordances duplicadas.
