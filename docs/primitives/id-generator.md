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

`SequenceIdGenerator<TId>` fornece identidades tipadas em ordem e falha com código estável quando a sequência determinística é esgotada. Um adapter UUID concreto permanece associado à factory do ID de seu domínio; a fundação não converte texto para um tipo nominal por cast.

## Relacionamento com outras primitivas

Produz o ID tipado exigido pelo consumidor; pode ser usado por factory/caso de uso, não necessariamente armazenado na Entity. A factory do ID concreto continua responsável por validar formato e normalização.

## Possíveis evoluções

Definir geração em lote, IDs ordenáveis e políticas por bounded context.

## Boas práticas

- Esconder o formato atrás de tipo nominal.
- Testar unicidade/formato no adapter e comportamento com gerador determinístico.

## Anti-patterns

- Classe base de Entity importando biblioteca UUID.
- `string` intercambiável entre todos os IDs.
- Gerador com acesso implícito a contexto global.
