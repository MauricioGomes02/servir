# ADR 057 — Fundação da aplicação web Vue

- Estado: aceita
- Data: 2026-08-12

## Contexto

O backend já oferece os primeiros cortes verticais e consultas necessárias para um consumidor. A interface precisa funcionar em navegadores móveis e desktop, preservar o contexto explícito da Organization e crescer por capacidades sem concentrar transporte, estado e apresentação em componentes Vue. Sem uma fundação explícita, temas, responsividade e acessibilidade tenderiam a ser correções tardias e inconsistentes.

## Decisão

Criar `frontend/` como workspace independente no mesmo nível de `backend/` e `infrastructure/`. `applications/web` usa Vue 3, TypeScript, Vite e Vue Router; `applications/bff` usa Fastify como fronteira pública orientada às necessidades da interface. Features da web organizam services de Application, adapters de Infrastructure e componentes de Presentation. Código transversal existe somente para responsabilidades comprovadamente compartilhadas, como HTTP, tema e tokens visuais.

O navegador chama apenas caminhos relativos `/bff/*` na mesma origem. O BFF traduz essas operações para `API_BASE_URL`, disponível somente em seu runtime, e serve os arquivos estáticos produzidos pela web. Web e BFF são aplicações e builds separados, porém o artefato inicial possui um único processo: após o build, Vue é um conjunto de arquivos estáticos servido pelo BFF. A API permanece privada e escala independentemente.

O `organizationId` permanece na URL como contexto explícito do tenant. Estado global será introduzido apenas quando múltiplos consumidores precisarem compartilhar estado com ciclo de vida próprio; a existência de Pinia ou de um store não será presumida para dados já representados pela rota.

A interface é mobile-first e progressivamente aprimorada. Layouts usam fluxo natural, Grid, Flexbox e medidas fluidas; media queries respondem à necessidade do conteúdo, não a modelos de dispositivo. Hover não é requisito de interação. Zoom, teclado, toque, orientação e preferências de contraste, movimento e esquema de cores devem preservar as operações essenciais.

HTML semântico é o padrão. ARIA complementa a semântica nativa quando necessário, sem substituí-la. Campos possuem labels, erros associados, foco visível e anúncios adequados de operações assíncronas. Componentes e páginas principais são testados por seus nomes e papéis acessíveis.

O design system começa com CSS Custom Properties em duas camadas: valores primitivos e tokens semânticos como superfície, texto, borda, ação e perigo. Componentes consomem tokens semânticos. Temas claro, escuro e automático compartilham o mesmo contrato; a preferência explícita é persistida localmente. Contraste WCAG AA é o mínimo esperado.

O primeiro fluxo cria uma Organization e navega para seu workspace por identidade. O cliente HTTP centraliza idioma e Problem Details; adapters conhecem os caminhos do BFF; services expressam as operações consumidas pela tela; componentes não dependem de gateways, `fetch` ou contratos da API interna.

## Consequências

Frontend e backend possuem dependências, builds e ciclos de implantação independentes. Web e BFF possuem testes e builds próprios, enquanto o BFF pode empacotar o bundle estático em um único container público. Features crescem verticalmente sem barrels ou stores globais obrigatórios. A fundação adiciona verificações próprias de TypeScript, ESLint, Stylelint, testes e build.

Responsividade e acessibilidade passam a ser critérios de aceite desde o primeiro componente. Tokens reduzem cores e medidas dispersas, mas ainda exigem revisão visual e auditoria em navegadores reais. O primeiro corte não cria uma biblioteca de componentes completa nem autenticação, pois ainda não existem consumidores que justifiquem essas abstrações.

## Alternativas

Um workspace frontend dentro de `backend/` foi rejeitado porque compartilharia lifecycle e ownership entre aplicações independentes. Uma versão mobile separada foi rejeitada porque duplicaria fluxos que podem ser atendidos por uma aplicação web responsiva. Acesso direto do navegador à API foi rejeitado porque exporia a topologia interna e dificultaria sessão segura e composição futura; um reverse proxy transparente isolaria a rede, mas não ofereceria um contrato orientado à interface. Um store global para toda resposta HTTP foi rejeitado porque esconderia o contexto da rota e criaria sincronização desnecessária. Um framework visual completo foi adiado para que identidade, acessibilidade e composição respondam ao produto em vez de adaptar o domínio a componentes genéricos.
