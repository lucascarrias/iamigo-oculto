import { describe, expect, it } from "vitest";
import { isValidGuess, ROUND_POINTS, scoresFromEvents, validCandidates } from "../src/rules.ts";
import type { MatchEvent, ParticipantId } from "../src/schema.ts";

const ids = ["gpt", "mistral", "claude", "kimi", "gemini", "glm", "deepseek", "qwen"];
const pid = (id: string) => id as ParticipantId;

type EventDescription = MatchEvent extends infer Event
  ? Event extends MatchEvent
    ? Omit<Event, "seq" | "at">
    : never
  : never;

function makeEvents(descriptions: readonly EventDescription[]): MatchEvent[] {
  return descriptions.map((event, index) => ({
    ...event,
    seq: index + 1,
    at: `2026-11-25T00:00:${String(index).padStart(2, "0")}.000Z`,
  })) as MatchEvent[];
}

describe("regras de palpites e pontuação", () => {
  it("mantém a ordem dos assentos e permite o palpite em si mesmo e no próprio alvo", () => {
    const candidates = validCandidates(["a", "b", "c", "d"], "b", ["d"]);
    expect(candidates).toEqual(["a", "c"]);
    expect(isValidGuess(candidates, "a")).toBe(true);
    expect(isValidGuess(candidates, "b")).toBe(false);
    expect(isValidGuess(candidates, "d")).toBe(false);
    expect(isValidGuess(["a", "c"], "c")).toBe(true);
  });

  it("dá 3/2/1 pelo primeiro acerto, sem pontuar erro ou apresentador", () => {
    expect(ROUND_POINTS).toEqual({ 1: 3, 2: 2, 3: 1 });
    const events = makeEvents([
      { type: "turn_started", turn: 1, presenter: pid("a") },
      { type: "guess_made", turn: 1, round: 1, by: pid("a"), target: pid("z") },
      { type: "guess_made", turn: 1, round: 1, by: pid("b"), target: pid("wrong") },
      { type: "guess_made", turn: 1, round: 1, by: pid("c"), target: pid("z") },
      { type: "guess_made", turn: 1, round: 2, by: pid("c"), target: pid("z") },
      { type: "guess_made", turn: 1, round: 2, by: pid("d"), target: pid("z") },
      { type: "guess_made", turn: 1, round: 3, by: pid("e"), target: pid("z") },
      { type: "friend_revealed", turn: 1, presenter: pid("a"), target: pid("z") },
    ]);
    expect(scoresFromEvents(["a", "b", "c", "d", "e"], events)).toEqual({
      a: 0,
      b: 0,
      c: 3,
      d: 2,
      e: 1,
    });
  });

  it("acumula pontos por turno e inclui participantes zerados", () => {
    const events = makeEvents([
      { type: "turn_started", turn: 1, presenter: pid("a") },
      { type: "guess_made", turn: 1, round: 1, by: pid("b"), target: pid("c") },
      { type: "friend_revealed", turn: 1, presenter: pid("a"), target: pid("c") },
      { type: "turn_started", turn: 2, presenter: pid("c") },
      { type: "guess_made", turn: 2, round: 3, by: pid("b"), target: pid("a") },
      { type: "friend_revealed", turn: 2, presenter: pid("c"), target: pid("a") },
    ]);
    expect(scoresFromEvents(["a", "b", "c", "unused"], events)).toEqual({
      a: 0,
      b: 4,
      c: 0,
      unused: 0,
    });
  });

  it("não pontua o turno aberto até a revelação", () => {
    const prefix = makeEvents([
      { type: "turn_started", turn: 1, presenter: pid("a") },
      { type: "guess_made", turn: 1, round: 1, by: pid("b"), target: pid("c") },
    ]);
    const complete = makeEvents([
      { type: "turn_started", turn: 1, presenter: pid("a") },
      { type: "guess_made", turn: 1, round: 1, by: pid("b"), target: pid("c") },
      { type: "friend_revealed", turn: 1, presenter: pid("a"), target: pid("c") },
    ]);
    expect(scoresFromEvents(["a", "b", "c"], prefix)).toEqual({ a: 0, b: 0, c: 0 });
    expect(scoresFromEvents(["a", "b", "c"], complete)).toEqual({ a: 0, b: 3, c: 0 });
  });

  it("calcula a pontuação do turno 1 do protótipo", () => {
    // GPT apresenta, então não pontua. Mistral, Claude, Kimi, Gemini, GLM e DeepSeek
    // acertam na rodada 1 (+3 cada); Qwen erra na rodada 1 e acerta na 2 (+2).
    const events = makeEvents([
      { type: "turn_started", turn: 1, presenter: pid("gpt") },
      { type: "guess_made", turn: 1, round: 1, by: pid("mistral"), target: pid("mistral") },
      { type: "guess_made", turn: 1, round: 1, by: pid("claude"), target: pid("mistral") },
      { type: "guess_made", turn: 1, round: 1, by: pid("kimi"), target: pid("mistral") },
      { type: "guess_made", turn: 1, round: 1, by: pid("gemini"), target: pid("mistral") },
      { type: "guess_made", turn: 1, round: 1, by: pid("glm"), target: pid("mistral") },
      { type: "guess_made", turn: 1, round: 1, by: pid("deepseek"), target: pid("mistral") },
      { type: "guess_made", turn: 1, round: 1, by: pid("qwen"), target: pid("deepseek") },
      { type: "guess_made", turn: 1, round: 2, by: pid("mistral"), target: pid("mistral") },
      { type: "guess_made", turn: 1, round: 2, by: pid("claude"), target: pid("mistral") },
      { type: "guess_made", turn: 1, round: 2, by: pid("kimi"), target: pid("mistral") },
      { type: "guess_made", turn: 1, round: 2, by: pid("gemini"), target: pid("mistral") },
      { type: "guess_made", turn: 1, round: 2, by: pid("glm"), target: pid("mistral") },
      { type: "guess_made", turn: 1, round: 2, by: pid("deepseek"), target: pid("mistral") },
      { type: "guess_made", turn: 1, round: 2, by: pid("qwen"), target: pid("mistral") },
      { type: "friend_revealed", turn: 1, presenter: pid("gpt"), target: pid("mistral") },
    ]);
    expect(scoresFromEvents(ids, events)).toEqual({
      gpt: 0,
      mistral: 3,
      claude: 3,
      kimi: 3,
      gemini: 3,
      glm: 3,
      deepseek: 3,
      qwen: 2,
    });
  });
});
