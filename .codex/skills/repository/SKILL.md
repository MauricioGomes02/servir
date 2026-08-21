---
name: repository
description: Definir e revisar contratos e adapters de Repository no Servir. Usar ao persistir Aggregate Roots, separar consultas em Readers, implementar tracking de mudanças ou explicitar consistência concorrente sem colocar regras de negócio na persistência.
---

# Objetivo

Isolar persistência atrás de contratos orientados ao domínio e ao consumidor.

## Quando utilizar

Usar quando application precisa carregar ou salvar um Aggregate sem conhecer tecnologia.

## Regras obrigatórias

1. Ler `../../../docs/primitives/repository.md`.
2. Criar contrato específico por Aggregate Root e somente com operações exigidas pelos casos de uso; não criar CRUD genérico nem um método por ação de domínio.
3. Receber e retornar tipos de domínio, nunca modelos de ORM, DTOs ou Read Models.
4. Limitar o Repository a reconstituir a root por sua identidade e persistir seu estado. Consultas por identidade alternativa, projeções ou fatos compostos pertencem a Readers orientados ao consumidor.
5. Manter decisões e falhas esperadas de negócio em Aggregates, Policies e handlers. O Repository não importa Policies, não decide elegibilidade e não converte violações físicas em `Result` de negócio; constraints são proteção estrutural e violações inesperadas são falhas técnicas codificadas.
6. Manter demarcação transacional, ordem de locks e publicação fora do Repository. Quando fatos precisam permanecer estáveis até a escrita, o handler declara um port de lock, a ordem de aquisição e a sequência `lock → fatos ou Aggregate → decisão → persistência` dentro da mesma Unit of Work; o adapter do Repository não esconde `FOR UPDATE`.
7. Para Aggregate Roots mutáveis com ciclo `findById` seguido de `save`, ler o [ADR 072](../../../docs/decisions/072-repository-local-persistence-snapshots.md) e usar snapshot local ao adapter do write scope quando for necessário selecionar mudanças sem passar campos pela Application. O snapshot contém uma whitelist persistível, evita `UPDATE` sem mudança, renova somente após sucesso e não implica coluna de versão.
8. Quando o fluxo exigir serialização por fatos concorrentes, usar o [ADR 073](../../../docs/decisions/073-declarative-ministry-write-locks.md) como referência concreta e manter Repository, Facts Reader, lock e outbox sobre o mesmo write scope. Não generalizar locks ou Criteria antes de existirem consumidores equivalentes.

## Exemplo correto

`MinistryRepository.findById(id)` reconstitui a root e `save(ministry)` compara seu estado ao snapshot local. Se a alteração exigir serialização, o handler adquire `MinistryWriteLock` antes da leitura; o Repository continua sem conhecer a regra ou o lock.

## Anti-patterns

- `Repository<T>` universal.
- Expor query builder.
- Repository por tabela.
- Métodos como `findActiveByUser` ou `saveMemberLink` criados para cada filtro ou ação.
- Consultar fatos para decidir regras ou retornar erros de Policy pelo Repository.
- Tratar `ON CONFLICT`, constraint ou número de linhas afetadas como decisão de negócio.
- Executar `FOR UPDATE` implicitamente em `findById`.
- Atualizar todas as colunas sem necessidade ou receber da Application uma lista de campos alterados.
- Compartilhar snapshots entre write scopes ou usar Domain Events como patches de banco.

## Checklist

- [ ] O consumidor exige cada método?
- [ ] A unidade é Aggregate Root?
- [ ] Ausência/falha têm semântica explícita?
- [ ] O contrato ignora detalhes do banco?
- [ ] Consultas que não reconstituem a root estão em Readers específicos?
- [ ] Policies, regras e códigos de falha de negócio ficaram fora do Repository?
- [ ] Locks necessários estão explícitos no handler e no write scope, em ordem testável?
- [ ] `save` persiste somente diferenças rastreadas e não executa `UPDATE` sem mudança?
- [ ] Toda nova propriedade persistível atualizou snapshot, comparação e mapper?
- [ ] Erros técnicos do adapter possuem códigos estáveis e preservam a causa?
