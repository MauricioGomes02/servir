# Infraestrutura

Esta pasta concentra recursos operacionais externos às aplicações. Terraform administra a plataforma Docker, incluindo API e relay, e o catálogo de tópicos Kafka em states separados; Compose executa somente ferramentas descartáveis. As aplicações não criam infraestrutura, não aplicam migrations e não administram tópicos.

## Responsabilidades

| Responsável | Recursos |
|---|---|
| Terraform `local` | Redes segmentadas, IPAM, volumes protegidos e infraestrutura de execução de PostgreSQL/Kafka/Collector/Jaeger/API/relay |
| Terraform `local-messaging` | Tópicos e suas configurações persistentes |
| Compose | Execuções sob demanda de Liquibase |
| Dockerfiles das aplicações | Builds multi-stage independentes e reproduzíveis da API e do relay |
| Pipeline de entrega | Build, análise, publicação e promoção das referências de imagem |
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

Antes do primeiro plano, construa as duas imagens fora do Terraform, sempre usando `backend` como contexto:

```bash
docker build -f applications/api/Dockerfile -t servir-api:local .
docker build -f applications/outbox-relay/Dockerfile -t servir-outbox-relay:local .
```

No primeiro bootstrap, mantenha `api_enabled = false` e `outbox_relay_enabled = false`. Terraform prepara os containers e seus recursos sem iniciar processos antes de o schema e dos tópicos existirem. Depois de aplicar Liquibase e o catálogo Kafka, habilite cada workload no `terraform.tfvars`, gere um novo plano e aplique-o.

O primeiro `terraform init` gera `.terraform.lock.hcl`, que deve ser versionado para fixar os checksums selecionados do provider. Os arquivos `.terraform/`, `terraform.tfvars`, planos e states permanecem ignorados.

Os outputs distinguem endpoints por origem:

| Consumidor | PostgreSQL | Kafka | OTLP/HTTP | API |
|---|---|---|---|---|
| Processo no host/WSL | `localhost:5432` | `localhost:29092` | `http://localhost:4318/v1/traces` | `http://localhost:3000` |
| Container autorizado | `postgres:5432` | `kafka:9092` | `http://otel-collector:4318/v1/traces` | `http://api:3000` na rede `edge` |

O bloco `172.28.0.0/24` é dividido por padrão em quatro bridges `/26`: `edge`, `data`, `messaging` e `observability`. Altere o bloco pai no `terraform.tfvars` antes do primeiro apply se houver sobreposição com VPN ou outra rede Docker. Gateways são derivados, containers usam DNS e IPs fixos não fazem parte do contrato.

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

O job usa a rede externa `servir-platform-data`. Liquibase aplica somente os changesets pendentes e continua fora do lifecycle e do state do Terraform.

Para consultar sem alterar:

```bash
docker compose run --rm liquibase status
```

## Executar as aplicações containerizadas

Com os respectivos flags habilitados, `terraform apply` inicia containers independentes usando as imagens prontas indicadas por `api_image` e `outbox_relay_image`. CPU, memória e todo o ambiente de cada processo são fornecidos separadamente pelo `terraform.tfvars`; o módulo não possui configuração de runtime embutida. As configurações locais de exemplo usam somente DNS das redes autorizadas:

```text
API: postgres:5432 e otel-collector:4318
Relay: postgres:5432, kafka:9092 e otel-collector:4318
```

Valide a API pelo host:

```bash
curl --fail http://localhost:3000/health/live
```

O endpoint de liveness verifica processo e transporte sem consultar dependências. Para desenvolvimento com hot reload, `npm run dev:api` e `npm run dev:relay` continuam disponíveis no host usando os respectivos `.env.example`.

Mapas de ambiente marcados como sensíveis ainda são armazenados no state. As credenciais simplificadas existem apenas para desenvolvimento local. Ambientes compartilhados exigem imagens publicadas por CI, identidades separadas, permissões mínimas e integração com um gerenciador de segredos.

## Visualizar traces

Collector e Jaeger são provisionados pelo mesmo stack `local`. O Collector recebe OTLP/HTTP em `127.0.0.1:4318`, processa os spans com proteção de memória e batch e os encaminha ao Jaeger pela rede interna. Acesse:

```text
http://localhost:16686
```

Reinicie API e relay após habilitar `OTEL_SDK_DISABLED=false`. Gere uma requisição, selecione `servir-api` ou `servir-outbox-relay` no campo **Service** do Jaeger e execute **Find Traces**. O armazenamento é efêmero e será perdido quando o container do Jaeger for recriado.

Esse incremento transporta somente traces. Logs continuam estruturados no stdout; métricas e exportação OTLP de logs não fazem parte deste pipeline.

## Rede e segurança local

- As bridges `edge`, `data`, `messaging` e `observability` limitam comunicação lateral por responsabilidade.
- A API participa de `edge`, `data` e `observability`; não alcança Kafka.
- O relay participa de `data`, `messaging` e `observability`; não publica portas.
- PostgreSQL participa somente de `data`, e Kafka somente de `messaging`.
- PostgreSQL e Kafka publicam portas apenas em `127.0.0.1`.
- Collector e Jaeger publicam OTLP/HTTP e UI apenas em `127.0.0.1`.
- O listener `INTERNAL` do Kafka anuncia `kafka:9092`; o listener `EXTERNAL` anuncia `localhost:29092`.
- API e relay executam como usuário não-root, com root filesystem somente leitura, capabilities removidas e `no-new-privileges`.
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
    ├── modules/local-platform/          # redes, volumes, plataforma e aplicações locais
    └── modules/local-messaging/         # catálogo de tópicos Kafka
```

```text
infrastructure/observability/
└── otel-collector.yaml                  # pipeline local de traces
```

Novas migrations são novos changesets imutáveis. Mudanças incompatíveis seguem expand/contract. Novos recursos persistentes entram no Terraform; operações repetíveis e descartáveis permanecem fora do state. O stack de plataforma deve ser aplicado antes do stack de mensageria.
