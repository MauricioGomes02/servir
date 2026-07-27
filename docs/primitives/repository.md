# Repository

## Motivação

Oferecer ao núcleo uma visão de coleção de Aggregates sem revelar mecanismo de persistência.

## Problema que resolve

ORMs e consultas técnicas no domínio acoplam regras ao esquema, lifecycle e capacidades de uma tecnologia.

## Responsabilidades

- Carregar Aggregate Roots por identidade ou consultas necessárias ao consumidor.
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

`OrganizationRepository.findById` e `save`; consultas de leitura podem usar ports próprios quando não precisam reconstituir Aggregate.

## Relacionamento com outras primitivas

Opera Aggregate Roots e EntityIds; participa de Unit of Work; adapters usam Mappers.

## Possíveis evoluções

Definir concorrência otimista, paginação e separação de read models quando os casos de uso existirem.

## Boas práticas

- Desenhar pelo consumidor, não pela API do banco.
- Manter contrato pequeno e específico do Aggregate.

## Anti-patterns

- `GenericRepository<T>`.
- Expor query builder ao application/domain.
- Repository por tabela ou entidade interna.
