# ADR 030 — Roteamento de publicação definido pela mensagem

- Estado: aceita
- Data: 2026-08-04
- Refina: [ADR 024](024-kafka-durable-outbox-relay.md) e [ADR 026](026-kafka-cloudevents-publication.md)

## Contexto

O primeiro relay publicava todas as mensagens num tópico global configurado por `KAFKA_TOPIC`, com source e prefixo CloudEvents fixos em Organizations. A introdução de `MemberRegisteredIntegrationEventV1` faria um fato de Membership ser publicado no tópico e com a identidade pública de Organizations.

Executar um relay por tópico exigiria filtrar claims por destino e multiplicaria processos sem necessidade operacional demonstrada.

## Decisão

Cada Integration Event define `channel`, `source` e `type` completos. O adapter PostgreSQL persiste esses campos atomicamente com a mensagem. O relay valida e reconstitui a rota, e o publisher Kafka traduz `channel` para tópico sem manter uma configuração global de destino.

`organization.created` usa `servir.organizations.events`; `member.registered` usa `servir.membership.events`. Terraform mantém ownership de ambos os tópicos. A migration faz backfill explícito apenas dos eventos históricos reconhecidos e interrompe a atualização caso encontre um nome desconhecido.

As colunas de rota não possuem defaults. Todo novo registro deve persistir `channel`, `source` e `type`; assim, a ausência de tradução falha na fronteira transacional em vez de publicar silenciosamente no contexto errado.

O `type` público segue `servir.<bounded-context>.<fato>.v<versão>`, como em `servir.membership.member.registered.v1`. O prefixo `com.` não é usado porque a convenção reverse-DNS só comunica ownership quando o namespace deriva de um domínio DNS efetivamente controlado pelo projeto. Essa escolha não altera o nome interno do Domain Event nem o `source` do CloudEvent.

## Consequências

Um único relay processa mensagens de vários bounded contexts sem inferir destino por nome nem conhecer módulos da API. O destino passa a integrar a representação durável e versionada da publicação; mudanças de canal para mensagens futuras exigem mapper e infraestrutura compatíveis.

O termo `channel` preserva o contrato compartilhado independente de Kafka. O adapter tecnológico decide como materializar esse canal. Source e type não são reconstruídos no relay, evitando divergência entre produtor e publicação.

## Alternativas

Manter um tópico global foi rejeitado por misturar bounded contexts. Configurar tabelas de roteamento no relay foi rejeitado por duplicar conhecimento dos contratos. Um relay por tópico foi adiado porque aumenta implantação e exige claims filtrados sem benefício atual.
