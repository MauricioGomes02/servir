# ADR 060 — Experiência frontend orientada a tarefas

- Estado: aceita
- Data: 2026-08-12
- Refina: [ADR 057](057-vue-web-application-foundation.md) e [ADR 059](059-product-visual-language-and-reusable-web-components.md)

## Contexto

Os ADRs 057 e 059 estabeleceram uma aplicação web independente, BFF, acessibilidade, responsividade, temas e componentes reutilizáveis. A primeira implementação comprovou essa fundação, mas sua organização conceitual ainda pode induzir a interface a espelhar camadas, entidades e capacidades do backend. Um catálogo visualmente consistente de recursos continuaria sendo uma experiência orientada a CRUD, não necessariamente ao trabalho de uma igreja.

O frontend possui duas arquiteturas relacionadas, mas distintas: a arquitetura técnica controla dependências e efeitos; a arquitetura de informação organiza o que o usuário reconhece, procura e realiza. O domínio continua definindo regras e linguagem, porém não determina sozinho páginas, menus ou composição visual.

## Decisão

Projetar a aplicação web por tarefas e perguntas do usuário. Páginas representam destinos e contexto; features representam ações completas; componentes compartilhados representam contratos de interação comprovadamente repetidos; gateways e BFF traduzem necessidades da experiência sem vazar DTOs, endpoints ou topologia da API privada para a apresentação.

A navegação será organizada por Início, Operação, Pessoas, Ministérios e Administração. Esses grupos representam o trabalho, não bounded contexts ou Aggregates, e só recebem destinos quando houver uma experiência útil suportada pelo produto.

O fluxo prioritário é atividade, necessidade de pessoas, disponibilidade, respostas, montagem da escala, publicação, execução e histórico. A interface evolui por cortes verticais desse fluxo em vez de antecipar telas CRUD para toda capacidade disponível no backend.

Estados percebidos são parte do contrato de cada experiência. Loading, vazio, erro recuperável, sucesso, indisponível, salvando, salvo, rascunho e publicado devem ser projetados quando aplicáveis, comunicados semanticamente e cobertos proporcionalmente por testes.

Usabilidade, prevenção de erros, controle do usuário, HTML semântico, teclado, WCAG 2.2 e responsividade são critérios de aceite. Tendências visuais e bibliotecas são ferramentas subordinadas a esses critérios. O guia vivo está em [Experiência da aplicação web](../frontend-experience.md).

A estrutura de diretórios atual não será migrada mecanicamente. Novas experiências e refatorações motivadas por consumidores reais poderão convergir para responsabilidades como `app`, `pages`, `features`, `ui` e `data`; nomes de camadas do backend não serão reproduzidos por simetria. Limites existentes que impedem componentes de acessar transporte diretamente continuam válidos.

## Consequências

O backend continua responsável por invariantes, autorização, isolamento multi-tenant, persistência e contratos internos. O frontend passa a ter critérios próprios para navegação, conteúdo, feedback, recuperação e composição, sem duplicar regras de negócio como fonte de verdade.

Uma página pode consumir múltiplas operações, e uma capacidade do backend pode não possuir página própria. O BFF pode oferecer contratos compostos orientados à tarefa, aumentando sua responsabilidade de tradução sem transformá-lo em domínio ou fonte de autorização.

Componentes genéricos deixam de ser promovidos apenas por semelhança visual. Cards, tabelas e menus exigem justificativa funcional. A revisão de uma tela passa a incluir seus estados, operação por teclado, comportamento responsivo e linguagem, além de build e testes.

A adoção incremental evita uma reorganização ampla sem benefício observável, mas permite que a estrutura antiga e a nova coexistam temporariamente. Cada corte deve melhorar essa convergência sem criar diretórios vazios ou abstrações especulativas.

## Alternativas

Espelhar bounded contexts, Aggregates ou endpoints foi rejeitado porque otimiza a interface para a implementação, não para a tarefa. Aplicar integralmente uma arquitetura frontend genérica foi rejeitado porque nomes de pastas não garantem bons limites e criariam migração sem consumidor. Adotar um design system de mercado como fonte das decisões foi rejeitado porque componentes visuais não substituem pesquisa, princípios de interação ou regras do produto. Manter somente recomendações informais foi rejeitado porque estados, navegação e critérios de aceite precisam ser verificáveis e duráveis.
