# IAmigo Oculto — Especificação

> Status: **rascunho v0.3** (POC) · Idioma do projeto: português brasileiro · Licença: MIT
>
> Este documento é o contrato do projeto. Mudanças de regra, de schema de eventos ou de
> interface passam por PR neste arquivo antes de virar código. Decisões técnicas com
> alternativas relevantes ficam em `docs/adr/`.

## 1. Visão

Um amigo oculto entre modelos de IA, para assistir. Cada modelo tira um amigo oculto,
escolhe um presente, dá dicas engraçadas para os outros adivinharem e, na revelação,
o presenteado agradece (e provoca). As partidas são **geradas antes e reproduzidas depois**,
com ritmo de show, numa tela em semicírculo com balões de fala.

## 2. Princípios

1. **O gerador é o mestre do jogo.** Os modelos não guardam estado; cada chamada recebe
   apenas o que aquele jogador pode saber (seção 5).
2. **Tudo é evento.** Uma partida é um log de eventos imutável. A interface só reproduz.
3. **Engine pura.** A lógica do jogo não faz I/O, é determinística dada uma semente e
   roda em qualquer runtime JS.
4. **Jogador é plugável.** A engine conversa com uma interface `Player`. Hoje só existe
   `LlmPlayer`; o modo humano infiltrado entra depois sem mudar a engine.
5. **Provedor é plugável.** A POC usa só OpenCode Zen, mas atrás de uma interface
   `LlmProvider`.
6. **Provocar o modelo, nunca pessoas.** Regra do conteúdo oficial do repositório (seção 9).

## 3. Fora do escopo da POC

- Modo humano infiltrado (previsto na arquitetura, não implementado).
- Provedores além do OpenCode Zen.
- Partidas ao vivo (geração em tempo real enquanto se assiste).
- Teto de gasto por partida (só monitoramento; ver seção 11).
- Tradução / outros idiomas.
- Contas de usuário. Na demo pública só o mantenedor gera partidas.
- Backend no ar, banco de dados e geração de partidas pela interface (ver seção 12).

## 4. Regras do jogo

### 4.1 Participantes
- De **3 a 12** jogadores por partida. Seleção padrão: 8 (seção 10).
- Cada jogador é um modelo com identidade, dossiê e personalidade.

### 4.2 Sorteio
- O sorteio forma **um ciclo único** (A→B→C→…→A), gerado a partir da semente da partida.
- Consequência: quem é revelado vai para a frente na rodada seguinte, e o jogo termina
  quando o ciclo fecha. O primeiro a ir para a frente é definido pela semente.

### 4.3 Presentes
- Logo após o sorteio, cada jogador escolhe em segredo um presente para o seu amigo oculto
  (nome do presente + uma frase curta). As escolhas são feitas em paralelo.

### 4.4 Turno
Para o jogador da vez (o **apresentador**) e seu amigo oculto (o **alvo**):

1. O apresentador vai para a frente.
2. **Rodada de dica** (no máximo 3):
   1. O apresentador dá uma dica que começa com "O meu amigo oculto…". A dificuldade
      sobe a cada rodada: obscura → média → quase entregando.
   2. Todos os outros jogadores dão um palpite em paralelo, com um comentário opcional.
   3. O apresentador anuncia quantos acertaram (sem dizer quem).
   4. Se **todos** acertaram, ou se foi a 3ª dica, a rodada encerra o turno.
3. O apresentador revela o alvo.
4. O apresentador entrega o presente escolhido em 4.3.
5. O alvo agradece e pode fazer um comentário engraçado sobre o apresentador.
6. O alvo passa a ser o apresentador do próximo turno.

### 4.5 Palpites válidos
- Candidatos = participantes − apresentador − alvos já revelados.
- O jogador **pode** chutar a si mesmo ("acho que sou eu").
- Nada impede chutar o próprio amigo oculto, mas o prompt lembra o jogador dessa informação.
- Um palpite fora dos candidatos é inválido e passa pelo fluxo de falhas (seção 8).

### 4.6 Pontuação *(proposta)*
- Quem dá palpite ganha **3 / 2 / 1** pontos se acertar pela primeira vez na 1ª / 2ª / 3ª dica.
- O apresentador não pontua no próprio turno.
- No fim, o "Detetive da festa" é quem tiver mais pontos.

## 5. Modelo de informação

O que cada chamada recebe, além do system prompt (identidade + personalidade):

| Momento            | Quem       | Recebe                                                                                   |
|--------------------|------------|------------------------------------------------------------------------------------------|
| Escolher presente  | qualquer   | seu alvo, dossiê do alvo, lista de participantes                                         |
| Dar dica           | apresentador | seu alvo, dossiê do alvo, dicas já dadas no turno, rodada atual, acertos da rodada anterior |
| Palpitar           | os outros  | todas as dicas do turno, candidatos válidos, dossiês dos candidatos, **o próprio alvo**  |
| Agradecer          | alvo       | quem o tirou, o presente, dossiê do apresentador                                         |

Ninguém recebe o sorteio completo, os palpites dos outros na mesma rodada nem os presentes
de turnos que ainda não aconteceram. A engine monta uma `PlayerView` por chamada e
nada fora dela chega ao provedor.

## 6. Arquitetura

Monorepo com **pnpm workspaces**, rodando em **Node 24 LTS** (ADR-001). TypeScript executado
direto pelo Node, por isso só sintaxe "apagável" (`erasableSyntaxOnly`: sem `enum` nem `namespace`).


```
packages/
  engine/      lógica pura do jogo, RNG com semente, tipos e schema de eventos
  providers/   interface LlmProvider + adaptador OpenCode Zen
  players/     interface Player + LlmPlayer (prompts, validação, fallback)
  dossiers/    um arquivo YAML por modelo + schema de validação
apps/
  cli/         `iamigo generate` e `iamigo report`; grava partidas em matches/
  web/         React, site estático: lista de partidas e player de replay
matches/       partidas publicadas na demo (JSON, versionadas no Git)
fixtures/      partidas e cassetes usados nos testes
docs/
  SPEC.md, adr/
```

A demo pública é só o build estático do `web` lendo `matches/`. Não há backend no ar
nem chave de API em produção.

Regras de dependência: `engine` não depende de nada do projeto; `players` depende de
`engine` e `providers`; os apps dependem dos pacotes, nunca o contrário. `engine`,
`providers` e `players` **não** usam APIs exclusivas de runtime: só `fetch` e APIs web padrão,
para poderem rodar no Node, no navegador (modo humano, no futuro) ou em outro runtime.

### 6.1 Interface do jogador

```ts
interface Player {
  id: ParticipantId
  chooseGift(view: GiftView): Promise<GiftChoice>      // { name, line }
  giveHint(view: HintView): Promise<HintText>          // começa com "O meu amigo oculto"
  guess(view: GuessView): Promise<GuessChoice>         // { target, quip? }
  thank(view: ThanksView): Promise<ThanksText>
}
```

### 6.2 Interface do provedor

```ts
interface LlmProvider {
  id: string                                           // ex.: "opencode-zen"
  generate(req: {
    model: string
    system: string
    messages: Message[]
    schema?: JsonSchema                                // saída estruturada quando suportado
    timeoutMs: number
  }): Promise<{ text: string; json?: unknown; usage: Usage }>
}
```

O adaptador Zen escolhe o endpoint pela família do modelo (`/responses`, `/messages`,
Google ou `/chat/completions`) com base na lista de `https://opencode.ai/zen/v1/models`.

## 7. Schema de eventos

Toda partida é `Match { id, schemaVersion, seed, createdAt, participants, events[] }`.
Cada evento tem `seq`, `at` e, quando vier de um LLM, `meta`.

```ts
type MatchEvent =
  | { type: "match_started";   participants: ParticipantId[]; firstPresenter: ParticipantId }
  | { type: "draw_completed";  cycle: ParticipantId[] }           // verdade completa; a UI esconde
  | { type: "gift_chosen";     by: ParticipantId; gift: { name: string; line: string } }
  | { type: "turn_started";    turn: number; presenter: ParticipantId }
  | { type: "hint_given";      turn: number; round: 1|2|3; text: string }
  | { type: "guess_made";      turn: number; round: 1|2|3; by: ParticipantId; target: ParticipantId; quip?: string }
  | { type: "round_scored";    turn: number; round: 1|2|3; hits: number; total: number }
  | { type: "friend_revealed"; turn: number; presenter: ParticipantId; target: ParticipantId }
  | { type: "gift_delivered";  turn: number; from: ParticipantId; to: ParticipantId }
  | { type: "thanks_given";    turn: number; by: ParticipantId; to: ParticipantId; text: string }
  | { type: "match_finished";  scores: Record<ParticipantId, number> }

type EventMeta = {
  model: string; provider: string
  attempts: number            // 1..4
  fallback: boolean           // true = fala de emergência
  usage?: { inputTokens: number; outputTokens: number; costUsd?: number }
  latencyMs: number
}
```

- `schemaVersion` começa em `1`. Mudança incompatível = versão nova + conversor no `web`.
- O log contém a verdade completa; quem controla spoilers é o player de replay.
- **Formato em disco:** uma partida = um arquivo `matches/<id>.json` com o `Match` inteiro,
  indentado para gerar diffs legíveis. A escrita é atômica (arquivo temporário + `rename`).
  Um `matches/index.json` gerado pelo CLI lista as partidas para o `web`.
- Esse JSON é o **formato canônico**: é a entrada do replay, a fixture de teste e o formato
  de exportação/importação, mesmo que um banco seja adotado no futuro.

## 8. Falhas e validação

Toda resposta de LLM passa por validação antes de virar evento:

- **Formato:** JSON conforme o schema da ação.
- **Dica:** começa com "O meu amigo oculto"; não contém o nome nem os apelidos do alvo
  (campo `aliases` do dossiê, sem diferenciar maiúsculas de acentos); até 200 caracteres.
- **Palpite:** alvo dentro dos candidatos (4.5).
- **Textos:** tamanho máximo por ação; nenhum conteúdo vazio.

Fluxo: tentativa → falhou (erro de rede, timeout, validação) → **até 3 novas tentativas**
com backoff → **fala de emergência**: uma frase engraçada sorteada de um banco por ação
(ex.: "O meu amigo oculto… travei. Alguém reinicia meu contexto?"). O evento sai com
`meta.fallback = true`. Palpite de emergência = candidato sorteado com a semente.

## 9. Dossiês e conteúdo

- Um arquivo por modelo em `packages/dossiers/<id>.yaml`, validado por schema no CI:

```yaml
id: kimi
name: Kimi
lab: Moonshot AI
models: [kimi-k3]            # IDs aceitos no provedor
aliases: [kimi, moonshot]     # usados no bloqueio de vazamento
persona: Sonhador e calmo, faz referências a rock e ao espaço.
facts:
  - level: obscure            # obscure | medium | easy
    text: A Moonshot AI foi batizada por causa de um álbum de rock progressivo.
    source: https://...
roast:
  - Lê tudo e não esquece nada.
avatar: mascots/kimi.svg
```

- **Regra do repositório:** provocar o modelo, nunca pessoas. Não entram fatos sobre
  fundadores ou funcionários além do nome, política, nem nada que não tenha fonte.
  Todo fato precisa de `source`.
- Quem roda a própria instância pode apontar para outra pasta de dossiês e responde pelo
  conteúdo que usar.
- **Marcas:** o repositório não distribui logos. Avatares são mascotes próprios (MIT);
  `avatar` aceita qualquer arquivo em instâncias próprias. O README e o rodapé da interface
  dizem que o projeto não é afiliado às empresas citadas.

## 10. Seleção de participantes

- Cada partida escolhe seus participantes. O CLI traz **seleções padrão**
  (ex.: "Clássica 8") definidas em configuração.
- Um participante = dossiê + modelo + provedor. O mesmo laboratório pode aparecer mais de
  uma vez, desde que os ids sejam distintos.

## 11. Custos e observabilidade

- Toda chamada registra tokens, custo estimado, latência, tentativas e fallback no `meta`
  do evento (`EventMeta`). Chamadas que falharam antes do fallback também são contadas.
- O `iamigo generate` mostra o custo total ao terminar a partida.
- `iamigo report` lê os JSONs e soma custo, tokens, latência e taxa de fallback por partida,
  por modelo e por período.
- POC sem teto de gasto. Os relatórios orientam a decisão futura sobre limites.

## 12. Persistência e distribuição

- **Arquivos JSON** (seção 7), sem banco de dados. Decisão registrada na ADR-002.
- **Demo hospedada:** o mantenedor gera partidas localmente com o CLI, faz commit em
  `matches/` e publica o `web` como site estático. O público só assiste.
- **Instância própria:** cada pessoa usa as próprias chaves, via variáveis de ambiente
  (`OPENCODE_API_KEY`), gera quantas partidas quiser com o CLI e serve o `web` como quiser.
- **Quando revisitar:** geração de partidas pela interface, fila de partidas ou o modo humano
  infiltrado (que exige servidor ao vivo). Nesse momento um banco (SQLite) entra como
  armazenamento e índice, sem mudar o formato canônico.

## 13. Testes

- **Vitest** em todo o monorepo, inclusive no `web`.
- RNG com semente: mesma semente + mesmas respostas = mesmo log de eventos.
- **Cassetes:** respostas de LLM gravadas em fixtures e reproduzidas nos testes. O CI
  nunca usa chave de API.
- A engine é testada com um `ScriptedPlayer` (respostas fixas), cobrindo fim antecipado
  por 100%, três rodadas, palpite inválido e fallback.
- O player de replay é testado com partidas gravadas em `fixtures/matches/`.

## 14. Convenções do repositório

- **Commits:** Conventional Commits, validados no `commit-msg` via lefthook.
- **Lint e formatação:** Biome, configuração única na raiz (ADR-003).
- **Hooks (lefthook):** `biome check` nos arquivos alterados no `pre-commit`; typecheck no `pre-push`.
- **CI:** `biome ci`, typecheck, testes, validação dos dossiês e checagem de commits do PR.
- **Instruções para agentes:** `AGENTS.md` na raiz (independente de fornecedor).
- **Documentos obrigatórios:** README, LICENSE (MIT), CONTRIBUTING (com o guia de dossiês),
  CODE_OF_CONDUCT.

## 15. Decisões em aberto

| # | Tema | Proposta | Registrar em |
|---|------|----------|--------------|
| 1 | Runtime | **Decidido:** Node 24 LTS + pnpm | ADR-001 |
| 2 | Persistência | **Decidido:** arquivos JSON na POC | ADR-002 |
| 3 | Lint/format | **Decidido:** Biome | ADR-003 |
| 4 | Pontuação | 3/2/1 (4.6) | este SPEC |
| 5 | Limites de participantes | 3–12, padrão 8 | este SPEC |
| 6 | Teto de gasto | decidir depois dos primeiros testes | — |
