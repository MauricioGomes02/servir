# ADR 068 — Contexto causal de execução e fronteira de auditoria

- Estado: aceita
- Data: 2026-08-17
- Complementa: [ADR 010](010-telemetry-context-propagation.md), [ADR 013](013-structured-logging.md), [ADR 025](025-http-request-logging-and-use-case-tracing.md) e [ADR 067](067-direct-oidc-and-servir-issued-credentials.md)

## Contexto

Uma operação pode ser iniciada por uma pessoa, atravessar BFF, API, outbox e fila, e ser executada posteriormente por outro processo. Registrar apenas `userId`, IP ou serviço atual perde a diferença entre quem causou a ação, qual componente executou cada etapa e por qual canal ela começou. Logs técnicos, traces e auditoria também possuem garantias distintas e não devem ser tratados como sinônimos.

IP e user agent podem ajudar uma investigação de segurança, mas são dados pessoais, não identidades. Headers encaminhados pelo cliente são falsificáveis quando não existe uma cadeia de proxies confiável.

## Decisão

O modelo alvo do `ExecutionContext` distinguirá:

- `actor`: identidade causal que iniciou a operação, como User, Service ou System;
- `executor`: identidade do serviço que executa a etapa atual;
- `source`: origem inicial opcional, como web, API, mensagem ou job;
- `correlationId` e `requestId`: correlação já implementada, sem substituir trace ou identidades.

O ator autenticado normal usará `UserId`. Uma ação automática usará System; uma integração autenticada poderá usar Service. Quando um worker processar uma ação iniciada por User, preservará o actor original e substituirá o executor pelo próprio `ServiceId`. IP, hostname, nome de container e endereço de rede não identificarão workloads.

Cada adapter de entrada criará um contexto mínimo, imutável e independente do transporte. BFF e API identificarão seus executores pela configuração e, futuramente, por identidade de workload verificável. Mensagens transportarão somente o contexto causal permitido pelo contrato; headers HTTP, objetos de framework e credenciais não atravessarão para Application ou domínio.

`source` representará a origem inicial, não o peer de cada salto. Para web, poderá conter IP canonicalizado e user agent limitado somente quando houver necessidade de segurança ou auditoria, política de retenção e origem confiável. O BFF aceitará headers encaminhados apenas de proxies explicitamente confiáveis. O browser nunca será fonte confiável de `X-Client-IP` ou `X-Forwarded-For`.

Quando a API precisar da origem web observada pelo BFF, os campos mínimos serão protegidos pela credencial curta destinada à API ou por outro envelope autenticado; headers livres não concederão confiança. Dados pessoais não serão colocados em JWTs, logs ou mensagens por padrão.

`ExecutionContext` não será um `AuditRecord`. O contexto acompanha a operação; auditoria registra um fato relevante com ação, instante, actor, executor, origem permitida, recurso, outcome e correlação. Logs técnicos continuam de melhor esforço e respondem perguntas operacionais; traces descrevem duração e causalidade técnica; Domain Events descrevem fatos do domínio; Integration Events são contratos públicos.

Mudanças críticas que exigirem evidência atômica persistirão um registro ou intenção de auditoria na mesma transação, usando outbox e consumidor idempotente quando houver processamento assíncrono. Eventos de segurança sem transação de negócio, como login rejeitado, usarão um port de auditoria próprio e não registrarão tokens, authorization codes, secrets ou headers completos.

## Consequências

Uma ação assíncrona poderá preservar quem a iniciou sem atribuir o ato ao worker. Serviços terão identidade estável mesmo quando containers e IPs mudarem. A auditoria poderá ser durável sem transformar todo log ou evento público em evidência de compliance.

IP e user agent exigirão minimização, acesso restrito e retenção explícita. Nem toda consulta ou abertura de página será auditada. A primeira implementação introduzirá os campos somente junto a consumidores reais, e o código atual continuará documentado como parcial até a migração.

A revisão operacional futura avaliará se API, BFF e relay respondem às perguntas necessárias por logs e traces. O BFF receberá logging estruturado e OpenTelemetry. Um pipeline de logs poderá usar Elasticsearch/Kibana, enquanto a experiência de consulta de traces poderá evoluir além do Jaeger atual; aplicações continuarão emitindo contratos vendor-neutral por stdout/OTLP, sem importar SDKs desses destinos.

## Alternativas

Usar apenas `userId` foi rejeitado por perder execução por serviços e automações. Tratar executor como actor foi rejeitado por atribuir ações assíncronas ao worker. Identificar workloads por IP foi rejeitado por instabilidade. Confiar cegamente em `X-Forwarded-For` foi rejeitado por spoofing. Colocar request, headers ou logger dentro do contexto foi rejeitado por acoplamento. Usar logs técnicos como auditoria foi rejeitado porque são de melhor esforço e possuem retenção, acesso e finalidade diferentes.
