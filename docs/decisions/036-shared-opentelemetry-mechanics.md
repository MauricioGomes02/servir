# ADR 036 — Mecânica compartilhada do OpenTelemetry

- Estado: aceita
- Data: 2026-08-05
- Complementa: [ADR 010](010-telemetry-context-propagation.md), [ADR 031](031-local-trace-visualization.md), [ADR 033](033-outbox-relay-semantic-tracing.md) e [ADR 035](035-shared-application-and-observability-packages.md)

## Contexto

API e outbox relay inicializavam separadamente o mesmo SDK OpenTelemetry, exporter OTLP e propagador W3C. Também repetiam a classificação de falhas do lifecycle e operações mecânicas de spans. As cópias já exigiam que correções equivalentes fossem feitas em dois processos, mas as aplicações possuem instrumentações e semânticas diferentes.

## Decisão

`@servir/node-observability` é o único responsável pela mecânica comum do OpenTelemetry em Node: criação e lifecycle do SDK, exporter OTLP, propagador W3C Trace Context, códigos estáveis de falha, configuração segura da instrumentação PostgreSQL, captura e extração do contexto distribuído e execução técnica de operações em spans.

Cada application composition root fornece explicitamente suas instrumentações. A API seleciona HTTP, PostgreSQL e Fastify; o relay seleciona PostgreSQL. Nomes de spans, atributos, eventos, links e momentos observáveis permanecem nas aplicações porque expressam seus processos. `traceUseCase`, tracing de lote e mensagem e publicação Kafka usam a mecânica compartilhada, mas preservam seus vocabulários locais.

Somente dependências necessárias para construir o SDK e os adapters comuns pertencem ao pacote. As aplicações mantêm `@opentelemetry/api` para criar telemetria semântica e mantêm diretamente apenas instrumentações que escolhem em sua composição.

## Consequências

Lifecycle, propagação e tratamento técnico de falhas evoluem uma única vez para todos os processos Node. Testes contratuais ficam no pacote; testes locais verificam apenas a seleção de instrumentações. A composição continua explícita e não existe um perfil global que habilite instrumentações silenciosamente.

O pacote é específico de runtime e não pode ser importado pelo domínio ou usado para transportar tipos do SDK por contratos de Application. Metadados funcionais continuam em `ExecutionContext` e envelopes; contexto W3C permanece uma preocupação de adapters.

## Alternativas

Manter implementações duplicadas foi rejeitado pelo risco de divergência. Centralizar também nomes e atributos de spans foi rejeitado por apagar a semântica de cada processo. Ativar automaticamente todas as instrumentações no pacote foi rejeitado por tornar comportamento e custo implícitos. Introduzir uma plataforma de observabilidade genérica independente do OpenTelemetry foi rejeitado porque não existe um segundo runtime ou SDK consumidor que justifique essa abstração.
