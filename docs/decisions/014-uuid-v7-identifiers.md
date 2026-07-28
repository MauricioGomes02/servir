# ADR 014 — UUIDv7 para identidades geradas

- Estado: aceita
- Data: 2026-07-28

## Contexto

Identidades persistidas precisam ser únicas sem coordenação central. UUIDv4 distribui aleatoriedade por todos os bits e tende a reduzir a localidade de inserção em índices ordenados. A aplicação também precisa preservar IDs nominais e testes determinísticos sem acoplar domínio e application a uma biblioteca.

## Decisão

Usar UUIDv7, conforme RFC 9562, como estratégia padrão para novas identidades persistidas geradas pela aplicação. O adapter `UuidV7Generator` implementa `IdGenerator<TId>`, delega a construção do tipo nominal à factory correspondente e usa a biblioteca `uuid` somente na infraestrutura.

A fonte de UUID é injetável para testes. Falha da fonte, exceção da factory e rejeição do valor gerado são falhas técnicas distintas, representadas por tipo e códigos estáveis. IDs externos permanecem opacos e passam pela validação de seus contratos; não são reescritos para UUIDv7.

## Consequências

UUIDv7 favorece ordenação temporal e localidade de inserção em índices, sem prometer ausência de fragmentação ou ordem global estrita. O timestamp embutido revela aproximadamente o instante de geração, portanto IDs sensíveis exigem avaliação específica.

O ID não substitui `createdAt`, `Instant`, ordenação de negócio ou auditoria. Bancos devem usar tipo UUID nativo quando disponível. Estado interno usado pela biblioteca para gerações no mesmo milissegundo permanece detalhe do adapter.

## Alternativas

UUIDv4 foi rejeitado como padrão para chaves persistidas por sua menor localidade em índices. Implementar UUIDv7 manualmente foi rejeitado pelo risco criptográfico e de conformidade. IDs sequenciais centralizados, ULID e geração pelo banco permanecem alternativas possíveis quando um bounded context demonstrar requisitos diferentes.
