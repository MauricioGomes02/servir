# ADR 025 — Logging de requisição e tracing de casos de uso

- Estado: aceita
- Data: 2026-07-30
- Complementa: [ADR 010](010-telemetry-context-propagation.md), [ADR 013](013-structured-logging.md), [ADR 015](015-fastify-http-adapter.md) e [ADR 022](022-postgresql-observability.md)
- Refina: [ADR 012](012-in-memory-event-dispatch.md) e [ADR 016](016-in-memory-outbox-relay.md)

## Contexto

Usar Domain Event, outbox, relay e Event Bus apenas para escrever um log operacional no stdout torna uma reação de melhor esforço dependente de um fluxo assíncrono. Ao mesmo tempo, registrar um log em cada etapa duplica informações que traces HTTP, Fastify e PostgreSQL já representam com duração e relacionamento causal.

## Decisão

O adapter HTTP registra exatamente um fato estruturado ao terminar cada requisição. Respostas abaixo de 500 produzem `http.request.completed`; falhas técnicas produzem `http.request.failed`. Ambos incluem método, rota normalizada, status, duração monotônica, `RequestId` e `CorrelationId`. O adapter JSON acrescenta `traceId` e `spanId` quando houver span ativo.

Falhas operacionais incluem somente tipo e código estável quando disponível. Mensagem, stack trace, payload, headers, parâmetros SQL e valores de negócio não são copiados para o log. O trace correlacionado contém os detalhes técnicos permitidos pela instrumentação.

Casos de uso recebem spans semânticos na borda de infraestrutura, sem importar OpenTelemetry na Application. HTTP, Fastify e PostgreSQL continuam com instrumentação automática; queries parametrizadas e suas durações permanecem nos spans do driver e não são repetidas no stdout.

Domain Events, outbox, relay e Event Bus permanecem destinados a reações que dependem de fatos de negócio, como auditoria durável, notificações e integrações. O `EventLoggingHandler` deixa de integrar a composição da API e o log da requisição não depende da publicação do evento.

## Consequências

Cada requisição possui um registro operacional pesquisável e um trace com decomposição temporal quando a telemetria está habilitada. Respostas esperadas 4xx são conclusões observáveis, não falhas técnicas. O logging continua funcionando sem collector e não influencia o status da requisição.

A duração total aparece tanto no log final quanto no span HTTP para permitir operação básica somente com stdout. Durações internas são consultadas no trace, evitando multiplicação de logs. Auditoria continua sendo uma responsabilidade durável e separada.

## Alternativas

Manter o handler de log como consumidor do Domain Event foi rejeitado por atrasar e complicar um efeito local de melhor esforço. Registrar início e fim de cada operação foi rejeitado por duplicar registros e exigir reconstrução posterior. Logar cada query foi rejeitado por duplicar a instrumentação PostgreSQL e aumentar o risco de exposição de dados.
