# Como contribuir

Leia a [especificação](docs/SPEC.md), o [roadmap](docs/ROADMAP.md) e o [código de conduta](CODE_OF_CONDUCT.md) antes de contribuir. Para instruções de trabalho no repositório, consulte [AGENTS.md](AGENTS.md).

## Ambiente

Instale Node 24 LTS e habilite o Corepack para usar o pnpm. Na raiz do repositório:

```sh
corepack enable
pnpm install
pnpm test
pnpm lint
pnpm format
pnpm -r typecheck
```

Os comandos e ferramentas chegam progressivamente durante o M0; alguns podem ainda não estar disponíveis. Nenhum teste chama LLM de verdade: use jogadores com respostas fixas ou cassetes gravados, sem credenciais.

## Branches, commits e pull requests

Cada branch e pull request trata de um item do roadmap. Nomeie a branch como `<tipo>/<item>-<slug>`, por exemplo `feat/M1-03-sorteio-ciclo-unico`.

Use Conventional Commits: tipo e escopo em inglês, descrição em português, por exemplo `feat(engine): sorteio em ciclo único`. Os tipos convencionais e `content` são aceitos; o escopo é opcional e, quando presente, deve ser um de `engine`, `providers`, `players`, `dossiers`, `cli`, `web`, `docs`, `ci` ou `deps`. Nunca use `--no-verify` nem desative os hooks; corrija a causa se algum falhar.

Abra um pull request com o item do [roadmap](docs/ROADMAP.md), mostre como cada critério de pronto foi atendido e justifique eventuais dependências novas. Execute lint, typecheck e testes antes de considerar o item pronto. Aguarde a revisão e trate os comentários antes da integração.

O conteúdo oficial deve provocar o modelo, nunca pessoas. Não inclua política, fatos sobre fundadores ou funcionários além do nome, nem fatos sem fonte.

## Guia de dossiês: em breve (M2-05)
