# ADR 034 — Narrativa operacional dos processos de negócio

- Estado: aceita
- Data: 2026-08-05
- Refina: [ADR 013](013-structured-logging.md) e [ADR 025](025-http-request-logging-and-use-case-tracing.md)

## Contexto

Um único registro ao final da requisição é suficiente para operação HTTP, mas não explica as decisões e os marcos de um processo de negócio. Traces mostram causalidade técnica, duração e dependências; usá-los como única narrativa exige inferir significado de negócio a partir de spans de framework, banco e mensageria.

Registrar cada método, query ou objeto produziria volume sem semântica e aumentaria o risco de expor dados. Domain Events também não devem existir apenas para gerar logs de melhor esforço.

## Decisão

Operações de negócio relevantes podem produzir uma sequência curta de registros estruturados na Application: intenção iniciada, decisão esperada, marco persistido e conclusão. Os nomes são estáveis, os atributos usam códigos, identidades e contagens, e o `ExecutionContext` preserva correlação. Entidades e Value Objects não recebem Logger.

O primeiro corte é `CreateOrganization`, com `organization.creation.started`, `organization.creation.validated`, `organization.creation.rejected`, `organization.creation.persisted` e `organization.creation.completed`. Nome da organização, command, payload, entidade, evento completo e dados pessoais não são registrados.

Marcos intermediários usam `debug`; fatos persistidos, conclusões e rejeições esperadas usam `info`. `LOG_LEVEL` controla o volume no adapter JSON. Falhas técnicas continuam registradas uma vez na borda que possui contexto e não são capturadas pelo handler apenas para logar e relançar.

Logs contam a evolução semântica; traces continuam responsáveis por SQL, Kafka, duração interna e relacionamento técnico. O resumo `http.request.completed` permanece porque atende uma pergunta operacional diferente.

## Consequências

Uma operação pode ser reconstruída por `correlationId` ou `traceId` sem inspecionar payload. Em desenvolvimento, `debug` expõe decisões intermediárias; ambientes com menor tolerância a volume podem usar `info`, `warn` ou `error` sem alterar casos de uso.

Cada novo marco exige uma pergunta operacional concreta e um schema mínimo. Logs não substituem auditoria durável e não garantem entrega.

## Alternativas

Manter somente o log HTTP foi rejeitado por não explicar o processo de negócio. Copiar todos os logs para span events foi rejeitado por misturar documentos operacionais com tracing e duplicar volume. Instrumentar cada método foi rejeitado por produzir uma narrativa técnica pior que os traces. Gerar Domain Events exclusivamente para logging foi rejeitado por acoplar um efeito de melhor esforço ao fluxo durável.
