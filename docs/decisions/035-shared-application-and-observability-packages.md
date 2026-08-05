# ADR 035 — Pacotes compartilhados de Application e observabilidade Node

- Estado: aceita
- Data: 2026-08-05
- Complementa: [ADR 013](013-structured-logging.md), [ADR 023](023-application-workspaces.md) e [ADR 034](034-business-process-logging.md)

## Contexto

API e outbox relay são aplicações independentes, mas começaram a implementar separadamente capacidades transversais iguais. Logging já possuía contratos, nomes de campos, níveis, limites e correlação diferentes. Manter cópias faria correções de segurança, redaction, filtros e futuros exporters evoluírem de maneira inconsistente.

Um pacote genérico `shared` também seria inadequado: esconderia ownership e incentivaria a extração de semânticas que pertencem a uma aplicação específica.

## Decisão

Capacidades com pelo menos dois consumidores reais são extraídas para pacotes nomeados em `backend/packages`. `@servir/application-foundation` contém contratos independentes de runtime; `@servir/node-observability` contém adapters e mecânica específica de Node/OpenTelemetry e depende da fundação.

O primeiro corte centraliza `Logger`, `LogRecord`, níveis, atributos imutáveis e o adapter JSON Lines para stdout. API e relay usam o mesmo schema: `level`, `eventName`, `occurredAt`, `context` e `attributes`. O adapter comum aplica filtro de nível, limites estruturais, correlação com span ativo e comportamento best effort.

Timestamps cruzam a fronteira compartilhada como UTC ISO, impedindo que o contrato de logging dependa do Value Object `Instant` atualmente localizado na API. A API mantém fachadas temporárias de reexportação para permitir migração incremental dos imports sem duplicar implementação.

Semânticas específicas permanecem nas aplicações. Nomes e momentos dos marcos de negócio, logging HTTP, lifecycle do worker e tracing de lote ou caso de uso não são generalizados.

## Consequências

Correções no formato e no adapter de log passam a ocorrer uma vez e valer para ambos os processos. O relay ganha os mesmos níveis, limites e correlação da API e aceita `LOG_LEVEL` pelo mesmo vocabulário.

Os pacotes passam a ser APIs internas versionáveis e exigem testes próprios. Extrações futuras de OpenTelemetry, tempo e identidade devem ocorrer em incrementos separados e somente após estabilizar o contrato canônico.

## Alternativas

Manter cópias foi rejeitado pelo drift já observado. Colocar todo código das aplicações em um único pacote foi rejeitado por apagar fronteiras. Criar herança entre serviços foi rejeitado porque lifecycle e semântica operacional são diferentes. Extrair logging, tracing, Clock e IDs numa única mudança foi rejeitado pelo risco e pela incompatibilidade atual dos contratos temporais.
