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

```ts
export interface IdGenerator<TId> {
  generate(): TId;
}
```

O contrato canônico reside em `@servir/application-foundation`. Cada consumidor fornece o tipo nominal exigido; aliases locais podem especializá-lo sem recriar a interface, como `LeaseIdGenerator = IdGenerator<LeaseId>`.

`SequenceIdGenerator<TId>` fornece identidades tipadas em ordem e falha com código estável quando a sequência determinística é esgotada. `UuidV7Generator<TId, TError>` usa UUIDv7 na infraestrutura e delega construção e validação à factory do ID; a fundação não converte texto para um tipo nominal por cast. Para os IDs persistidos atuais, a factory aceita UUIDs canônicos reconhecidos durante reconstituição, enquanto o generator garante UUIDv7 para novas identidades. No relay, `LeaseId` exige especificamente UUIDv7 canônico porque representa uma posse efêmera sempre criada pelo próprio worker, não uma identidade histórica.

## Relacionamento com outras primitivas

Produz o ID tipado exigido pelo consumidor; pode ser usado por factory/caso de uso, não necessariamente armazenado na Entity. A factory do ID concreto continua responsável por validar formato e normalização.

## Possíveis evoluções

Definir geração em lote e políticas específicas por bounded context. UUIDv7 é o padrão inicial para identidades persistidas, não uma exigência universal.

## Boas práticas

- Esconder o formato atrás de tipo nominal.
- Testar unicidade/formato no adapter e comportamento com gerador determinístico.
- Não usar a ordenação ou o timestamp aproximado do UUIDv7 como substituto de `Instant` ou regra de negócio.

## Anti-patterns

- Classe base de Entity importando biblioteca UUID.
- `string` intercambiável entre todos os IDs.
- Gerador com acesso implícito a contexto global.
