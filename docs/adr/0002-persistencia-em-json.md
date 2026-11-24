# ADR-002: Partidas em arquivos JSON na POC

- **Status:** aceita
- **Data:** 2026-11-24
- **Relacionado:** SPEC seções 7, 11 e 12

## Contexto

Uma partida é um log de eventos imutável, gerado uma vez e reproduzido muitas vezes.
Na demo pública só o mantenedor gera partidas; quem roda a própria instância usa as
próprias chaves. Também precisamos de fixtures para os testes e de um jeito simples de
compartilhar partidas. A alternativa considerada foi SQLite (via Drizzle) com as tabelas
`matches`, `match_events` e `llm_calls`.

## Decisão

Na POC, cada partida é um arquivo `matches/<id>.json` com o `Match` completo. Não há banco
de dados nem backend no ar: o CLI gera as partidas e o `web` é um site estático que lê
`matches/`. Esse JSON é o formato canônico do projeto.

## Consequências

**Positivas**
- A demo é um site estático: sem custo de servidor, sem endpoint exposto e sem chave de API
  em produção.
- Partidas versionadas no Git, revisáveis em PR e com diff legível.
- Um formato só para replay, fixtures de teste e troca entre instâncias.
- Sem migrations, ORM ou dependência nativa; nenhum pacote fica preso a um runtime.

**Negativas e como mitigamos**
- Consultas entre partidas exigem ler todos os arquivos. Aceitável no volume esperado;
  `iamigo report` faz as agregações de custo.
- Risco de arquivo corrompido se o processo cair durante a escrita. Escrita atômica
  (arquivo temporário + `rename`).
- Não suporta geração de partidas pela interface nem concorrência.

## Quando revisitar

Quando houver geração de partidas pela interface, fila de partidas ou o modo humano
infiltrado. Nesse caso um banco (provavelmente SQLite) entra como armazenamento e índice;
o JSON continua sendo o formato de exportação e importação.
