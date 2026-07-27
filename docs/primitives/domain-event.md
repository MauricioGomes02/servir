# Domain Event

## Motivação

Expressar um fato de negócio relevante sem acoplar quem o produz a quem reage.

## Problema que resolve

Chamadas diretas do domínio para integrações misturam invariantes com efeitos colaterais e criam dependências entre módulos.

## Responsabilidades

- Nomear um fato no passado.
- Carregar apenas dados necessários para interpretar o fato.
- Registrar instante e identidade do evento por contratos explícitos.

## O que não faz

- Não executa efeito colateral.
- Não é command, log ou modelo de persistência.
- Não precisa ser o contrato público de integração.

## Fluxo

```mermaid
sequenceDiagram
    participant A as Aggregate
    participant E as Domain Event
    participant P as Publisher
    A->>E: registra fato
    P->>A: coleta pendentes
    P-->>E: publica após fronteira definida
```

## Exemplos

`OrganizationCreated`, `MemberAssigned` e `SchedulePublished` descrevem fatos; `CreateOrganization` é command.

## Relacionamento com outras primitivas

É registrado por Aggregate Root, distribuído por Event Bus e pode ser transformado em Application ou Integration Event.

## Possíveis evoluções

Definir envelope, versionamento, causalidade, deduplicação e tradução entre contextos.

## Boas práticas

- Preferir payload imutável e semanticamente mínimo.
- Evitar referências a objetos mutáveis do agregado.

## Anti-patterns

- Evento chamado `CreateX`.
- Handler embutido no evento.
- Publicação direta pelo domínio em broker.
