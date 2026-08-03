# ADR 029 — Separação de responsabilidades entre Commands e Queries

- Estado: aceita
- Data: 2026-08-03

## Contexto

Os primeiros casos de uso de escrita introduziram Repository ports orientados a Aggregates. À medida que consultas de apresentação surgirem, usar esses mesmos Repositories para paginação, filtros, joins e projeções obrigaria a reconstituir Aggregates sem que uma decisão de domínio precisasse deles ou faria o contrato acumular responsabilidades incompatíveis.

O projeto precisa distinguir escrita e leitura sem antecipar bancos separados, consistência eventual ou uma infraestrutura completa de CQRS antes de existirem consumidores reais.

## Decisão

Adotar separação pragmática de responsabilidades entre Commands e Queries dentro da camada Application.

- Commands expressam intenção de alterar estado e são tratados por command handlers.
- Repositories são ports orientados a Aggregate Roots. Recebem e retornam tipos de domínio e participam da Unit of Work quando há escrita.
- Queries expressam pedidos de informação sem alterar estado observável e são tratadas por query handlers.
- Cada Query define seu Read Model e depende de um Reader port específico para a projeção exigida pelo consumidor.
- Readers podem consultar projeções, executar joins, filtros e paginação sem reconstituir Aggregates, mas não expõem ORM, SQL ou query builders à Application.
- Ports de consulta usados como precondição de Commands, como `OrganizationMembershipEligibility`, permanecem contratos específicos da decisão e não são apresentados artificialmente como Queries de leitura.

A separação é lógica. Commands e Queries podem usar o mesmo PostgreSQL e o mesmo schema enquanto não houver necessidade concreta de modelos físicos, bancos ou processos independentes. Pastas, Readers e Read Models só são criados junto ao primeiro consumidor real.

## Consequências

Repositories permanecem pequenos e coerentes com as fronteiras dos Aggregates. Consultas podem produzir representações adequadas ao consumidor sem contaminar o domínio nem carregar grafos desnecessários. A Application explicita se um fluxo altera estado ou somente lê.

Não há garantia automática de consistência eventual, escalabilidade independente ou sincronização de projeções: essas capacidades exigirão novas decisões caso se tornem necessárias. Queries não registram auditoria de negócio nem efeitos observáveis; telemetria técnica continua permitida nos adapters.

## Alternativas

Usar Repository para toda leitura foi rejeitado porque mistura reconstituição de Aggregate com projeções de apresentação. Criar `GenericReadRepository<T>` foi rejeitado porque esconde necessidades específicas e tende a espelhar armazenamento. Adotar desde já bancos e processos separados foi rejeitado por não existir consumidor que justifique a complexidade operacional.
