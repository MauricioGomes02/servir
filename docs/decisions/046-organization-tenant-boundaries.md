# ADR 046 — Organization como fronteira de tenant

- Estado: aceita
- Data: 2026-08-10
- Complementa: [ADR 039](039-create-ministry-vertical-slice.md), [ADR 041](041-request-ministry-membership-vertical-slice.md) e [ADR 045](045-qualify-member-for-ministry-role-vertical-slice.md)

## Contexto

Cada `Organization` representa inicialmente uma igreja local. Embora relacionamentos permitam deduzir essa propriedade por joins, chaves estrangeiras baseadas somente em IDs não impedem que um erro de adapter associe dados de organizações diferentes. Consultas sem tenant explícito também ampliam o risco de exposição acidental.

## Decisão

O Servir adota banco e schema compartilhados, com `organization_id` explícito em toda tabela de dados pertencente a uma Organization. Relacionamentos tenant-owned usam chaves estrangeiras compostas para provar que origem e destino pertencem à mesma Organization. Índices de acesso e unicidade tenant-owned iniciam por `organization_id`, e adapters recebem ou obtêm o `OrganizationId` do Aggregate antes de consultar ou alterar estado.

IDs continuam globalmente únicos, mas essa propriedade não substitui o isolamento estrutural. Tabelas operacionais globais, como a outbox genérica, não recebem obrigatoriamente `organization_id`; seus contratos tenant-owned carregam a organização no payload e na chave de partição.

Row-Level Security não pertence a esta decisão. Sua adoção exige definir identidade autenticada, configuração transacional da sessão e interação com o pool de conexões.

## Consequências

O banco rejeita vínculos entre organizações mesmo quando a Application ou um adapter falha. `ministry_roles` passa a carregar `organization_id`, retropreenchido a partir de Ministry. Repositories e Readers sempre escopam operações tenant-owned pelo tenant. Constraints e índices compostos aumentam moderadamente o custo de escrita em troca de isolamento, consultas previsíveis e uma futura adoção de RLS mais segura.

## Alternativas

Deduzir o tenant exclusivamente por joins foi rejeitado por depender de toda consulta estar correta. Um schema ou banco por Organization foi rejeitado pela complexidade operacional prematura. Adotar RLS imediatamente foi rejeitado porque autenticação e propagação segura da identidade do tenant ainda não foram definidas.
