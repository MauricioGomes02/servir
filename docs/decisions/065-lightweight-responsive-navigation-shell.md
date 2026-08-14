# ADR 065 — Shell de navegação responsivo e visualmente leve

- Estado: aceita
- Data: 2026-08-14
- Refina: [ADR 062](062-indigo-navy-product-identity.md)

## Contexto

O ADR 062 adotou navy para a navegação persistente e indigo para marca e ações. A primeira implementação aplicou navy a toda a sidebar e, no mobile, converteu o mesmo bloco em uma região horizontal escura. Com poucos destinos, essa superfície dominava a interface, competia com o conteúdo e tornava o tema escuro excessivamente profundo.

O shell precisa preservar identidade e localização sem tratar desktop e mobile como a mesma composição. Também deve servir às próximas áreas sem antecipar menus recolhíveis ou navegação escondida.

## Decisão

Preservar navy como signifier persistente da navegação, aplicado à borda estrutural e a detalhes de contexto, enquanto a superfície principal da sidebar usa os tokens neutros do tema. Indigo continua identificando seleção, foco e ação principal.

No desktop, a navegação permanece lateral, compacta e sticky, mas deixa de formar um painel conectado ao conteúdo. No mobile, contexto e dois destinos atuais são apresentados como tabs visíveis, sem hamburger ou rolagem horizontal. O item atual combina texto, superfície e indicador, sem depender somente de cor.

O tema escuro usa navy acinzentado e superfícies progressivas em vez de preto azulado dominante. Bordas e sombras mantêm separação sem transformar todos os blocos em cards. Temas claro e escuro preservam os mesmos papéis semânticos e são avaliados separadamente.

## Consequências

O conteúdo ganha prioridade visual e largura útil, enquanto a organização e a localização permanecem reconhecíveis. A mesma semântica de navegação assume composições adequadas à largura disponível. Novos destinos poderão exigir agrupamento ou outro padrão mobile, mas essa complexidade só será introduzida com consumidores reais.

O ADR 062 continua válido para identidade navy/indigo, cores semânticas, densidade, tipografia e uso não especulativo dos mockups. A exigência de uma grande superfície navy em toda a navegação é refinada por esta decisão.

## Alternativas

Manter a sidebar totalmente navy foi rejeitado por dominar o conteúdo e agravar o tema escuro. Remover navy da navegação foi rejeitado por fragmentar a identidade aprovada. Um menu hamburger no mobile foi rejeitado porque esconderia dois destinos frequentes sem necessidade. Uma barra inferior foi adiada até existir quantidade e prioridade de destinos que justifiquem esse contrato.
