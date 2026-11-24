# IAmigo Oculto — Plano da POC

> Base: `docs/SPEC.md` v0.4 e ADRs 001–003. Cada item abaixo vira uma issue no GitHub,
> agrupada por milestone. Tamanhos: **P** (até 2 h), **M** (2–5 h), **G** (5–10 h).

## Objetivo da POC

A POC está pronta quando:

1. `pnpm iamigo generate` gera uma partida completa de 8 modelos via OpenCode Zen, sem
   intervenção manual, e grava um JSON válido em `matches/`.
2. O site estático reproduz essa partida no celular e no desktop, sem spoilers.
3. Pelo menos 3 partidas curadas estão publicadas, com o custo de cada uma conhecido.
4. O repositório está pronto para receber contribuições (CI verde, docs, guia de dossiês).

## Visão geral

```
M0 Fundação ──► M1 Engine ──► M3 Jogadores LLM ──► M4 CLI ──► M6 Lançamento
                  │                                              ▲
                  ├──► M2 Dossiês (em paralelo) ─────────────────┤
                  └──► M5 Player web (em paralelo, com fixture) ─┘
```

- **Caminho crítico:** M0 → M1 → M3 → M4 → M6.
- **M5 não espera os LLMs.** A partida roteirizada do protótipo vira uma fixture JSON
  (M1-08), e o player é construído em cima dela.
- **M2 pode ser feita a qualquer momento antes de M3-04**, inclusive por contribuidores.

| Milestone | Itens | Estimativa |
|---|---|---|
| M0 Fundação do repositório | 7 | ~14 h |
| M1 Engine | 8 | ~27 h |
| M2 Dossiês e mascotes | 5 | ~17 h |
| M3 Provedor e jogadores LLM | 7 | ~30 h |
| M4 CLI e primeiras partidas | 5 | ~18 h |
| M5 Player web mobile-first | 10 | ~43 h |
| M6 Lançamento da POC | 4 | ~8 h |
| **Total** | **46** | **~157 h** |

No ritmo de 10–20 h por semana, isso dá **8 a 16 semanas**. Com M2 e M5 em paralelo ao
caminho crítico, o mínimo realista fica perto de 8 semanas.

---

## M0 — Fundação do repositório

| # | Item | Tam. | Depende de | Pronto quando |
|---|---|---|---|---|
| M0-01 | `chore: monorepo pnpm + Node 24` | P | — | `pnpm-workspace.yaml`, `packageManager`, `engines.node`, pastas `packages/*` e `apps/*` vazias |
| M0-02 | `chore: tsconfig base` | P | M0-01 | `strict`, `erasableSyntaxOnly`, `noUncheckedIndexedAccess`; cada pacote estende a base; `pnpm -r typecheck` |
| M0-03 | `chore: Biome` | P | M0-01 | `biome.json` na raiz; `pnpm lint` e `pnpm format` |
| M0-04 | `chore: Vitest` | P | M0-02 | workspace do Vitest; `pnpm test` roda em todos os pacotes |
| M0-05 | `chore: lefthook + commits convencionais` | P | M0-03 | `pre-commit`: `biome check --write` nos alterados; `pre-push`: typecheck; `commit-msg`: valida Conventional Commits |
| M0-06 | `ci: GitHub Actions` | M | M0-02..05 | PR roda `biome ci`, typecheck, testes e checagem dos commits; cache do pnpm |
| M0-07 | `docs: arquivos da comunidade` | M | — | README (visão, aviso de não afiliação), LICENSE MIT, CONTRIBUTING, CODE_OF_CONDUCT, AGENTS.md, templates de issue e PR |

## M1 — Engine (`packages/engine`)

Sem I/O, determinística, só APIs web padrão.

| # | Item | Tam. | Depende de | Pronto quando |
|---|---|---|---|---|
| M1-01 | `feat(engine): tipos e schema de eventos` | M | M0 | tipos do SPEC §7 + validação em tempo de execução do `Match` (ver decisão D1); `schemaVersion: 1` |
| M1-02 | `feat(engine): RNG com semente` | P | M1-01 | mesma semente gera a mesma sequência; testes |
| M1-03 | `feat(engine): sorteio em ciclo único` | P | M1-02 | ciclo único para 3–12 participantes; primeiro apresentador pela semente; erro fora do limite |
| M1-04 | `feat(engine): PlayerView` | M | M1-01 | uma função por ação monta exatamente o que o SPEC §5 permite; testes garantem que nada a mais vaza |
| M1-05 | `feat(engine): máquina de estados do turno` | G | M1-03, M1-04 | dicas até 3, fim por 100%, revelação, presente, agradecimento, passagem para o próximo; emite eventos na ordem |
| M1-06 | `feat(engine): pontuação e validação de palpites` | P | M1-05 | 3/2/1 por primeiro acerto; candidatos válidos (SPEC §4.5) |
| M1-07 | `feat(engine): interface Player + ScriptedPlayer` | M | M1-05 | partida completa só com respostas roteirizadas; testes de fim antecipado, 3 rodadas, palpite em si mesmo |
| M1-08 | `test(engine): fixture da partida do protótipo` | M | M1-07 | a partida roteirizada do protótipo vira `fixtures/matches/prototipo.json`, gerada pelo ScriptedPlayer |

## M2 — Dossiês e mascotes (`packages/dossiers`)

| # | Item | Tam. | Depende de | Pronto quando |
|---|---|---|---|---|
| M2-01 | `feat(dossiers): schema e validador` | M | M0 | schema do SPEC §9; `pnpm dossiers:check` falha sem `source`, `aliases` ou com nível inválido; roda no CI |
| M2-02 | `feat(dossiers): 8 dossiês com fontes` | G | M2-01 | GPT, Claude, Gemini, DeepSeek, Qwen, Kimi, GLM, Mistral; cada fato com fonte verificada; ≥ 2 fatos por nível |
| M2-03 | `feat(dossiers): mascotes SVG` | M | — | 8 mascotes originais com cor e expressões (feliz, pensando); licença MIT |
| M2-04 | `feat(dossiers): seleção padrão "Clássica 8"` | P | M2-02 | arquivo de seleções; cada participante = dossiê + modelo + provedor |
| M2-05 | `docs: guia de contribuição de dossiês` | P | M2-01 | seção no CONTRIBUTING: regra "provocar o modelo, nunca pessoas", exigência de fontes, exemplo |

## M3 — Provedor e jogadores LLM (`packages/providers`, `packages/players`)

| # | Item | Tam. | Depende de | Pronto quando |
|---|---|---|---|---|
| M3-01 | `feat(providers): interface LlmProvider` | P | M0 | interface do SPEC §6.2; tipos de `Usage` e erros |
| M3-02 | `feat(providers): adaptador OpenCode Zen` | G | M3-01, D2 | escolhe endpoint pela família do modelo; timeout; captura tokens e custo; testado com cassetes |
| M3-03 | `feat(providers): cassetes (gravar/reproduzir)` | M | M3-01 | modo `record` com chave, modo `replay` no CI; chave nunca gravada no arquivo |
| M3-04 | `feat(players): prompts por ação` | G | M1-04, M2-02 | system prompt (identidade + persona) e um prompt por ação, montados só a partir da `PlayerView` |
| M3-05 | `feat(players): validação das respostas` | M | M3-04 | JSON por ação; dica começa com "O meu amigo oculto", sem nome nem apelidos do alvo, ≤ 200 caracteres; palpite válido |
| M3-06 | `feat(players): novas tentativas e fala de emergência` | M | M3-05 | até 3 novas tentativas com backoff; banco de falas engraçadas por ação; `meta.fallback` e `meta.attempts` preenchidos |
| M3-07 | `test(players): partida completa com cassetes` | M | M3-02..06 | uma partida de 8 modelos reproduzida no CI sem chave, resultado idêntico a cada execução |

## M4 — CLI e primeiras partidas (`apps/cli`)

| # | Item | Tam. | Depende de | Pronto quando |
|---|---|---|---|---|
| M4-01 | `feat(cli): iamigo generate` | M | M3 | flags `--selection`, `--participants`, `--seed`, `--out`; lê `OPENCODE_API_KEY`; mostra progresso e custo total |
| M4-02 | `feat(cli): escrita atômica + index.json` | P | M4-01 | arquivo temporário + `rename`; `matches/index.json` atualizado |
| M4-03 | `feat(cli): iamigo report` | M | M4-01 | custo, tokens, latência e taxa de fallback por partida, por modelo e por período |
| M4-04 | `chore: rodada de calibração do humor` | G | M4-01 | ~5 partidas reais; ajustes de prompt registrados; critérios: dicas em escada, provocações que funcionam, fallback < 5% |
| M4-05 | `docs: guia de instância própria` | P | M4-01 | README: chave, gerar, servir o site |

## M5 — Player web mobile-first (`apps/web`)

| # | Item | Tam. | Depende de | Pronto quando |
|---|---|---|---|---|
| M5-01 | `feat(web): app Vite + React` | P | M0 | build estático; fontes; tokens de cor do protótipo |
| M5-02 | `feat(web): carregar partidas` | P | M1-01, M5-01 | lê `matches/index.json` e a partida, com validação; lista de partidas |
| M5-03 | `feat(web): reducer de eventos → cena` | G | M1-08 | uma função pura, testada com a fixture, que transforma "eventos até o passo N" no estado da tela, sem spoiler |
| M5-04 | `feat(web): palco em ferradura (mobile)` | G | M5-03 | assentos, ir à frente (apresentador e alvo), assento vazio, animações de deslocamento |
| M5-05 | `feat(web): balões` | M | M5-04 | balão principal + mini-balões, faixa de comentários/dicas anteriores |
| M5-06 | `feat(web): controles e reprodução automática` | M | M5-03 | voltar/play/avançar, progresso, tempo por tipo de evento, pausa ao trocar de aba |
| M5-07 | `feat(web): placar e ordem da festa` | M | M5-03 | bottom sheet no mobile; seção fixa no desktop |
| M5-08 | `feat(web): layout desktop em semicírculo` | G | M5-04, M5-05 | mesmo componente, outra geometria a partir de ~900 px |
| M5-09 | `feat(web): acessibilidade` | M | M5-05..07 | navegação por teclado, rótulos, contraste, `prefers-reduced-motion`, narração em região `aria-live` |
| M5-10 | `ci: deploy do site estático` | M | M5-02, D3 | publica a cada merge na `main` |

## M6 — Lançamento da POC

| # | Item | Tam. | Depende de | Pronto quando |
|---|---|---|---|---|
| M6-01 | `content: 3 partidas curadas` | M | M4-04 | três partidas publicadas em `matches/` |
| M6-02 | `docs: README de lançamento` | P | M6-01 | GIF ou vídeo curto da partida, como rodar, aviso de não afiliação |
| M6-03 | `chore: relatório de custo da POC` | P | M4-03 | custo médio por partida registrado; decisão sobre teto de gasto |
| M6-04 | `docs: retrospectiva e próximos passos` | P | M6-01..03 | o que funcionou, o que mudar, prioridade do modo humano infiltrado |

---

## Pequenas decisões pendentes

| # | Decisão | Proposta | Bloqueia |
|---|---|---|---|
| D1 | Validação de schema em tempo de execução | Zod (gera tipos e JSON Schema para a saída estruturada dos LLMs) | M1-01 |
| D2 | SDK de LLM | Vercel AI SDK (já tem pacotes por família, que é como o Zen funciona) | M3-02 |
| D3 | Hospedagem da demo | Cloudflare Pages ou GitHub Pages (grátis, estático) | M5-10 |
| D4 | Domínio | — | M6-02 |

## Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Humor fraco ou repetitivo | Alto: é o produto | M4-04 com tempo reservado; personas fortes; dicas em escada; curadoria das partidas |
| Saída estruturada varia entre modelos do Zen | Médio | Validação + novas tentativas + extração tolerante de JSON; fala de emergência |
| Fatos errados nos dossiês | Médio (credibilidade) | Fonte obrigatória, validada no CI; revisão em PR |
| Bloqueio de vazamento com falso positivo | Baixo | Apelidos curados por dossiê; testes com casos reais |
| Custo maior que o esperado | Baixo | `meta.usage` desde o primeiro dia; `iamigo report`; modelos grátis para testes |
