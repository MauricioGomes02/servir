---
name: naming
description: Escolher e revisar nomes segundo o vocabulário ubíquo do Servir. Usar ao criar módulos, tipos, eventos, commands, queries, policies, specifications, handlers, errors ou métodos de domínio.
---

# Objetivo

Fazer nomes comunicarem responsabilidade e impedir sinônimos arquiteturais ambíguos.

## Quando utilizar

Usar antes de introduzir qualquer conceito público ou quando dois nomes parecem intercambiáveis.

## Regras obrigatórias

1. Ler `../../../docs/glossary.md`.
2. Reutilizar o termo canônico ou propor atualização do glossário.
3. Nomear eventos no passado, commands no imperativo e specifications como condições.
4. Evitar sufixos vagos como `Manager`, `Helper`, `Common`, `Utils` e `Base`.
5. Nomear erro por conceito e código estável, não por mensagem.

## Exemplo correto

`PublishSchedule` (command), `SchedulePublished` (event), `SchedulePublicationPolicy` (decisão).

## Anti-patterns

- `ScheduleService` com responsabilidades distintas.
- `Data`, `Info` ou `Model` sem contexto.
- Mesmo termo com significados diferentes.

## Checklist

- [ ] O nome está no vocabulário?
- [ ] Expressa fato, intenção, condição ou responsabilidade?
- [ ] Evita tecnologia no domínio?
- [ ] Pode ser entendido sem abrir a implementação?
