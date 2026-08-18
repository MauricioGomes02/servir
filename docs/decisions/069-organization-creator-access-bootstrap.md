# ADR 069 — Bootstrap do acesso do criador da Organization

- Estado: aceita
- Data: 2026-08-17
- Complementa: [ADR 066](066-identity-access-and-member-linking.md)

## Contexto

Uma Organization nova ainda não possui alguém autorizado a administrar acessos ou emitir convites. Criar o primeiro acesso por seed ou operação privilegiada externa deixaria a jornada normal incompleta e introduziria uma segunda porta de bootstrap.

## Decisão

`CreateOrganization` exige um `User` autenticado e cria um `OrganizationAccess` ativo com papel técnico `owner` para esse usuário. Organization, acesso inicial e outbox são persistidos na mesma transação.

O acesso inicial não possui `MemberId`: criar uma igreja não prova que a conta representa um cadastro de membro. Vínculos pessoais continuam dependendo de convite explícito. O papel `owner` inaugura somente a autoridade técnica necessária para administrar o tenant; permissões mais granulares nascerão de consumidores concretos.

Constraints PostgreSQL garantem no máximo um acesso vigente por `OrganizationId + UserId` e, quando houver vínculo futuro, por `OrganizationId + MemberId`.

## Consequências

A Organization nunca nasce sem administrador e falhas ao persistir qualquer parte revertem todo o bootstrap. A criação deixa de ser anônima. Organizações preexistentes sem acesso exigirão migração ou bootstrap operacional explícito antes da proteção integral das rotas.

Seeds administrativos e escolha automática de Member foram rejeitados, respectivamente, por criar uma porta privilegiada paralela e por permitir associação de identidade sem prova.
