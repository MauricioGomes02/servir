---
name: aggregate
description: Modelar e revisar Aggregates e Aggregate Roots no Servir. Usar ao definir fronteiras de consistência, invariantes envolvendo múltiplos objetos e ciclo de Domain Events pendentes.
---

# Objetivo

Definir a menor fronteira que preserva invariantes de forma consistente.

## Quando utilizar

Usar quando mudanças relacionadas precisam ser aceitas ou rejeitadas juntas.

## Regras obrigatórias

1. Ler `../../../docs/primitives/aggregate-root.md` e `domain-event.md`.
2. Permitir mudanças internas somente pela root.
3. Registrar evento junto da mudança válida; não publicar no domínio.
4. Não expor coleções internas mutáveis.
5. Tratar a root como unidade do Repository.

## Exemplo correto

`Organization.addTeam` protege unicidade e registra `TeamAdded` somente após sucesso.

## Anti-patterns

- Agregado igual ao grafo do ORM.
- Repository para entidade interna.
- Root chamando event bus ou transaction.

## Checklist

- [ ] A fronteira corresponde a invariantes?
- [ ] O Aggregate permanece pequeno?
- [ ] Falha não deixa mutação parcial?
- [ ] Eventos pendentes têm ciclo explícito?
