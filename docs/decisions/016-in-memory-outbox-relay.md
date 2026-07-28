# ADR 016 — Relay de outbox em memória

- Estado: aceita
- Data: 2026-07-28

## Contexto

O primeiro corte vertical persiste `EventEnvelope` junto ao Aggregate, mas os handlers reativos não devem executar dentro do caso de uso nem transformar uma falha posterior ao commit em falha da requisição. Ainda não existe um banco que demonstre as necessidades concretas de claim, lease, retry, concorrência distribuída e dead-letter.

## Decisão

Usar um relay restrito à infraestrutura em memória para publicar envelopes pendentes no `EventPublisher`. O relay processa a fila em ordem, confirma cada envelope somente após publicação bem-sucedida, mantém o envelope pendente quando o dispatch falha e serializa execuções concorrentes de flush.

O relay inicia e encerra com o ciclo de vida da aplicação. Falhas periódicas são registradas com contexto estruturado e não retornam ao caso de uso que já concluiu. O contrato `EventOutbox` permanece somente de escrita; operações de leitura e confirmação pertencem ao adapter concreto nesta etapa.

## Consequências

Handlers de logging, auditoria e notificação podem reagir após a fronteira transacional sem acoplar o produtor. O adapter em memória não oferece durabilidade, retry com backoff, idempotência, coordenação entre processos ou garantia contra perda durante encerramento abrupto.

Um adapter durável deverá definir seu próprio modelo de claim, lease, tentativas, próximo instante de execução e dead-letter a partir dos requisitos do banco e da operação, sem assumir que a API interna deste relay é um port estabilizado.

## Alternativas

Publicar no caso de uso após o commit foi rejeitado porque uma falha do handler faria a requisição parecer malsucedida apesar do estado persistido. Expandir agora o port compartilhado da outbox foi rejeitado por cristalizar semânticas de concorrência e retry sem um consumidor tecnológico real.
