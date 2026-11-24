# ADR-001: Node 24 LTS + pnpm como runtime e gerenciador de pacotes

- **Status:** aceita
- **Data:** 2026-11-24
- **Relacionado:** SPEC seções 6, 13 e 14; ADR-002

## Contexto

O projeto é um monorepo TypeScript (engine, provedores, jogadores, CLI e web em React) e
open source. Avaliamos Bun e Node. A principal vantagem do Bun para nós era o SQLite
embutido, que deixou de importar com a ADR-002 (partidas em JSON). O gargalo da geração
de partidas é a latência dos LLMs, não o runtime.

## Decisão

- **Runtime:** Node 24 LTS, executando TypeScript direto (type stripping nativo).
  O `tsconfig` usa `erasableSyntaxOnly`: nada de `enum`, `namespace` ou outra sintaxe
  que precise de transformação.
- **Pacotes:** pnpm com workspaces. Versões fixadas via `packageManager` no `package.json`
  e `engines.node`.
- **Testes:** Vitest em todo o monorepo.
- `engine`, `providers` e `players` usam só `fetch` e APIs web padrão, sem APIs exclusivas
  de nenhum runtime.

## Consequências

**Positivas**
- O caminho mais familiar para quem contribui: nada além de Node e pnpm para instalar.
- Compatibilidade total com o ecossistema (Vite, AI SDK, lefthook, Biome).
- Um test runner só para backend e front.

**Negativas**
- Sem binário único do CLI de graça. Se fizer falta, dá para usar Bun (ou Node SEA)
  apenas para compilar o `apps/cli`, porque os pacotes não dependem de runtime.
- `erasableSyntaxOnly` restringe um pouco a sintaxe (uniões de literais em vez de `enum`).
