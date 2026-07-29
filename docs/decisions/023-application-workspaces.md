# ADR 023 — Aplicações independentes em npm workspaces

## Contexto

A API HTTP persiste o Aggregate e sua mensagem de outbox na mesma transação. A entrega durável dessa mensagem terá ciclo de vida, escala, falhas e implantação diferentes dos da API. Manter API e relay no mesmo executável faria o processamento competir com requisições e impediria operar cada carga de forma independente.

## Decisão

Organizar os executáveis do backend em npm workspaces sob `backend/applications/`. A API passa a residir em `backend/applications/api` e mantém seu próprio `package.json`, configuração, entrada e ciclo de vida. O futuro relay durável será criado como outro workspace somente quando seu primeiro comportamento executável for implementado.

O `backend/package.json` coordena instalação e comandos comuns apenas das aplicações backend. Código não será extraído antecipadamente para `backend/packages/`: um pacote compartilhado exige pelo menos dois consumidores reais e um contrato que não pertença exclusivamente a uma aplicação.

## Consequências

API e relay poderão ser construídos, testados, implantados e escalados separadamente, embora permaneçam no mesmo repositório e compartilhem uma única resolução de dependências do backend. Frontend, infraestrutura e outras ferramentas não ficam subordinados ao workspace npm do backend. Os comandos partem de `backend`, a raiz desse workspace.

Até existir o relay durável, o modo PostgreSQL continuará apenas persistindo a outbox. A separação estrutural não define por si só claim, retry, idempotência, particionamento ou contrato de publicação no broker; essas decisões pertencem ao incremento do relay.

## Alternativas consideradas

Executar o relay dentro da API foi rejeitado porque acopla disponibilidade e capacidade de duas cargas distintas. Criar dois repositórios foi adiado porque aumentaria a coordenação antes de existir necessidade de ownership ou entrega separados. Extrair imediatamente toda a fundação para um pacote compartilhado foi rejeitado porque criaria uma API pública baseada em reuso hipotético.
