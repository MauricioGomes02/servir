# ADR 009 — Imutabilidade por padrão

- Estado: aceita
- Data: 2026-07-24

## Contexto

Referências mutáveis compartilhadas dificultam raciocínio, igualdade, eventos e testes.

## Decisão

Value Objects, Events, Results, erros e Contexts são imutáveis. Entities alteram estado somente por comportamentos que preservam invariantes.

## Consequências

Fluxos ficam previsíveis, mas cópias defensivas e atenção a estruturas aninhadas são necessárias; `Object.freeze` raso não prova imutabilidade profunda.

## Alternativas

Setters públicos e objetos parcialmente válidos foram rejeitados.
