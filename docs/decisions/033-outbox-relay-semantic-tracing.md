# ADR 033 — Tracing semântico do outbox relay

- Estado: aceita
- Data: 2026-08-05
- Complementa: [ADR 010](010-telemetry-context-propagation.md), [ADR 024](024-kafka-durable-outbox-relay.md) e [ADR 031](031-local-trace-visualization.md)

## Contexto

A instrumentação automática do PostgreSQL e do Kafka mostra operações técnicas, mas não explica qual lote do relay foi processado, qual mensagem produziu cada operação nem se ela foi publicada, reagendada ou encerrada como falha terminal. Tornar o trace da API pai direto do processamento assíncrono também representaria incorretamente uma relação temporal que pode atravessar tentativas e processos.

Logs e traces têm finalidades complementares. Logs continuam sendo documentos operacionais pesquisáveis; spans descrevem duração e causalidade. Ambos devem ser correlacionáveis sem levar payload, credenciais ou contexto W3C bruto para os registros.

## Decisão

`ProcessOutboxBatch` depende de um port mínimo de telemetria da Application. O adapter OpenTelemetry cria `outbox.relay.batch` somente quando o claim retorna trabalho e cria um `outbox.message.process` por mensagem. Spans automáticos de publicação e transição no PostgreSQL permanecem filhos do processamento semântico ativo.

Cada mensagem registra como atributos somente identidade, destino, tipo do evento e número da tentativa. O resultado é representado pelos eventos `outbox.message.published`, `outbox.message.rescheduled` ou `outbox.message.failed`; o lote recebe as contagens finais. Polls vazios não criam span semântico nem log de conclusão.

O contexto W3C persistido pela API é adicionado como link ao span da mensagem. O relay inicia um trace próprio para o lote, em vez de continuar artificialmente o trace da requisição. O contexto ativo do relay é injetado na mensagem Kafka para permitir a continuação pelos consumidores.

O log estruturado de conclusão é emitido enquanto o span do lote está ativo. O adapter JSON o enriquece com `traceId` e `spanId`, mas logging continua best effort e separado do pipeline de traces. Span events podem ser vistos no Jaeger; documentos de log continuam no stdout até existir um pipeline OTLP de logs.

## Consequências

O Jaeger passa a explicar o processamento do relay por lote e mensagem, incluindo publicação, retry e falha terminal, sem transformar polling ocioso em ruído. A origem na API permanece navegável por um span link quando o backend de observabilidade oferece essa visualização.

A Application conhece apenas intenções semânticas e não importa OpenTelemetry. O adapter decide nomes, atributos, links e status. Payload, `traceparent`, `tracestate`, mensagens técnicas, stacks e dados pessoais não são registrados.

## Alternativas

Depender somente da autoinstrumentação foi rejeitado porque consultas e publicações isoladas não expressam o resultado do processamento. Continuar o trace original como pai direto foi rejeitado porque esconde a fronteira assíncrona e pode produzir traces longos e enganosos. Criar spans e logs para cada poll vazio foi rejeitado pelo volume sem valor operacional.
