---
name: notification
description: Aplicar e revisar Notification Pattern no Servir. Usar em validações independentes que devem acumular múltiplas violações estruturadas antes de retornar uma falha.
---

# Objetivo

Fornecer diagnóstico acumulado sem exceções ou mensagens instáveis.

## Quando utilizar

Usar quando várias validações podem ser avaliadas com segurança na mesma tentativa.

## Regras obrigatórias

1. Ler `../../../docs/primitives/notification.md` e ADR 004.
2. Representar erro por código estável, campo opcional e parâmetros serializáveis.
3. Manter localização e transporte fora do domínio.
4. Não misturar erros técnicos, warnings ou logs.
5. Expor itens somente leitura.

## Exemplo correto

Acumular violações de nome e período, então retornar `failure(notification)`.

## Anti-patterns

- Lista de strings humanas.
- Notification global compartilhada.
- Acumular validações dependentes após pré-condição falhar.

## Checklist

- [ ] As validações são independentes?
- [ ] Códigos são tipados e estáveis?
- [ ] A coleção não vaza mutabilidade?
- [ ] O consumidor decide a tradução?
