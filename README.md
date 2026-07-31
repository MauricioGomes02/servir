# Servir

Fundação arquitetural para aplicações orientadas a domínio, composição e contratos explícitos. O primeiro domínio consumidor será a gestão de escalas e equipes ministeriais, mas as primitivas devem permanecer reutilizáveis e independentes de framework.

> Status: fundação com implementações iniciais. O primeiro corte vertical de caso de uso está liberado para validar os contratos; APIs e adapters tecnológicos entram somente conforme necessidades concretas.

## Índice

- [Visão geral](docs/architecture.md)
- [Filosofia e princípios](docs/philosophy.md)
- [Roadmap](docs/roadmap.md)
- [Vocabulário ubíquo](docs/glossary.md)
- [Primitivas arquiteturais](docs/primitives/README.md)
- [Decisões arquiteturais](docs/decisions/README.md)
- [Estratégia de testes](docs/testing-strategy.md)
- [Relay durável de outbox](docs/outbox-relay.md)
- [Infraestrutura local e migrations](infrastructure/README.md)
- [Exemplos conceituais](docs/examples/README.md)
- [Como contribuir](#como-contribuir)

## Princípios

- Modelar antes de implementar.
- Manter o domínio independente de frameworks e infraestrutura.
- Preferir composição, imutabilidade, tipos fortes e contratos explícitos.
- Tratar falhas esperadas como valores, não como exceções.
- Comunicar fatos por mensagens sem acoplar produtores e consumidores.
- Fazer cada abstração justificar uma responsabilidade indivisível.

## Estrutura do projeto

```text
.
├── .codex/skills/      # Guardrails para futuras contribuições assistidas
├── backend/
│   ├── applications/
│   │   ├── api/        # API HTTP e seu composition root
│   │   └── outbox-relay/ # Processamento independente da outbox
│   └── packages/
│       └── integration-messaging/ # Contrato serializável compartilhado
├── frontend/           # Aplicações de apresentação web
├── infrastructure/     # Banco local, migrations e futura IaC
└── docs/
    ├── decisions/      # Architecture Decision Records
    ├── examples/       # Exemplos conceituais, não aplicações completas
    └── primitives/     # Contratos das primitivas arquiteturais
```

## Roadmap resumido

1. Consolidar vocabulário e decisões.
2. Especificar relações entre primitivas.
3. Implementar e testar cada primitiva na ordem definida no [roadmap](docs/roadmap.md).
4. Validar a fundação com cortes verticais e introduzir somente os ports e adapters exigidos por consumidores reais.

## Como contribuir

1. Consulte o [glossário](docs/glossary.md) antes de nomear um conceito.
2. Confirme a etapa ativa no [roadmap](docs/roadmap.md).
3. Registre decisões com impacto duradouro em um ADR.
4. Atualize documentação, diagramas e testes junto com o código.
5. Não introduza dependências de transporte, persistência ou framework no domínio.

## Estado atual

Há implementações iniciais das primitivas centrais de domínio, mensagens, contexto, logging, localização de erros, tempo, identidade e Unit of Work. O primeiro corte vertical possui composição executável, rota HTTP, log estruturado final, tracing semântico do caso de uso e persistência atômica de Organization + outbox em memória ou PostgreSQL. No modo PostgreSQL, `OrganizationCreated` é traduzido explicitamente para um Integration Event v1 antes da persistência. A aplicação `outbox-relay` possui processamento de lote, storage PostgreSQL, retry com jitter, publisher Kafka/CloudEvents, W3C Trace Context e processo contínuo com encerramento seguro. O contrato serializável compartilhado limita-se a Integration Events e valores JSON. PostgreSQL local, Liquibase e o schema inicial são externos às aplicações. Repository, Specification e Policy permanecem orientados pelos primeiros consumidores concretos.

## Executar a API localmente

O backend usa npm workspaces. A API usa o suporte nativo do Node para carregar `backend/applications/api/.env` quando o arquivo existir. Copie `backend/applications/api/.env.example` para personalizar o ambiente local; o `.env` não é versionado e não substitui as variáveis fornecidas pela plataforma em produção.

```bash
cd backend
npm install
npm run dev:api
```

O exemplo mantém o OpenTelemetry desabilitado enquanto não houver um collector local. Para exportar traces, configure `OTEL_SDK_DISABLED=false` e mantenha `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` apontando para o endpoint OTLP/protobuf do collector.
