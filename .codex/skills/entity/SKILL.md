---
name: entity
description: Modelar e revisar Entities e IDs tipados no Servir. Usar ao criar objetos definidos por identidade, factories de entidades, igualdade ou comportamentos que preservam continuidade.
---

# Objetivo

Garantir identidade estável, igualdade correta e comportamento não anêmico.

## Quando utilizar

Usar quando um conceito continua sendo o mesmo apesar da alteração de atributos.

## Regras obrigatórias

1. Ler `../../../docs/primitives/entity.md` e o verbete Entity no glossário.
2. Usar ID nominal compatível e igualdade por identidade.
3. Construir somente estado válido por constructor protegido/factory.
4. Alterar estado apenas por comportamentos que preservem invariantes.
5. Não adicionar eventos salvo se o tipo também for Aggregate Root.

## Exemplo correto

`Organization.rename(name)` valida e muda o nome; duas organizações com mesmo nome não são iguais sem o mesmo ID.

## Anti-patterns

- Setters públicos.
- Igualdade por todas as propriedades.
- ID `string` intercambiável entre entidades.

## Checklist

- [ ] O conceito realmente possui identidade?
- [ ] ID, igualdade e factory estão testados?
- [ ] Invariantes são protegidas?
- [ ] Persistência e framework estão ausentes?
