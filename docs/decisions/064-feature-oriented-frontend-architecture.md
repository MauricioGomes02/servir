# ADR 064 — Arquitetura frontend orientada a pages, features e entities

- Estado: aceita
- Data: 2026-08-14
- Refina: [ADR 057](057-vue-web-application-foundation.md) e [ADR 060](060-task-oriented-frontend-experience.md)

## Contexto

O ADR 057 estabeleceu Vue, BFF, limites de transporte e uma separação inicial entre Application, Infrastructure e Presentation. Essa estrutura protegeu os primeiros cortes, mas reproduz nomes e indireções do backend no navegador. Organization usa camadas técnicas enquanto Ministries concentra lista, detalhe, mutation, gateway e composição numa única feature ampla. À medida que novas jornadas surgirem, ambos os formatos dificultam prever onde páginas, ações e dados apresentados devem residir.

O guia de experiência já decidiu que o frontend se organiza por tarefas e não por Aggregates. É necessário complementar essa decisão com limites técnicos verificáveis sem realizar uma migração mecânica ou introduzir bibliotecas antes dos consumidores.

## Decisão

Adotar `app`, `pages`, `features`, `entities` e `shared` como estrutura conceitual da aplicação Vue.

- `app` inicializa router, layouts, providers e configuração global;
- `pages` representam destinos de rota e compõem experiências;
- `features` representam ações explícitas do usuário;
- `entities` representam contratos de leitura e visualizações de conceitos na UI, sem equivalência obrigatória com Entities DDD;
- `shared` contém somente infraestrutura e UI independentes do produto.

Dependências apontam de `app` para `pages`, destas para `features`, depois para `entities` e finalmente `shared`. Camadas superiores podem usar níveis inferiores; o inverso não é permitido. Módulos expõem APIs públicas locais e consumidores evitam deep imports.

No Vue, hooks dos exemplos gerais correspondem a composables apenas quando existe comportamento. Template, composable, CSS e teste permanecem colocados junto à experiência. Queries normalmente pertencem à entity; mutations orientadas a tarefas pertencem a features. HTTP específico conhece apenas rotas relativas `/bff`; o navegador continua sem acesso ou conhecimento da API privada.

Server state, URL state, form state, UI state e session state são classificados antes da escolha de ferramenta. Composables locais permanecem o padrão atual. Pinia, TanStack Query para Vue ou bibliotecas de formulário exigem necessidade demonstrada.

A migração será incremental e acompanhada por consumidores reais ou cortes estruturais pequenos. Não serão criadas árvores vazias nem realizada movimentação total num único commit. O guia canônico está em [Arquitetura do frontend web](../frontend-architecture.md).

## Consequências

O frontend deixa de reproduzir `application/infrastructure/presentation` por simetria com o backend. Páginas, ações e representações passam a ter ownership previsível, enquanto componentes compartilhados permanecem livres de conceitos ministeriais.

O ADR 057 continua válido para workspace, Vue, responsividade, acessibilidade, temas, BFF e API privada. Sua escolha de organizar features web com camadas equivalentes ao backend é substituída por esta decisão. O ADR 060 permanece válido e passa a possuir uma estrutura técnica compatível com a arquitetura de informação orientada a tarefas.

Durante a migração, estrutura antiga e nova podem coexistir. Essa coexistência é deliberada, temporária e não autoriza duplicar comportamento ou criar duas fontes de verdade.

## Alternativas

Manter a estrutura inicial foi rejeitado porque ela já apresenta dois modelos de organização e tende a espalhar uma experiência entre camadas técnicas. Migrar tudo imediatamente foi rejeitado pelo risco de regressão, diffs extensos e ausência de benefício funcional verificável. Aplicar literalmente um guia React foi rejeitado porque hooks, providers e acesso direto à API não representam a stack nem a topologia do Servir. Adotar Pinia ou TanStack Query desde já foi rejeitado porque os consumidores atuais ainda não demonstram necessidade de store ou cache compartilhado.
