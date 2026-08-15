# Identity & Access

## Estado

Decisão arquitetural e modelo inicial aprovados. Aggregates, persistência, adapters OIDC, sessão e interfaces ainda estão planejados.

## Motivação

Permitir que pessoas acessem o Servir sem transformar `Member` em credencial e sem associar contas por coincidência de nome ou contato.

## Responsabilidades

- representar a conta global por `User`;
- associar identidades externas verificadas sem armazenar senha;
- conceder e revogar acesso tenant-scoped;
- vincular uma conta ao Member correto por convite explícito;
- fornecer ator autenticado e acesso selecionado ao `ExecutionContext`;
- sustentar permissões técnicas sem reutilizar funções ministeriais.

## Limites

- não administra dados ministeriais, disponibilidade ou escalas;
- não altera `Member` para armazenar credenciais;
- não decide vínculo por nome ou e-mail semelhante;
- não confia em `organizationId` recebido pela URL;
- não coloca JWT, sessão, cookie ou SDK de OIDC no domínio;
- não implementa merge de Members;
- não antecipa uma matriz completa de permissões antes dos primeiros consumidores.

## Modelo inicial

```text
User (global)
├── UserId
├── status: active | inactive
└── externalIdentities: issuer + subject

OrganizationAccess (tenant-scoped)
├── OrganizationAccessId
├── OrganizationId
├── UserId
├── MemberId?
└── status: active | revoked

MemberAccessInvitation (tenant-scoped)
├── MemberAccessInvitationId
├── OrganizationId
├── MemberId
├── tokenDigest
├── intendedVerifiedEmail?
├── expiresAt
└── status: pending | accepted | revoked
```

`MemberId` é opcional em `OrganizationAccess` porque uma conta técnica pode administrar uma Organization sem representar inicialmente um membro. Quando presente, o vínculo é exclusivo dentro do tenant. `issuer + subject` identifica a conta no provedor; e-mail é claim mutável e não substitui essa identidade.

## Fluxos

### Provisionamento autenticado

Após o callback OIDC, a borda valida protocolo e claims. `ProvisionUserFromExternalIdentity` encontra idempotentemente um User pelo par `issuer + subject` ou cria um novo User. Repetir o mesmo login não cria outra conta.

### Convite de membro

`InviteMemberToAccess` exige ator autorizado, Organization e Member ativos do mesmo tenant. O token aleatório é produzido por adapter criptograficamente seguro, devolvido apenas ao canal de entrega e persistido como digest. Logs e eventos carregam o ID do convite, nunca o token.

### Aceitação

`AcceptMemberAccessInvitation` recebe o User autenticado e o segredo apresentado. A Application busca o convite pelo digest, verifica expiração, estado, destinatário e conflitos atuais. A mesma Unit of Work marca o convite como aceito, cria `OrganizationAccess` e persiste outbox. Falha não consome o convite nem cria acesso parcial.

### Cadastro sem convite

Um User pode existir sem acesso organizacional. Solicitação espontânea de entrada e aprovação administrativa permanecem posteriores; o usuário não recebe uma busca de Members para escolher quem representar.

## Autenticação e sessão

- OIDC Authorization Code com PKCE, `state` e `nonce`;
- issuer e audience configurados explicitamente;
- assinatura, `exp`, `nbf` e claims obrigatórias validadas;
- sessão do BFF em cookie `HttpOnly`, `Secure` e `SameSite`;
- proteção CSRF em mutações autenticadas;
- logout local e, quando suportado, encerramento no provedor;
- tokens e segredos redigidos de logs e telemetria;
- API valida a identidade e aplica autorização independentemente do BFF.

## Sequência incremental

1. Definir ports OIDC, ator autenticado e extensão do `ExecutionContext`.
2. Implementar `User` e provisionamento idempotente por identidade externa.
3. Validar access token na API e proteger rotas.
4. Implementar login, callback, sessão e logout no BFF.
5. Implementar `MemberAccessInvitation` e criação de convite.
6. Implementar aceitação atômica e `OrganizationAccess` vinculado.
7. Adicionar seleção segura de Organization e guards no frontend.
8. Expor “Minha conta” e “Meu perfil”.
9. Introduzir permissões técnicas pelos primeiros casos de uso administrativos.
10. Avaliar solicitação espontânea, revogação, recuperação e RLS.

## Boas práticas

- usar IDs nominais e constraints compostas tenant-safe;
- tornar provisionamento e callbacks idempotentes;
- tratar convite como segredo temporário de uso único;
- exigir e-mail verificado quando ele restringir o destinatário;
- registrar fatos auditáveis sem registrar credenciais;
- autorizar na API mesmo quando a interface oculta uma ação.

## Anti-patterns

- procurar Member por nome ou e-mail e vinculá-lo automaticamente;
- usar `MinistryRole` como permissão;
- armazenar token de convite em texto puro;
- aceitar tenant apenas porque veio numa rota válida;
- guardar access token em `localStorage`;
- confiar no BFF como única barreira de autorização;
- criar senha e recuperação local sem necessidade demonstrada.
