# ADR 015 — Fastify como adapter HTTP

- Estado: aceita
- Data: 2026-07-28

## Contexto

O primeiro corte vertical precisa de uma borda HTTP executável sem mover composição, contexto, localização ou tratamento técnico para domínio e application. A arquitetura também deve permitir substituir composição manual por injeção automática quando a quantidade de módulos justificar.

## Decisão

Usar Fastify como adapter HTTP fino. A factory recebe dependências prontas e rotas não acessam container global. O adapter fornece ao Fastify um `IdGenerator<RequestId>` injetado, constrói `ExecutionContext`, negocia locale e preserva `CorrelationId`. A estratégia concreta de geração permanece fora do framework, conforme o ADR 014. Falhas técnicas são observadas na borda e apresentadas sem detalhes internos.

W3C Trace Context é tratado pela instrumentação OpenTelemetry inicializada antes do Fastify. A integração oficial `@fastify/otel` cobre o framework e a instrumentação HTTP preserva o contexto de transporte. `traceId`, `requestId` e `correlationId` mantêm semânticas distintas; baggage fica desabilitado sem allowlist explícita.

## Consequências

Rotas podem ser testadas sem socket por `inject`, e domínio/application permanecem independentes de Fastify. A composição manual pode migrar para `@fastify/awilix` sem alterar construtores internos. Tipos e decorators do framework ficam restritos à infraestrutura HTTP.

A aplicação precisa manter políticas explícitas para códigos HTTP, validação estrutural, negociação de locale, logs e respostas seguras. A instrumentação não transforma headers de tracing em contexto de negócio. DI automática e adapters HTTP de casos de uso permanecem incrementos separados.

## Alternativas

NestJS foi adiado por introduzir DI e decorators antes de haver escala que os justificasse. Um controller HTTP abstrato sem framework foi rejeitado por cristalizar contrato sem consumidor real. Usar `traceId` como correlation ID foi rejeitado conforme o ADR 010.
