# Uso eficiente do Codex

Este documento orienta desenvolvedores que usam Codex no Servir. Ele explica como escolher o contexto, a conversa, a skill, o modelo e a validação adequados. Não substitui as regras operacionais do [`AGENTS.md`](../AGENTS.md), a documentação arquitetural ou os ADRs.

## Onde cada informação vive

| Local | Responsabilidade | Carregamento esperado |
| --- | --- | --- |
| [`AGENTS.md`](../AGENTS.md) | Regras gerais de trabalho, limites e comandos essenciais | Sempre relevante |
| [`.codex/skills/`](../.codex/skills/) | Procedimentos e conhecimento especializado por domínio | Somente quando a tarefa exigir |
| `agents/openai.yaml` dentro de uma skill | Metadados de exibição e prompt padrão da skill | Interface, não fonte de regras |
| `docs/` | Conhecimento detalhado para pessoas e agentes | Conforme o assunto |
| [`docs/decisions/`](decisions/) | Motivações, alternativas e consequências de decisões duradouras | Quando a decisão for afetada |
| Conversa atual | Bug, hipótese, arquivos investigados e resultados temporários | Enquanto a linha de trabalho durar |

Uma regra operacional deve ter uma fonte principal. Não copie o mesmo conteúdo entre `AGENTS.md`, skills, documentação e ADRs.

## Antes de iniciar uma tarefa

Defina o mínimo necessário:

```text
Domínio:
Objetivo:
Escopo:
Arquivos ou diretórios prováveis:
Critério de conclusão:
```

Comece pelo diretório indicado e siga referências somente quando necessário. Não peça uma análise do repositório inteiro para uma alteração localizada.

### Exemplo simples

```text
Domínio: backend/application
Objetivo: adicionar um teste unitário para uma falha já identificada
Escopo: caso de uso e sua suíte de testes
Arquivos prováveis: backend/applications/api/src/...
Critério de conclusão: teste passa e nenhum arquivo não relacionado é alterado
```

### Exemplo de investigação

```text
Domínio: observabilidade
Objetivo: descobrir por que um span HTTP não aparece no trace
Escopo: adapter HTTP, composição OpenTelemetry e testes relacionados; não alterar ainda
Arquivos prováveis: backend/applications/api/, backend/packages/node-observability/, docs/observability.md
Critério de conclusão: causa, dependências e próximo passo documentados
```

### Exemplo de arquitetura

```text
Domínio: arquitetura
Objetivo: avaliar onde deve viver um novo port
Escopo: limites Application, domínio e adapter do fluxo afetado
Arquivos prováveis: documentação da arquitetura, ADRs relacionados e módulos do fluxo
Critério de conclusão: alternativas, dependências, riscos e decisão recomendada revisados antes de codificar
```

## Como escolher a conversa

Uma conversa representa uma linha de trabalho, não necessariamente uma única alteração.

Continue a conversa quando o domínio, as decisões e o objetivo continuam relacionados. Por exemplo, `Servir — Observabilidade` pode conter a investigação dos traces, ajustes de spans, testes e revisão final.

Inicie outra conversa quando mudar o domínio ou o objetivo principal. Exemplos:

- `Servir — Observabilidade`
- `Servir — Infraestrutura`
- `Servir — Arquitetura`
- `Servir — Segurança`
- `Servir — Feature X`

Evite tanto uma conversa única para assuntos independentes quanto uma conversa nova para cada renomeação, teste ou correção trivial da mesma iniciativa.

## Processo proporcional

Para tarefas pequenas, informe o escopo e implemente diretamente. Para alterações grandes ou incertas, use:

```text
ANALYZE → PLAN → IMPLEMENT → TEST → REVIEW
```

Durante `ANALYZE`, não altere arquivos: localize o código, dependências e riscos. Durante `PLAN`, defina arquivos, mudanças e testes. Durante `IMPLEMENT`, altere somente o necessário. Em `TEST`, execute validações relevantes. Em `REVIEW`, revise o diff, os arquivos modificados e possíveis regressões.

O contexto temporário da tarefa deve permanecer na conversa. Promova uma descoberta para documentação, skill ou ADR somente quando ela se tornar conhecimento permanente e houver uma fonte adequada para ela.

## Skills

As skills existentes são especializadas e devem ser acionadas conforme o assunto:

- `architecture`: limites, dependências, ports/adapters e decisões transversais;
- `aggregate`, `entity` e `value-object`: modelagem e invariantes do domínio;
- `domain-event`: fatos de domínio e ciclo de publicação;
- `context` e `logger`: contexto de execução e observabilidade por fatos;
- `repository`: contratos de persistência orientados ao consumidor;
- `result` e `notification`: falhas esperadas e validações acumuladas;
- `naming`: vocabulário ubíquo e nomes de conceitos;
- `testing`: testes como especificação de contratos;
- `documentation`: documentação arquitetural, glossário, roadmap e ADRs;
- `review`: revisão contra os contratos do projeto.

Não crie uma skill para cada diretório nem carregue skills não relacionadas. Uma nova skill só se justifica quando existe conhecimento especializado, recorrente e acionável que não pertence às regras gerais nem à documentação humana.

## Escalonamento de modelo

Escolha o modelo de menor custo capaz de concluir a tarefa e escale por necessidade de raciocínio, não pelo tamanho nominal do projeto.

| Complexidade | Exemplos | Escolha inicial |
| --- | --- | --- |
| Localizada | naming, formatação, lint, documentação, teste simples, correção conhecida | Modelo econômico |
| Multi-componente | bug difícil, concorrência, transação, performance, mudança que atravessa camadas | Modelo intermediário |
| Sistêmica | redesign, trade-off arquitetural importante, investigação de vários subsistemas | Modelo avançado, com justificativa concreta |

Se a tarefa continuar simples depois da investigação, não escale. Um modelo mais caro não é justificado apenas porque o projeto é grande, a tarefa é importante ou houve uma pequena incerteza.

## Modo rápido

Velocidade e consumo são trade-offs. Trate o modo rápido como uma opção para tarefas pequenas ou quando o tempo for explicitamente mais importante que o consumo; ele não é o padrão para toda tarefa e pode elevar a taxa de uso de créditos.

## Validação

Use os comandos oficiais já existentes, sem criar um script paralelo para cada tarefa. O [`AGENTS.md`](../AGENTS.md) mantém os comandos operacionais curtos; o [README](../README.md#qualidade-e-testes), a [estratégia de testes](testing-strategy.md) e o guia de [infraestrutura](../infrastructure/README.md) detalham quando executar cada validação. Integrações PostgreSQL exigem `TEST_DATABASE_URL` e um banco preparado; Terraform exige `terraform fmt -check -recursive` e `terraform validate` no ambiente afetado.

Ao terminar qualquer mudança, revise:

- `git diff` e `git diff --check`;
- arquivos alterados e referências quebradas;
- testes, lint, formatação e build relevantes;
- duplicações entre instruções, skills e documentação;
- decisão de criar ou não um novo ADR.

## Adicionar ou alterar instruções

Antes de criar, mover, renomear ou remover um arquivo:

1. confirme sua responsabilidade e quem o referencia;
2. procure uma fonte existente para o mesmo conhecimento;
3. classifique a informação como regra geral, procedimento especializado, motivação arquitetural ou conhecimento temporário;
4. escolha, respectivamente, `AGENTS.md`, `SKILL.md`, ADR/documentação ou a conversa;
5. mantenha a menor mudança que preserve o contexto necessário.

Não transforme uma documentação arquitetural extensa em instruções sempre carregadas. Não promova o resultado de uma investigação temporária a regra permanente sem evidência de que ele será reutilizado.
