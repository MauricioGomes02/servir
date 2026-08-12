# ADR 058 — API privada atrás do frontend BFF containerizado

- Estado: aceita
- Data: 2026-08-12
- Substitui parcialmente: [ADR 055](055-containerized-applications-and-local-network-segmentation.md), quanto às redes `edge` e à publicação da API

## Contexto

O ADR 055 reservou a rede `edge` para API e futuro frontend e publicou a API em loopback. Com a adoção do BFF no ADR 057, o navegador deve acessar somente a fronteira orientada à interface. Manter BFF e API na mesma bridge de borda ou publicar ambos no host contrariaria esse limite e permitiria contornar o BFF no ambiente integrado.

A web Vue não mantém um processo depois do build. Seus arquivos estáticos podem compartilhar o artefato do BFF sem repetir o problema que exigiu separar API e relay, pois somente o BFF possui runtime e necessidade própria de escala.

## Decisão

Produzir uma imagem OCI multi-stage do frontend. O build compila web e BFF separadamente; a imagem final contém dependências de produção do BFF, seu JavaScript compilado e o bundle estático da web. Um único processo Node não-root serve ambos. Terraform recebe a referência pronta e não conhece o Dockerfile nem executa build.

O BFF oferece liveness independente, shutdown gracioso, limite de corpo, timeout do upstream, headers defensivos, cache imutável para assets versionados e revalidação do documento SPA. Rotas `/bff` são explícitas; o fallback da SPA nunca transforma uma operação desconhecida do BFF ou health check em HTML.

Dividir o `/24` local em oito `/27`, usando cinco bridges e reservando três faixas:

- `edge`: BFF, único workload HTTP publicado em loopback;
- `application`: BFF e API privada;
- `data`: API, relay, PostgreSQL e jobs operacionais;
- `messaging`: relay e Kafka;
- `observability`: API, relay, Collector e Jaeger.

O BFF participa somente de `edge` e `application`. A API participa de `application`, `data` e `observability` e não publica porta no host quando gerenciada pelo Terraform. O relay mantém suas redes atuais. Processos em desenvolvimento continuam executáveis no host e usam os endpoints loopback das dependências.

Frontend, API e relay possuem flags, imagens, ambientes e recursos independentes no Terraform. Habilitar o frontend exige habilitar a API. `API_BASE_URL` é configuração exclusiva do BFF e usa o DNS `api` da rede `application`; nunca entra no bundle Vue.

## Consequências

O ambiente integrado possui uma única entrada HTTP pública e representa a fronteira que será usada em produção. API e BFF escalam e são promovidos independentemente, apesar de web e BFF compartilharem inicialmente um artefato. Alterar a subdivisão substitui bridges e containers conectados, mas não volumes protegidos.

O BFF não substitui autenticação, autorização ou isolamento multi-tenant da API. O navegador ainda pode observar e repetir contratos públicos do BFF durante uma sessão válida. TLS, edge global, CDN, identidade de workload e secrets gerenciados permanecem responsabilidades da infraestrutura de ambientes compartilhados.

## Alternativas

Manter a API publicada em loopback foi rejeitado porque permitiria contornar o BFF no ambiente integrado. Compartilhar `edge` entre BFF e API foi rejeitado porque não expressaria a direção permitida da comunicação. Executar web e BFF em containers separados foi adiado porque o bundle estático não possui runtime nem demanda de escala independente; uma CDN poderá extraí-lo posteriormente. Usar um proxy genérico foi rejeitado porque novas rotas internas poderiam tornar-se públicas por acidente.
