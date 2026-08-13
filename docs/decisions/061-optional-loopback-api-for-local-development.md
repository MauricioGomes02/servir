# ADR 061 — API opcional em loopback para desenvolvimento local

- Estado: aceita
- Data: 2026-08-12
- Refina: [ADR 058](058-private-api-behind-containerized-frontend-bff.md) somente no ambiente local

## Contexto

O ADR 058 tornou o BFF a única fronteira HTTP pública da aplicação integrada e removeu a porta da API no host. Essa topologia representa produção e impede que o navegador contorne o BFF. Porém, durante o desenvolvimento do frontend, executar web e BFF no host com hot reload exigiria reconstruir a imagem do BFF a cada nova rota se a API containerizada continuasse acessível somente pela bridge Docker.

PostgreSQL, Kafka e observabilidade já oferecem endpoints em loopback para processos locais. A API precisa da mesma ponte de desenvolvimento sem tornar sua publicação obrigatória nem alterar o contrato acessado pelo navegador.

## Decisão

O ambiente Terraform local aceita `api_port` opcional. Quando definido, o container da API publica sua porta interna `3000` exclusivamente em `127.0.0.1`; quando `null`, nenhuma porta é publicada. Outros ambientes não recebem essa configuração por consequência desta decisão.

O navegador continua chamando somente `/bff/*`. Em desenvolvimento, Vite encaminha essas chamadas ao BFF no host, e o BFF usa `API_BASE_URL=http://localhost:3000`. Na aplicação integrada, o BFF containerizado continua usando `http://api:3000` pela rede `application`.

A configuração local canônica usa `api_port = 3000` para permitir hot reload de web e BFF sem rebuild de imagens. Alterar a publicação exige uma recriação pontual do container da API, não de redes, volumes ou imagens.

## Consequências

Desenvolvedores podem reutilizar PostgreSQL, Kafka, Collector e API provisionados pelo Terraform enquanto executam somente os processos frontend em edição. A API não é exposta em interfaces externas da máquina e não se torna um contrato destinado ao navegador.

A fronteira de produção permanece privada. Loopback reduz exposição, mas não substitui autenticação, autorização ou isolamento multi-tenant; ferramentas e processos locais ainda podem alcançar a API diretamente.

## Alternativas

Reconstruir o container do frontend a cada mudança foi rejeitado por eliminar o ciclo rápido de desenvolvimento. Conectar um processo Node do host diretamente à bridge Docker foi rejeitado por depender de detalhes e comportamento específicos do daemon. Publicar a API em todas as interfaces foi rejeitado por ampliar desnecessariamente a superfície local. Executar também a API no host permanece válido, mas não permite reutilizar o container já provisionado.
