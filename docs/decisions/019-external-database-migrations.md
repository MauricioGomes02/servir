# ADR 019 — Migrations de banco externas às aplicações

- Estado: aceita
- Data: 2026-07-29

## Contexto

O primeiro adapter PostgreSQL exigirá um schema compartilhado por persistência de Aggregates e outbox. Executar migrations no startup do backend mistura entrega da aplicação com administração do banco e, com múltiplas réplicas ou aplicações, cria concorrência, permissões excessivas e uma ordem de evolução implícita.

## Decisão

Manter os changelogs Liquibase em `infrastructure/database`, fora do backend, e executá-los como uma etapa explícita da operação ou do pipeline. A infraestrutura é proprietária da evolução física do banco; os módulos continuam proprietários da semântica dos dados e revisam mudanças em suas tabelas.

Ambientes compartilhados usam identidades distintas: o executor de migrations recebe as permissões de DDL necessárias e a aplicação recebe somente permissões de runtime. A composição local pode usar credenciais simplificadas, que não constituem configuração de produção.

Changesets aplicados são imutáveis. Evoluções incompatíveis seguem expand/contract: primeiro adicionam uma forma compatível, depois migram consumidores e dados e, somente em outra implantação segura, removem a forma anterior. O backend não chama Liquibase nem condiciona seu startup à aplicação automática de migrations.

Identidades persistidas que possuem contrato UUID usam o tipo nativo `uuid` do PostgreSQL. Metadados externos cujo contrato permanece opaco, como `CorrelationId`, não são convertidos em UUID apenas por conveniência do banco.

## Consequências

A evolução do schema fica centralizada e auditável mesmo quando existirem várias aplicações. Deploys precisam coordenar a compatibilidade entre versão do schema e versões dos consumidores, e o pipeline passa a ter uma etapa explícita com credenciais próprias.

PostgreSQL e Liquibase tornam-se escolhas operacionais iniciais. O código de domínio e os ports permanecem independentes deles. IaC para recursos de ambientes compartilhados será introduzida quando provedor, rede, gestão de segredos e topologia estiverem definidos.

## Alternativas

Executar migrations no startup foi rejeitado por acoplar cada processo da aplicação a DDL e por permitir concorrência entre instâncias. Manter migrations dentro de um único backend foi rejeitado porque esse backend não deve se tornar proprietário operacional de schemas consumidos futuramente por mais de uma aplicação. Criar IaC específica de um provedor agora foi adiado por ainda não existir uma decisão concreta de ambiente.
