# Architecture Decision Records

| ADR | Decisão | Estado |
|---|---|---|
| [001](001-domain-modeling.md) | Modelagem orientada ao domínio | Aceita |
| [002](002-event-driven.md) | Comunicação por eventos | Aceita |
| [003](003-result-pattern.md) | Result para falhas esperadas | Aceita |
| [004](004-notification-pattern.md) | Notification para acúmulo de violações | Aceita |
| [005](005-no-expected-exceptions.md) | Exceções fora do fluxo esperado | Aceita |
| [006](006-framework-independent-domain.md) | Domínio independente de framework | Aceita |
| [007](007-composition-over-inheritance.md) | Composição acima de herança | Aceita |
| [008](008-strong-types.md) | Tipos fortes e nominais | Aceita |
| [009](009-immutability.md) | Imutabilidade por padrão | Aceita |
| [010](010-telemetry-context-propagation.md) | Propagação de contexto de telemetria | Aceita |
| [011](011-temporal-modeling.md) | Modelagem temporal explícita | Aceita |
| [012](012-in-memory-event-dispatch.md) | Dispatch de eventos em memória | Aceita |
| [013](013-structured-logging.md) | Logging estruturado e contextual | Aceita |
| [014](014-uuid-v7-identifiers.md) | UUIDv7 para identidades geradas | Aceita |
| [015](015-fastify-http-adapter.md) | Fastify como adapter HTTP | Aceita |
| [016](016-in-memory-outbox-relay.md) | Relay de outbox em memória | Aceita |
| [017](017-http-resource-and-problem-representations.md) | Representações HTTP de recursos e problemas | Aceita |
| [018](018-testing-strategy.md) | Design e nomeação de testes comportamentais | Aceita |
| [019](019-external-database-migrations.md) | Migrations de banco externas às aplicações | Aceita |
| [020](020-uuid-contract-for-persisted-identifiers.md) | Contrato UUID para identificadores persistidos | Aceita |
| [021](021-postgresql-transactional-unit-of-work.md) | Unit of Work transacional com PostgreSQL | Aceita |
| [022](022-postgresql-observability.md) | Observabilidade da persistência PostgreSQL | Aceita |
| [023](023-application-workspaces.md) | Aplicações independentes em npm workspaces | Aceita |
| [024](024-kafka-durable-outbox-relay.md) | Relay durável de outbox com Kafka | Aceita |
| [025](025-http-request-logging-and-use-case-tracing.md) | Logging de requisição e tracing de casos de uso | Aceita |
| [026](026-kafka-cloudevents-publication.md) | Publicação Kafka com CloudEvents | Aceita |
| [027](027-local-infrastructure-terraform-ownership.md) | Ownership da infraestrutura local por Terraform | Aceita |
| [028](028-kafka-topic-terraform-ownership.md) | Ownership dos tópicos Kafka por Terraform | Aceita |
| [029](029-command-query-responsibility-separation.md) | Separação de responsabilidades entre Commands e Queries | Aceita |
| [030](030-message-owned-publication-routing.md) | Roteamento de publicação definido pela mensagem | Aceita |
| [031](031-local-trace-visualization.md) | Visualização local de traces por Collector e Jaeger | Aceita |
| [032](032-composition-root-dependency-container.md) | Container de dependências na composition root | Aceita |
| [033](033-outbox-relay-semantic-tracing.md) | Tracing semântico do outbox relay | Aceita |
| [034](034-business-process-logging.md) | Narrativa operacional dos processos de negócio | Aceita |
| [035](035-shared-application-and-observability-packages.md) | Pacotes compartilhados de Application e observabilidade Node | Aceita |
| [036](036-shared-opentelemetry-mechanics.md) | Mecânica compartilhada do OpenTelemetry | Aceita |
| [037](037-shared-id-generator-and-nominal-lease-id.md) | Id Generator compartilhado e LeaseId nominal | Aceita |
| [038](038-safe-shared-operational-primitives.md) | Primitivas operacionais compartilhadas e seguras | Aceita |
| [039](039-create-ministry-vertical-slice.md) | Primeiro corte vertical de Ministry | Aceita |
| [040](040-define-ministry-role-vertical-slice.md) | Definição de funções ministeriais | Aceita |
| [041](041-request-ministry-membership-vertical-slice.md) | Solicitação de participação ministerial | Aceita |
| [042](042-typed-mediator-and-installable-modules.md) | Mediator tipado e módulos instaláveis | Aceita |
| [043](043-approve-ministry-membership-vertical-slice.md) | Aprovação de participação ministerial | Aceita |

Novos ADRs devem registrar contexto, decisão, consequências e alternativas. Decisões aceitas não são reescritas: uma mudança cria um novo ADR que substitui o anterior.
