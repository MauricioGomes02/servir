# ADR 005 — Exceções não representam fluxo esperado

- Estado: aceita
- Data: 2026-07-24

## Contexto

Entrada inválida, regra não satisfeita e ausência prevista não são defeitos inesperados.

## Decisão

Usar Result/Notification para condições esperadas. Reservar exceções para violações de programação, invariantes impossíveis após construção válida ou falhas técnicas não recuperáveis localmente. Exceções customizadas expõem tipo e código estáveis; quando encapsulam outra falha, preservam sua causa.

## Consequências

Assinaturas documentam o fluxo. Fronteiras ainda devem capturar, observar e traduzir exceções inesperadas. Tratamento, telemetria e tradução dependem do tipo ou código, nunca do texto da mensagem.

## Alternativas

Capturar toda exceção e convertê-la em falha genérica foi rejeitado por esconder defeitos.
