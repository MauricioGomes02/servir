# ADR 010 — Propagação de contexto de telemetria

- Estado: aceita
- Data: 2026-07-27

## Contexto

Requisições, mensagens e jobs precisam preservar rastreamento distribuído sem acoplar application ou domínio a um SDK ou fornecedor de observabilidade. Correlação de negócio também pode durar mais que um trace técnico.

## Decisão

Adapters propagam trace context conforme W3C Trace Context e integram OpenTelemetry sem expor seus tipos ao núcleo. `CorrelationId` permanece um identificador lógico independente de `traceId`; mensagens preservam causalidade por metadados próprios. Baggage não é propagado por padrão e exige allowlist explícita.

## Consequências

Destinos de telemetria podem ser substituídos e traces permanecem interoperáveis. Adapters precisam extrair e injetar `traceparent` e `tracestate`; workflows longos devem correlacionar traces por `CorrelationId` e links quando aplicável.

## Alternativas

Usar `traceId` como única correlação foi rejeitado porque traces podem ser reiniciados ou não cobrir todo o workflow. Expor tipos do SDK OpenTelemetry no `ExecutionContext` foi rejeitado por acoplar o núcleo à infraestrutura.
