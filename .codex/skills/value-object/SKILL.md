---
name: value-object
description: Modelar e revisar Value Objects imutáveis no Servir. Usar ao substituir primitivos por valores com semântica, invariantes, operações próprias e igualdade por conteúdo.
---

# Objetivo

Representar valores válidos, imutáveis e semanticamente tipados.

## Quando utilizar

Usar quando o significado e as regras importam mais que identidade/ciclo de vida.

## Regras obrigatórias

1. Ler `../../../docs/primitives/value-object.md`.
2. Criar por factory que valida entrada desconhecida e retorna Result quando a falha é esperada.
3. Preservar imutabilidade profunda ou fazer cópias defensivas.
4. Comparar por conteúdo entre tipos semanticamente compatíveis.
5. Encapsular brand/casts dentro da abstração.
6. Para nomes humanos, seguir `docs/input-validation-and-normalization.md`: NFC e whitespace previsível, preservando caixa e acentos.

## Exemplo correto

`OrganizationName.create(input)` normaliza, valida e retorna `Result<OrganizationName, Error>`.

## Anti-patterns

- Wrapper sem regra ou comportamento.
- Estado parcialmente válido.
- Expor array/objeto mutável interno.

## Checklist

- [ ] Não há identidade?
- [ ] Estado inválido é impossível após criação?
- [ ] Igualdade e imutabilidade estão testadas?
- [ ] Nome comunica unidade/semântica?
