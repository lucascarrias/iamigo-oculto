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
    {
      type: "gift_chosen",
      seq: 2,
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
    { type: "turn_started", seq: 3, at, turn: 1, presenter: "a" },
    { type: "guess_made", seq: 4, at, turn: 1, round: 1, by: "b", target: "c" },
    { type: "match_finished", seq: 5, at, scores: { a: 0, b: 3, c: 0 } },
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
    ],
    [
      "rodada inválida",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(m.events[3]), { round: 4 });
      },
    ],
    [
      "seq ausente",
      (m: ReturnType<typeof validMatch>) => {
        Reflect.deleteProperty(required(m.events[0]), "seq");
      },
    ],
    [
      "lacuna na sequência",
      (m: ReturnType<typeof validMatch>) => {
        required(m.events[1]).seq = 3;
      },
    ],
    [
      "versão inválida",
      (m: ReturnType<typeof validMatch>) => {
        m.schemaVersion = 2;
      },
    ],
    [
      "tentativas inválidas",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(required(m.events[1]).meta), { attempts: 5 });
      },
    ],
    [
      "meta em evento não LLM",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(m.events[2]), { meta: required(m.events[1]).meta });
      },
    ],
    [
      "chave extra",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(m.events[0]), { extra: true });
      },
    ],
    [
      "participante desconhecido",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(m.events[3]), { target: "x" });
      },
    ],
    [
      "dois participantes",
      (m: ReturnType<typeof validMatch>) => {
        m.participants = m.participants.slice(0, 2);
      },
    ],
    [
      "treze participantes",
      (m: ReturnType<typeof validMatch>) => {
        m.participants = Array.from({ length: 13 }, (_, i) => participant(`p${i}`));
      },
    ],
    [
      "ids duplicados",
      (m: ReturnType<typeof validMatch>) => {
        m.participants[1] = participant("a");
      },
    ],
    [
      "pontuação de desconhecido",
      (m: ReturnType<typeof validMatch>) => {
        Object.assign(required(required(m.events[4]).scores), { x: 1 });
      },
    ],
  ])("rejeita %s", (_name, mutate) => {
    const match = validMatch();
    mutate(match);
    expect(() => parseMatch(match)).toThrow(MatchValidationError);
  });
  it("informa o caminho do erro em português", () => {
    const match = validMatch();
    required(match.events[1]).seq = 4;
    expect(() => parseMatch(match)).toThrow(/Partida inválida:.*events\.1\.seq/);
  });
});
