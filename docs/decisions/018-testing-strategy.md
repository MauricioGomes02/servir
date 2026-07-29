# ADR 018 — Design e nomeação de testes comportamentais

- Estado: aceita
- Data: 2026-07-28

## Contexto

O código, os termos de domínio e os contratos técnicos usam inglês, enquanto as descrições dos testes estavam em português. A seleção dos casos também dependia de julgamento local, sem um método compartilhado para caminhos, condições, fluxo de dados, classes de entrada e limites.

## Decisão

Escrever suites, casos, helpers e fixtures de teste em inglês e nomear casos como declarações de comportamento observável. Aplicar teste de caminho básico, teste de condição, teste de fluxo de dados, partição de equivalência e análise de valor limite como técnicas complementares. Testes de domínio e application também protegem transições de estado, invariantes, atomicidade e contratos.

Complexidade ciclomática acima de 10 exige revisão para possível refatoração. Ela não prescreve uma quantidade exata de testes nem substitui análise comportamental. Defeitos de fluxo de dados comprováveis por TypeScript ou lint permanecem responsabilidade da análise estática.

Rótulos de técnicas não são incluídos nos nomes dos testes. Entradas, agrupamentos e asserções demonstram a técnica, enquanto os nomes preservam o vocabulário ubíquo.

## Consequências

A saída dos testes permanece coerente com o idioma do código e funciona como documentação executável. Revisões passam a procurar explicitamente caminhos, partições, limites e efeitos proibidos ausentes. A aplicação das técnicas exige julgamento e pode revelar código de produção que deve ser simplificado antes da adição de mais casos.

Descrições existentes em português são migradas sem alterar comportamento. Novas coberturas são revisadas separadamente para não confundir migração textual com novas especificações.

## Alternativas

Manter descrições em português foi rejeitado por preservar dois idiomas para o mesmo vocabulário técnico. Prefixar nomes com técnicas foi rejeitado por tornar relatórios ruidosos e desviar a atenção do comportamento. Usar percentual de cobertura como estratégia foi rejeitado porque linhas executadas não provam que partições, limites ou invariantes relevantes foram selecionados.
