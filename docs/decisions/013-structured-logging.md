# ADR 013 — Logging estruturado e contextual

- Estado: aceita
- Data: 2026-07-27

## Contexto

Logs precisam permitir busca e correlação sem copiar requests, payloads ou dados pessoais. Destinos de observabilidade e SDKs mudam independentemente da application.

## Decisão

O Logger recebe `LogRecord` estruturado com severidade, nome estável, instante opcional, contexto permitido e atributos JSON-like. Contexto contém somente IDs necessários; resource attributes e trace/span IDs são enriquecidos por adapters. Logging é observabilidade de melhor esforço e não substitui auditoria durável.

## Consequências

Registros são pesquisáveis e independentes de fornecedor, mas cada produtor precisa escolher atributos mínimos e estáveis. Redaction, limites e integração OpenTelemetry pertencem aos adapters.

## Alternativas

Mensagens textuais livres foram rejeitadas por dificultar consulta. Passar `ExecutionContext` ou payloads completos foi rejeitado por excesso de dados. Expor SDK OpenTelemetry no port foi rejeitado por acoplamento.
