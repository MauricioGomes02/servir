# ADR 003 — Result para falhas esperadas

- Estado: aceita
- Data: 2026-07-24

## Contexto

Operações de validação e decisão têm falhas previstas que fazem parte do contrato.

## Decisão

Representar essas operações por união discriminada `Result<TValue, TError>`, com sucesso e falha mutuamente exclusivos.

## Consequências

Chamadores tratam ambos os caminhos e erros ficam tipados. APIs podem ficar mais verbosas, e combinadores só serão adicionados com necessidade comprovada.

## Alternativas

Exceções, `null` e tuplas sem discriminante foram rejeitados por esconder ou enfraquecer semântica.
