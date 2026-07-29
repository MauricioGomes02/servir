# ADR 022 — Observabilidade da persistência PostgreSQL

- Estado: aceita
- Data: 2026-07-29
- Complementa: [ADR 010](010-telemetry-context-propagation.md), [ADR 013](013-structured-logging.md)

## Contexto

Os adapters PostgreSQL tornaram a persistência e a outbox transacionais, mas operações do driver ainda não apareciam como spans próprios. Ao mesmo tempo, registrar e relançar falhas dentro de Repository, outbox e Unit of Work duplicaria logs e produziria registros sem o contexto completo da requisição ou do worker.

## Decisão

Registrar `@opentelemetry/instrumentation-pg` no bootstrap do SDK antes de carregar o driver `pg`. Manter `enhancedDatabaseReporting` explicitamente desabilitado para não anexar valores dos parâmetros nem informações enriquecidas de resultados aos spans. A instrumentação automática mantém `db.query.text` com o SQL parametrizado e seus placeholders, além da operação, banco, destino, duração e resultado; application e domínio continuam sem tipos ou SDKs OpenTelemetry.

Adapters PostgreSQL classificam e propagam falhas por tipos e códigos estáveis, mas não registram e relançam o mesmo erro. A fronteira que possui `ExecutionContext`, inicialmente o error handler HTTP, registra uma única ocorrência `http.request.failed` e o adapter JSON acrescenta trace/span ativos. O log inclui o código estável e exclui SQL, parâmetros, payload, credenciais, `DATABASE_URL` e detalhes da causa do driver; o `traceId` conduz ao span que contém o SQL parametrizado.

Spans manuais serão adicionados somente quando uma fronteira semântica não puder ser compreendida pelos spans automáticos. Logging continua sendo melhor esforço e não substitui auditoria nem a outbox.

## Consequências

Operações PostgreSQL participam do trace da requisição sem acoplar os adapters ao SDK. Uma falha pode ser correlacionada por request ID, correlation ID, trace ID, span ID e código técnico. O texto parametrizado da query fica restrito ao span; valores de parâmetros e resultados não são capturados pela configuração atual.

A instrumentação automática depende de ser registrada antes do carregamento de `pg`; por isso o bootstrap inicia telemetria antes do import dinâmico do serviço. Com telemetria desabilitada, persistência e logging continuam funcionais sem collector.

## Alternativas

Criar spans manualmente em cada query foi rejeitado por duplicar a instrumentação do driver e espalhar semântica técnica. Injetar `Logger` em cada adapter foi rejeitado por gerar log duplicado antes da fronteira contextual. Capturar parâmetros SQL foi rejeitado pelo risco de expor dados pessoais, payloads ou segredos.
