# ADR 051 — Valores temporais civis canônicos

- Estado: aceita
- Data: 2026-08-11

## Contexto

O ADR 011 separou `Instant`, data civil, horário civil e zona IANA, mas adiou os contratos civis até existirem requisitos concretos. `ActivityOccurrence` precisa preservar a intenção local de agenda e `SchedulePeriod` precisa representar horizontes inclusivos sem depender de timezone. Misturar esses conceitos em `Date` ou converter cedo para UTC perde semântica e torna transições de offset implícitas.

## Decisão

Introduzir Value Objects independentes e imutáveis:

- `CivilDate` usa calendário gregoriano e representação estrita `YYYY-MM-DD`, dos anos 0001 a 9999;
- `CivilTime` usa representação estrita `HH:mm` e precisão de minuto;
- `TimeZoneId` aceita uma zona reconhecida pelo banco IANA do runtime, rejeita offsets fixos e armazena o identificador canônico resolvido;
- `SchedulePeriod` contém início e fim inclusivos e rejeita início posterior ao fim.

Os contratos não expõem bibliotecas temporais. A combinação de data, horário e zona não produz `Instant` neste corte. O primeiro caso de uso consumidor deverá definir explicitamente como tratar horários inexistentes ou ambíguos durante transições de offset.

## Consequências

Agendamentos deixam de depender da timezone do processo e não confundem intenção civil com instante absoluto. Aliases IANA convergem para uma representação canônica segundo o runtime. Atualizações da base IANA podem mudar a canonicalização, portanto deploys devem usar runtimes suportados e a persistência deverá conservar a zona canônica junto à intenção civil.

Períodos de um único dia são válidos e nenhuma duração máxima é antecipada. Precisão de segundos exigirá uma nova necessidade de domínio em vez de ampliação silenciosa do contrato atual.

## Alternativas

Persistir somente UTC foi rejeitado porque não preserva a intenção local nem mudanças futuras nas regras de uma zona. Offsets fixos foram rejeitados porque não representam regras históricas e futuras. Uma string única de data/hora/zona foi rejeitada por misturar valores com invariantes e consumidores diferentes. Adotar Luxon ou Temporal na API pública foi rejeitado para preservar a independência do núcleo.
