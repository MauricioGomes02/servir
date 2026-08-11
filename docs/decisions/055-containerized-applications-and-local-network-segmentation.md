# 055. Aplicações containerizadas e segmentação da rede local

## Status

Aceita.

## Contexto

A API e o outbox relay eram executados apenas como processos no host, enquanto PostgreSQL, Kafka e observabilidade já pertenciam ao Terraform local. Uma única bridge permitia comunicação lateral entre todos os containers e não representava os limites necessários para o futuro frontend.

As duas aplicações possuem demandas diferentes de capacidade, disponibilidade e escala. Build de artefatos, provisionamento de infraestrutura e promoção de versões também são ciclos distintos e não devem depender uns dos outros.

## Decisão

API e outbox relay possuem Dockerfiles multi-stage e imagens OCI independentes. Cada artefato possui instalação de produção, runtime e comando próprios, permitindo versionamento, deploy, recursos e escala distintos. As imagens fixam a versão base do Node, instalam dependências por `npm ci`, executam como usuário não-root e não contêm código de teste ou toolchain TypeScript.

Terraform administra a infraestrutura de execução das duas aplicações, incluindo serviços ou containers, conectividade, capacidade, segurança, portas e sondas. Ele não compila fontes nem conhece caminhos de Dockerfile. Build, análise e publicação pertencem ao pipeline de entrega; Terraform recebe referências das imagens prontas, usando tags locais no ambiente de desenvolvimento e preferencialmente digests imutáveis de registry em ambientes compartilhados.

Configuração de runtime pertence à composition root de cada ambiente. O módulo recebe mapas separados para API e relay, sem incorporar URLs, credenciais, nomes de serviço ou flags da aplicação. No ambiente local esses valores são declarados por `terraform.tfvars`; ambientes compartilhados devem integrar sua fonte de configuração e segredos sem versionar valores sensíveis.

O primeiro bootstrap mantém `api_enabled` e `outbox_relay_enabled` falsos: Terraform prepara a plataforma e os containers sem iniciar aplicações antes do schema e dos tópicos existirem. Liquibase e o catálogo Kafka são aplicados explicitamente; um plano posterior habilita cada workload de forma independente.

O bloco `network_subnet` é uma reserva pai dividida deterministicamente em quatro bridges:

- `edge`: API e futuro frontend;
- `data`: API, relay, PostgreSQL e jobs operacionais de banco;
- `messaging`: relay e Kafka;
- `observability`: API, relay, Collector e Jaeger.

Cada serviço conecta-se somente às redes exigidas por suas dependências. PostgreSQL, Kafka e OTLP continuam publicados apenas em loopback para ferramentas do host; a API publica sua porta HTTP em loopback. O relay não publica portas.

A API oferece `GET /health/live`, uma sonda de processo e transporte que não consulta dependências externas. Readiness de banco não é antecipada. O relay é supervisionado pela continuidade de seu processo e pela política de restart; uma sonda semântica futura deverá medir progresso da outbox.

## Consequências

- API e relay podem evoluir, receber recursos e escalar independentemente.
- O ambiente integrado executa os mesmos artefatos isolados que serão promovidos futuramente.
- O pipeline de build não depende do state ou da execução do Terraform.
- API não alcança Kafka, frontend não alcançará dados ou mensageria e PostgreSQL não compartilha bridge com Kafka.
- Liquibase usa somente a rede `data` e permanece um job descartável fora do state.
- Um ambiente novo habilita cada aplicação somente depois de suas dependências operacionais.
- Mapas sensíveis ainda são armazenados no state local; isso continua inadequado para segredos de ambientes compartilhados.
- A divisão do `/24` padrão produz quatro redes `/26`; alterar o bloco pai substitui as bridges e seus containers conectados.

## Alternativas consideradas

- Um Dockerfile multi-target compartilhado: rejeitado porque une a evolução de artefatos com necessidades operacionais distintas; a pequena duplicação declarativa é preferível ao acoplamento de build.
- Build de imagens pelo Terraform: rejeitado porque mistura a produção do artefato com o provisionamento e impede promoção independente.
- Remover os workloads do Terraform: rejeitado porque CPU, memória, redes, políticas e escala pertencem à infraestrutura, mesmo quando a promoção da imagem ocorre em outro fluxo.
- Uma única bridge para todos os serviços: rejeitada por permitir comunicação lateral desnecessária.
- Endereços IP fixos: rejeitados porque aliases DNS são o contrato e IPs aumentariam acoplamento operacional.
- Readiness que consulta o banco: adiada até existir política explícita para timeout, degradação e exposição segura.
