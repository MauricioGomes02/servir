# ADR 072 — Snapshots locais de persistência nos Repositories

- Estado: aceita
- Data: 2026-08-21
- Complementa: [ADR 021](021-postgresql-transactional-unit-of-work.md)
- Complementa: [ADR 044](044-module-owned-persistence-registration.md)

## Contexto

Um Repository orientado a Aggregate deve permitir que a Application carregue a root, execute comportamento de domínio e persista o resultado sem conhecer colunas. Atualizar todas as colunas em cada `save`, entretanto, produz escrita mesmo quando nada mudou, amplia o trabalho do banco e pode confundir auditoria técnica baseada em alterações físicas. Passar uma lista de campos pelo caso de uso deslocaria detalhes de persistência para a Application e criaria métodos de atualização específicos para cada ação.

O projeto não adota uma Unit of Work que descubra Aggregates modificados por reflexão ou decorators. Também não há necessidade demonstrada de acrescentar uma coluna de versão ao schema somente para selecionar colunas alteradas. Locks e outras garantias de concorrência precisam continuar explícitos nos ports dos fluxos que os exigem.

## Decisão

Repositories de Aggregate Roots mutáveis que oferecem `save` mantêm um snapshot de persistência local à instância do adapter e, portanto, ao write scope da Unit of Work. O snapshot é registrado depois de `findById` ou de um `add` bem-sucedido e contém somente os valores persistíveis conhecidos pelo Repository.

Ao receber `save(aggregate)`, o adapter compara o estado atual com o snapshot por uma lista fixa de propriedades e colunas:

- nenhuma diferença não executa `UPDATE`;
- diferenças atualizam somente as colunas correspondentes por SQL parametrizado;
- sucesso renova o snapshot;
- um Aggregate que não foi carregado nem adicionado pela mesma instância falha com erro técnico codificado.

O contrato da Application continua recebendo apenas o Aggregate. Snapshots não entram no domínio, não são compartilhados por uma abstração genérica e não são persistidos no schema. Readers, stores append-only e Repositories sem ciclo `findById` seguido de `save` não recebem tracking.

Consultas por chaves alternativas ou fatos que envolvem mais de um Aggregate pertencem a Readers orientados ao consumidor. Um port declarativo separado expressa locks quando a decisão exige serialização. O snapshot seleciona colunas a persistir, mas não resolve concorrência e não determina fatos de auditoria de negócio.

## Consequências

Casos de uso continuam expressando comportamento e chamando um único `save`, sem listar campos. O PostgreSQL evita updates sem mudança e limita cada update às colunas realmente alteradas. A whitelist permanece visível no adapter, permitindo revisar o mapeamento e impedir que nomes externos componham SQL.

Cada Repository mutável assume uma pequena responsabilidade técnica de tracking. Uma nova propriedade persistível exige atualizar seu snapshot e seu mapeamento de diferenças. Como o tracking vive no write scope, Aggregates não podem ser carregados por uma instância e salvos silenciosamente por outra.

Auditoria de negócio continua derivada da ação ou de Domain Events. Concorrência perdida continua exigindo uma estratégia própria quando o caso de uso demonstrar essa necessidade, como lock explícito ou controle de versão decidido separadamente.

## Alternativas

Atualizar todas as colunas em todo `save` foi rejeitado por gerar escrita desnecessária e esconder quais valores mudaram. Passar campos alterados ou criar métodos como `saveMemberLink` foi rejeitado por acoplar a Application ao mapeamento físico e multiplicar contratos por ação. Tracking genérico na Unit of Work foi rejeitado por introduzir descoberta mágica e contrariar o ownership modular do ADR 044. Usar Domain Events como deltas de persistência foi rejeitado porque eventos registram fatos de domínio e não patches de banco. Adicionar uma coluna de versão foi adiado: seleção de colunas e controle de concorrência são problemas distintos.
