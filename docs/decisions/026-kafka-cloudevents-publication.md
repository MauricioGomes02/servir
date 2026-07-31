# ADR 026 — Publicação Kafka com CloudEvents

## Contexto

O relay durável precisa materializar o contrato Kafka adiado pelo ADR 024 sem expor Domain Events, acoplar a Application ao SDK do broker ou confundir identidade funcional com contexto de telemetria. A entrega continua sendo `at-least-once`, portanto a mensagem pública precisa oferecer identidade estável para deduplicação.

## Decisão

Cada bounded context publica em um tópico próprio; Organizations usa `servir.organizations.events`. O nome do ambiente não integra o tópico por padrão e permanece responsabilidade da infraestrutura e do cluster. A chave Kafka é `partitionKey` quando disponível, preservando a ordem relativa oferecida por uma partição sem prometer ordem global.

O valor é um CloudEvent 1.0 em modo estruturado JSON com media type `application/cloudevents+json`. `messageId` ocupa `id` e é a identidade pública de idempotência; o `eventId` interno não é exposto automaticamente. `source` identifica o bounded context, `type` combina namespace, nome e versão do Integration Event, `subject` recebe o Aggregate ID, `time` preserva o instante do fato e `data` contém apenas o payload público. Correlação e causalidade são extensões `correlationid` e `causationid`.

Headers Kafka limitam-se ao media type e ao W3C Trace Context (`traceparent` e `tracestate` opcional). A API captura esse contexto no adapter PostgreSQL e o persiste separado dos metadados funcionais no JSON da outbox. O relay restaura o contexto, cria um span de produção quando houver SDK ativo e injeta o contexto resultante. Baggage não é propagado e `tracestate` não deve ser registrado em logs.

KafkaJS fica isolado na infraestrutura do relay. Auto-criação de tópicos é desabilitada, acknowledgements exigem todos os replicas (`acks=-1`), o envio possui timeout inferior à lease e os retries internos são limitados. O modo idempotente do KafkaJS não é habilitado neste corte porque sua garantia pressupõe retries praticamente ilimitados, incompatíveis com a lease e com o retry durável coordenado pela Application. Falhas são classificadas por código e pela indicação estruturada de retentabilidade do SDK, nunca por mensagem; falhas desconhecidas permanecem retentáveis e erros estruturais são terminais.

## Consequências

Consumidores recebem um envelope interoperável e podem deduplicar por `id`. O contrato público não depende de classes do domínio, KafkaJS ou tipos do OpenTelemetry. A infraestrutura deve criar previamente tópico, partições, retenção e ACLs. O timestamp do record Kafka representa publicação, enquanto `time` representa ocorrência.

A confirmação do Kafka seguida de falha antes de `markPublished` ainda pode produzir duplicata. Mesmo um producer idempotente não alteraria essa garantia ponta a ponta nem eliminaria a deduplicação nos consumidores; sua adoção poderá ser reavaliada com uma política de tempo compatível com a lease.

## Alternativas consideradas

Headers proprietários para todos os metadados foram rejeitados por duplicar o envelope e dificultar interoperabilidade. Publicar o Domain Event foi rejeitado por expor contrato interno. Um tópico por tipo de evento foi adiado porque aumenta a governança operacional sem necessidade demonstrada. Depender do binding Kafka de CloudEvents foi rejeitado enquanto ele permanecer menos estável que o core; o modo estruturado usa apenas a especificação principal.
