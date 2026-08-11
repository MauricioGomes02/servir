# Validação de entrada e normalização

## Motivação

Reduzir ciclos de correção na API e impedir que pequenas diferenças de representação criem identidades ou nomes inesperadamente distintos.

## Validações independentes

Handlers validam todas as entradas estruturais independentes antes de consultar Readers, Repositories ou iniciar uma Unit of Work. `combineValidationResults` usa `Notification` para acumular violações e devolve uma coleção imutável em ordem de entrada. O primeiro erro permanece disponível como erro primário para compatibilidade; Presenters traduzem a coleção completa e Problem Details a expõe em `errors`.

Exemplos de validações independentes são os formatos de `organizationId`, `ministryId`, `memberId` e `name` recebidos pelo mesmo Command. Ausência de Aggregate, conflito de unicidade, elegibilidade e transição de estado são decisões dependentes e permanecem fail-fast.

Não se consulta persistência quando qualquer entrada estrutural é inválida. Também não se acumulam regras cuja avaliação dependa de uma pré-condição que falhou.

## IDs

IDs recebidos na borda são textos desconhecidos e seguem a mesma ordem de validação:

1. tipo textual;
2. conteúdo não vazio depois de `trim`;
3. máximo de 128 caracteres;
4. UUID canônico de versão reconhecida.

Valores válidos são armazenados em minúsculas. Cada conceito mantém códigos próprios para `invalid_type`, `empty`, `too_long` e `invalid_format`. `validateEntityId` centraliza a mecânica, sem substituir os tipos nominais.

## Nomes

Nomes usam `normalizeName`, que aplica:

1. normalização Unicode NFC;
2. remoção de whitespace nas extremidades;
3. compactação de sequências internas de whitespace para um espaço.

Caixa e acentos são preservados na representação. Comparações de unicidade ignoram caixa conforme a regra do Aggregate, mas não removem acentos. Normalizações destrutivas, transliteração e alteração automática de capitalização são proibidas sem uma decisão específica do domínio.

## Limites

- Normalização não substitui validação.
- Dados técnicos, segredos e conteúdo livre não usam automaticamente a regra de nomes.
- Falhas técnicas não entram em `Notification`.
- Uma Policy não recebe valores parcialmente válidos.

## Testes esperados

- múltiplas entradas inválidas são retornadas juntas;
- nenhum I/O ocorre quando a validação estrutural falha;
- valores válidos preservam ordem e tipos;
- nomes Unicode equivalentes produzem a mesma representação NFC;
- caixa e acentos permanecem intactos;
- cada classe inválida de ID mantém código e campo estáveis.
