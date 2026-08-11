# ADR 050 — Validação acumulada de entrada e normalização segura

- Estado: aceita
- Data: 2026-08-11
- Complementa: [ADR 003](003-result-pattern.md), [ADR 004](004-notification-pattern.md) e [ADR 005](005-no-expected-exceptions.md)

## Contexto

Handlers retornavam a primeira falha estrutural, embora vários IDs e valores pudessem ser validados independentemente. A API já possuía Problem Details com coleção de erros, mas a apresentação entregava apenas um item. IDs recentes também possuíam diagnósticos menos específicos e nomes aplicavam normalizações diferentes.

## Decisão

Handlers acumulam validações estruturais independentes antes de I/O por `combineValidationResults`. O acumulador usa `Notification` e retorna uma coleção imutável com erro primário estável. Presenters traduzem todos os itens e o adapter HTTP os preserva no Problem Details.

IDs usam a mecânica comum `validateEntityId`, mantendo tipos nominais e códigos específicos por conceito. Nomes aplicam Unicode NFC, removem whitespace externo e compactam whitespace interno, preservando caixa e acentos.

Policies, consultas dependentes, conflitos concorrentes e transições de Aggregate continuam fail-fast.

## Consequências

Clientes recebem um diagnóstico estrutural completo em uma tentativa e nenhuma consulta ocorre com entrada inválida. Contratos de apresentação passam a transportar uma coleção, mantendo o primeiro item para decisões HTTP compatíveis. Novos IDs e nomes devem seguir o padrão documentado.

## Alternativas

Manter fail-fast em toda validação foi rejeitado pelo custo de múltiplas tentativas. Acumular decisões dependentes foi rejeitado por produzir diagnósticos especulativos. Remover acentos, forçar caixa ou transliterar nomes foi rejeitado por alterar a representação escolhida pelo usuário.
