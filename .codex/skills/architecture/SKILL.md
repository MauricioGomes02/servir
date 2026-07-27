---
name: architecture
description: Orientar decisões, implementações e refatorações segundo a arquitetura do Servir. Usar ao introduzir conceitos transversais, definir limites, dependências, mensagens, ports/adapters ou avaliar se uma abstração pertence à fundação.
---

# Objetivo

Preservar uma fundação coesa, reutilizável e independente de framework.

## Quando utilizar

Usar antes de mudanças arquiteturais ou quando a responsabilidade/camada de um componente não estiver clara.

## Regras obrigatórias

1. Ler `../../../docs/architecture.md`, `../../../docs/glossary.md` e o ADR relacionado.
2. Identificar responsabilidade, contrato, consumidor e direção da dependência antes de codificar.
3. Manter domínio sem infraestrutura; tratar efeitos em ports/adapters.
4. Atualizar glossário, roadmap, diagramas e ADRs quando a semântica mudar.
5. Não antecipar primitivas ou casos de uso bloqueados pelo roadmap.

## Exemplo correto

Um agregado registra um fato; application coleta e um adapter publica. O agregado não importa broker.

## Anti-patterns

- Abstração “shared” sem significado.
- Interface que apenas espelha implementação.
- Estrutura de pastas usada como substituto de limites reais.

## Checklist

- [ ] Há uma responsabilidade indivisível?
- [ ] O nome existe no vocabulário?
- [ ] Dependências apontam para o núcleo?
- [ ] Falhas, efeitos e mutabilidade estão explícitos?
- [ ] Documentação e testes acompanham a decisão?
