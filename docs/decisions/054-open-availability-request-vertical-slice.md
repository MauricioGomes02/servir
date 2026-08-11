# 054. Abertura de coleta de disponibilidade

## Status

Aceita.

## Contexto

Times ministeriais precisam coletar restrições dos membros antes de montar uma escala. Cada time pode trabalhar com horizontes diferentes e pode precisar abrir uma coleta excepcional para um intervalo já coberto por outra solicitação.

## Decisão

`AvailabilityRequest` é um Aggregate Root separado, criado por `OpenAvailabilityRequest`. A primeira versão registra `OrganizationId`, `MinistryTeamId`, um `SchedulePeriod` civil inclusivo, prazo de resposta como `Instant` UTC e estado `open`.

O time precisa estar ativo e pertencer à Organization da rota. O prazo deve estar estritamente no futuro no momento da abertura. Solicitações sobrepostas são permitidas: a existência de outra coleta não impede uma janela menor, urgente ou complementar.

O Aggregate não materializa uma lista de destinatários. Elegibilidade e respostas pertencem aos casos de uso consumidores posteriores. Aggregate e `availability_request.opened` são persistidos atomicamente com outbox, e o contrato público inicial é `availability_request.opened.v1`.

O endpoint é `POST /organizations/{organizationId}/ministry-teams/{ministryTeamId}/availability-requests`.

## Consequências

- O período preserva intenção civil sem inventar uma timezone para dias inteiros.
- O prazo representa um momento inequívoco e pode ser comparado ao Clock.
- Sobreposições precisam ser apresentadas claramente aos consumidores futuros.
- Fechamento, lembretes, notificações e expiração automática permanecem fora deste corte.
- Um futuro `CloseAvailabilityRequest` deverá definir a transição e seu fato sem depender de um job implícito.

## Alternativas consideradas

- Guardar o prazo como data civil: rejeitado porque não define o momento exato de encerramento.
- Impedir períodos sobrepostos: rejeitado porque bloquearia coletas urgentes ou complementares.
- Copiar todos os membros elegíveis na abertura: rejeitado porque antecipa regras de destinatários e aumenta desnecessariamente a fronteira de consistência.
- Fechar automaticamente neste corte: rejeitado porque ainda não existe consumidor que exija a transição ou sua operação.
