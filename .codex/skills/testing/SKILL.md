---
name: testing
description: Criar e revisar testes das primitivas e do domínio no Servir. Usar ao especificar invariantes, igualdade, imutabilidade, Result/Notification, eventos, policies, specifications e contratos de ports.
---

# Objetivo

Usar testes como especificação executável do comportamento arquitetural.

## Quando utilizar

Usar antes de considerar uma primitiva estável e em toda correção de comportamento.

## Regras obrigatórias

1. Ler o documento da primitiva sob teste.
2. Testar comportamento observável e contratos, não detalhes privados.
3. Cobrir caminho válido, limites, falhas esperadas e invariantes.
4. Usar Clock/IdGenerator/fakes determinísticos; evitar tempo, rede e aleatoriedade reais.
5. Nomear testes na linguagem do domínio.
6. Escrever nomes de suites, casos, helpers e fixtures em inglês como declarações de comportamento observável.
7. Selecionar casos conforme `../../../docs/testing-strategy.md`, cobrindo caminhos independentes, condições, fluxo de dados, partições de equivalência, valores limite, invariantes e contratos quando aplicáveis.
8. Tratar complexidade ciclomática acima de 10 como gatilho de revisão de design, não como quantidade automática de testes.

## Exemplo correto

Testar que uma mudança inválida retorna failure, não altera o Aggregate e não registra evento.

## Anti-patterns

- Teste que apenas replica implementação.
- Snapshot indiscriminado de objetos.
- Mock de todo colaborador sem necessidade.

## Checklist

- [ ] O teste explica uma regra?
- [ ] É determinístico e isolado?
- [ ] Verifica ausência de mutação/efeito em falha?
- [ ] Protege tipo/contrato público relevante?
- [ ] As partições, limites, condições e caminhos relevantes foram avaliados?
- [ ] O nome em inglês descreve comportamento, sem rótulo da técnica?
