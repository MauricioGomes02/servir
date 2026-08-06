# ADR 037 — Id Generator compartilhado e LeaseId nominal

- Estado: aceita
- Data: 2026-08-05
- Complementa: [ADR 008](008-strong-types.md), [ADR 014](014-uuid-v7-identifiers.md), [ADR 020](020-uuid-contract-for-persisted-identifiers.md) e [ADR 035](035-shared-application-and-observability-packages.md)

## Contexto

API e outbox relay precisam gerar identidades, mas mantinham ports estruturalmente equivalentes com nomes diferentes. O relay representava a identidade de posse de uma lease como `string` e seu adapter UUIDv7 confiava em qualquer valor devolvido pela fonte. Isso permitia intercambiar a lease com outros textos e aceitar silenciosamente UUIDs inválidos ou de outra versão.

Os contratos temporais das duas aplicações, em contraste, não são equivalentes: a API produz `Instant` de domínio, enquanto o relay calcula timestamps UTC operacionais e deriva expirações. Unificá-los no mesmo incremento apagaria necessidades distintas.

## Decisão

O port mínimo `IdGenerator<TId>` passa a residir em `@servir/application-foundation`, independente de algoritmo e runtime. A API mantém uma fachada temporária de tipo para migração incremental. O relay especializa o port como `LeaseIdGenerator = IdGenerator<LeaseId>`.

`LeaseId` é uma identidade nominal do processo de outbox e aceita somente a representação canônica de UUIDv7. Sua factory encapsula a marca nominal e rejeita entradas inválidas com `LeaseIdError` e código estável. Geração, fixtures e reconstituição PostgreSQL passam pela factory; o adapter converte falha da fonte ou rejeição do valor em falha técnica de geração com causa preservada.

Os contratos `Clock` e a representação `Instant` não são centralizados. A modelagem temporal compartilhada será reconsiderada quando atividades, recorrência, disponibilidade e escalas fornecerem requisitos concretos de instante, duração, data civil, horário local e timezone.

## Consequências

Consumidores não podem trocar acidentalmente um lease ID por qualquer `string`. Um valor persistido inválido é classificado como linha inválida antes de entrar na Application. O contrato de geração pode ser reutilizado por aplicações sem importar UUID ou factories concretas.

Fixtures do relay usam UUIDv7 canônico, tornando os testes compatíveis com o contrato físico PostgreSQL. O algoritmo UUIDv7 continua em adapters, e seu timestamp não substitui tempo de negócio ou auditoria.

## Alternativas

Manter `LeaseIdGenerator` como interface independente foi rejeitado por duplicar um contrato já estável. Compartilhar apenas uma função que retorna `string` foi rejeitado porque preservaria a fragilidade semântica. Mover `Instant` e ambos os Clocks agora foi rejeitado porque os consumidores ainda não compartilham o mesmo contrato. Criar um pacote genérico de utilitários de tempo e identidade foi rejeitado por não expressar ownership coeso.
