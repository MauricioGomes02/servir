# ADR 021 — Unit of Work transacional com PostgreSQL

- Estado: aceita
- Data: 2026-07-29

## Contexto

O primeiro caso de uso precisa persistir `Organization` e seu `EventEnvelope` sem produzir estado sem evento ou evento sem estado. O `DirectUnitOfWork` preserva o contrato em memória, mas não oferece atomicidade real. O schema PostgreSQL e a outbox durável já foram definidos externamente por Liquibase.

## Decisão

Implementar `PostgresUnitOfWork` como adapter do port `UnitOfWork`. A cada execução ele adquire uma conexão do pool, inicia uma transação e cria um escopo cujos adapters compartilham a mesma conexão. `PostgresOrganizationRepository` salva o Aggregate e `PostgresEventOutbox` adiciona os envelopes; o Unit of Work faz commit somente quando o callback termina com sucesso.

Uma falha durante o callback provoca rollback e é propagada sem depender de sua mensagem. Falhas ao adquirir conexão, iniciar, confirmar ou reverter a transação usam tipos e códigos técnicos estáveis. A conexão é sempre liberada. Falha de commit provoca tentativa de rollback antes da liberação.

O modo de persistência é escolhido explicitamente na composition root. `memory` permanece o padrão; `postgres` exige `DATABASE_URL`. O backend não executa migrations. No modo PostgreSQL, o relay em memória não processa a outbox durável: um relay PostgreSQL será um adapter separado.

## Consequências

Estado do Aggregate e envelope tornam-se atômicos dentro do PostgreSQL. O caso de uso continua dependente apenas de `UnitOfWork<OrganizationWriteScope>`, sem conhecer pool, SQL ou transação. Adapters do escopo não abrem transações próprias nem retêm conexões além da execução.

Até o relay durável ser implementado, eventos persistidos não acionam handlers pós-commit no modo PostgreSQL. Isso evita apresentar dispatch em memória como entrega durável ou transformar falhas posteriores ao commit em falhas da requisição.

## Alternativas

Colocar transação dentro do Repository foi rejeitado porque impediria coordenar Aggregate e outbox. Publicar diretamente após o commit no caso de uso foi rejeitado porque acoplaria reações e confundiria falha de entrega com falha da operação já confirmada. Introduzir ORM foi adiado porque o primeiro consumidor exige apenas SQL pequeno e explícito, sem demonstrar benefício que compense o acoplamento adicional.

