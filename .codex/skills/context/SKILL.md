---
name: context
description: Modelar e revisar Execution Context no Servir. Usar ao propagar correlation ID, request ID, ator, tenant, locale ou trace entre adapters e application sem depender do transporte.
---

# Objetivo

Propagar metadados mínimos e imutáveis sem vazar framework ou estado global.

## Quando utilizar

Usar na borda de cada operação iniciada por HTTP, fila, job ou teste.

## Regras obrigatórias

1. Ler `../../../docs/primitives/context.md`.
2. Criar o contexto no adapter de entrada e propagá-lo explicitamente.
3. Usar tipos fortes e campos mínimos.
4. Não armazenar dependências, payload ou objetos de framework.
5. Separar identidade do ator de entidade de domínio.

## Exemplo correto

HTTP e job constroem o mesmo `ExecutionContext` por origens diferentes.

## Anti-patterns

- Request Express no caso de uso.
- Context como service locator.
- Dados pessoais propagados sem necessidade.

## Checklist

- [ ] O campo é metadado transversal necessário?
- [ ] O contrato independe do transporte?
- [ ] O valor é imutável?
- [ ] Correlação é preservada nas saídas?
