# Repository

## Motivação

Oferecer ao núcleo uma visão de coleção de Aggregates sem revelar mecanismo de persistência.

## Problema que resolve

ORMs e consultas técnicas no domínio acoplam regras ao esquema, lifecycle e capacidades de uma tecnologia.

## Responsabilidades

- Carregar Aggregate Roots quando uma decisão de domínio exige seu estado e comportamento.
- Persistir mudanças na fronteira do Aggregate.
- Explicitar ausência e falhas relevantes por contrato.

## O que não faz

- Não é CRUD genérico para qualquer entidade.
- Não retorna modelos do ORM.
- Não abre transação ou publica eventos sozinho.

## Fluxo

```mermaid
flowchart LR
    U[Application] --> R[Repository Port]
    R --> A[Adapter]
    A --> P[(Persistência)]
    P --> A
    A --> G[Aggregate reconstituído]
```

## Exemplos

`OrganizationRepository.findById` e `save` operam `Organization`. Uma Query como `GetMemberDetails` define um `MemberDetails` Read Model e usa um `MemberDetailsReader`, sem adicionar projeções ao `MemberRepository`.

Quando um mesmo Repository atende criação e alteração, os verbos podem distinguir o ciclo esperado do Aggregate. `add(aggregate)` introduz uma root nova na coleção e deve rejeitar colisões em vez de atualizar estado existente. `save(aggregate)` persiste mudanças de uma root previamente carregada, preservando sua identidade. Essa distinção não representa diretamente `INSERT`, `UPDATE` ou `UPSERT`: o adapter escolhe as operações físicas necessárias e não transforma uma criação em atualização silenciosa.

No módulo Ministries, `add(ministry)` atende `CreateMinistry`, enquanto `findById` seguido de `save(ministry)` atende `DefineMinistryRole`. A separação impede que uma colisão de `MinistryId` durante criação seja interpretada como alteração de outro Aggregate e deixa explícita a pré-condição de cada operação.

O port nasce junto ao primeiro consumidor que demonstra essas operações. A fundação não fornece uma interface compartilhada de Repository apenas para antecipar contratos ainda desconhecidos.

## Relacionamento com outras primitivas

Opera Aggregate Roots e EntityIds; participa de Unit of Work; adapters usam Mappers.

## Possíveis evoluções

Criar os primeiros Repository ports específicos junto aos Commands consumidores. Queries, Readers, paginação e Read Models nascem juntos à primeira necessidade concreta de leitura. Separar armazenamento físico de escrita e leitura somente quando houver motivo operacional.

## Boas práticas

- Desenhar pelo consumidor, não pela API do banco.
- Manter contrato pequeno e específico do Aggregate.
- Distinguir adição de root nova e persistência de root carregada quando os consumidores exigirem garantias diferentes.
- Tratar ausência esperada sem convertê-la em falha técnica; o caso de uso atribui a semântica de negócio.

## Anti-patterns

- `GenericRepository<T>`.
- Expor query builder ao application/domain.
- Repository por tabela ou entidade interna.
- Retornar DTO ou Read Model de apresentação por Repository.
- Criar `GenericReadRepository<T>` para consultas sem consumidor definido.
