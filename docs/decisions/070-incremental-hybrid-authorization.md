# ADR 070 — Estratégia incremental e híbrida de autorização

- Estado: aceita
- Data: 2026-08-18
- Complementa: [ADR 066](066-identity-access-and-member-linking.md) e [ADR 069](069-organization-creator-access-bootstrap.md)

## Contexto

O Servir precisa autorizar operações tenant-scoped e futuramente diferenciar responsabilidades administrativas. RBAC puro não prova que um usuário pertence ao tenant ou que uma ação é válida para um recurso específico. Um Policy Engine ou Authorization Service antecipado acrescentaria disponibilidade, latência, cache, deploy e operação antes de existirem múltiplos serviços ou políticas dinâmicas.

## Decisão

A autorização será híbrida e incremental dentro da API. `OrganizationAccess` representa a relação do User com a Organization; roles agrupam capabilities técnicas quando existirem consumidores; policies no código avaliam tenant, recurso, estado e demais condições necessárias.

O código define o catálogo e o significado das capabilities suportadas. O banco persiste acessos, roles atribuídas e, quando necessário, associações configuráveis entre roles e permissions. Expressões arbitrárias de policy não serão armazenadas nem interpretadas inicialmente.

A API aplica deny by default e least privilege. Entradas autenticadas sem acesso ou capacidade retornam `403`; identidade ausente ou inválida retorna `401`. O frontend usa decisões apenas para experiência. PEP e PDP permanecem componentes modulares locais; extração para serviço ou engine exige nova decisão baseada em consumidores e requisitos operacionais.

## Consequências

ReBAC, RBAC e ABAC podem coexistir sem uma tabela genérica de relações ou um autorizador universal. Novas capabilities e roles exigem operações reais e testes de permissão e negação. Guards HTTP não substituem autorização em casos de uso alcançáveis por outras entradas.

## Alternativas

RBAC puro foi rejeitado por não proteger tenant e estado do recurso. Regras totalmente configuráveis no banco foram rejeitadas por criar implicitamente uma linguagem de programação. Um serviço inspirado em Zanzibar foi adiado porque a escala e o grafo de relações atuais não justificam sua complexidade.
