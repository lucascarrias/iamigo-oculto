# AGENTS.md

Instruções para agentes de código que trabalham neste repositório. Valem para qualquer
ferramenta (OpenCode, Claude Code, Cursor, Codex…).

## O projeto

IAmigo Oculto: um amigo oculto entre modelos de IA, gerado por um CLI e assistido num
site estático, mobile-first. Projeto open source (MIT), brasileiro, com o jogo em
português.

## Fontes de verdade

Leia antes de começar qualquer tarefa. Em caso de conflito, vale a primeira da lista:

1. `docs/SPEC.md`: regras do jogo, modelo de informação, schema de eventos, interfaces.
2. `docs/adr/`: decisões técnicas e seus motivos.
3. `docs/ROADMAP.md`: milestones, itens e critérios de pronto.
4. `docs/design/`: referência visual do player (comece pelo `README.md`).
5. O código existente.

Se o código contradiz o SPEC, o código está errado ou o SPEC precisa mudar. Não resolva
isso sozinho: aponte a contradição.

## Onde escrever o quê

| Conteúdo | Lugar |
|---|---|
| Planos de milestone, notas de implementação, rascunhos, investigações, checklists | `tmp/` (fora do Git) |
| Mudança de regra do jogo, do schema de eventos ou de interface pública | `docs/SPEC.md` |
| Decisão técnica com alternativas relevantes | nova ADR em `docs/adr/` |
| Itens, tamanhos e critérios de pronto | `docs/ROADMAP.md` |

- **Prefira `tmp/`** para qualquer documento de trabalho. Sugestão de organização:
  `tmp/plans/M1.md` para o plano de um milestone, `tmp/notes/M1-03.md` para as notas de
  um item.
- **Não crie outros documentos em `docs/`** nem arquivos Markdown espalhados pelo
  repositório. O que importa a longo prazo vai para o SPEC ou para uma ADR.
- **SPEC e ADRs só mudam com aprovação do mantenedor.** Proponha a mudança (no plano, no PR
  ou na conversa) em vez de editar por conta própria. Uma vez aprovada, a mudança entra no
  mesmo PR que a implementa.
- ADRs: `docs/adr/NNNN-titulo-curto.md`, numeração sequencial, com Status, Data, Contexto,
  Decisão e Consequências (siga as existentes). Uma ADR aceita não é editada; uma decisão
  nova a substitui.

## Fluxo de trabalho

1. **Plano antes de código.** Cada milestone começa com um plano em `tmp/plans/Mx.md`:
   estrutura de arquivos, assinaturas das interfaces, ordem dos itens, testes de cada item e
   pontos ambíguos. Só implemente depois que o mantenedor aprovar o plano.
2. **Um item do ROADMAP por branch e por PR.** Branch: `<tipo>/<item>-<slug>`, ex.:
   `feat/M1-03-sorteio-ciclo-unico`. O PR cita o item e mostra como cada critério de pronto
   foi atendido.
3. **Ambiguidade → pare e pergunte.** Não invente regra de jogo, formato de evento nem
   comportamento visual. Se o SPEC não responde, a pergunta indica um buraco no SPEC.
4. **Escopo fechado.** Não faça refatorações, melhorias ou dependências novas fora do item.
   Anote ideias em `tmp/notes/` e mencione no PR.

## Stack e comandos

Node 24 LTS e pnpm (ADR-001); Biome (ADR-003); Vitest; React + Vite no `apps/web`.
Os comandos abaixo passam a existir com o M0:

```sh
pnpm install
pnpm test               # Vitest em todos os pacotes
pnpm lint               # Biome
pnpm format
pnpm -r typecheck
```

Antes de dar um item como pronto: lint, typecheck e testes passando.

## Regras de código

- **TypeScript estrito**, com `erasableSyntaxOnly`: nada de `enum`, `namespace` ou
  parameter properties. Use uniões de literais e objetos `as const`.
- **Identificadores em inglês**, comentários e documentação em português. Todo texto
  exibido ao usuário é em português brasileiro.
- **`packages/engine` é puro:** sem I/O, sem rede, sem `Math.random()` nem `Date.now()`.
  Aleatoriedade vem do RNG com semente e o relógio é injetado. Mesma semente + mesmas
  respostas = mesmo log de eventos.
- **Direção das dependências:** `engine` não depende de nada do projeto; `players` depende
  de `engine` e `providers`; apps dependem de pacotes, nunca o contrário.
- **`engine`, `providers` e `players` usam só APIs web padrão** (`fetch`, `crypto`,
  `TextEncoder`…), sem APIs exclusivas do Node ou de outro runtime.
- **Modelo de informação:** nenhuma chamada de LLM recebe dados fora da `PlayerView` da
  ação (SPEC §5). Isso vale também para logs e mensagens de erro enviados ao modelo.
- **Dependências novas** precisam de justificativa no PR.

## Testes

- Todo item vem com testes. Bug corrigido = teste que falhava antes.
- **Nenhum teste chama um LLM de verdade.** Use `ScriptedPlayer` ou cassetes gravados.
- O CI nunca tem chave de API. Ninguém commita chaves, `.env` ou cassetes com credenciais.
- Partidas de teste ficam em `fixtures/`. `matches/` é só para partidas publicadas, e só o
  mantenedor adiciona partidas lá.

## Commits e hooks

- **Conventional Commits**, com tipo e escopo em inglês e descrição em português:
  `feat(engine): sorteio em ciclo único`.
- Escopos: `engine`, `providers`, `players`, `dossiers`, `cli`, `web`, `docs`, `ci`.
- **Nunca use `--no-verify`** nem desative hooks do lefthook. Se um hook falha, corrija a causa.

## Conteúdo (dossiês, prompts, falas de emergência)

- **Provocar o modelo, nunca pessoas.** Nada sobre fundadores ou funcionários além do nome,
  nada de política, nada sem fonte.
- Todo fato de dossiê tem `source`.
- O repositório não distribui logos de empresas; avatares são mascotes próprios.

## Interface

- **Mobile-first.** Implemente e valide primeiro em 390 px de largura; o desktop vem depois
  (M5-08).
- Siga os tokens e medidas de `docs/design/README.md`. As telas em `docs/design/mobile/`
  são referência visual, não código para copiar.
- Alvos de toque ≥ 44 px, contraste ≥ 4.5:1, `prefers-reduced-motion` respeitado.
- O player nunca mostra o que os jogadores ainda não sabem (SPEC §7).
