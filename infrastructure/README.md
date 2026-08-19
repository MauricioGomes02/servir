# Infraestrutura

Esta pasta concentra recursos operacionais externos às aplicações. Terraform administra a plataforma Docker, incluindo frontend BFF, API e relay, e o catálogo de tópicos Kafka em states separados; Compose executa somente ferramentas descartáveis. As aplicações não criam infraestrutura, não aplicam migrations e não administram tópicos.

## Responsabilidades

| Responsável                 | Recursos                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Terraform `local`           | Redes segmentadas, IPAM, volumes protegidos e infraestrutura de execução de PostgreSQL/Kafka/Collector/Jaeger/Grafana/frontend/API/relay |
| Terraform `local-messaging` | Tópicos e suas configurações persistentes                                                                                                |
| Compose                     | Execuções sob demanda de Liquibase                                                                                                       |
| Dockerfiles das aplicações  | Builds multi-stage independentes e reproduzíveis do frontend, da API e do relay                                                          |
| Pipeline de entrega         | Build, análise, publicação e promoção das referências de imagem                                                                          |
| Aplicações                  | Consumo dos endpoints e contratos já provisionados                                                                                       |

Terraform e Compose nunca devem declarar ownership sobre o mesmo container, volume ou rede.

O Kafka executa sem privilégios com UID/GID `1000:1000`. Antes do broker, um `terraform_data` registra a preparação do volume persistente e usa `local-exec` para executar um container BusyBox descartável, sem rede e somente com a capability `CHOWN`. O job ajusta o ownership para `1000:1000`, termina e é removido; falha diferente de zero interrompe o apply. Seus `triggers_replace` repetem a preparação quando mudam o volume, a imagem inicializadora ou a versão explícita do procedimento. O Kafka é substituído depois dessa nova execução, enquanto o volume protegido e seus dados são preservados.

Esse provisioner é uma exceção local e limitada. O provider Docker gerencia adequadamente containers duráveis, mas um container removido após executar deixa drift permanente no refresh; o state precisa representar a preparação concluída, não a existência do job. O comando exige que Terraform seja executado em Linux/WSL com o Docker CLI apontando para o mesmo daemon do provider. Terraform conhece o código de saída e os gatilhos, mas não inspeciona posteriormente o ownership interno do volume. Ambientes compartilhados devem usar o mecanismo nativo da plataforma, como init containers e políticas do storage driver, em vez de reproduzir este `local-exec`.

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

Antes do primeiro plano, construa as três imagens fora do Terraform. Backend e frontend possuem contextos independentes:

```bash
docker build -f applications/api/Dockerfile -t servir-api:local .
docker build -f applications/outbox-relay/Dockerfile -t servir-outbox-relay:local .
cd ../frontend
docker build -t servir-frontend:local .
```

No primeiro bootstrap, mantenha `frontend_enabled = false`, `api_enabled = false` e `outbox_relay_enabled = false`. Terraform prepara os containers e seus recursos sem iniciar processos antes de o schema e dos tópicos existirem. Depois de aplicar Liquibase e o catálogo Kafka, habilite cada workload no `terraform.tfvars`, gere um novo plano e aplique-o. O frontend exige a API habilitada.

O primeiro `terraform init` gera `.terraform.lock.hcl`, que deve ser versionado para fixar os checksums selecionados do provider. Os arquivos `.terraform/`, `terraform.tfvars`, planos e states permanecem ignorados.

Os outputs distinguem endpoints por origem:

| Consumidor           | PostgreSQL       | Kafka             | OTLP/HTTP                              | HTTP público                                                                 |
| -------------------- | ---------------- | ----------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| Processo no host/WSL | `localhost:5432` | `localhost:29092` | `http://localhost:4318/v1/traces`      | `http://localhost:3001` (BFF) / `http://localhost:3000` (API local opcional) |
| Container autorizado | `postgres:5432`  | `kafka:9092`      | `http://otel-collector:4318/v1/traces` | BFF acessa `http://api:3000` na rede `application`                           |

O bloco `172.28.0.0/24` é dividido por padrão em oito faixas `/27`; cinco formam as bridges `edge`, `application`, `data`, `messaging` e `observability`, enquanto três permanecem reservadas. Altere o bloco pai no `terraform.tfvars` antes do primeiro apply se houver sobreposição com VPN ou outra rede Docker. Gateways são derivados, containers usam DNS e IPs fixos não fazem parte do contrato.

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

Com os respectivos flags habilitados, `terraform apply` inicia containers independentes usando as imagens prontas indicadas por `frontend_image`, `api_image` e `outbox_relay_image`. CPU, memória e todo o ambiente de cada processo são fornecidos separadamente pelo `terraform.tfvars`; o módulo não possui configuração de runtime embutida. O limite total de memória mais swap é declarado como o dobro da memória de cada workload, tornando explícito o comportamento padrão do Docker e evitando drift recorrente no plano. Isso permite uma margem de swap igual à memória configurada sem reservá-la antecipadamente. As configurações locais de exemplo usam somente DNS das redes autorizadas:

Autenticação permanece desabilitada enquanto as variáveis `AUTH_*` estiverem ausentes. Para habilitá-la, o frontend BFF recebe issuer, audience, `kid` e o caminho `AUTH_PRIVATE_JWK_FILE`; a API recebe o mesmo issuer e audience e o caminho `AUTH_JWKS_FILE`, contendo somente chaves públicas. No ambiente local, Terraform monta arquivos de `.secrets/` como volumes somente leitura. Chaves reais não pertencem ao arquivo de exemplo nem ao Git. Em produção, o fluxo de deploy deve materializá-las a partir do secret store no startup, sem consulta remota por request; durante rotação, publique as chaves públicas antiga e nova na API antes de alterar o `kid` ativo no BFF.

```text
API: postgres:5432 e otel-collector:4318
Frontend BFF: api:3000
Relay: postgres:5432, kafka:9092 e otel-collector:4318
```

Valide a entrada pública pelo host:

```bash
curl --fail http://localhost:3001/health/live
```

O endpoint valida somente processo e transporte do BFF. A API possui liveness próprio na rede `application`; no ambiente local, `api_port` pode publicá-la exclusivamente em loopback para que um BFF executado no host reutilize o container existente. O navegador continua acessando somente `/bff/*`, e remover `api_port` restaura a topologia sem publicação. Para desenvolvimento do frontend com hot reload e `api_port = 3000`, execute `npm run dev:bff` e `npm run dev:web` no workspace `frontend`; não é necessário reconstruir imagens. API e relay também continuam executáveis no host por seus workspaces e arquivos `.env.example`.

O Terraform aguarda o health check do Kafka, que consulta o broker com `kafka-topics`, antes de concluir sua criação e liberar o relay dependente. Essa ordem reduz corridas no bootstrap, mas não substitui o retry do relay: Kafka pode reiniciar ou ficar temporariamente indisponível depois que ambos estiverem ativos. O KafkaJS 2.2.4 pode emitir `TimeoutNegativeWarning` no Node 24 depois de retries de conexão; o aviso nasce no agendamento interno da biblioteca, que o Node normaliza para `1 ms`, e não no intervalo de polling da outbox. Confirme pelos logs que o evento `outbox.relay.started` ocorreu e investigue erros persistentes de conexão em vez de ocultar warnings globalmente.

Mapas de ambiente marcados como sensíveis ainda são armazenados no state. As credenciais simplificadas existem apenas para desenvolvimento local. Ambientes compartilhados exigem imagens publicadas por CI, identidades separadas, permissões mínimas e integração com um gerenciador de segredos.

## Investigar traces

Collector, Jaeger e Grafana são provisionados pelo mesmo stack `local`. O Collector recebe OTLP/HTTP em `127.0.0.1:4318`, processa os spans com proteção de memória e batch e os encaminha ao Jaeger pela rede interna. Grafana consulta o Jaeger por um datasource provisionado e é a entrada principal para exploração:

```text
http://localhost:3002
```

O Jaeger continua disponível diretamente para comparação e diagnóstico:

```text
http://localhost:16686
```

Reinicie API e relay após habilitar `OTEL_SDK_DISABLED=false`. Gere uma requisição e, no **Explore** do Grafana, selecione `Servir traces`. Comece por `servir-api` ou `servir-outbox-relay`, restrinja o período e pesquise pelos nomes estáveis dos spans. Casos de uso da API carregam `servir.use_case.name`; o relay usa `outbox.relay.batch` e `outbox.message.process`, com atributos de messaging, tipo do evento e tentativa.

Consultas úteis devem começar por uma pergunta e estreitar progressivamente serviço, operação, resultado e duração. IDs podem ajudar a investigar uma execução nos traces, mas não devem virar dimensões de métricas futuras. O armazenamento do Jaeger é efêmero e será perdido quando seu container for recriado.

Esse incremento transporta somente traces. Logs continuam estruturados no stdout; métricas e exportação OTLP de logs não fazem parte deste pipeline.

## Rede e segurança local

- As bridges `edge`, `application`, `data`, `messaging` e `observability` limitam comunicação lateral por responsabilidade.
- O frontend BFF participa de `edge` e `application` e é o único workload HTTP publicado.
- A API participa de `application`, `data` e `observability`; não alcança Kafka nem publica porta.
- O relay participa de `data`, `messaging` e `observability`; não publica portas.
- PostgreSQL participa somente de `data`, e Kafka somente de `messaging`.
- PostgreSQL e Kafka publicam portas apenas em `127.0.0.1`.
- Collector, Jaeger e Grafana publicam OTLP/HTTP e UIs apenas em `127.0.0.1`.
- O listener `INTERNAL` do Kafka anuncia `kafka:9092`; o listener `EXTERNAL` anuncia `localhost:29092`.
- Frontend BFF, API e relay executam como usuário não-root, com root filesystem somente leitura, capabilities removidas e `no-new-privileges`.
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
├── otel-collector.yaml                  # pipeline local de traces
└── grafana/provisioning/                # datasource Jaeger versionado
```

Novas migrations são novos changesets imutáveis. Mudanças incompatíveis seguem expand/contract. Novos recursos persistentes entram no Terraform; operações repetíveis e descartáveis permanecem fora do state. O stack de plataforma deve ser aplicado antes do stack de mensageria.
