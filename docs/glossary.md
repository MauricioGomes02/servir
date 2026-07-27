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
| Application Event | Fato do fluxo da aplicação, não necessariamente do domínio. | Orquestrado na camada Application. | `ImportCompleted`. | Evento de integração público. |
| Integration Event | Contrato versionado para comunicação entre contextos/sistemas. | Derivado de fato interno por adaptador. | `order.created.v1`. | Expor diretamente a classe de domínio. |
| Message | Envelope geral de comunicação com payload e metadados. | Especializado em Command, Query ou Event. | Envelope com correlation ID. | Objeto global de request. |
| Command | Intenção de alterar estado; nome no imperativo. | Tratado por um Handler. | `CancelOrder`. | `OrderCancelled`. |
| Query | Pedido de informação sem alterar estado observável. | Tratado por leitor especializado. | `GetOrderById`. | Método que persiste auditoria de negócio. |
| Specification | Predicado de negócio reutilizável e combinável. | Pode apoiar Policy. | `isActive.and(hasCredit)`. | Serviço que executa efeitos. |
| Policy | Decisão de negócio explícita, possivelmente baseada em múltiplos fatos. | Usa Specifications e contexto de domínio. | Política de cancelamento. | Flag dispersa em controller. |
| Contract | Forma e semântica explícitas entre componentes. | Implementado por ports/adapters. | Interface `Clock`. | Tipo sem garantia comportamental. |
| Port | Contrato exigido ou oferecido pelo núcleo. | Implementado por Adapter. | `OrganizationRepository`. | Cliente Prisma no domínio. |
| Adapter | Tradução entre um port e tecnologia/ambiente externo. | Depende do Port. | Repositório PostgreSQL. | Regra de negócio no controller. |
| Repository | Port de coleção para carregar e persistir Aggregates. | Trabalha por Aggregate Root. | `save(organization)`. | CRUD genérico de todas as tabelas. |
| Context | Metadados imutáveis da execução, independentes do transporte. | Propagado por Application. | `ExecutionContext`. | Objeto HTTP dentro do domínio. |
| Logger | Port para registrar fatos estruturados. | Adaptadores enviam a destinos. | `logger.info(fact)`. | `console.log` em entidade. |
| Clock | Port que fornece tempo de forma controlável. | Injetado onde tempo é uma dependência. | `clock.now()`. | `new Date()` disperso. |
| CorrelationId | Identificador que correlaciona operações relacionadas. | Campo de Context/Message. | Mesmo ID em passos de um fluxo. | ID da entidade de negócio. |
| Handler | Componente que trata um tipo de mensagem. | Recebe Command, Query ou Event. | `CancelOrderHandler`. | Service com dezenas de métodos. |
| Publisher | Port que envia mensagens sem conhecer consumidores. | Usa Event Bus ou broker por adapter. | Publicador de eventos pendentes. | Agregado chamando webhook. |
| Subscriber | Consumidor registrado para um tipo de mensagem. | Invoca um Handler. | Auditoria de `OrderCreated`. | Produtor conhecendo lista de consumidores. |
| Factory | Constrói objeto válido quando criação exige regras. | Pode retornar Result. | `Organization.create`. | Wrapper de `new` sem regra. |
| Builder | Monta incrementalmente representação complexa, sobretudo em testes. | Produz objeto final válido. | `OrderBuilder` de teste. | Objeto de domínio parcialmente válido. |
| Mapper | Traduz representações sem decidir negócio. | Usado em Adapter. | Persistência ↔ domínio. | Validador com acesso ao banco. |
| Validator | Avalia restrições de entrada/estrutura e relata violações. | Pode produzir Notification. | Validação de payload. | Policy de autorização de negócio. |

## Regras de evolução

- Antes de criar um termo, verificar se ele já existe com outro nome.
- Alterações semânticas exigem atualização dos documentos relacionados e, se duradouras, ADR.
- Nomes de fatos usam passado; intenções usam imperativo; predicados expressam condição.
