# ADR 001 — Modelagem orientada ao domínio

- Estado: aceita
- Data: 2026-07-24

## Contexto

O núcleo deve servir aplicações diferentes sem ser organizado por tecnologias.

## Decisão

Usar linguagem ubíqua, bounded contexts, entidades, value objects, aggregates e serviços/policies apenas quando suas responsabilidades forem demonstradas pelo domínio.

## Consequências

Modelagem e documentação precedem infraestrutura. O custo inicial de descoberta aumenta, mas regras e nomes permanecem explícitos e testáveis.

## Alternativas

Organização por CRUD ou por framework foi rejeitada por acoplar o modelo ao mecanismo de entrega/persistência.
