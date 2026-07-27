---
name: domain-event
description: Modelar e revisar Domain Events no Servir. Usar quando um Aggregate precisa registrar um fato relevante para consumidores desacoplados ou quando eventos internos e de integração precisam ser distinguidos.
---

# Objetivo

Comunicar fatos de domínio sem executar efeitos colaterais.

## Quando utilizar

Usar para fatos passados que interessam além do comportamento que os produziu.

## Regras obrigatórias

1. Ler `../../../docs/primitives/domain-event.md` e ADR 002.
2. Nomear no passado e manter payload mínimo, imutável e independente de framework.
3. Registrar no Aggregate; publicar fora dele.
4. Não reutilizar automaticamente o evento interno como contrato de integração.
5. Obter ID/instante por contratos explícitos.

## Exemplo correto

`SchedulePublished` contém IDs e instante do fato; um handler externo gera log ou integração.

## Anti-patterns

- `PublishScheduleEvent` como intenção.
- Evento com método `handle`.
- Referência a entidade mutável no payload.

## Checklist

- [ ] É fato, não command?
- [ ] Há relevância para outro componente?
- [ ] Payload é estável e mínimo?
- [ ] Não existem efeitos no domínio?
