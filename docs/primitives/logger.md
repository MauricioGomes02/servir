# Logger

## Motivação

Registrar fatos estruturados de forma independente do destino de observabilidade.

## Problema que resolve

Strings e chamadas diretas a console/SDK espalham formato, destino e dados sensíveis pelo núcleo.

## Responsabilidades

- Aceitar nível, nome do fato e atributos estruturados.
- Preservar contexto de correlação.
- Ser implementado por adapters.

## O que não faz

- Não substitui Domain Events.
- Não decide regra de negócio.
- Não expõe CloudWatch, Datadog ou OpenTelemetry ao núcleo.

## Fluxo

```mermaid
flowchart LR
    F[Fato] --> T[Transformação]
    T --> L[Logger Port]
    L --> A[Adapter]
    A --> D[Console / Cloud / OTel]
```

## Exemplos

```ts
logger.log(
  createLogRecord({
    level: LogLevels.Info,
    eventName: "http.request.completed",
    context: {
      correlationId: context.correlationId,
      requestId: context.requestId,
    },
    attributes: {
      "http.request.method": "POST",
      "http.route": "/organizations",
      "http.response.status_code": 201,
      "duration.ms": 42,
    },
  }),
);
```

`LogContext` aceita apenas `CorrelationId`, `RequestId`, `MessageId` e `causationId` nesta etapa. O adapter JSON consulta o contexto ativo do OpenTelemetry e acrescenta `traceId` e `spanId` no momento da escrita, sem alterar o port nem exigir esses dados dos casos de uso. Resource attributes como serviço, versão e ambiente pertencem ao SDK e ao backend de observabilidade, não a cada chamada de log.

## Relacionamento com outras primitivas

Consome metadados permitidos de Context e Message; adapters implementam o port. A borda HTTP registra conclusão ou falha uma única vez, enquanto Domain Events permanecem reservados a reações orientadas a fatos de negócio. Logger é observabilidade de melhor esforço e não substitui um `AuditWriter` durável.

O contrato canônico reside em `@servir/application-foundation`; o adapter JSON Lines compartilhado por API e relay reside em `@servir/node-observability`. Timestamps atravessam esse limite como UTC ISO. Fachadas locais podem reexportar os tipos durante migrações, mas não mantêm implementações próprias.

## Possíveis evoluções

O adapter JSON para stdout limita tamanho, profundidade e quantidade de atributos antes da escrita e já correlaciona o registro ao span ativo. Cada linha representa uma única ocorrência nessa codificação, mas JSON Lines não faz parte do contrato do port. `node-observability` também compartilha a extração segura de falhas técnicas: tipo e código são o padrão; mensagem e stack exigem habilitação explícita. Permanecem planejados um exporter OTLP e políticas configuráveis de redaction.

Um incremento próprio alinhará o modelo interoperável ao OpenTelemetry Logs Data Model e às Semantic Conventions que estiverem estáveis, sem expor tipos do SDK no port. O contrato deverá distinguir timestamp do evento e de observação, severidade, nome do evento, trace/span, resource, instrumentation scope e atributos da ocorrência. Convenções ainda instáveis exigirão decisão e versão explícitas antes de adoção.

JSON Lines e OTLP serão codificações de adapters. ECS, `@timestamp`, index templates, data streams, labels e mappings equivalentes pertencerão ao collector ou ao adapter de cada destino. Elasticsearch, Loki, Datadog, CloudWatch ou outro backend poderão ser substituídos sem alterar `Logger`, Application ou domínio. Retenção e políticas específicas de indexação permanecerão na infraestrutura escolhida.

Uma revisão incremental verificará se os registros atuais respondem às perguntas técnicas e operacionais de API e relay e adicionará logging estruturado e tracing ao BFF. Elasticsearch/Kibana poderá fornecer busca de logs, e a experiência de traces poderá evoluir além do Jaeger atual, mas ambos permanecerão destinos atrás do pipeline vendor-neutral. Actor, executor, source, IP e user agent não serão adicionados automaticamente a todo log; cada uso exige pergunta observável, minimização e política de acesso.

Falhas de adapters PostgreSQL são registradas na fronteira HTTP ou no worker que possui `ExecutionContext`, nunca simultaneamente no adapter que irá relançá-las. A instrumentação automática do driver produz spans técnicos separados com `db.query.text` parametrizado, sem valores dos parâmetros; logs preservam apenas o código estável e o contexto necessário, usando `traceId` para navegação até a query.

A API emite `http.request.completed` para respostas abaixo de 500 e `http.request.failed` para falhas técnicas. O registro contém duração total monotônica, método, rota normalizada e status. Mensagem e stack trace da exceção não são copiadas; spans automáticos e o span semântico do caso de uso fornecem a decomposição temporal correlacionada.

Falhas fatais de bootstrap e shutdown seguem política diferente dos registros HTTP: em produção preservam somente tipo e código estáveis; em desenvolvimento podem incluir mensagem e stack quando `NODE_ENV=development`. A opção é explícita e não altera a classificação da falha.

Processos de negócio relevantes podem emitir uma sequência curta de marcos semânticos na Application. Esses registros explicam intenção, decisão, persistência e conclusão; não repetem queries, durações internas nem detalhes de framework já presentes no trace. `LOG_LEVEL` permite manter decisões intermediárias em `debug` e fatos concluídos ou rejeições em `info`.

## Boas práticas

- Usar nomes estáveis e atributos pesquisáveis.
- Remover segredos e minimizar dados pessoais.
- Preferir IDs, códigos, contagens, duração e resultado da operação.
- Emitir um único resumo HTTP por requisição e somente os marcos de negócio necessários para reconstruir uma operação.
- Usar `debug` para decisões intermediárias e `info` para fatos persistidos, conclusões e rejeições esperadas.
- Manter atributos de resource e trace fora das chamadas da application.

## Anti-patterns

- Log textual como contrato de integração.
- Logger dentro de Value Object ou Entity.
- Capturar e ignorar erro após logar.
- Copiar payload, headers, tokens, entidades ou dados pessoais por conveniência.
- Repetir em logs a query e as durações já disponíveis no trace PostgreSQL.
- Registrar cada método, copiar Commands ou usar logs como dump do estado interno.
- Usar IDs de alta cardinalidade como dimensões de métricas automaticamente.
