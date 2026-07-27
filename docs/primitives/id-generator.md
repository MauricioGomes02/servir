# Id Generator

## Motivação

Desacoplar criação de identidade de UUID ou qualquer algoritmo específico.

## Problema que resolve

IDs gerados diretamente por entidades dificultam testes, migração de formato e controle de compatibilidade.

## Responsabilidades

- Gerar identificadores válidos para um contrato.
- Permitir implementações UUID, ULID, Snowflake ou determinísticas.
- Preservar tipo nominal no domínio.

## O que não faz

- Não valida identidade recebida; essa responsabilidade pertence ao tipo de ID/factory.
- Não persiste nem reserva IDs sem contrato explícito.
- Não decide estratégia universal para todos os domínios.

## Fluxo

```mermaid
flowchart LR
    A[Application/Factory] --> G[Id Generator Port]
    G --> I[EntityId tipado]
    I --> E[Entity]
```

## Exemplos

`OrganizationIdGenerator.generate()` pode usar UUID v7 no adapter e sequência fixa em testes.

## Relacionamento com outras primitivas

Produz EntityId; pode ser usado por factory/caso de uso, não necessariamente armazenado na Entity.

## Possíveis evoluções

Definir geração em lote, IDs ordenáveis e políticas por bounded context.

## Boas práticas

- Esconder o formato atrás de tipo nominal.
- Testar unicidade/formato no adapter e comportamento com gerador determinístico.

## Anti-patterns

- Classe base de Entity importando biblioteca UUID.
- `string` intercambiável entre todos os IDs.
- Gerador com acesso implícito a contexto global.
