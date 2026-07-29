# ADR 024 — Relay durável de outbox com Kafka

## Contexto

A API já persiste o Aggregate e sua mensagem de outbox na mesma transação PostgreSQL. Publicar essa mensagem dentro da requisição confundiria o commit do negócio com a disponibilidade do broker. O relay em memória não processa mensagens duráveis nem permite operar publicação separadamente da API.

## Decisão

Adotar Kafka como broker de eventos de integração e implementar o relay durável como uma aplicação independente em `backend/applications/outbox-relay`. A aplicação será criada com seu primeiro comportamento executável, não como scaffold vazio.

O relay oferecerá entrega `at-least-once`. Ele reivindicará lotes no PostgreSQL por lease usando `FOR UPDATE SKIP LOCKED`, encerrará a transação de claim antes de acessar o Kafka e confirmará cada mensagem somente depois do acknowledgement do broker. Falhas liberam o lease e agendam nova tentativa com backoff exponencial e jitter; tentativas esgotadas permanecem no PostgreSQL como falhas terminais operáveis.

Mensagens publicadas serão Integration Events versionados, derivados de fatos internos por um mapper na fronteira de saída. Domain Events não serão expostos diretamente como contratos Kafka. `message_id` será a identidade de idempotência, e consumidores deverão tolerar duplicatas. Quando houver uma chave de Aggregate disponível, ela será usada como chave de partição; não se promete ordenação global.

Correlação e causalidade pertencem aos metadados da mensagem. Trace context será propagado por headers do Kafka conforme OpenTelemetry, sem substituir os identificadores funcionais. Payloads e erros técnicos detalhados não serão copiados para logs operacionais.

## Consequências

API e broker podem ficar indisponíveis independentemente sem perder mensagens já confirmadas no banco. Várias instâncias do relay podem disputar trabalho sem processar deliberadamente o mesmo claim ativo. Um processo interrompido deixa mensagens recuperáveis após a expiração do lease.

A fronteira PostgreSQL/Kafka ainda admite uma duplicata quando a publicação é aceita e o relay falha antes de registrar `published_at`. Consumidores precisam deduplicar por `message_id`; a plataforma não promete exactly-once. A ordenação estrita entre eventos consecutivos do mesmo Aggregate exigirá versionamento do Aggregate ou outra regra explícita e permanece adiada.

Tópicos, retenção, número de partições, autenticação, cliente Node, limites de lote, duração de lease, política final de retry e operação de reprocessamento serão definidos com o primeiro executável e seu ambiente concreto.

## Alternativas consideradas

Publicar na requisição foi rejeitado por acoplar o resultado do caso de uso ao broker. Executar o relay dentro da API foi rejeitado por misturar ciclos de vida e cargas operacionais. RabbitMQ continua tecnicamente viável, mas Kafka foi escolhido para manter um log particionado de eventos consumido independentemente por auditoria, notificações e futuras projeções. Transação distribuída e exactly-once entre PostgreSQL e Kafka foram rejeitados pela complexidade e por não eliminarem a necessidade de idempotência ponta a ponta.
