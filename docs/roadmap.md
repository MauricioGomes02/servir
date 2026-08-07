# Roadmap da Fundação

## Motivação

Controlar dependências entre conceitos e impedir que implementação prematura cristalize contratos frágeis.

## Problema que resolve

Primitivas construídas fora de ordem tendem a duplicar responsabilidades ou depender de conceitos ainda indefinidos.

## Responsabilidades

- Tornar a sequência e os critérios de conclusão explícitos.
- Registrar o estado real sem confundir código existente com contrato estabilizado.

## O que não faz

- Não é cronograma.
- Não garante estabilidade sem revisão e testes.

## Fluxo e etapas

```mermaid
flowchart TD
    D[Documentação e vocabulário] --> R[Result]
    R --> N[Notification]
    N --> I[Instant]
    I --> DE[Domain Event]
    DE --> M[Message Envelope]
    M --> OR[Outbox Relay]
    OR --> EB[Event Bus]
    EB --> AR[Aggregate Root]
    AR --> E[Entity]
    E --> VO[Value Object]
    VO --> C[Context]
    C --> L[Logger]
    L --> CL[Clock]
    CL --> ID[Id Generator]
    ID --> U[Unit of Work]
    U --> UC[Casos de uso]
    UC -. define quando necessário .-> S[Specifications]
    S -. pode compor .-> P[Policies]
    UC -. define quando necessário .-> P
    UC -. Commands definem .-> RC[Repository Ports específicos]
    UC -. Queries definem .-> RP[Readers e Read Models específicos]
    UC --> PL[Apresentação e localização de erros]
    PL --> HTTP[Adapter HTTP e Composition Root]
    PL --> TP[Apresentação temporal e datas civis]
```

| Etapa | Estado | Critério de saída |
|---|---|---|
| Vocabulário e documentação | Em andamento | Links, ADRs e contratos revisados |
| Documentação bilíngue | Planejado | Português definido como fonte canônica; versões em inglês organizadas em `docs/en/`; navegação entre idiomas e processo de sincronização definidos; skills voltadas apenas a agentes avaliadas para padronização em inglês |
| Result | Implementação inicial | Semântica e testes estabilizados |
| Notification | Implementação inicial | Acúmulo, imutabilidade e testes decididos |
| Instant | Implementação inicial | UTC, imutabilidade, igualdade e serialização testadas |
| Domain Event | Implementação inicial | Identidade, instante, imutabilidade e testes definidos |
| Message Envelope e Integration Event | Implementação inicial | Contratos externos versionados definem canal, source e type; Organization e Membership possuem mappers explícitos e roteamento persistido por mensagem |
| Event Bus | Implementação inicial | Ports, concorrência, falhas e subscriptions testados |
| Outbox Relay | Implementação inicial | `ProcessOutboxBatch` coordena as transições; adapters em memória e PostgreSQL validam claim concorrente, limite, disponibilidade temporal, posse, expiração, recuperação e estados terminais |
| Aggregate Root | Implementação inicial | Registro, snapshot, ordem e confirmação seletiva testados |
| Entity | Implementação inicial | Identidade, igualdade e construção testadas |
| Value Object | Implementação inicial | Imutabilidade e igualdade testadas |
| Specification e Policy | Implementação inicial | `MemberRegistrationPolicy` é a primeira decisão contextual concreta: recebe fatos explícitos de Reader, não consulta infraestrutura e possui testes próprios |
| Context | Implementação inicial | IDs fortes, imutabilidade e testes definidos |
| Logger | Implementação inicial | Contrato, parsing de severidade, adapter JSON e atributos seguros de falhas são compartilhados por API e relay; contexto, imutabilidade, filtro por `LOG_LEVEL`, limites, correlação e narrativas de negócio estão testados; detalhes técnicos exigem desenvolvimento explícito e redaction configurável permanece planejada |
| Fundação OpenTelemetry para Node | Implementação inicial | SDK, OTLP, W3C Trace Context, lifecycle, erros técnicos, instrumentação PostgreSQL segura e mecânica de spans estão centralizados em `node-observability`; API e relay preservam composição e semântica próprias; configuração avançada de sampling e exporters permanece planejada |
| Schema e governança de logs operacionais | Planejado | Contrato interoperável alinhado ao OpenTelemetry Logs Data Model e às Semantic Conventions estáveis; timestamp do evento, severidade, nome, trace/span, resource, instrumentation scope e atributos tipados definidos; redaction e controle de volume testados; JSON Lines, OTLP e mappings para destinos específicos permanecem responsabilidades de adapters e infraestrutura |
| Clock | Implementação inicial | Port, SystemClock, FixedClock e testes definidos |
| Id Generator | Implementação inicial | Port tipado compartilhado em `application-foundation`, sequência determinística, validação canônica dos IDs persistidos, LeaseId nominal e adapters UUIDv7 com factories e falhas técnicas codificadas estão testados |
| Commands, Queries e Repository | Implementação inicial | Commands usam Repositories orientados a Aggregates; GetMemberDetails concretiza a primeira Query com Reader, Read Model e suíte de contrato para memória/PostgreSQL; nenhum contrato genérico ou separação física é antecipado |
| Unit of Work | Implementação inicial | Port com escopo tipado, adapter direto, confirmação seletiva de eventos e adapter PostgreSQL com commit/rollback testados |
| Primeiro corte vertical | Implementação inicial | CreateOrganization persiste Organization e outbox atomicamente; PostgreSQL traduz `OrganizationCreated` para contrato externo v1; relay publica o CloudEvent no Kafka e confirma a outbox; fluxo real validado manualmente, com teste de sistema automatizado ainda planejado |
| Descoberta do domínio ministerial | Em andamento | Contextos de Organizations, Membership, Ministries, Activities e Scheduling mapeados; linguagem confirmada separada de hipóteses; primeiro incremento selecionado após fechar questões do Aggregate consumidor |
| Member e vínculo organizacional | Corte vertical inicial | Núcleo, RegisterMember, GetMemberDetails, Policy, Readers, persistência PostgreSQL, schema com status numérico, Integration Event v1 e entradas HTTP localizadas implementados; listagem paginada permanece orientada pelo primeiro consumidor |
| Ministry e funções | Cortes verticais iniciais | CreateMinistry e DefineMinistryRole estão implementados com invariantes de nomes ativos, persistência/outbox atômicas, Integration Events v1 e entradas HTTP; desativação e reativação permanecem orientadas por consumidores futuros |
| Participação e qualificação ministerial | Cortes verticais iniciais | RequestMinistryMembership e ApproveMinistryMembership implementados na root separada, com transição requested → active, persistência/outbox atômicas, Integration Events v1 e entradas HTTP; rejeição, estados posteriores e qualificação permanecem planejados |
| Times ministeriais | Planejado | MinistryTeam, TeamMembership, liderança vigente e responsabilidade por escala definidos |
| Activities e ocorrências | Planejado | Fluxo manual estabilizado; datas civis e timezone definidos; geração recorrente finita, versionada e idempotente adicionada depois |
| Disponibilidade | Planejado | Declarações, precedência, resposta explícita e coleta flexível por time e período testadas |
| Escalas por time | Planejado | Necessidades, atribuições, conflito global, apoio, snapshots publicados e substituições históricas testados |
| Workspaces de aplicações | Implementação inicial | `backend` coordena workspaces npm; API e relay possuem manifestos próprios; `integration-messaging`, `application-foundation` e `node-observability` possuem ownership explícito e consumidores reais |
| Aplicação de relay durável | Implementação inicial | Storage PostgreSQL, retry com jitter, publisher Kafka/CloudEvents, propagação W3C por links e records, spans semânticos por lote/mensagem, logs correlacionados, ciclo contínuo cancelável e encerramento seguro estão implementados; métricas, operação de reprocessamento e testes reais com Kafka permanecem planejados |
| Infraestrutura local e migrations | Implementação inicial | Stacks Terraform de plataforma e mensageria, permissões do volume Kafka, Liquibase e fluxo local PostgreSQL/outbox/Kafka foram validados; credenciais de runtime e IaC de ambientes compartilhados permanecem planejadas |
| Apresentação e localização de erros | Implementação inicial | Locale e fallback, port de tradução, adapter em memória, erro apresentado, primeiro Presenter e títulos HTTP localizados estão definidos |
| Adapter HTTP e Composition Root | Implementação inicial | Factory Fastify, container restrito à composição, tokens tipados, Mediator, módulos instaláveis e persistência PostgreSQL registrada pelo módulo estão testados; write scopes recebem outbox automaticamente, mappers usam registry O(1), contexto permanece explícito e doubles de persistência pertencem somente ao test support |
| Visualização local de traces | Implementação inicial | Terraform provisiona Collector vendor-neutral e Jaeger efêmero; API e relay exportam por OTLP/HTTP e a UI permite avaliar spans antes de ampliar logging ou instrumentação |
| Apresentação temporal e datas civis | Planejado | API preserva `Instant` UTC; apresentação converte com locale e timezone IANA; agendamentos modelam data civil, horário civil e zona separadamente; precedência entre timezone da operação, usuário, organização e aplicação permanece por definir com o primeiro consumidor |

## Exemplos

Uma implementação existente pode permanecer “inicial” até que sua API e invariantes tenham testes de contrato.

## Relacionamento com outras primitivas

A ordem expressa dependências conceituais, não herança ou dependência obrigatória de código.

## Possíveis evoluções

Adicionar critérios mensuráveis, versões da fundação e marcos por bounded context.

## Boas práticas

- Atualizar estado e documentação na mesma mudança.
- Não marcar concluído apenas porque existe código.

## Anti-patterns

- Iniciar infraestrutura para “validar” um contrato ainda indefinido.
- Expandir escopo silenciosamente.
