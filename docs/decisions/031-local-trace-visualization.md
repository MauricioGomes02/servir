# ADR 031 — Visualização local de traces por Collector e Jaeger

- Estado: aceita
- Data: 2026-08-04
- Complementa: [ADR 010](010-telemetry-context-propagation.md), [ADR 022](022-postgresql-observability.md) e [ADR 025](025-http-request-logging-and-use-case-tracing.md)

## Contexto

API e outbox relay já exportam traces por OTLP e preservam W3C Trace Context, mas um endpoint OTLP apenas recebe telemetria: ele não oferece busca nem visualização. Sem observar traces reais, adicionar spans ou logs seria uma decisão baseada em suposição.

O ambiente local também deve preservar a independência das aplicações em relação a um backend específico e seguir o ownership de infraestrutura definido pelo Terraform.

## Decisão

O stack Terraform `local` provisiona um OpenTelemetry Collector como gateway vendor-neutral e um Jaeger all-in-one como backend de desenvolvimento. Aplicações no host enviam OTLP/HTTP ao Collector em `localhost:4318`; o Collector limita memória, agrupa spans e os exporta por OTLP/gRPC ao Jaeger dentro da rede `servir-platform`. A interface fica disponível somente no loopback em `localhost:16686`.

O pipeline inicial aceita exclusivamente traces. Logs continuam em JSON Lines no stdout e métricas permanecem planejadas. O Jaeger utiliza armazenamento em memória: reiniciar ou substituir seu container descarta os traces locais.

## Consequências

API e relay continuam configurados apenas por variáveis OpenTelemetry e não importam SDK ou contrato do Jaeger. O backend de visualização pode ser substituído alterando somente a infraestrutura e o exporter do Collector.

A inspeção passa a mostrar duração e relação entre spans HTTP, casos de uso, PostgreSQL e publicação Kafka já instrumentados. Novos spans ou logs só devem ser adicionados quando uma pergunta operacional concreta não puder ser respondida pelos traces existentes.

Essa topologia é deliberadamente local: não oferece retenção durável, autenticação, TLS, alta disponibilidade nem dimensionamento de produção.

## Alternativas

Exportar diretamente das aplicações para o Jaeger foi rejeitado por acoplar configuração e ciclo operacional ao backend escolhido. Usar apenas o exporter `debug` do Collector foi rejeitado porque não permite busca e navegação adequadas. Adicionar imediatamente Grafana, Tempo, Loki e Prometheus foi adiado por ampliar o stack antes de existir uma necessidade observada.
