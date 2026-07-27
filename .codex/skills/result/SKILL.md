---
name: result
description: Aplicar e revisar Result Pattern no Servir. Usar ao modelar operações com sucesso ou falha esperada, factories validadas e composição explícita de resultados tipados.
---

# Objetivo

Tornar fluxos esperados explícitos na assinatura.

## Quando utilizar

Usar quando o chamador consegue agir sobre uma falha prevista.

## Regras obrigatórias

1. Ler `../../../docs/primitives/result.md` e ADRs 003/005.
2. Usar união discriminada com exatamente sucesso ou falha.
3. Tipar erros por contrato; não usar mensagem para controle.
4. Não converter defeitos inesperados em failure genérico.
5. Adicionar combinadores somente com usos repetidos comprovados.

## Exemplo correto

`Result<OrganizationId, EntityIdError>` obriga tratamento de formato e versão inválidos.

## Anti-patterns

- Misturar throw e failure para a mesma condição.
- `Result<T, unknown>` por padrão.
- Ignorar o discriminante com cast.

## Checklist

- [ ] A falha é esperada e recuperável?
- [ ] Ambos os ramos são exclusivos?
- [ ] Tipos preservam informação útil?
- [ ] Não há efeito colateral oculto?
