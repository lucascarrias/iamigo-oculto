# ADR-003: Biome para lint e formatação

- **Status:** aceita
- **Data:** 2026-11-24
- **Relacionado:** SPEC seção 14

## Contexto

Queremos checagens estáticas no CI e nos hooks do lefthook, com pouca configuração e
rápidas o bastante para rodar em todo commit. A alternativa considerada foi ESLint +
Prettier.

## Decisão

Biome é o linter e formatador do monorepo, com um único `biome.json` na raiz.

- `pre-commit` (lefthook): `biome check --write` nos arquivos alterados.
- `pre-push` (lefthook): typecheck (`tsc --noEmit`, via `pnpm -r typecheck`).
- CI: `biome ci` no repositório inteiro.

## Consequências

**Positivas**
- Uma ferramenta e um arquivo de configuração no lugar de duas ferramentas e vários plugins.
- Rápido o bastante para hooks sem atrapalhar o fluxo.
- Menos decisões de estilo para discutir em PR.

**Negativas**
- Menos regras e plugins que o ecossistema do ESLint (ex.: algumas regras específicas de
  React). Se uma regra essencial faltar, adicionamos o ESLint só para ela, num escopo restrito.
- Typecheck continua separado, já que o Biome não faz checagem de tipos.
