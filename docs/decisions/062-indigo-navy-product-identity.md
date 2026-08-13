# ADR 062 — Identidade de produto indigo e navy

- Estado: aceita
- Data: 2026-08-13
- Refina: [ADR 059](059-product-visual-language-and-reusable-web-components.md)

## Contexto

O ADR 059 estabeleceu tokens semânticos, temas, acessibilidade e componentes promovidos por uso real, mas adotou verde como ação principal. A evolução das experiências de coordenação e de membro trouxe uma referência visual mais completa, com navegação navy, ação indigo, superfícies neutras e densidade adequada ao trabalho operacional.

A referência também contém telas conceituais. Copiar seus dados, destinos ou capacidades sem contratos reais produziria uma interface cenográfica e contrariaria o frontend orientado a tarefas.

## Decisão

Adotar navy como superfície persistente de navegação e indigo como cor de marca e ação principal. Sucesso, atenção, perigo e informação mantêm cores semânticas próprias; verde não representa mais a marca nem ações genéricas. Os temas claro e escuro implementam os mesmos papéis semânticos, com contraste e hierarquia avaliados separadamente.

A escala visual usa tipografia compacta, espaços baseados em quatro pixels, controles com raios moderados e sombras discretas. Cards representam unidades ou estados reais, não são o contêiner padrão. Desktop pode manter navegação lateral; mobile reorganiza a navegação e prioriza uma tarefa por vez, sem comprimir o desktop.

Os mockups e o [guia visual](../design-system/servir-ux-ui-reference.md) são referências de direção e composição. O domínio, os contratos implementados e o [guia de experiência](../frontend-experience.md) continuam soberanos. Uma tela conceitual não autoriza criar endpoints, dados, permissões ou itens de navegação inoperantes.

No código e nos contratos técnicos, `MinistryRole` preserva o nome do domínio. Na interface, “função ministerial” distingue a aptidão exercida — como vocal ou guitarra — de papéis e permissões de acesso.

## Consequências

As telas existentes passam a compartilhar uma identidade reconhecível e preparada para experiências administrativas e mobile. A parte cromática verde do ADR 059 é substituída; suas decisões sobre tokens semânticos, temas, componentes acessíveis e promoção por consumidores reais permanecem válidas.

A migração ocorre somente em capacidades reais. Referências futuras de disponibilidade e escala permanecem documentadas até que read models e ações sustentem as respectivas tarefas.

## Alternativas

Manter verde como marca foi rejeitado porque fragmentaria a identidade aprovada. Copiar integralmente os mockups foi rejeitado porque apresentaria funcionalidades e dados inexistentes. Criar uma biblioteca visual completa antes das telas foi rejeitado porque anteciparia contratos sem consumidores. Usar a mesma composição no desktop e no mobile foi rejeitado porque as tarefas e prioridades são diferentes.
