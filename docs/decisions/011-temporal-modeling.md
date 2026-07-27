# ADR 011 — Modelagem temporal explícita

- Estado: aceita
- Data: 2026-07-27

## Contexto

Eventos precisam registrar quando ocorreram, enquanto escalas futuras precisarão representar datas e horários civis sujeitos a timezone e mudanças de offset. `Date` mistura essas semânticas e bibliotecas temporais não devem definir os contratos do núcleo.

## Decisão

Usar `Instant` para pontos absolutos, normalizados em UTC. Data civil, horário civil e zona IANA serão conceitos separados quando necessários. Luxon, Temporal ou outra biblioteca podem implementar parsing e operações sem aparecer nas APIs públicas do domínio e da application.

## Consequências

Eventos e Clock compartilham uma representação imutável e independente de fornecedor. Conversões de timezone ficam explícitas; novos tipos serão necessários para regras de agenda e apresentação.

## Alternativas

Expor `Date` foi rejeitado por mutabilidade e ambiguidade. Expor `DateTime` do Luxon foi rejeitado por acoplamento. Armazenar timezone em todo instante foi rejeitado porque um ponto absoluto não depende de timezone.
