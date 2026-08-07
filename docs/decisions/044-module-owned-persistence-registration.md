# ADR 044 — Registro de persistência pertencente aos módulos

- Estado: aceita
- Data: 2026-08-07
- Complementa: [ADR 042](042-typed-mediator-and-installable-modules.md)

## Contexto

Os módulos instaláveis removeram handlers e rotas do cradle global, mas `ApplicationPersistence`, `ApplicationCradle`, `registerPersistence` e `createPostgresPersistence` ainda cresciam a cada nova porta. A factory PostgreSQL conhecia todos os repositories, readers e Domain Events, repetia a construção da outbox por write scope e selecionava mappers por uma cadeia linear de condições. Repositories em memória continuavam exportados como infraestrutura dos módulos apesar de servirem apenas aos testes.

## Decisão

A composition root adota tokens tipados e um `ServiceRegistry` restrito à montagem da aplicação. `ApplicationPersistence` expõe o registry e o lifecycle, sem enumerar portas específicas. Cada bounded context registra seus próprios tokens, readers, write scopes PostgreSQL e mappers de Integration Events.

`PostgresPersistenceBuilder` cria a `PostgresUnitOfWork` e acrescenta automaticamente uma `PostgresEventOutbox` a cada write scope. A outbox permanece explícita no contrato do scope e no handler, preservando a fronteira transacional. `IntegrationEventMapperRegistry` indexa mappers por `DomainEvent.name`, rejeita duplicidade e resolve em O(1).

Repositories e readers em memória deixam os barrels de infraestrutura e são consolidados em `composition/test-support`. Adapters transversais em memória, como logger, translator, Event Bus e outbox, permanecem porque implementam portas pequenas com contratos próprios e não constituem um runtime alternativo de persistência.

O Mediator aceita objetos handler diretamente por `registerHandler`. O pipeline HTTP não é convertido em DSL: parsing de entrada, status, representação e mapeamento de problemas continuam visíveis em cada adapter até que um contrato menor e comprovadamente comum surja.

## Consequências

Adicionar Aggregate, Reader ou Integration Event altera somente o registro de persistência do módulo proprietário. O cradle e `ApplicationPersistence` não crescem por vertical slice; a factory PostgreSQL conhece apenas os módulos instalados e seu lifecycle. A construção de outbox deixa de ser repetida e nenhum mapper exige uma condição central.

O registry funciona como mecanismo de DI somente na composition root. Domínio, Application, handlers e rotas não o recebem. Tokens ausentes e duplicados falham imediatamente durante a montagem ou resolução.

## Alternativas

Um Repository genérico foi rejeitado por apagar contratos orientados ao Aggregate. Descoberta automática por filesystem ou decorators foi rejeitada por esconder ownership. Injetar o registry nos handlers foi rejeitado como Service Locator. Uma Unit of Work que detectasse Aggregates e eventos magicamente foi rejeitada por ocultar atomicidade. Uma DSL HTTP completa foi adiada porque aumentaria configuração e complexidade de tipos sem eliminar decisões próprias de cada endpoint.
