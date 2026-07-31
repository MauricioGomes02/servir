# ADR 028: Ownership dos tópicos Kafka por Terraform

## Contexto

O ADR 027 atribuiu ao Terraform os recursos persistentes da plataforma local, mas manteve a criação idempotente de tópicos Kafka em um job de CLI executado pelo Compose. Embora repetível, esse comando não mantinha estado desejado, não apresentava drift no plano e dividia o ownership da mensageria entre mecanismos diferentes.

O provider Kafka precisa alcançar um broker já iniciado para administrar seus recursos. Colocar broker e tópicos no mesmo state criaria uma dependência de bootstrap entre a infraestrutura que disponibiliza o endpoint e o provider que precisa usá-lo.

Liquibase tem natureza diferente: changesets representam uma sequência ordenada de transições do schema, e não um recurso persistente reconciliado por Terraform.

## Decisão

Terraform passa a administrar os tópicos Kafka em um stack `local-messaging`, separado do stack `local` que cria rede, volumes, PostgreSQL e broker Kafka.

A ordem operacional é:

1. aplicar `environments/local` para disponibilizar o broker;
2. aplicar `environments/local-messaging` para reconciliar o catálogo versionado de tópicos;
3. executar Liquibase explicitamente pelo Compose quando houver migrations pendentes.

O tópico `servir.organizations.events` possui três partições e replication factor 1 no ambiente local. Os tópicos têm proteção contra destruição acidental no lifecycle do Terraform. Alterações destrutivas exigem decisão explícita e revisão do plano.

O Compose deixa de administrar tópicos e permanece responsável somente por jobs operacionais descartáveis, atualmente Liquibase.

Esta decisão substitui apenas a atribuição da criação de tópicos ao Compose definida no ADR 027. As demais decisões do ADR 027 permanecem válidas.

## Consequências

- Tópicos passam a ter ownership, plano, drift e configuração declarativa explícitos.
- Plataforma e mensageria possuem states e lockfiles independentes.
- O broker precisa estar saudável e acessível em `localhost:29092` antes de planejar ou aplicar o stack de mensageria.
- A remoção intencional de tópicos exige retirar temporariamente a proteção, revisar o plano e reconhecer a perda potencial de mensagens.
- A versão da imagem do broker não é confundida com uma exigência de versão de protocolo do provider; a compatibilidade de protocolo é negociada pelo adapter.
- Liquibase continua fora do state e das aplicações, preservando o histórico ordenado de migrations como responsabilidade operacional explícita.

## Alternativas consideradas

- Manter `kafka-topics --if-not-exists` no Compose: simples, mas sem detecção de drift ou lifecycle declarativo.
- Administrar broker e tópicos no mesmo stack: reduz diretórios, mas mistura ciclos de vida e cria uma dependência de bootstrap do provider.
- Executar Liquibase por `null_resource` ou provisioner: ocultaria transições de schema dentro do lifecycle de infraestrutura e tornaria falhas e reexecuções menos claras.
