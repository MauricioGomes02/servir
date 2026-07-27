# ADR 004 — Notification para acumular violações

- Estado: aceita
- Data: 2026-07-24

## Contexto

Entradas podem violar várias restrições independentes e o consumidor se beneficia de recebê-las juntas.

## Decisão

Usar Notification com erros estruturados (`code`, `field`, `params`) e sem mensagens localizadas.

## Consequências

Validações independentes podem ser acumuladas e traduzidas na borda. É necessário impedir que Notification vire estado global ou misture falhas técnicas.

## Alternativas

Fail-fast e listas de strings foram rejeitados por pior diagnóstico e contratos instáveis.
