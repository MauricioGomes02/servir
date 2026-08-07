# ADR 042 — Mediator tipado e módulos instaláveis

- Estado: aceita
- Data: 2026-08-07
- Substitui parcialmente: [ADR 032](032-composition-root-dependency-container.md)

## Contexto

O container tipado reduziu a montagem manual inicial, mas cada novo caso de uso ainda amplia o cradle global, as opções de persistência e o registro central de rotas. Adapters em memória de runtime duplicam contratos PostgreSQL e aumentam o custo de cada incremento.

## Decisão

A API adota um mediator interno com tokens tipados para Commands e Queries. `ExecutionContext` permanece argumento explícito de cada envio; handlers continuam recebendo dependências por factory e mantêm Unit of Work explícita. A pipeline do mediator cria o span semântico do caso de uso, sem decidir regras, transações ou representação HTTP.

Bounded contexts expõem módulos instaláveis que registram serviços, mensagens e rotas. A composition root mantém somente a lista explícita de módulos. Uma fachada tipada sobre Awilix oferece lifetimes singleton, transient e scoped; scoped só será usado quando existir estado por escopo.

A configuração recebe uma única persistência instalável. PostgreSQL torna-se o único adapter de persistência do runtime. Testes usam stubs locais ou suporte de teste, não um segundo runtime completo em memória.

## Consequências

Rotas dependem do mediator, não de handlers concretos. O cradle global deixa de crescer por caso de uso e a instalação de um módulo concentra seu wiring. A API local exige PostgreSQL e migrations aplicadas. Testes unitários continuam sem banco; testes de persistência usam PostgreSQL condicional.

Logs semânticos específicos permanecem nos handlers. O mediator centraliza apenas tracing e protocolo de dispatch. Descoberta automática por filesystem e Service Locator continuam proibidos.

## Alternativas

Adicionar uma biblioteca externa foi rejeitado porque o contrato necessário é pequeno e precisa preservar Result e ExecutionContext. Resolver handlers diretamente do container nas rotas foi rejeitado por criar Service Locator. Manter o runtime em memória foi rejeitado pelo custo duplicado de manutenção.
