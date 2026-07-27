# ADR 012 — Dispatch de eventos em memória

- Estado: aceita
- Data: 2026-07-27

## Contexto

Um evento pode acionar logging, auditoria, métricas e notificações independentes. Interromper no primeiro erro esconde falhas e impede reações que ainda poderiam concluir; ignorar erros impede retry e observabilidade.

## Decisão

O Event Bus em memória inicia todos os handlers inscritos, aguarda suas conclusões concorrentemente e, depois, lança `EventDispatchError` com todas as falhas. Ausência de handlers é sucesso; ordem de conclusão não é garantida. Uma combinação de nome do evento e nome do handler não pode ser registrada duas vezes.

## Consequências

Falha de um consumidor não impede a tentativa dos demais e nenhuma falha é silenciosa. Handlers precisam ser independentes; o bus não oferece persistência, retry, idempotência ou garantia de entrega.

## Alternativas

Execução sequencial com interrupção na primeira falha foi rejeitada por acoplar consumidores. Ignorar falhas foi rejeitado por perder efeitos. Converter toda falha técnica em `Result` foi rejeitado porque o chamador local não consegue recuperá-la; adapters duráveis definirão retry posteriormente.
