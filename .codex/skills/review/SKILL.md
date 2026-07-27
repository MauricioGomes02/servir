---
name: review
description: Executar revisão arquitetural e de código no Servir. Usar ao revisar diffs, pull requests, primitivas ou propostas quanto a invariantes, acoplamento, tipos, imutabilidade, eventos, testes e documentação.
---

# Objetivo

Encontrar riscos concretos contra contratos do projeto e propor correções proporcionais.

## Quando utilizar

Usar antes de estabilizar API pública ou integrar mudanças arquiteturais.

## Regras obrigatórias

1. Ler documentos da primitiva e ADRs afetados.
2. Priorizar defeitos, invariantes violadas e regressões; citar arquivo/linha.
3. Verificar direção de dependência, estados inválidos, mutabilidade e semântica de falha.
4. Exigir testes como especificação do contrato.
5. Distinguir bloqueio, melhoria e oportunidade futura; não criar abstração especulativa.

## Exemplo correto

Apontar que congelamento raso permite mutação interna, demonstrar o caminho e sugerir teste/fix mínimo.

## Anti-patterns

- Comentários apenas estilísticos.
- Aprovar porque compila.
- Reescrever por preferência pessoal.

## Checklist

- [ ] Invariantes e API pública estão seguras?
- [ ] Erros esperados e exceções estão corretos?
- [ ] Há vazamento de infraestrutura?
- [ ] Testes cobrem contratos e bordas?
- [ ] Glossário/roadmap/diagramas permanecem coerentes?
