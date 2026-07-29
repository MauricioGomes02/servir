# Estratégia de testes

## Motivação

Usar testes como especificações executáveis e selecionar casos sistematicamente, sem depender apenas do caminho feliz ou da intuição sobre a implementação.

## Idioma e nomeação

Suites, casos, helpers e fixtures de teste são nomeados em inglês, acompanhando o código e o vocabulário ubíquo. O nome descreve comportamento observável, não a técnica aplicada nem um detalhe de implementação.

```ts
describe('OrganizationName', () => {
  it('accepts a name with exactly 120 characters', () => {});
  it('rejects a name longer than 120 characters', () => {});
});
```

Prefixos como `[BVA]` ou `[BASIC_PATH]` são evitados: valores e asserções devem evidenciar a técnica sem ocultar o comportamento.

## Técnicas de seleção de casos

O projeto aplica as técnicas complementares abaixo, adaptadas das orientações de teste de software apresentadas por Pressman.

### Teste de caminho básico

- Identificar caminhos logicamente independentes na unidade sob teste.
- Exercitar os resultados observáveis de cada caminho relevante, incluindo falhas e retornos antecipados.
- Usar complexidade ciclomática como sinal de design. Valor acima de 10 exige revisão para possível refatoração; não representa reprovação automática nem quantidade-alvo de casos.
- Não testar ramos privados diretamente quando o contrato público puder expressar o mesmo comportamento.

### Teste de condição

- Exercitar resultados verdadeiros e falsos relevantes de condições simples e compostas.
- Cobrir combinações relevantes de `AND`, `OR`, negação e curto-circuito.
- Preferir nomear uma condição complexa de negócio como Specification ou Policy em vez de repetir tabelas-verdade entre consumidores.

### Teste de fluxo de dados

- Verificar como entradas, estado e saídas percorrem contratos observáveis.
- Assegurar ausência de mudança de estado, persistência ou emissão de eventos após uma operação rejeitada.
- Usar TypeScript e análise estática para variáveis não inicializadas, não utilizadas ou inalcançáveis; não criar testes de execução para defeitos que o compilador pode provar.

### Partição de equivalência

- Dividir entradas em classes que devem apresentar comportamento equivalente.
- Selecionar um representante de cada classe válida e inválida relevante.
- Adicionar representantes apenas quando protegerem regra ou regressão distinta.

### Análise de valor limite

- Exercitar os limites exatos e os valores significativos imediatamente abaixo e acima.
- Cobrir tamanho de coleções, comprimento de texto, intervalos numéricos, fronteiras temporais e limites de paginação quando aplicável.
- Evitar valores artificiais quando o domínio não possuir uma fronteira ordenada.

### Estado, invariantes e contratos

- Cobrir transições de estado válidas e rejeitadas.
- Verificar invariantes, imutabilidade e ausência de efeitos parciais após falhas.
- Exercitar ports com suites de contrato reutilizáveis quando múltiplos adapters implementarem o mesmo comportamento.
- Testar adapters por sua borda pública sem vazar detalhes de framework, banco ou SDK para os testes do núcleo.

## Estrutura dos testes

- Preparar apenas o estado relevante ao comportamento.
- Agir por um contrato público.
- Verificar o resultado e cada efeito material, inclusive efeitos proibidos.
- Controlar tempo, identidade, aleatoriedade, rede e concorrência para manter determinismo.
- Preferir fakes e adapters determinísticos a mocks abrangentes.
- Usar casos parametrizados quando o mesmo comportamento se aplicar a uma classe de equivalência ou tabela de limites.

## Checklist de revisão

- O nome é uma declaração de comportamento em inglês?
- Partições válidas, inválidas e limites estão representados?
- Caminhos independentes de sucesso, falha e retorno antecipado estão cobertos?
- Condições compostas foram exercitadas em seus resultados relevantes?
- Uma falha preserva a consistência de estado, persistência e eventos pendentes?
- Tempo, identidade, concorrência e efeitos externos são determinísticos?
- Complexidade acima de 10 ficaria mais clara após refatoração?
- O teste protege um contrato público em vez de reproduzir código privado?

## Anti-patterns

- Traduzir cada linha do código em uma asserção.
- Perseguir 100% de cobertura sem motivo comportamental.
- Criar um teste por ramo interno e deixar invariantes sem proteção.
- Nomear testes pela técnica em vez do comportamento.
- Esconder vários comportamentos não relacionados no mesmo caso.
- Usar tempo, IDs aleatórios, rede ou serviços externos reais em testes unitários.
