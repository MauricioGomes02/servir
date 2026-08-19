# ADR 071 — Grafana sobre os traces existentes no Jaeger

- Estado: aceita
- Data: 2026-08-18
- Complementa: [ADR 031](031-local-trace-visualization.md), [ADR 033](033-outbox-relay-semantic-tracing.md) e [ADR 036](036-shared-opentelemetry-mechanics.md)

## Contexto

O Collector e o Jaeger já tornam os traces da API e do relay visíveis, mas a experiência local de pesquisa não oferece uma entrada única para a evolução planejada de traces, logs e métricas. Trocar o backend de traces ou introduzir simultaneamente Loki, Prometheus e Tempo ampliaria a infraestrutura antes de validar consultas operacionais reais.

## Decisão

O Terraform local provisiona Grafana na rede de observabilidade e publica sua UI somente em loopback. O datasource Jaeger é versionado e provisionado automaticamente; Jaeger continua sendo o backend efêmero de traces e o Collector continua sendo o único gateway OTLP das aplicações.

O primeiro corte usa o Explore do Grafana para pesquisar por `service.name`, nome estável do span e atributos já emitidos, incluindo `servir.use_case.name`, atributos HTTP, messaging e outbox. Não são adicionados Loki, Prometheus, Tempo, dashboards artificiais nem novos spans sem uma pergunta operacional concreta.

Logs permanecem JSON Lines no stdout. O próximo incremento pode adicionar Loki e correlação trace-to-logs sem alterar Application ou domínio. Métricas e exemplars permanecem posteriores a um contrato de métricas e a perguntas operacionais próprias.

## Consequências

O ambiente ganha uma experiência de investigação extensível sem migrar traces ou acoplar aplicações ao Grafana. Jaeger continua acessível para comparação e diagnóstico. A UI local não possui autenticação e, como todas as portas de observabilidade, fica limitada a `127.0.0.1`.

Grafana e Jaeger continuam efêmeros neste estágio. Produção exigirá autenticação, TLS, retenção, storage durável e capacidade definidas pela IaC do ambiente.

## Alternativas

Substituir imediatamente Jaeger por Tempo foi adiado porque o problema atual é principalmente experiência de consulta, não incompatibilidade do pipeline OTLP. Adicionar Elasticsearch/Kibana foi rejeitado neste corte pelo custo operacional para consultas simples de logs. Adicionar Loki e Prometheus junto com Grafana foi adiado para manter o incremento verificável e orientado por sinais já existentes.
