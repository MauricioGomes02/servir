# Membership

## Estado

Núcleo de domínio e caso de uso `RegisterMember` implementados. A persistência PostgreSQL, o contrato de integração e a apresentação permanecem planejados.

## Motivação

Representar pessoas conhecidas pela igreja sem exigir que possuam credenciais e sem criar uma identidade global entre organizações antes de existir esse caso de uso.

## Responsabilidades

- Identificar um membro de forma estável dentro de uma Organization.
- Validar e normalizar seu nome.
- Preservar o vínculo obrigatório com uma única Organization.
- Registrar o fato `MemberRegistered` junto da criação válida.
- Manter o ciclo ministerial separado de autenticação e autorização.

## Limites

- `Member` não contém senha, credencial ou `UserId`.
- Não representa participação ou qualificação num ministério.
- Não tenta deduplicar a mesma pessoa entre organizações.
- Contato, endereço, nascimento e documentos não existem sem consumidor e regras de privacidade concretos.
- O domínio não consulta existência ou estado da Organization. `RegisterMember` delega essa decisão ao port `OrganizationMembershipEligibility` antes de criar o Aggregate.

## Modelo inicial

```text
Member
├── MemberId
├── OrganizationId
├── MemberName
└── MemberStatus: active | inactive
```

`MemberId` aceita UUID canônico reconhecido e usa UUIDv7 para novas identidades por meio do adapter de geração. `MemberName` remove espaços externos, exige conteúdo e aceita até 120 caracteres. Nomes iguais não definem igualdade nem implicam duplicidade.

## Registro

```mermaid
sequenceDiagram
    participant A as RegisterMember
    participant O as OrganizationMembershipEligibility
    participant M as Member
    participant U as UnitOfWork
    A->>O: allowsMemberRegistration(organizationId)
    alt Organization elegível
        A->>M: register(id, organizationId, name, eventId, occurredAt)
        alt nome válido
            M->>M: registra member.registered
            A->>U: save(Member) + add(envelope)
            U-->>A: commit
            A->>M: acknowledgeDomainEvents
            A-->>A: Result success
        else nome inválido
            M-->>A: Result failure sem Member nem evento
        end
    else Organization inelegível
        A-->>A: member.registration.organization_not_eligible
    end
```

O caso de uso recebe dados ainda não confiáveis, valida `OrganizationId`, consulta elegibilidade e somente então cria o Aggregate. `MemberRepository` e `EventOutbox` participam do mesmo `MemberWriteScope`; a garantia transacional concreta caberá ao adapter PostgreSQL. O evento só é reconhecido no Aggregate depois que a Unit of Work conclui.

O payload interno do fato contém somente `memberId`, `organizationId` e o nome normalizado. Ator, correlação e request pertencem ao envelope/contexto; nenhum contrato de integração foi definido.

## Relações

- Organizations fornece `OrganizationId` como referência nominal.
- Ministries consumirá `MemberId` por meio de `MinistryMembership`.
- Scheduling usará `MemberId` em disponibilidade e atribuições.
- Identity & Access poderá associar `User` e `Member` por um fluxo futuro sem colocar credenciais no Aggregate.

## Próximos comportamentos candidatos

- Implementar os adapters PostgreSQL de `MemberRepository`, `OrganizationMembershipEligibility` e `MemberWriteScope`.
- Definir o contrato de integração de `MemberRegistered` somente quando existir consumidor.
- Expor `RegisterMember` por uma entrada HTTP com Problem Details e localização.
- Desativação e reativação preservam histórico por eventos próprios.
- Renomeação registra fato sem alterar publicações históricas que guardem snapshots.

## Boas práticas

- Tratar `Member` como unidade do Repository.
- Usar `MemberId`, nunca string intercambiável com outros IDs.
- Coletar somente dados exigidos por um fluxo real.
- Permitir nomes iguais e resolver identidade pelo ID.

## Anti-patterns

- Usar e-mail ou nome como identidade do membro.
- Tornar login obrigatório para cadastrar um voluntário.
- Compartilhar automaticamente um Member entre organizações.
- Colocar participações de todos os ministérios dentro do Aggregate.
