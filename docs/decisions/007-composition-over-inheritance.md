# ADR 007 — Composição acima de herança

- Estado: aceita
- Data: 2026-07-24

## Contexto

Hierarquias extensas acoplam variações e tornam mudanças em classes base arriscadas.

## Decisão

Preferir composição de contratos, funções, policies e specifications. Usar herança apenas para uma relação semântica estável com invariantes compartilhadas, como uma base mínima de Entity.

## Consequências

Dependências ficam explícitas e comportamentos combináveis. Alguma delegação adicional é aceita.

## Alternativas

Classes base utilitárias e template methods generalizados foram rejeitados.
