# ADR 063 — Experiência de detalhe do ministério

- Estado: aceita
- Data: 2026-08-13
- Complementa: [ADR 029](029-command-query-responsibility-separation.md), [ADR 046](046-organization-tenant-boundaries.md) e [ADR 060](060-task-oriented-frontend-experience.md)

## Contexto

A aplicação web permite criar, buscar e listar ministérios, mas os itens não conduziam a uma experiência de detalhe. O backend possui funções internas de `Ministry`, porém não oferecia um read model individual. Reproduzir o mockup completo exigiria inventar contagens, pessoas, times e liderança ainda sem contratos de consulta.

## Decisão

Introduzir `GetMinistryDetails` como Query e `MinistryDetailsReader` orientado ao consumidor. A consulta recebe `OrganizationId` e `MinistryId`, aplica ambos no PostgreSQL e retorna nome, estado e funções ministeriais pertencentes ao Aggregate. Ausência dentro da fronteira da organização produz a mesma resposta de recurso não encontrado, sem revelar dados de outro tenant.

Expor `GET /organizations/{organizationId}/ministries/{ministryId}` na API privada e um contrato explícito equivalente em `/bff`. A lista web passa a navegar semanticamente para o detalhe, que modela carregamento, erro recuperável, ausência de funções e funções existentes.

Pessoas, times, liderança e métricas não integram este read model. Esses dados pertencem a outras raízes e só entrarão quando uma tarefa real justificar a composição no BFF. A página não apresenta tabs ou seções sem conteúdo executável.

## Consequências

O usuário pode avançar da estrutura ministerial para um ministério reconhecível sem conhecer IDs ou endpoints. A leitura não reconstitui o Aggregate e não altera o Repository de escrita. O adapter PostgreSQL realiza uma consulta tenant-scoped e preserva a ordenação estável das funções.

O próximo incremento pode oferecer `DefineMinistryRole` pela própria experiência. A ampliação para pessoas e times exigirá read models próprios ou composição orientada à página, sem transformar o detalhe em espelho de tabelas.

## Alternativas

Usar `MinistryRepository.findById` foi rejeitado porque uma Query de apresentação não precisa reconstituir comportamento nem eventos. Montar o detalhe no navegador com várias chamadas foi rejeitado porque vazaria a topologia interna e favoreceria N+1. Copiar todo o mockup com placeholders foi rejeitado porque comunicaria capacidades inexistentes.
