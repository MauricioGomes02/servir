# Arquitetura

## Motivação

Construir uma linguagem arquitetural estável que permita compor aplicações diferentes sobre o mesmo núcleo.

## Problema que resolve

Aplicações crescem com acoplamento quando domínio, orquestração e detalhes técnicos compartilham responsabilidades. A arquitetura define limites e contratos antes que frameworks imponham seu modelo.

## Responsabilidades

- Definir camadas conceituais, direção das dependências e formas de comunicação.
- Preservar invariantes no domínio.
- Separar fatos, decisões, orquestração e efeitos colaterais.
- Tornar infraestrutura substituível.

## O que não faz

- Não prescreve framework, banco, protocolo ou topologia de implantação.
- Não transforma toda função em abstração.
- Não autoriza casos de uso antes da fundação.

## Fluxo

```mermaid
flowchart LR
    D[Domínio] -->|Domain Events| A[Application]
    A -->|Ports| I[Adaptadores]
    I --> X[(Banco / Fila / HTTP / Cloud)]
    X -. dados .-> I
    I -. contratos .-> A
```

Dependências de código apontam para dentro: adaptadores conhecem contratos da aplicação e do domínio; o domínio não conhece adaptadores.

## Exemplos

- Um agregado registra `OrderCreated`; um publicador externo encaminha o evento.
- Um caso de uso depende de `Clock` e `Repository`, nunca de `Date` ou ORM.

## Relacionamento com outras primitivas

`Result` e `Notification` representam resultados esperados; entidades, agregados e value objects modelam estado; eventos comunicam fatos; ports como `Clock`, `Logger` e `Repository` isolam efeitos.

## Possíveis evoluções

Definir contratos de aplicação, envelopes de mensagem, consistência transacional e fronteiras entre bounded contexts após estabilizar a fundação.

## Boas práticas

- Fazer contratos pequenos e orientados à necessidade do consumidor.
- Registrar decisões irreversíveis ou transversais em ADR.
- Manter eventos no passado e políticas como decisões explícitas.

## Anti-patterns

- Domínio importando ORM, HTTP, filas ou SDKs.
- “Shared” como depósito de utilitários sem semântica.
- Interfaces criadas apenas para espelhar classes concretas.
