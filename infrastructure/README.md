# Infraestrutura

Esta pasta concentra recursos operacionais externos às aplicações. Terraform administra a plataforma Docker persistente e o catálogo de tópicos Kafka em states separados; Compose executa somente ferramentas descartáveis. API e relay não criam infraestrutura, não aplicam migrations e não administram tópicos.

## Responsabilidades

| Responsável | Recursos |
|---|---|
| Terraform `local` | Rede, IPAM, volumes protegidos, imagens e containers PostgreSQL/Kafka |
| Terraform `local-messaging` | Tópicos e suas configurações persistentes |
| Compose | Execuções sob demanda de Liquibase |
| Aplicações | Consumo dos endpoints e contratos já provisionados |

Terraform e Compose nunca devem declarar ownership sobre o mesmo container, volume ou rede.

O Kafka executa sem privilégios com UID/GID `1000:1000`. Antes do broker, o stack executa uma vez o container encerrado `servir-kafka-data-init`, sem rede e somente com a capability `CHOWN`, para preparar o volume persistente. Uma mudança nesse inicializador substitui apenas o container Kafka; o volume protegido e seus dados são preservados.

## Pré-requisitos

- Docker Engine 20.10.4 ou superior acessível no mesmo ambiente em que Terraform será executado.
- Terraform CLI entre 1.10 e a próxima major.
- Docker Compose para os jobs operacionais.

No WSL, execute Terraform dentro da distribuição que possui acesso a `/var/run/docker.sock`. State local pode conter valores sensíveis e não deve ser versionado ou compartilhado.

## Provisionar a plataforma local

```bash
cd infrastructure/terraform/environments/local
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform fmt -check -recursive ../..
terraform validate
terraform plan -out=local.tfplan
terraform apply local.tfplan
```

O primeiro `terraform init` gera `.terraform.lock.hcl`, que deve ser versionado para fixar os checksums selecionados do provider. Os arquivos `.terraform/`, `terraform.tfvars`, planos e states permanecem ignorados.

Os outputs distinguem endpoints por origem:

| Consumidor | PostgreSQL | Kafka |
|---|---|---|
| Processo no host/WSL | `localhost:5432` | `localhost:29092` |
| Container na rede | `postgres:5432` | `kafka:9092` |

A rede bridge `servir-platform` usa por padrão `172.28.0.0/24` e gateway `172.28.0.1`. Altere ambos no `terraform.tfvars` antes do primeiro apply se houver sobreposição com VPN ou outra rede Docker. Containers usam DNS; IPs fixos não fazem parte do contrato.

## Provisionar os tópicos

Com o broker saudável, aplique separadamente o catálogo de mensageria:

```bash
cd infrastructure/terraform/environments/local-messaging
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform validate
terraform plan -out=local-messaging.tfplan
terraform apply local-messaging.tfplan
```

Esse state é separado porque o provider Kafka precisa alcançar o broker criado pelo stack `local`. O catálogo declara `servir.organizations.events` e `servir.membership.events`, cada um com três partições e replication factor 1. A versão da imagem do broker não é configurada como versão de protocolo do provider; são conceitos diferentes e o provider negocia uma versão compatível.

Para consultar o recurso gerenciado sem alterá-lo:

```bash
terraform state show 'module.messaging.kafka_topic.managed["organizations_events"]'
terraform state show 'module.messaging.kafka_topic.managed["membership_events"]'
terraform plan
```

## Aplicar migrations

Após provisionar a plataforma, copie `.env.example` para `.env` somente se precisar alterar os defaults e execute:

```bash
cd infrastructure
docker compose run --rm liquibase
```

O job usa a rede externa `servir-platform`. Liquibase aplica somente os changesets pendentes e continua fora do lifecycle e do state do Terraform.

Para consultar sem alterar:

```bash
docker compose run --rm liquibase status
```

## Executar as aplicações

Configure a API para PostgreSQL e o relay para os endpoints publicados no host:

```dotenv
# backend/applications/api/.env
PERSISTENCE_MODE=postgres
DATABASE_URL=postgresql://servir_migrator:servir_migrator_local@localhost:5432/servir

# backend/applications/outbox-relay/.env
DATABASE_URL=postgresql://servir_migrator:servir_migrator_local@localhost:5432/servir
KAFKA_BROKERS=localhost:29092
```

Em outro terminal:

```bash
cd backend
npm run dev:api
npm run dev:relay
```

As credenciais simplificadas existem apenas para desenvolvimento local. Ambientes compartilhados exigem identidades separadas e permissões mínimas.

## Rede e segurança local

- A bridge definida pelo usuário fornece DNS e isolamento da bridge padrão.
- PostgreSQL e Kafka publicam portas apenas em `127.0.0.1`.
- O listener `INTERNAL` do Kafka anuncia `kafka:9092`; o listener `EXTERNAL` anuncia `localhost:29092`.
- PLAINTEXT é aceito somente neste ambiente local; produção requer autenticação e criptografia definidas pela IaC do ambiente.
- O nó Kafka combina broker e controller em KRaft. Essa topologia não representa alta disponibilidade.

## Proteção e remoção de dados

Os volumes `servir-postgres-data`, `servir-kafka-data` e os tópicos gerenciados possuem `prevent_destroy`. Por isso, operações que destruiriam dados falham deliberadamente.

Para apagar dados, revise o plano, faça backup se necessário, remova temporariamente o `prevent_destroy` do recurso correto e só então execute um novo `terraform plan`/`destroy`. Destrua a mensageria antes da plataforma. Não remova simplesmente resources do código: a proteção não se aplica quando a configuração deixa de existir.

## Organização

```text
infrastructure/
├── compose.yaml                         # jobs operacionais descartáveis
├── database/liquibase/changelog/       # migrations canônicas
└── terraform/
    ├── environments/local/              # composition root e state da plataforma
    ├── environments/local-messaging/    # composition root e state dos tópicos
    ├── modules/local-platform/          # rede, volumes e serviços persistentes
    └── modules/local-messaging/         # catálogo de tópicos Kafka
```

Novas migrations são novos changesets imutáveis. Mudanças incompatíveis seguem expand/contract. Novos recursos persistentes entram no Terraform; operações repetíveis e descartáveis permanecem fora do state. O stack de plataforma deve ser aplicado antes do stack de mensageria.
