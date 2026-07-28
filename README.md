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
├── backend/src/        # Código da fundação e, futuramente, dos domínios
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

Há implementações iniciais das primitivas centrais de domínio, mensagens, contexto, logging, tempo, identidade e Unit of Work. Repository, Specification e Policy permanecem orientados pelos primeiros consumidores concretos. A documentação descreve o contrato desejado; divergências devem ser resolvidas por testes e ADRs antes de expandir a API pública.
