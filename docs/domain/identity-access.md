# Identity & Access

## Estado

Modelo inicial em implementação. Login Google, sessão segura, `User` global, provisionamento idempotente, credenciais próprias, criação atômica do primeiro `OrganizationAccess` como `owner` e verificação HTTP de acesso ativo nas rotas tenant-scoped estão implementados; capabilities específicas, convites, vínculo com Member e interfaces ainda estão planejados.

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

O caso de uso recebe a identidade exclusivamente pelo `ExecutionContext`; `issuer` e `subject` não são aceitos do body. O port `UserProvisioner` representa a operação atômica de encontrar ou inserir, e o adapter PostgreSQL usa uma constraint única para resolver tentativas concorrentes sem deixar Users órfãos. Esse primeiro fato não produz Domain Event nem Integration Event porque ainda não existe consumidor desacoplado.

### Convite de membro

`InviteMemberToAccess` exige ator autorizado, Organization e Member ativos do mesmo tenant. O token aleatório é produzido por adapter criptograficamente seguro, devolvido apenas ao canal de entrega e persistido como digest. Logs e eventos carregam o ID do convite, nunca o token.

### Aceitação

`AcceptMemberAccessInvitation` recebe o User autenticado e o segredo apresentado. A Application busca o convite pelo digest, verifica expiração, estado, destinatário e conflitos atuais. A mesma Unit of Work marca o convite como aceito, cria `OrganizationAccess` e persiste outbox. Falha não consome o convite nem cria acesso parcial.

### Cadastro sem convite

Um User pode existir sem acesso organizacional. Solicitação espontânea de entrada e aprovação administrativa permanecem posteriores; o usuário não recebe uma busca de Members para escolher quem representar.

### Bootstrap da Organization

`CreateOrganization` exige ator autenticado e cria no mesmo commit a Organization, o `OrganizationAccess` ativo do criador como `owner` e a outbox. O acesso não recebe `MemberId`, pois criar a Organization não comprova identidade ministerial. A decisão está registrada no [ADR 069](../decisions/069-organization-creator-access-bootstrap.md).

## Autenticação e sessão

- Google será o primeiro provedor OIDC direto e Microsoft o segundo;
- OIDC Authorization Code com PKCE, `state` e `nonce`;
- issuer e audience configurados explicitamente;
- assinatura, `exp`, `nbf` e claims obrigatórias validadas;
- sessão do BFF em cookie `HttpOnly`, `Secure` e `SameSite`;
- proteção CSRF em mutações autenticadas;
- logout local e, quando suportado, encerramento no provedor;
- tokens e segredos redigidos de logs e telemetria;
- API valida a identidade e aplica autorização independentemente do BFF.

Após validar o provedor, o BFF emite uma sessão stateless em cookie seguro e um access JWT curto com audience exclusiva da API. No primeiro login, uma afirmação interna de bootstrap, restrita ao propósito de provisionamento, transporta `issuer + subject` até a API. Depois do provisionamento, credenciais normais usam `UserId`; a identidade externa deixa de representar o ator operacional. A decisão completa está no [ADR 067](../decisions/067-direct-oidc-and-servir-issued-credentials.md).

O primeiro corte executável integra Google ao BFF por Authorization Code, `state`, `nonce` e PKCE. A transação temporária é criptografada em cookie `__Host-`; o callback valida o provedor, emite uma assertion interna curta, chama `POST /identity/users/provision` na API privada e cria uma sessão assinada contendo o `UserId` interno. O provisionamento é idempotente por `issuer + subject`, e a rota aceita exclusivamente credenciais com propósito `user-provisioning`.

O BFF também expõe consulta de sessão e logout local. A sessão vincula um token CSRF aleatório; mutações autenticadas validam o valor enviado no header contra o cookie legível pelo cliente e contra a claim assinada, além de exigir origem confiável. O logout remove os cookies de sessão e CSRF, sem prometer revogação imediata de uma cópia previamente roubada da sessão stateless.

Quando autenticação está configurada, o BFF exige uma sessão válida nas rotas de negócio, aplica CSRF às mutações, emite um access token curto para o `UserId` e o envia somente à API privada. O navegador continua sem acesso ao JWT. A API valida assinatura, issuer, audience, expiração e propósito antes de materializar o `AuthenticatedActor` no contexto.

Esse mecanismo autentica o ator, mas não concede acesso automaticamente a uma organização. Nas rotas autenticadas com `organizationId`, a API exige um `OrganizationAccess` ativo para o `UserId` e o tenant solicitados. Presença de sessão ou de `organizationId` na URL nunca é interpretada como permissão.

Chaves privadas são carregadas uma vez pelo BFF no startup, preferencialmente de arquivo somente leitura materializado pelo ambiente. A API carrega da mesma forma apenas o JWKS público. Variáveis inline permanecem disponíveis para desenvolvimento, com menor precedência que os arquivos; integrações com secret stores não fazem chamadas por request.

Uma segunda identidade externa só pode ser vinculada por fluxo explícito iniciado por User autenticado e nova autenticação no provedor. Coincidência de e-mail ou nome nunca une contas.

## Sequência incremental

1. ~~Definir ports OIDC, ator autenticado e extensão do `ExecutionContext`.~~
2. ~~Implementar `User` e provisionamento idempotente por identidade externa.~~
3. ~~Separar a afirmação externa de bootstrap do ator operacional identificado por UserId.~~
4. ~~Implementar assinatura, rotação e validação das credenciais próprias do Servir.~~
5. ~~Implementar login Google, callback, sessão, CSRF e logout no BFF.~~
6. ~~Validar o access token na API e proteger a primeira rota.~~
7. ~~Verificar `OrganizationAccess` ativo nas rotas HTTP tenant-scoped.~~
8. ~~Adicionar descoberta e seleção segura de Organizations acessíveis.~~
9. Implementar Microsoft e vinculação explícita de identidades.
10. Implementar `MemberAccessInvitation` e criação de convite.
11. Implementar aceitação atômica e `OrganizationAccess` vinculado.
12. Expor “Minha conta” e “Meu perfil”.
13. Introduzir permissões técnicas pelos primeiros casos de uso administrativos.
14. Avaliar solicitação espontânea, revogação, recuperação e RLS.

## Boas práticas

- usar IDs nominais e constraints compostas tenant-safe;
- tornar provisionamento e callbacks idempotentes;
- tratar convite como segredo temporário de uso único;
- exigir e-mail verificado quando ele restringir o destinatário;
- registrar fatos auditáveis sem registrar credenciais;
- autorizar na API mesmo quando a interface oculta uma ação.
- evoluir roles, capabilities e policies conforme a [estratégia de autorização](../authorization.md).

## Anti-patterns

- procurar Member por nome ou e-mail e vinculá-lo automaticamente;
- usar `MinistryRole` como permissão;
- armazenar token de convite em texto puro;
- aceitar tenant apenas porque veio numa rota válida;
- guardar access token em `localStorage`;
- confiar no BFF como única barreira de autorização;
- criar senha e recuperação local sem necessidade demonstrada.
