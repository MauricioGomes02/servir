# ADR 032 — Container de dependências na composition root

- Estado: aceita
- Data: 2026-08-05

## Contexto

Com Organizations e Membership executáveis, a composition root passou a repetir criação de geradores, handlers, presenters e dependências de persistência. Novos módulos ampliariam uma única factory e tornariam configurações parciais mais difíceis de detectar. As rotas também repetiam o protocolo de obtenção do contexto e apresentação de Problem Details.

## Decisão

Usar Awilix em modo estrito como container tipado exclusivo da composition root. Dependências compartilhadas, persistência e cada bounded context possuem funções explícitas de registro. Objetos sem estado de request usam lifetime singleton. `ExecutionContext` continua sendo criado pelo adapter Fastify e passado explicitamente aos casos de uso; não será resolvido pelo container.

Handlers, domínio, presenters e rotas não acessam container global nem `request.diScope`. A composition root resolve dependências e as entrega pelos construtores e parâmetros existentes. O container automatiza montagem e lifetime sem substituir ports ou esconder dependências do núcleo.

No adapter HTTP, funções compartilhadas exigem o contexto já criado e enviam um `PresentedError` como Problem Details. Extração de entrada, classificação de status, nome do span e representação de sucesso continuam explícitas em cada rota.

## Consequências

O bootstrap fica menor, módulos registram suas próprias dependências e configurações incompletas de persistência falham por código estável. Testes ainda podem construir handlers diretamente sem Awilix. A borda HTTP preserva políticas específicas enquanto centraliza media type, idioma, correlação e estrutura de problemas.

Novos lifetimes devem ser justificados por estado real. Caso surja uma dependência por request, um scope poderá ser criado na borda sem mover `ExecutionContext` para um Service Locator.

## Alternativas

Manter composição manual numa única factory foi rejeitado pelo crescimento e repetição já observados. Usar `@fastify/awilix` e resolver dependências em cada request foi adiado porque atualmente não existe dependência request-scoped e isso acoplaria rotas ao container. Um controller ou route handler genérico foi rejeitado por esconder políticas HTTP distintas e criar tipos genéricos sem uma responsabilidade única.
