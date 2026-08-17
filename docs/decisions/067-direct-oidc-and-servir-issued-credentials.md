# ADR 067 — OIDC direto e credenciais emitidas pelo Servir

- Estado: aceita
- Data: 2026-08-17
- Complementa: [ADR 058](058-private-api-behind-containerized-frontend-bff.md) e [ADR 066](066-identity-access-and-member-linking.md)

## Contexto

O Servir precisa autenticar pessoas sem armazenar senhas. Google e Microsoft cobrem inicialmente contas pessoais, organizações que usam Google Workspace e ambientes corporativos Microsoft. Seus tokens pertencem aos respectivos provedores: um ID Token prova autenticação ao cliente OIDC, enquanto um access token pode ser opaco ou destinado às APIs do provedor. Nenhum deles deve se tornar, por conveniência, a credencial de autorização da API Servir.

Adicionar um broker de identidade reduziria parte da implementação, mas criaria outra dependência operacional antes de existirem múltiplas aplicações ou requisitos empresariais que a justifiquem. Sem broker, o Servir precisa assumir explicitamente a emissão, proteção e rotação de suas próprias credenciais.

## Decisão

O BFF será o cliente OIDC confidencial e integrará diretamente provedores configurados por contrato comum, começando por Google e depois Microsoft. O fluxo será Authorization Code com `state`, `nonce` e PKCE. O BFF validará assinatura, algoritmo permitido, issuer, audience, expiração, nonce e requisitos próprios do provedor antes de aceitar `issuer + subject` como uma afirmação de identidade externa.

Tokens do provedor não serão armazenados no browser, usados para autorizar a API Servir nem registrados em logs. Client secrets e chaves privadas permanecerão em secret stores do ambiente; configuração de um provedor inicial não será modelada como dado tenant-scoped.

Depois de validar o provedor, o Servir emitirá duas credenciais distintas:

- uma sessão stateless em cookie `__Host-` com `HttpOnly`, `Secure`, `SameSite` e audience do BFF;
- um access JWT de curta duração, com audience exclusiva da API, enviado somente pelo BFF no header `Authorization`.

As credenciais serão assinadas assimetricamente, identificarão a chave por `kid` e permitirão sobreposição de chaves públicas durante rotação. A API terá apenas material público e validará assinatura, issuer, audience, algoritmo, expiração, `nbf` quando presente e claims obrigatórias. O JWT carregará somente identidade e metadados mínimos; autorização tenant-scoped continuará consultando `OrganizationAccess`.

O primeiro login possui uma etapa de bootstrap porque ainda não existe `UserId`. Após validar o ID Token, o BFF emitirá uma afirmação interna, curta, com audience da API e propósito exclusivo de provisionamento. Ela carregará a identidade externa verificada e será aceita somente por `ProvisionUserFromExternalIdentity`. Depois que a API devolver o `UserId`, sessões e access tokens normais usarão esse ID interno como subject.

O conceito atualmente implementado como `AuthenticatedActor` com `issuer + subject` será migrado para `ExternalIdentityAssertion`, restrito a provisionamento e vinculação. O `AuthenticatedActor` operacional passará a representar um `UserId` reconhecido pelo Servir.

Vincular Google e Microsoft ao mesmo User exigirá um fluxo explícito iniciado por um User já autenticado e uma nova autenticação no segundo provedor. E-mail, nome ou coincidência de claims nunca produzirão vínculo automático.

## Consequências

Google e Microsoft ficam fora do caminho normal depois do login. O browser não manipula tokens e uma credencial destinada ao BFF não funciona na API. O BFF passa a exercer uma responsabilidade limitada de emissor: proteger chave privada, emitir claims corretas, publicar chaves, rotacioná-las e rejeitar algoritmos não permitidos.

A sessão stateless evita memória de instância e infraestrutura adicional, mas não oferece revogação imediata de uma cópia roubada. Tokens curtos, rotação e logout local reduzem exposição; sessão externa, denylist ou estratégia híbrida exigirão nova decisão quando revogação imediata tiver consumidor real.

Cookies autenticados exigem proteção CSRF. `SameSite` integra a defesa, mas mutações também deverão validar origem e adotar token CSRF quando o modelo de ameaça exigir.

## Alternativas

Keycloak como broker foi adiado para evitar outra dependência operacional. Usar diretamente o ID Token do Google na API foi rejeitado por misturar audiência de login e autorização interna. Repassar access tokens externos foi rejeitado porque podem ser opacos ou destinados a APIs do provedor. Um token único para browser e API foi rejeitado por apagar a fronteira de audience. Sessão em memória foi rejeitada por impedir escala horizontal e execução serverless. Criar um Auth Service separado foi adiado até múltiplas aplicações exigirem uma fronteira implantável própria.
