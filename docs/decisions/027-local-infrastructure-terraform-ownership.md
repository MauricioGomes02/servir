# ADR 027 — Ownership da infraestrutura local por Terraform

- Estado: aceita
- Data: 2026-07-31

## Contexto

PostgreSQL e Liquibase eram administrados pelo mesmo arquivo Compose, e Kafka ainda não possuía ambiente local. A introdução de IaC não pode fazer Terraform e Compose disputarem containers, redes ou volumes, pois dois reconciliadores sobre o mesmo recurso gerariam drift e destruições imprevisíveis.

## Decisão

Terraform será a fonte de verdade dos recursos Docker persistentes do ambiente local: rede bridge, volumes, imagens e containers PostgreSQL/Kafka. O módulo `local-platform` descreve esses recursos e o environment `local` define versões, entradas e outputs. O provider `kreuzwerker/docker` será fixado por versão e o state permanecerá local e não versionado.

Compose será limitado a jobs operacionais descartáveis. Liquibase aplica migrations explicitamente e `kafka-topics` cria ou verifica tópicos. Esses jobs ingressam na rede externa criada pelo Terraform, mas não administram seu ciclo de vida. API e relay não executam migrations nem criam tópicos no startup.

A rede `servir-platform` usa bridge e IPAM explícito, sem endereços fixos por container. Containers se descobrem pelos aliases DNS `postgres` e `kafka`. Portas para processos executados no host são publicadas somente em `127.0.0.1`; Kafka anuncia listeners diferentes para a rede Docker e para o host.

O Kafka local usa um único nó KRaft combinado, adequado ao desenvolvimento, com replication factor 1. `servir.organizations.events` possui três partições para exercitar a chave por Organization. Autocriação de tópicos permanece desabilitada.

Volumes PostgreSQL e Kafka usam `prevent_destroy`. Consequentemente, um `terraform destroy` completo é deliberadamente bloqueado enquanto a proteção existir. Apagar dados exige revisar/remover temporariamente a proteção e executar um plano explícito; remover o bloco da configuração não deve ser usado como atalho, pois `prevent_destroy` não protege um recurso cuja configuração foi removida.

## Consequências

Ownership e dependências tornam-se inspecionáveis no plano do Terraform. A rede definida pelo usuário oferece DNS e isolamento em relação à bridge padrão, enquanto os endpoints de host continuam adequados às aplicações ainda não containerizadas.

O environment local mantém state em texto claro e usa credenciais simplificadas, portanto não representa produção. Ambientes compartilhados exigirão backend de state protegido, gestão de segredos, identidades de runtime, TLS/SASL, múltiplos brokers e segmentação de rede própria.

Operadores precisam executar `terraform apply` antes dos jobs Compose. A subnet padrão pode colidir com VPNs ou outras redes Docker e, nesse caso, deve ser alterada por `terraform.tfvars` antes da criação.

## Alternativas consideradas

Manter todos os recursos no Compose foi rejeitado por não introduzir estado, plano e ownership declarativo de IaC. Dividir o mesmo container entre Terraform e Compose foi rejeitado por criar dupla propriedade. Executar Liquibase e criação de tópicos com provisioners Terraform foi rejeitado porque são operações explícitas e repetíveis, não recursos persistentes. Criar três brokers ou múltiplas redes sem aplicações containerizadas foi adiado por adicionar custo sem um limite consumidor concreto.
