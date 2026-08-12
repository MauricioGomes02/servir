# ADR 056 — Fronteiras entre testes unitários e integração PostgreSQL

- Estado: aceita
- Data: 2026-08-12

## Contexto

A API acumulou repositories e readers em memória para compor testes de handlers e fluxos HTTP. Esses adapters aceleram testes, mas duplicam regras de constraints, transações, SQL, ordenação e isolamento multi-tenant sem provar que o adapter PostgreSQL real cumpre o contrato. O comando único de testes também descobria arquivos de integração e os marcava como ignorados quando não havia banco configurado, tornando menos evidente qual camada havia sido efetivamente validada.

## Decisão

Separar explicitamente as suítes unitária e de integração.

- Testes unitários exercitam domínio, Application e adapters puros sem rede ou banco. Handlers usam colaboradores mínimos definidos pelo próprio teste para observar chamadas e efeitos; esses colaboradores não são implementações alternativas de persistência.
- Repositories, Readers, Unit of Work, constraints, atomicidade e isolamento tenant-safe são validados somente contra PostgreSQL real com o schema Liquibase aplicado.
- Arquivos `*.integration.test.ts` pertencem exclusivamente à suíte de integração e exigem `TEST_DATABASE_URL`; ausência da variável é erro de configuração, não teste ignorado.
- `test:unit` permanece rápido e integra o `check` local. `test:integration` é uma etapa separada e obrigatória nos fluxos que dispõem da infraestrutura PostgreSQL.
- Doubles de tempo, identidade, logging e ports externos permanecem permitidos quando isolam uma unidade e não afirmam reproduzir garantias do PostgreSQL.
- A remoção dos adapters de persistência em memória ocorre incrementalmente por contexto, mantendo a suíte executável entre cortes.

## Consequências

O resultado da suíte informa claramente quais garantias foram verificadas. Testes de persistência passam a detectar diferenças reais de SQL, tipos, índices, constraints e transações. Testes unitários continuam determinísticos e localizam falhas de regras rapidamente.

A integração exige banco provisionado e migrations atualizadas, possui execução mais lenta e precisa de fixtures com limpeza segura. Durante a migração, o suporte legado em memória permanece apenas para contextos ainda não convertidos e não recebe novos contratos.

## Alternativas

Executar todos os handlers contra PostgreSQL foi rejeitado porque mistura regras de Application com infraestrutura, aumenta o tempo de feedback e dificulta localizar falhas. Manter suites de contrato compartilhadas entre PostgreSQL e adapters em memória foi rejeitado porque preservaria implementações sem uso em produção. Continuar ignorando integrações sem variável de ambiente foi rejeitado porque uma execução aparentemente verde poderia não validar persistência alguma.
