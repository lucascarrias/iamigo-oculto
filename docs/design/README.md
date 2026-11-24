# Referência visual

Estas telas são a **referência visual** do player (SPEC §15). Elas mostram o visual e o
comportamento esperados; não são código de produção. Na dúvida entre a tela e o SPEC,
vale o SPEC.

## Arquivos

| Arquivo | O que mostra |
|---|---|
| `mobile/1-dica.html` | Apresentador no centro dando a dica; os outros "pensando"; dicas anteriores abaixo do palco |
| `mobile/2-palpites.html` | Mini-balões com o palpite sobre cada assento; resultado da rodada no centro; comentários abaixo |
| `mobile/3-revelacao.html` | Alvo vai à frente ao lado do apresentador; pontos de cada um nos assentos |
| `mobile/4-presente.html` | Balão principal com o presente |
| `mobile/5-agradecimento.html` | O alvo agradece; o balão aponta para quem fala |
| `mobile/6-placar.html` | Placar e ordem da festa num painel que sobe de baixo |
| `desktop/prototipo-desktop.dc.html` | Protótipo clicável do desktop, no formato do canvas de design (não abre sozinho no navegador). Serve de referência para o layout em semicírculo, as posições, os tempos da reprodução automática e a partida roteirizada usada na fixture M1-08 |

Os arquivos `mobile/*.html` abrem direto no navegador. Todos mostram a rodada 3 da partida
de exemplo (Claude → Kimi).

## Tokens

| Token | Valor | Uso |
|---|---|---|
| `ink` | `#1F2433` | texto, contornos de avatar, balões e botões |
| `muted` | `#4A5268` | rótulos, textos secundários |
| `ground` | `#EEF2FA` | fundo da página |
| `surface` | `#FFFFFF` | palco, balões, cartões |
| `coral` | `#C8432F` | ação principal (play), turno atual, chapéu do apresentador |
| `blue` | `#2456C9` | acerto, destaque do alvo, itens já revelados |
| `orange` | `#C2601B` | erro (palpite errado) |
| `stage-floor` | `#F7E2C4` / borda `#E6C79C` | chão do palco |

Cores dos mascotes: GPT `#7FD3AE`, Mistral `#F59AA6`, Claude `#F5B27A`, Kimi `#F3CF63`,
Gemini `#93B4F7`, GLM `#7FD0D8`, DeepSeek `#B3BCF7`, Qwen `#CDAEF6`. Elas são
provisórias até os mascotes definitivos (M2-03) e devem vir do dossiê, não do código.

**Tipografia:** Fredoka 500–700 para títulos, falas grandes e narração; Nunito 600–800
para o resto. Tamanho mínimo de 11 px (nomes nos assentos).

**Forma:** contornos de 2–2,5 px em `ink`, cantos bem arredondados (balões 12–18 px,
cartões 16–22 px, botões em pílula ou círculo), sombra "chapada" `0 3px 0 rgba(31,36,51,.18)`.
Nada de gradientes, a não ser a luz suave no chão do palco.

## Layout mobile (390 × 844 de referência)

- **Topo (60 px):** logo, indicador da rodada ("Rodada 3/8") e botão do placar.
- **Palco (470 px):** 8 assentos em ferradura. Posições de referência (centro do avatar,
  relativas ao palco), na ordem dos assentos:
  `(45,415) (38,280) (78,160) (152,89) (238,89) (312,160) (352,280) (345,415)`.
  Centro sozinho: `(195,420)`. Apresentador + alvo: `(135,420)` e `(255,420)`.
- **Avatar:** 44 px no assento, escala 1,15 no centro; o apresentador usa chapéu de festa.
- **Balão principal:** 240–270 px de largura, ancorado pela base cerca de 112 px acima do pé
  do palco, cauda apontando para quem fala.
- **Mini-balões:** só uma palavra ou número (o palpite, `+3`, "…").
- **Faixa abaixo do palco:** narração (Fredoka 17 px) + cartão com dicas anteriores,
  comentários ou pontos da rodada.
- **Controles fixos embaixo:** progresso + voltar (48 px) / play (60 px) / avançar (48 px).
- **Placar:** bottom sheet de ~600 px com ranking e ordem da festa.

## Desktop

O desktop usa o mesmo conceito com assentos em semicírculo (ver `desktop/`), o placar e a
ordem da festa visíveis abaixo do palco, e os controles ao lado da narração. Ele é
construído depois do mobile (M5-08), reaproveitando os mesmos componentes com outra geometria.

## Comportamento

- Toda mudança de lugar (ir à frente, voltar ao assento) é animada (~0,8 s).
- Balões aparecem com um "pop" curto. Com `prefers-reduced-motion`, sem animação.
- Tempos de referência da reprodução automática estão em `DELAY` no protótipo de desktop.
- Nada que os jogadores ainda não sabem aparece na tela (SPEC §7).
