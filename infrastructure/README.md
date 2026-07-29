# Infraestrutura

Esta pasta concentra recursos operacionais externos às aplicações. O backend consome o banco, mas não cria nem atualiza seu schema durante o startup.

## Ambiente local

O Compose oferece PostgreSQL e Liquibase. Copie `.env.example` para `.env` apenas se precisar alterar as configurações locais.

```bash
cd infrastructure
docker compose up -d postgres
docker compose run --rm liquibase
```

O segundo comando aplica explicitamente os changesets pendentes. Para consultar o estado sem alterar o schema:

```bash
docker compose run --rm liquibase status
```

As credenciais do exemplo pertencem somente ao ambiente local. Em ambientes compartilhados, o pipeline de migrations deve usar uma identidade com permissão de DDL, enquanto cada aplicação usa uma identidade de runtime limitada às operações necessárias. Segredos não devem ser versionados.

## Organização

- `compose.yaml`: dependências locais e ferramenta de migration sob demanda.
- `database/liquibase/changelog`: fonte canônica e ordenada das mudanças de schema.
- IaC de ambientes compartilhados será adicionada quando o provedor e a topologia forem decididos.

Novas mudanças de banco devem ser acrescentadas como changesets; changesets já aplicados não devem ser editados. Mudanças incompatíveis devem seguir expand/contract para permitir que versões diferentes das aplicações convivam durante uma implantação.

