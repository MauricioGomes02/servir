# Vocabulário Ubíquo

Cada termo possui um significado único. Exemplos demonstram uso; anti-exemplos delimitam o conceito.

| Termo | Definição e responsabilidade | Relações | Exemplo | Anti-exemplo |
|---|---|---|---|---|
| Entity | Objeto definido por identidade e continuidade; protege comportamento ligado a essa identidade. | Pode integrar um Aggregate. | `Organization` com `OrganizationId`. | DTO mutável com apenas getters/setters. |
| Aggregate | Limite de consistência que agrupa objetos alterados sob invariantes comuns. | Acessado pela Aggregate Root. | Organização e suas regras internas. | Grafo inteiro carregado por conveniência. |
| Aggregate Root | Entity que controla entrada no Aggregate e registra Domain Events. | Contém entidades/VOs; usa Result/Notification. | `Order` registra `OrderCreated`. | Classe base que publica em Kafka. |
| Value Object | Valor imutável, sem identidade, comparado por conteúdo. | Compõe entidades e eventos. | `Money`, `Email`. | Registro mutável com ID próprio. |
| Primitive | Bloco arquitetural mínimo com responsabilidade estável. | Compõe contratos maiores. | `Clock`, `Result`. | Helper genérico sem semântica. |
| Result | União tipada entre sucesso e falha esperada. | Pode carregar Notification. | `Result<Email, EmailError>`. | `try/catch` para entrada inválida. |
| Notification | Coleção de violações esperadas acumuláveis. | Pode ser erro de Result. | Erros de vários campos. | Log ou exceção agregada. |
| Domain Event | Fato passado relevante dentro do domínio. | Registrado por Aggregate Root. | `OrderCancelled`. | Comando `CancelOrder`. |
| DomainEventId | UUID canônico e nominal que identifica um fato de domínio; novos fatos usam UUIDv7. | Compõe Domain Event sem substituir MessageId. | ID de `OrganizationCreated`. | Reutilizar o ID do Aggregate como ID do evento. |
| Application Event | Fato do fluxo da aplicação, não necessariamente do domínio. | Orquestrado na camada Application. | `ImportCompleted`. | Evento de integração público. |
| Integration Event | Contrato versionado para comunicação entre contextos/sistemas; define canal e identidade pública de publicação. | Derivado de fato interno por adapter e persistido na outbox. | `order.created.v1` com `channel`, `source` e `type`. | Expor diretamente a classe de domínio ou inferir rota no relay. |
| Message | Envelope geral de comunicação com payload e metadados. | Especializado em Command, Query ou Event. | Envelope com correlation ID. | Objeto global de request. |
| MessageId | UUID canônico e nominal de uma mensagem transportada ou processada; novas mensagens usam UUIDv7. | Usado por envelopes e causalidade. | ID de um `EventEnvelope`. | ID do fato ou da entidade reutilizado sem contrato. |
| UUIDv7 | Estratégia padrão de infraestrutura para novas identidades persistidas e temporalmente ordenáveis. | Implementa Id Generator e é validado pela factory do ID nominal. | UUID conforme RFC 9562. | Usar o timestamp embutido como `createdAt`. |
| LeaseId | Identidade nominal UUIDv7 de uma posse temporária sobre mensagens da outbox. | Produzida por LeaseIdGenerator e exigida em toda transição protegida pela lease. | Worker confirma uma mensagem usando o mesmo LeaseId da reivindicação. | `string` arbitrária ou MessageId reutilizado como lease. |
| Command | Intenção de alterar estado; nome no imperativo. | Tratado por um Handler. | `CancelOrder`. | `OrderCancelled`. |
| Query | Pedido de informação sem alterar estado observável; define a necessidade de leitura de um consumidor. | Tratada por Query Handler e apoiada por Reader específico. | `GetMemberDetails`. | Método que persiste auditoria de negócio. |
| Read Model | Projeção imutável moldada para a resposta de uma Query, sem comportamento de Aggregate. | Produzido por Reader e consumido pela Application/presentation. | `MemberDetails` com nome da organização. | Entity de domínio ou modelo do ORM exposto. |
| Reader | Port de leitura específico de uma Query ou projeção consumidora. | Retorna Read Models sem reconstituir Aggregate desnecessariamente. | `MemberDetailsReader`. | `GenericReadRepository<T>` ou query builder exposto. |
| Specification | Predicado de negócio reutilizável e combinável. | Pode apoiar Policy. | `isActive.and(hasCredit)`. | Serviço que executa efeitos. |
| Policy | Decisão de negócio explícita, possivelmente baseada em múltiplos fatos. | Usa Specifications e contexto de domínio. | Política de cancelamento. | Flag dispersa em controller. |
| Contract | Forma e semântica explícitas entre componentes. | Implementado por ports/adapters. | Interface `Clock`. | Tipo sem garantia comportamental. |
| Port | Contrato exigido ou oferecido pelo núcleo. | Implementado por Adapter. | `OrganizationRepository`. | Cliente Prisma no domínio. |
| Adapter | Tradução entre um port e tecnologia/ambiente externo. | Depende do Port. | Repositório PostgreSQL. | Regra de negócio no controller. |
| Ownership de infraestrutura | Responsabilidade exclusiva de uma ferramenta por reconciliar o ciclo de vida de um recurso. | Terraform administra recursos persistentes; jobs operacionais apenas os utilizam. | Terraform cria `servir-platform`; Compose conecta Liquibase à rede externa. | Terraform e Compose criando o mesmo container. |
| Repository | Port orientado a Aggregate Root para reconstituição exigida por decisões e persistência de mudanças. | Trabalha com tipos de domínio e pode participar da Unit of Work. | `save(organization)`. | CRUD genérico ou consulta que retorna Read Model. |
| Context | Metadados imutáveis da execução, independentes do transporte. | Propagado por Application. | `ExecutionContext`. | Objeto HTTP dentro do domínio. |
| Logger | Port para registrar fatos estruturados de melhor esforço. | Adapters enviam a destinos e podem enriquecer com o trace ativo; não substitui auditoria. | Um único `http.request.completed` com status e duração. | `console.log` em entidade ou um log por query instrumentada. |
| Locale | Identificador canônico do idioma usado na apresentação, distinto de timezone. | Resolvido pelo adapter de entrada e consumido pelo Presenter. | `pt-BR`. | Usar `America/Sao_Paulo` como idioma. |
| Timezone | Identificador IANA que representa as regras civis de uma localidade, distinto de locale e offset fixo. | Converte `Instant` para apresentação e compõe agendamentos civis quando o caso de uso exigir. | `America/Rio_Branco`. | Persistir `-05:00` como regra permanente da localidade. |
| Message Translator | Port da apresentação que traduz um código estável com parâmetros para um locale suportado. | Implementado por adapter; usa catálogos de apresentação. | Traduzir `organization.name.empty`. | Mensagem localizada dentro do erro de domínio. |
| Presented Error | Representação segura e localizada de uma falha esperada. | Produzida por Presenter a partir de erro, locale e Context. | Código, mensagem, campo, parâmetros e correlation ID. | Expor stack trace ou mensagem técnica. |
| Problem Details | Representação HTTP padronizada de uma falha conforme RFC 9457. | O adapter HTTP converte falhas seguras e técnicas sem alterar application/domain. | `application/problem+json` com type, status e correlation ID. | Envelope proprietário com `success: false`. |
| Presenter | Componente da apresentação que converte a saída tipada de um caso de uso em uma representação segura e independente do transporte. | Usa Message Translator e Context quando apresenta falhas esperadas. | `CreateOrganizationPresenter`. | Controller retornando Entity ou inspecionando mensagens de erro. |
| Clock | Port que fornece tempo de forma controlável. | Injetado onde tempo é uma dependência. | `clock.now()`. | `new Date()` disperso. |
| Instant | Value Object que representa um ponto absoluto na linha do tempo, normalizado em UTC. | Produzido por Clock; usado por Events. | `2026-07-27T15:00:00.000Z`. | Horário civil sem offset. |
| CivilDate | Value Object de uma data gregoriana sem horário, offset ou timezone. | Compõe ocorrências e períodos. | `2026-08-09`. | `Instant` truncado para meia-noite. |
| CivilTime | Value Object de um horário civil com precisão de minuto, sem data, offset ou timezone. | Compõe a intenção local de uma ocorrência. | `10:00`. | `2026-08-09T10:00:00Z`. |
| TimeZoneId | Value Object de uma zona IANA válida e canônica. | Converte intenção civil em `Instant` por uma política explícita. | `America/Sao_Paulo`. | Offset fixo `-03:00`. |
| SchedulePeriod | Value Object de um intervalo inclusivo entre duas CivilDates. | Delimita disponibilidade e escalas sem impor timezone. | Agosto de 2026, incluindo o primeiro e o último dia. | Duração em milissegundos. |
| CorrelationId | Identificador que correlaciona operações relacionadas. | Campo de Context/Message. | Mesmo ID em passos de um fluxo. | ID da entidade de negócio. |
| Handler | Componente que trata um tipo de mensagem. | Recebe Command, Query ou Event. | `CancelOrderHandler`. | Service com dezenas de métodos. |
| Mediator | Dispatcher tipado entre uma mensagem e seu único Handler. | Aplica pipelines transversais sem esconder Context ou Unit of Work. | `mediator.send(CreateMinistryMessage, input, context)`. | Service Locator ou bus dinâmico sem tipos. |
| Application Module | Manifesto instalável de um bounded context na composition root. | Registra handlers e endpoints do próprio módulo. | `ministriesModule`. | Lista central alterada para cada novo handler e rota. |
| Service Token | Identidade tipada de uma dependência disponível somente na composition root. | Permite registro modular sem ampliar um cradle global. | Token de `MinistryMembershipWriteScope`. | String resolvida por um handler como Service Locator. |
| Publisher | Port que envia mensagens sem conhecer consumidores. | Usa Event Bus ou broker por adapter. | Publicador de eventos pendentes. | Agregado chamando webhook. |
| Subscriber | Consumidor registrado para um tipo de mensagem. | Invoca um Handler. | Auditoria de `OrderCreated`. | Produtor conhecendo lista de consumidores. |
| Outbox Relay | Adapter que entrega mensagens persistidas na outbox a um Publisher após a fronteira transacional. | Confirma entrega conforme a semântica do storage; pode acionar Event Bus ou broker. | Relay publica `OrganizationCreated` após o commit. | Caso de uso enviando e-mail depois de salvar e retornando falha por isso. |
| CloudEvent estruturado | Envelope interoperável cujo contexto e `data` são serializados juntos conforme CloudEvents 1.0. | Transporta Integration Events no Kafka sem expor Domain Events. | `messageId` em `id` e payload público em `data`. | Copiar toda a entidade ou metadados técnicos para o payload. |
| ProcessOutboxBatch | Caso de uso do relay que reivindica um lote e coordena publicação, confirmação, retry ou falha terminal. | Depende de OutboxMessageStore, IntegrationEventPublisher, Clock, LeaseIdGenerator e RetryPolicy. | Processar até dez mensagens com uma lease de 60 segundos. | Loop que contém SQL e chamadas diretas ao SDK Kafka. |
| OutboxMessageStore | Port do relay para reivindicar e transicionar mensagens persistidas sob uma lease. | Implementado por adapters em memória e PostgreSQL; não publica no broker. | Claim atômico com `SKIP LOCKED`. | Repository genérico da API ou SQL dentro de ProcessOutboxBatch. |
| Lease de outbox | Posse temporária e identificada de uma mensagem por uma instância do relay. | Expira para permitir recuperação; toda confirmação exige o mesmo LeaseId. | Worker reivindica um lote até determinado instante UTC. | Flag permanente `processing` abandonada após uma queda. |
| Retry com backoff exponencial | Política de reagendamento que aumenta progressivamente o intervalo entre tentativas e adiciona jitter controlado. | Recebe classificação da falha, Clock e RandomSource; respeita limites de tentativas e atraso. | Aguardar aproximadamente 1 s, 2 s e 4 s, com variação entre workers. | Retry imediato, intervalo fixo ou `Math.random()` implícito na Application. |
| Entrega at-least-once | Garantia de que uma mensagem confirmada pode ser entregue uma ou mais vezes, exigindo consumidor idempotente. | Outbox preserva a mensagem; MessageId permite deduplicação. | Repetir publicação após falha anterior à confirmação no banco. | Prometer ausência de duplicatas entre banco e broker. |
| Factory | Constrói objeto válido quando criação exige regras. | Pode retornar Result. | `Organization.create`. | Wrapper de `new` sem regra. |
| Builder | Monta incrementalmente representação complexa, sobretudo em testes. | Produz objeto final válido. | `OrderBuilder` de teste. | Objeto de domínio parcialmente válido. |
| Mapper | Traduz representações sem decidir negócio. | Usado em Adapter. | Persistência ↔ domínio. | Validador com acesso ao banco. |
| Validator | Avalia restrições de entrada/estrutura e relata violações. | Pode produzir Notification. | Validação de payload. | Policy de autorização de negócio. |

## Organizações

| Termo | Definição e responsabilidade | Relações | Exemplo | Anti-exemplo |
|---|---|---|---|---|
| Organization | Aggregate Root que representa uma igreja local e a fronteira de tenant responsável por suas regras, dados e continuidade. | Identificada por OrganizationId; dados tenant-owned carregam esse ID e não podem referenciar outra Organization. | Comunidade que organiza membros, ministérios, equipes e escalas. | Apenas um campo inferido por joins ou um registro pertencente ao módulo de notificações. |
| OrganizationId | UUID canônico, nominal e estável de uma Organization; novas identidades usam UUIDv7. | Gerada fora do Aggregate e validada por factory própria. | `0198f334-6dc5-7c20-9af1-91d7e599c7b1`. | Nome ou ID de outro Aggregate reutilizado. |
| OrganizationName | Nome obrigatório e normalizado de uma Organization, limitado a 120 caracteres. | Compõe Organization e OrganizationCreated. | `Comunidade Servir`. | Texto vazio ou usado como identidade. |
| OrganizationCreated | Domain Event que registra a criação válida de uma Organization. | Registrado por Organization; publicado fora do domínio. | `organization.created`. | Envio de email dentro da factory. |
| OrganizationCreatedIntegrationEventV1 | Primeira versão do contrato externo derivado de OrganizationCreated. | Mapper de saída seleciona payload, Aggregate e chave de partição antes da outbox PostgreSQL. | `organization.created`, versão `1`. | Publicar automaticamente toda propriedade do Domain Event. |

## Escalas ministeriais — descoberta

Os termos abaixo foram confirmados pela descoberta. `Member` possui núcleo de domínio inicial implementado; os demais ainda são candidatos até seu primeiro caso de uso.

| Termo | Definição e responsabilidade | Relações | Exemplo | Anti-exemplo |
|---|---|---|---|---|
| Member | Aggregate Root de uma pessoa conhecida por uma organização, sem exigir acesso autenticado; nasce ativa após registro válido. | Identificado por MemberId, pertence a OrganizationId e pode vincular-se futuramente a User e ministérios. | Voluntário cadastrado pela liderança. | Credencial, conta ou usuário técnico. |
| MemberId | UUID canônico e nominal que identifica um Member dentro de seu ciclo. | Novas identidades usam UUIDv7; não substitui UserId. | `0198f334-6dc5-7c20-9af1-91d7e599d7b1`. | Nome ou e-mail usado como identidade. |
| MemberName | Nome obrigatório, normalizado e limitado a 120 caracteres. | Compõe Member e MemberRegistered. | `Maria da Silva`. | Identidade global ou credencial. |
| MemberRegistered | Domain Event que registra a criação válida de um Member ativo numa Organization. | É registrado por Member e traduzido explicitamente para Integration Event v1. | `member.registered`. | Enviar convite dentro da factory. |
| MemberRegisteredIntegrationEventV1 | Contrato público versionado do registro de Member. | Usa MemberId como Aggregate ID e OrganizationId como chave de partição. | `member.registered`, versão `1`. | Publicar diretamente a classe de Domain Event. |
| OrganizationRegistrationFacts | Snapshot mínimo de fatos de Organization exigidos pela regra de registro de Member. | É obtido por Reader e avaliado por MemberRegistrationPolicy. | OrganizationId existente. | Booleano de elegibilidade decidido pelo adapter. |
| MemberRegistrationPolicy | Decisão pura que determina se os fatos organizacionais permitem registrar um Member. | Recebe OrganizationRegistrationFacts sem consultar infraestrutura. | Rejeitar com `member.registration.organization_not_found`. | SQL ou consulta escondida dentro da Policy. |
| MemberDetails | Read Model imutável da Query GetMemberDetails, limitado à representação atualmente consumida. | Produzido por MemberDetailsReader sem reconstituir Member. | ID, OrganizationId, nome e estado. | Aggregate ou linha do banco exposta pela API. |
| User | Identidade autenticável do contexto Identity & Access. | Pode ser associada a Member sem substituí-lo. | Pessoa com login ativo. | Todos os dados ministeriais da pessoa. |
| Ministry | Aggregate Root separado que representa uma área ministerial; nasce ativo e possui nome ativo único por Organization, ignorando caixa e preservando acentos. | Referencia OrganizationId; funções, times e vínculos evoluem por casos de uso próprios. | Louvor, Mídia, Recepção. | Coleção dentro de Organization carregada em toda operação. |
| MinistryId | UUID canônico e nominal que identifica um Ministry; novas identidades usam UUIDv7. | Não substitui OrganizationId nem MinistryRoleId. | `0198f334-6dc5-7c20-9af1-91d7e599e001`. | Nome do ministério usado como identidade. |
| MinistryName | Nome obrigatório, normalizado e limitado a 120 caracteres; enquanto ativo, é único por Organization sem diferença de caixa. | Compõe Ministry e MinistryCreated. | `Louvor`. | Nome globalmente único ou comparação que remove acentos. |
| MinistryCreated | Domain Event da criação válida de um Ministry ativo. | É traduzido explicitamente para `ministry.created.v1`. | `ministry.created`. | Publicar o Aggregate diretamente. |
| MinistryRole | Entity interna e estável definida por um Ministry; nasce ativa e possui nome ativo único dentro da root, ignorando caixa e preservando acentos. | É usada por qualificações, necessidades e atribuições; não possui Repository próprio. | Guitarra, vocal, câmera. | Papel técnico de autorização ou string sem identidade histórica. |
| MinistryRoleId | UUID canônico e nominal de uma MinistryRole; novas identidades usam UUIDv7. | É referenciado por qualificações e escalas sem substituir MinistryId. | `0198f334-6dc5-7c20-9af1-91d7e599e114`. | Nome da função usado como identidade. |
| MinistryRoleDefined | Domain Event da definição válida de uma função ativa dentro de Ministry. | É traduzido para `ministry.role-defined.v1`. | `ministry.role_defined`. | Alterar diretamente a tabela de funções. |
| MinistryMembership | Aggregate Root histórico entre Member e Ministry; nasce solicitado e exige aprovação para tornar-se ativo. | Referencia OrganizationId, MinistryId e MemberId; sustenta qualificações e participação em times. | João solicita entrada no Louvor e aguarda aprovação. | Adicionar ID a uma lista ou considerar solicitação como aprovação. |
| MinistryMembershipId | UUID canônico, nominal e estável de um MinistryMembership; novas identidades usam UUIDv7. | Não substitui MemberId nem MinistryId. | `0198f334-6dc5-7c20-9af1-91d7e599e201`. | Usar o par de IDs como identidade intercambiável. |
| MinistryMembershipRequested | Domain Event da criação de um vínculo ministerial em estado solicitado. | É traduzido para Integration Event v1 depois da fronteira transacional. | `ministry_membership.requested`. | Ativar o vínculo durante a solicitação. |
| MinistryRoleQualification | Aptidão ativa de um membro para exercer uma função ministerial. | Exigida por ScheduleAssignment. | João qualificado para guitarra e baixo. | Permissão HTTP para editar escala. |
| MinistryTeam | Unidade operacional de um ministério que possui participantes e liderança. | É dono funcional de TeamSchedule. | Louvor A. | Hierarquia recursiva genérica sem regra. |
| TeamMembership | Participação histórica de um vínculo ministerial em um time. | Exige MinistryMembership ativa. | João participa do Louvor A. | Qualificação automática para qualquer função. |
| TeamLeadership | Liderança histórica e vigente de um time ministerial, inicialmente exercida por um único participante ativo. | Referencia TeamMembership e MinistryTeam do mesmo tenant. | João lidera o Louvor A. | Permissão técnica ou lista de líderes sem vigência. |
| Activity | Aggregate Root de um evento planejado, ativo e com nome único por Organization. | Possui ao menos um ministério participante; recorrências e ocorrências têm ciclos próprios. | Culto de domingo. | `SchedulePublished` ou uma ocorrência concreta. |
| ActivityOccurrence | Execução concreta, manual ou gerada, de uma Activity. | É referenciada por planos e atribuições de vários times. | Culto de 09/08/2026 às 10h. | Regra “todo domingo”. |
| AvailabilityDeclaration | Disponibilidade ou indisponibilidade vigente de um membro. | É resolvida para ActivityOccurrence; indisponibilidade prevalece. | Indisponível em 09/08 pela manhã. | Ausência de resposta interpretada como disponível. |
| AvailabilityRequest | Coleta aberta por um time para um período e prazo explícitos. | Orienta respostas antes de TeamSchedule. | Disponibilidade de agosto a outubro. | Período global obrigatório para todos os ministérios. |
| TeamStaffingTemplate | Versão das quantidades e funções normalmente necessárias a um time. | Inicializa planos sem fixar pessoas. | Dois vocais e uma guitarra. | Sobrescrever escalas antigas ao mudar o template. |
| TeamSchedule | Aggregate que planeja um time durante um período explícito. | Contém planos por ocorrência e publicações versionadas. | Escala do Louvor A para agosto. | Escala única de todos os ministérios. |
| StaffingRequirement | Necessidade de quantidade para uma função numa ocorrência. | É preenchida por ScheduleAssignments. | Quatro câmeras num culto especial. | Nome de pessoa previamente fixado. |
| ScheduleAssignment | Atribuição histórica de um membro qualificado a uma função e ocorrência. | Pertence a TeamSchedule e pode ser substituída. | Maria no vocal do culto das 10h. | Editar memberId numa publicação antiga. |

## Regras de evolução

- Antes de criar um termo, verificar se ele já existe com outro nome.
- Alterações semânticas exigem atualização dos documentos relacionados e, se duradouras, ADR.
- Nomes de fatos usam passado; intenções usam imperativo; predicados expressam condição.
