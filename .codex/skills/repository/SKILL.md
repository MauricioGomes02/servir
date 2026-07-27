---
name: repository
description: Definir e revisar contratos de Repository no Servir. Usar ao criar ports de persistência para Aggregate Roots, separar modelos de domínio de ORM ou desenhar consultas exigidas por consumidores.
---

# Objetivo

Isolar persistência atrás de contratos orientados ao domínio e ao consumidor.

## Quando utilizar

Usar quando application precisa carregar ou salvar um Aggregate sem conhecer tecnologia.

## Regras obrigatórias

1. Ler `../../../docs/primitives/repository.md`.
2. Criar contrato específico por Aggregate, não CRUD genérico.
3. Receber/retornar tipos de domínio, nunca modelos de ORM.
4. Manter transação e publicação fora do Repository.
5. Separar read port quando a consulta não exige Aggregate.

## Exemplo correto

`OrganizationRepository.findById(id)` e `save(organization)` conforme casos de uso reais.

## Anti-patterns

- `Repository<T>` universal.
- Expor query builder.
- Repository por tabela.

## Checklist

- [ ] O consumidor exige cada método?
- [ ] A unidade é Aggregate Root?
- [ ] Ausência/falha têm semântica explícita?
- [ ] O contrato ignora detalhes do banco?
