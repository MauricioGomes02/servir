# ADR 059 — Linguagem visual de produto e componentes web reutilizáveis

- Estado: aceita
- Data: 2026-08-12

## Contexto

O primeiro corte web comprovou rotas, BFF, temas, responsividade e acessibilidade, mas sua apresentação ainda comunicava uma fundação técnica: pouca hierarquia, superfícies equivalentes, cards sem estado operacional claro e um seletor de tema permanentemente exposto. A evolução das áreas de Membros, Ministérios e Atividades exige consistência sem antecipar uma biblioteca genérica completa.

## Decisão

Adotar uma linguagem visual própria, contemporânea e acolhedora, apoiada em tipografia forte, verde como ação principal, acento quente, superfícies com profundidade moderada e densidade progressiva entre mobile e desktop. Referências de maturidade de produtos digitais orientam o nível de acabamento, não a cópia de identidade, composição ou marca.

Organizar tokens CSS em valores primitivos e papéis semânticos. Tema claro e escuro implementam o mesmo contrato sem inverter cores mecanicamente. A preferência inicial acompanha o sistema; escolhas explícitas permanecem em armazenamento local.

Ocultar a escolha de aparência atrás de um botão compacto de configurações. O painel usa controles nativos de opção para sistema, claro e escuro, fecha por ação explícita ou `Escape` e restaura o foco. O cabeçalho fica preparado para preferências futuras sem expor configurações como navegação primária.

Criar componentes compartilhados somente quando usados por telas reais: botão, campo com erros associados, ícone SVG local, badge de estado e card de área. Componentes preservam HTML nativo, nomes acessíveis e tokens semânticos; não conhecem gateways, rotas de API ou regras de domínio. Padrões sem segundo consumidor permanecem locais às views.

## Consequências

Criação e workspace de Organization passam a representar um produto coerente nos dois temas e em diferentes larguras. Novas áreas podem reutilizar controles estabilizados sem repetir estilos ou depender de um framework visual externo. A fundação continua pequena e permite promover novos padrões apenas após uso concreto.

SVGs simples permanecem versionáveis e code-native. Ilustrações rasterizadas, bibliotecas completas de componentes, estado global de interface e customização de marca por Organization continuam fora deste corte.

## Alternativas

Um toggle binário foi rejeitado porque eliminaria a preferência de sistema ou tornaria seu estado ambíguo. Manter o `select` no cabeçalho foi rejeitado porque dava peso de navegação principal a uma configuração ocasional. Adotar um framework visual completo foi rejeitado porque imporia linguagem e abstrações antes dos consumidores. Duplicar estilos por tela foi rejeitado porque tornaria temas, foco e estados inconsistentes.
