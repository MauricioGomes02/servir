# ADR 038 — Primitivas operacionais compartilhadas e seguras

- Estado: aceita
- Data: 2026-08-05
- Complementa: [ADR 013](013-structured-logging.md), [ADR 023](023-application-workspaces.md) e [ADR 035](035-shared-application-and-observability-packages.md)

## Contexto

API e outbox relay repetiam a normalização de `LOG_LEVEL` e extraíam atributos de exceções com políticas diferentes. A API incluía mensagem e stack em toda falha fatal; o relay geralmente registrava apenas um código. Mensagens técnicas podem conter URLs, credenciais, valores de drivers ou outros dados inadequados para logs de produção.

Os processos também possuem código parecido para sinais e encerramento, mas a ordem é semanticamente diferente. A API fecha o servidor HTTP e seus hooks; o relay interrompe o worker e então desconecta Kafka, PostgreSQL e telemetria.

## Decisão

`@servir/application-foundation` fornece `parseLogLevel`, responsável somente por normalizar severidades conhecidas, aplicar fallback e sinalizar entrada inválida. Cada aplicação preserva seu próprio erro e código de configuração.

`@servir/node-observability` fornece `createErrorLogAttributes`, que produz `error.type` e `error.code` com fallback fornecido pelo consumidor. Mensagem e stack são omitidas por padrão e somente aparecem com `includeDetails: true`. API e relay habilitam detalhes para falhas de lifecycle apenas quando `NODE_ENV=development`.

Nomes de eventos, severidade, códigos fallback e decisão de encerrar o processo permanecem locais. Registro de sinais, ordem de shutdown, bootstrap dinâmico e configuração específica não são centralizados.

## Consequências

Os processos usam o mesmo vocabulário de severidade e o mesmo schema mínimo de falhas técnicas. Produção não depende de mensagens para classificação nem expõe detalhes por padrão. Desenvolvimento local pode preservar diagnóstico detalhado por uma opção explícita.

O lifecycle continua legível na composition root de cada processo. Novos serviços podem reutilizar as primitivas sem herdar uma orquestração genérica ou um pacote de utilitários sem ownership.

## Alternativas

Compartilhar todas as configurações foi rejeitado porque regras e códigos pertencem aos processos. Criar um `ServiceLifecycleManager` foi rejeitado porque esconderia ordem e garantias de encerramento distintas. Registrar sempre mensagem e stack foi rejeitado pelo risco de exposição. Omitir detalhes em todos os ambientes foi rejeitado por reduzir desnecessariamente o diagnóstico local.
