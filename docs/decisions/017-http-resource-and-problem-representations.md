# ADR 017 — Representações HTTP de recursos e problemas

- Estado: aceita
- Data: 2026-07-28

## Contexto

O primeiro adapter HTTP retornava um envelope com `success` e `data` tanto para sinalizar o resultado quanto para carregar a representação. Isso duplicava a semântica já expressa pelo status HTTP e permitia contradições entre status e body. Falhas também usavam um formato próprio, embora HTTP possua um padrão interoperável para representar problemas.

## Decisão

Usar o status HTTP como única fonte de sucesso ou falha. Respostas bem-sucedidas que representam um recurso retornam a representação diretamente com `application/json`, sem os wrappers `success` ou `data`. A criação retorna `201 Created`, a representação criada e `Location` com a URI do recurso.

Representar respostas `4xx` e `5xx` conforme [Problem Details for HTTP APIs da RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html), usando `application/problem+json`. O adapter HTTP define `type`, `title`, `status` e `instance`; `correlationId` é uma extensão para suporte. Problemas de validação usam a extensão `errors`, cujos itens carregam código estável, detalhe localizado, JSON Pointer do campo e parâmetros seguros quando existirem.

`type` identifica a categoria HTTP do problema. Códigos de domínio permanecem em `errors[].code`, permitindo que clientes reajam sem interpretar texto localizado. `title` e `detail` respeitam o locale negociado, acompanhado por `Content-Language`. Mensagens técnicas, causas e stack traces permanecem somente na observabilidade.

O `Result`, os erros de domínio, `PresentedError` e os presenters não dependem da RFC 9457. A conversão para Problem Details pertence ao adapter HTTP.

## Consequências

Clientes usam o status HTTP para controlar o fluxo, desserializam recursos sem envelopes artificiais e reconhecem erros pelo media type e schema padronizados. Sucesso e falha possuem media types diferentes porque representam documentos com semânticas diferentes; ambos continuam serializados como JSON.

Adicionar metadados a coleções exigirá um contrato próprio, como `items` e paginação, sem introduzir um wrapper universal. Se futuramente o projeto adotar JSON:API ou outro padrão completo de representação, uma nova decisão deverá substituir esta.

## Alternativas

Manter `success` foi rejeitado por duplicar o status HTTP. Manter `data` em todos os sucessos foi rejeitado porque o projeto não adota um padrão que atribua semântica a esse envelope. Retornar erros como `application/json` em formato proprietário foi rejeitado por reduzir interoperabilidade e exigir tratamento específico dos clientes.
