# ADR 073 — Locks declarativos nos fluxos de escrita ministerial

- Estado: aceita
- Data: 2026-08-21
- Complementa: [ADR 039](039-create-ministry-vertical-slice.md)
- Complementa: [ADR 040](040-define-ministry-role-vertical-slice.md)
- Complementa: [ADR 041](041-request-ministry-membership-vertical-slice.md)
- Complementa: [ADR 043](043-approve-ministry-membership-vertical-slice.md)
- Complementa: [ADR 045](045-qualify-member-for-ministry-role-vertical-slice.md)
- Complementa: [ADR 072](072-repository-local-persistence-snapshots.md)

## Contexto

Os primeiros cortes de Ministries protegiam unicidade no PostgreSQL, mas `MinistryRepository.add`, `MinistryRepository.save` e `MinistryMembershipRepository.add` também interpretavam conflitos físicos como falhas de negócio. Com isso, adapters de Repository conheciam Policies e códigos esperados pela Application. Os Facts Readers de criação e solicitação executavam antes da Unit of Work, deixando uma janela entre leitura e escrita que obrigava o Repository a repetir parte da decisão.

Snapshots locais permitem que `save(aggregate)` selecione alterações, mas não resolvem concorrência. Esconder `FOR UPDATE` dentro de `findById` também tornaria a serialização invisível ao caso de uso.

## Decisão

Os fluxos ministeriais que dependem de fatos concorrentes declaram locks por ports da Application e executam leitura, decisão e escrita na mesma Unit of Work:

- `CreateMinistry` adquire a Organization, lê `MinistryCreationFacts`, avalia `MinistryCreationPolicy` e adiciona a root;
- `DefineMinistryRole` adquire o Ministry antes de carregá-lo por identidade e executar `Ministry.defineRole`;
- `RequestMinistryMembership` adquire Ministry e Member em ordem estável, lê `MinistryMembershipRequestFacts`, avalia a Policy e adiciona a root;
- aprovação e qualificação adquirem o `MinistryMembership` antes de `findById` e da mudança no Aggregate.

Os ports `MinistryWriteLock` e `MinistryMembershipWriteLock` expressam a aquisição necessária sem expor SQL. Seus adapters PostgreSQL concentram `FOR UPDATE`; Repositories não adquirem locks implicitamente.

`MinistryRepository` e `MinistryMembershipRepository` ficam limitados a `add`, `findById` e `save`. Eles não retornam erros de Policy, não consultam fatos para decidir conflitos e usam snapshots locais conforme o ADR 072. Constraints únicas permanecem como proteção estrutural contra writers que não respeitem o protocolo, mas uma violação inesperada é falha técnica do adapter, não uma decisão criada pelo Repository.

## Consequências

Policies e Aggregates são as únicas fontes das falhas esperadas de negócio. Tentativas concorrentes que usam os casos de uso suportados são serializadas antes da leitura dos fatos e recebem a decisão atualizada. A ordem de lock passa a fazer parte da orquestração visível e testável.

Os write scopes ficam um pouco maiores porque agrupam Repository, Facts Reader, lock e outbox sobre a mesma conexão. A contenção inicial é deliberadamente simples: criação serializa por Organization e solicitação por Ministry e Member. Medições futuras podem justificar uma chave de lock mais granular sem alterar os contracts dos Repositories.

## Alternativas

Manter `Result` de negócio nos Repositories foi rejeitado por misturar decisão e persistência. Capturar violações de constraint no handler foi rejeitado porque faria a Application conhecer detalhes do PostgreSQL. Validar apenas por Reader fora da transação foi rejeitado pela janela de corrida. Embutir `FOR UPDATE` no Repository foi rejeitado por esconder uma garantia de consistência. Um framework genérico de locks ou Criteria foi rejeitado por antecipar uma abstração sem consumidores equivalentes.
