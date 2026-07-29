# ADR 020 — Contrato UUID para identificadores persistidos

- Estado: aceita
- Data: 2026-07-29
- Refina: [ADR 014](014-uuid-v7-identifiers.md)

## Contexto

O ADR 014 definiu UUIDv7 como estratégia de geração sem impor UUID a todo identificador recebido. O primeiro schema PostgreSQL demonstrou, porém, que `OrganizationId`, `DomainEventId` e `MessageId` são identidades persistidas geradas pela aplicação. Aceitar textos opacos nesses contratos obrigaria o banco a usar colunas textuais ou permitiria que a factory aceitasse valores que o adapter não conseguiria persistir.

## Decisão

`OrganizationId`, `DomainEventId` e `MessageId` aceitam somente UUIDs canônicos de versões reconhecidas pela RFC 9562 e normalizam sua representação para letras minúsculas. Continuam sendo tipos nominais distintos e possuem códigos estáveis para tipo, vazio, excesso de comprimento e formato inválido.

Novas instâncias desses identificadores são geradas como UUIDv7 pelo adapter de infraestrutura. A reconstituição aceita outras versões reconhecidas para não confundir o algoritmo atual de geração com a identidade histórica dos dados. PostgreSQL persiste esses valores em colunas nativas `uuid`.

Identificadores de fronteiras externas não se tornam UUID automaticamente. `CorrelationId`, por exemplo, continua opaco porque pode ser originado por outro sistema ou por infraestrutura de telemetria.

## Consequências

Factories e schema compartilham o mesmo domínio de valores, UUIDv7 conserva localidade de inserção e o banco valida a representação física. Fixtures determinísticas precisam usar UUIDs válidos, embora payloads comuns não sejam convertidos incidentalmente em tipos de identidade.

Essa decisão restringe valores antes aceitos, como `organization-123`. Uma futura importação de identidades legadas não UUID exigirá mapeamento explícito ou revisão deste contrato, em vez de enfraquecer silenciosamente as factories atuais.

## Alternativas

Usar `varchar(128)` para todas as identidades foi rejeitado porque desperdiça o tipo nativo e permite divergência entre geração e persistência. Exigir UUIDv7 também na reconstituição foi rejeitado por acoplar dados históricos ao algoritmo atualmente escolhido. Converter `CorrelationId` em UUID foi rejeitado porque ele cruza fronteiras cujo formato não é controlado pelo domínio.

