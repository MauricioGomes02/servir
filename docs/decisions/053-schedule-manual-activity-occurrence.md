# 053. Agendamento manual de ocorrência de atividade

## Status

Aceita.

## Contexto

Uma `Activity` descreve o que acontece; cada realização concreta precisa de identidade e estado próprios. Horários civis dependem das regras IANA da timezone e podem ser inexistentes ou ambíguos em transições de horário de verão. Essas regras também podem mudar depois que uma ocorrência futura foi criada.

## Decisao

`ActivityOccurrence` será um Aggregate Root separado, inicialmente criado pelo caso de uso `ScheduleManualActivityOccurrence` em `POST /organizations/{organizationId}/activities/{activityId}/occurrences`.

A ocorrência preserva `civilDate`, `civilTime`, `timeZoneId`, o offset resolvido e o `Instant` UTC. Horários inexistentes são rejeitados. Horários ambíguos exigem a escolha explícita `earlier` ou `later`. A combinação vigente de `organizationId`, `activityId` e `scheduledAt` é única.

A persistência do Aggregate e do evento `activity_occurrence.scheduled` no outbox é atômica. A primeira origem é `manual`; recorrência fica fora deste corte.

Atualizações da base IANA ou do runtime não alteram ocorrências silenciosamente. Um processo futuro, executado de forma controlada após a atualização de tzdata, deverá re-resolver ocorrências futuras a partir dos valores civis preservados, comparar offset e instante com o snapshot e sinalizar divergências para revisão. Não será criado um job periódico enquanto esse fluxo de revisão não existir.

## Consequencias

- O instante continua determinístico e auditável segundo as regras usadas na criação.
- Os valores civis permitem detectar posteriormente mudanças de regra.
- Alterações futuras de timezone exigirão um fluxo explícito de reconciliação e decisão humana, sem reescrita automática.
- Cancelamento, reagendamento e recorrência exigirão novos casos de uso e revisões.

## Alternativas consideradas

- Persistir apenas UTC: descartado porque perde a intenção civil e impede reconciliação segura.
- Recalcular automaticamente em intervalos: descartado porque mudaria compromissos sem uma decisão explícita e criaria processamento sem necessidade.
- Escolher automaticamente um lado de horário ambíguo: descartado porque esconde uma decisão do usuário.
