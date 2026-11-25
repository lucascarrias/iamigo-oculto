import { describe, expect, expectTypeOf, it } from "vitest";
import { type MatchEvent, MatchValidationError, parseMatch } from "../src/index.ts";

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Valor ausente no teste");
  return value;
}

const at = "2026-11-25T12:00:00.000Z";
const participant = (id: string) => ({
  id,
  name: id,
  dossier: id,
  model: id,
  provider: "provedor",
});
const validMatch = () => ({
  id: "partida-1",
  schemaVersion: 1,
  seed: "semente",
  createdAt: at,
  participants: [participant("a"), participant("b"), participant("c")],
  events: [
    { type: "match_started", seq: 1, at, participants: ["a", "b", "c"], firstPresenter: "a" },
    { type: "draw_completed", seq: 2, at, cycle: ["a", "b", "c"] },
    {
      type: "gift_chosen",
      seq: 3,
      at,
      by: "a",
      gift: { name: "livro", line: "para você" },
      meta: {
        model: "modelo",
        provider: "provedor",
        attempts: 1,
        fallback: false,
        latencyMs: 0,
        usage: { inputTokens: 0, outputTokens: 1 },
      },
    },
    { type: "turn_started", seq: 4, at, turn: 1, presenter: "a" },
    { type: "hint_given", seq: 5, at, turn: 1, round: 1, text: "O meu amigo oculto..." },
    { type: "guess_made", seq: 6, at, turn: 1, round: 1, by: "b", target: "c" },
    { type: "round_scored", seq: 7, at, turn: 1, round: 1, hits: 1, total: 2 },
    { type: "friend_revealed", seq: 8, at, turn: 1, presenter: "a", target: "b" },
    { type: "gift_delivered", seq: 9, at, turn: 1, from: "a", to: "b" },
    { type: "thanks_given", seq: 10, at, turn: 1, by: "b", to: "a", text: "Obrigado!" },
    { type: "match_finished", seq: 11, at, scores: { a: 0, b: 3, c: 0 } },
  ],
});

describe("schema de partida", () => {
  it("aceita uma partida válida", () => {
    expect(parseMatch(validMatch())).toEqual(validMatch());
  });
  it("exporta exatamente os onze tipos de evento", () => {
    expectTypeOf<MatchEvent["type"]>().toEqualTypeOf<
      | "match_started"
      | "draw_completed"
      | "gift_chosen"
      | "turn_started"
      | "hint_given"
      | "guess_made"
      | "round_scored"
      | "friend_revealed"
      | "gift_delivered"
      | "thanks_given"
      | "match_finished"
    >();
  });
  it.each([
    [
      "tipo desconhecido",
      (m: ReturnType<typeof validMatch>) => {
        required(m.events[0]).type = "desconhecido";
      },
      "events.0.type",
    ],
    [
      "rodada inválida",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(m.events[5]), { round: 4 });
      },
      "events.5.round",
    ],
    [
      "seq ausente",
      (m: ReturnType<typeof validMatch>) => {
        Reflect.deleteProperty(required(m.events[0]), "seq");
      },
      "events.0.seq",
    ],
    [
      "lacuna na sequência",
      (m: ReturnType<typeof validMatch>) => {
        required(m.events[2]).seq = 4;
      },
      "events.2.seq",
    ],
    [
      "versão inválida",
      (m: ReturnType<typeof validMatch>) => {
        m.schemaVersion = 2;
      },
      "schemaVersion",
    ],
    [
      "tentativas inválidas",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(required(m.events[2]).meta), { attempts: 5 });
      },
      "events.2.meta.attempts",
    ],
    [
      "meta em evento não LLM",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(m.events[3]), { meta: required(m.events[2]).meta });
      },
      "events.3",
    ],
    [
      "chave extra",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(m.events[0]), { extra: true });
      },
      "events.0",
    ],
    [
      "participante desconhecido",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(m.events[5]), { target: "x" });
      },
      "events.5.target",
    ],
    [
      "pontuação de desconhecido",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(required(m.events[10]).scores), { x: 1 });
      },
      "events.10.scores.x",
    ],
  ])("rejeita %s", (_name, mutate, path) => {
    const match = validMatch();
    mutate(match);
    expect(() => parseMatch(match)).toThrow(MatchValidationError);
    expect(() => parseMatch(match)).toThrow(path);
  });
  it.each([
    [
      "id vazio",
      (m: ReturnType<typeof validMatch>) => {
        required(m.participants[0]).id = "";
      },
      "participants.0.id",
    ],
    [
      "nome vazio",
      (m: ReturnType<typeof validMatch>) => {
        required(m.participants[0]).name = "";
      },
      "participants.0.name",
    ],
    [
      "dossiê vazio",
      (m: ReturnType<typeof validMatch>) => {
        required(m.participants[0]).dossier = "";
      },
      "participants.0.dossier",
    ],
    [
      "modelo vazio",
      (m: ReturnType<typeof validMatch>) => {
        required(m.participants[0]).model = "";
      },
      "participants.0.model",
    ],
    [
      "provedor vazio",
      (m: ReturnType<typeof validMatch>) => {
        required(m.participants[0]).provider = "";
      },
      "participants.0.provider",
    ],
    [
      "nome de presente vazio",
      (m: ReturnType<typeof validMatch>) => {
        required(required(m.events[2]).gift).name = "";
      },
      "events.2.gift.name",
    ],
    [
      "frase de presente vazia",
      (m: ReturnType<typeof validMatch>) => {
        required(required(m.events[2]).gift).line = "";
      },
      "events.2.gift.line",
    ],
    [
      "dica vazia",
      (m: ReturnType<typeof validMatch>) => {
        required(m.events[4]).text = "";
      },
      "events.4.text",
    ],
    [
      "agradecimento vazio",
      (m: ReturnType<typeof validMatch>) => {
        required(m.events[9]).text = "";
      },
      "events.9.text",
    ],
    [
      "comentário vazio",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(m.events[5]), { quip: "" });
      },
      "events.5.quip",
    ],
    [
      "modelo de meta vazio",
      (m: ReturnType<typeof validMatch>) => {
        required(required(m.events[2]).meta).model = "";
      },
      "events.2.meta.model",
    ],
    [
      "provedor de meta vazio",
      (m: ReturnType<typeof validMatch>) => {
        required(required(m.events[2]).meta).provider = "";
      },
      "events.2.meta.provider",
    ],
    [
      "eventos vazios",
      (m: ReturnType<typeof validMatch>) => {
        m.events = [];
      },
      "events",
    ],
  ])("rejeita %s", (_name, mutate, path) => {
    const match = validMatch();
    mutate(match);
    expect(() => parseMatch(match)).toThrow(`Partida inválida: ${path}:`);
  });
  it("rejeita dois participantes pelo tamanho", () => {
    const match = validMatch();
    match.participants = match.participants.slice(0, 2);
    match.events = [
      { type: "match_started", seq: 1, at, participants: ["a", "b"], firstPresenter: "a" },
    ];
    expect(() => parseMatch(match)).toThrow(/Partida inválida: participants: valor inválido/);
  });
  it("rejeita treze participantes pelo tamanho", () => {
    const match = validMatch();
    match.participants.push(...Array.from({ length: 10 }, (_, i) => participant(`p${i}`)));
    expect(() => parseMatch(match)).toThrow(/Partida inválida: participants: valor inválido/);
  });
  it("rejeita ids duplicados", () => {
    const match = validMatch();
    match.participants[1] = participant("a");
    match.events = [
      { type: "match_started", seq: 1, at, participants: ["a", "c"], firstPresenter: "a" },
    ];
    expect(() => parseMatch(match)).toThrow(
      /participants\.1\.id: Identificador de participante duplicado/,
    );
  });
  it.each([
    ["acertos negativos", 6, "hits", -1, /events\.6\.hits/],
    ["total fracionário", 6, "total", 1.5, /events\.6\.total/],
    ["pontuação negativa", 10, "scores", { a: -1, b: 3, c: 0 }, /events\.10\.scores\.a/],
    ["pontuação fracionária", 10, "scores", { a: 0.5, b: 3, c: 0 }, /events\.10\.scores\.a/],
  ])("rejeita %s", (_name, index, field, value, path) => {
    const match = validMatch();
    Object.assign(required(match.events[index]), { [field]: value });
    expect(() => parseMatch(match)).toThrow(path);
  });
  it("informa o caminho do erro em português", () => {
    const match = validMatch();
    required(match.events[1]).seq = 4;
    expect(() => parseMatch(match)).toThrow(/Partida inválida:.*events\.1\.seq/);
  });
});
