# Roadmap da Fundação

## Motivação

Controlar dependências entre conceitos e impedir que implementação prematura cristalize contratos frágeis.

## Problema que resolve

Primitivas construídas fora de ordem tendem a duplicar responsabilidades ou depender de conceitos ainda indefinidos.

## Responsabilidades

- Tornar a sequência e os critérios de conclusão explícitos.
- Registrar o estado real sem confundir código existente com contrato estabilizado.

## O que não faz

- Não é cronograma.
- Não garante estabilidade sem revisão e testes.

## Fluxo e etapas

```mermaid
flowchart TD
    D[Documentação e vocabulário] --> R[Result]
    R --> N[Notification]
    N --> I[Instant]
    I --> DE[Domain Event]
    DE --> M[Message Envelope]
    M --> EB[Event Bus]
    EB --> AR[Aggregate Root]
    AR --> E[Entity]
    E --> VO[Value Object]
    VO --> C[Context]
    C --> L[Logger]
    L --> CL[Clock]
    CL --> ID[Id Generator]
    ID --> U[Unit of Work]
    U --> UC[Casos de uso]
    UC -. define quando necessário .-> S[Specifications]
    S -. pode compor .-> P[Policies]
    UC -. define quando necessário .-> P
    UC -. define por consumidor .-> RC[Repository Ports específicos]
    UC --> PL[Apresentação e localização de erros]
    PL --> TP[Apresentação temporal e datas civis]
```

| Etapa | Estado | Critério de saída |
|---|---|---|
| Vocabulário e documentação | Em andamento | Links, ADRs e contratos revisados |
| Result | Implementação inicial | Semântica e testes estabilizados |
| Notification | Implementação inicial | Acúmulo, imutabilidade e testes decididos |
| Instant | Implementação inicial | UTC, imutabilidade, igualdade e serialização testadas |
| Domain Event | Implementação inicial | Identidade, instante, imutabilidade e testes definidos |
| Message Envelope | Implementação inicial | Identidade, correlação, causalidade e imutabilidade testadas |
| Event Bus | Implementação inicial | Ports, concorrência, falhas e subscriptions testados |
| Aggregate Root | Implementação inicial | Registro, snapshot, ordem e confirmação seletiva testados |
| Entity | Implementação inicial | Identidade, igualdade e construção testadas |
| Value Object | Implementação inicial | Imutabilidade e igualdade testadas |
| Specification e Policy | Diretrizes definidas | Tipos concretos são criados quando regras consumidoras demonstrarem reuso ou decisão contextual |
| Context | Implementação inicial | IDs fortes, imutabilidade e testes definidos |
| Logger | Implementação inicial | Registro, contexto, imutabilidade e adapter de teste definidos |
| Clock | Implementação inicial | Port, SystemClock, FixedClock e testes definidos |
| Id Generator | Implementação inicial | Port tipado, sequência determinística, esgotamento e desacoplamento de EntityId testados |
| Repository | Diretriz definida | Ports específicos são criados com o primeiro caso de uso, sem contrato genérico compartilhado |
| Unit of Work | Implementação inicial | Port com escopo tipado, adapter direto e confirmação seletiva de eventos testados; adapter transacional permanece planejado |
| Primeiro corte vertical | Implementação inicial | CreateOrganization persiste Organization e EventEnvelope pelo mesmo Unit of Work; adapters tecnológicos permanecem planejados |
| Apresentação e localização de erros | Implementação inicial | Locale e fallback, port de tradução, adapter em memória, erro apresentado e primeiro Presenter estão definidos; negociação pelo transporte e fronteira de falhas técnicas permanecem planejadas |
| Apresentação temporal e datas civis | Planejado | API preserva `Instant` UTC; apresentação converte com locale e timezone IANA; agendamentos modelam data civil, horário civil e zona separadamente; precedência entre timezone da operação, usuário, organização e aplicação permanece por definir com o primeiro consumidor |

## Exemplos

Uma implementação existente pode permanecer “inicial” até que sua API e invariantes tenham testes de contrato.

## Relacionamento com outras primitivas

A ordem expressa dependências conceituais, não herança ou dependência obrigatória de código.

## Possíveis evoluções

Adicionar critérios mensuráveis, versões da fundação e marcos por bounded context.

## Boas práticas

- Atualizar estado e documentação na mesma mudança.
- Não marcar concluído apenas porque existe código.

## Anti-patterns

- Iniciar infraestrutura para “validar” um contrato ainda indefinido.
- Expandir escopo silenciosamente.
