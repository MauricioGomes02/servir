---
name: logger
description: Modelar e revisar logging e observabilidade no Servir. Usar ao registrar fatos estruturados, propagar correlação ou separar o núcleo de console, SDKs e destinos de telemetria.
---

# Objetivo

Tratar logs como fatos estruturados produzidos por adapters, não como dependência do domínio.

## Quando utilizar

Usar em handlers, application e adapters que precisam tornar execução observável.

## Regras obrigatórias

1. Ler `../../../docs/primitives/logger.md`.
2. Definir port independente do destino.
3. Registrar nome estável, atributos estruturados e contexto.
4. Remover segredos e minimizar dados pessoais.
5. Não injetar Logger em Entity ou Value Object.

## Exemplo correto

Um handler traduz `SchedulePublished` em `schedule.published` com IDs e correlation ID.

## Anti-patterns

- `console.log` no domínio.
- Mensagem textual usada por automação.
- Logar e engolir exceção.

## Checklist

- [ ] O fato é útil e pesquisável?
- [ ] Atributos têm schema estável?
- [ ] Dados sensíveis foram excluídos?
- [ ] Destino permanece no adapter?
