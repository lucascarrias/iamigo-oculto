import { describe, expect, it } from "vitest";
import { createRng, DrawError, drawCycle, targetOf } from "../src/index.ts";
import type { ParticipantId } from "../src/schema.ts";

function participantIds(count: number): ParticipantId[] {
  return Array.from({ length: count }, (_, index) => `participant-${index + 1}`);
}

describe("drawCycle", () => {
  it("forma um ciclo único para 3–12 participantes e 100 sementes", () => {
    for (let count = 3; count <= 12; count += 1) {
      const participants = participantIds(count);
      for (let seed = 0; seed < 100; seed += 1) {
        const draw = drawCycle(participants, createRng(`draw-${count}-${seed}`));
        const received = draw.cycle.map((presenter) => targetOf(draw.cycle, presenter));
        expect(new Set(draw.cycle)).toEqual(new Set(participants));
        expect(new Set(received)).toEqual(new Set(participants));
        expect(draw.cycle.every((presenter, index) => presenter !== received[index])).toBe(true);

        const visited = new Set<ParticipantId>();
        let current = draw.firstPresenter;
        while (!visited.has(current)) {
          visited.add(current);
          current = targetOf(draw.cycle, current);
        }
        expect(current).toBe(draw.firstPresenter);
        expect(visited.size).toBe(count);
      }
    }
  });

  it("é determinístico, não altera a entrada e retorna uma permutação", () => {
    const participants = participantIds(8);
    const original = [...participants];
    const first = drawCycle(participants, createRng("same-seed"));
    const second = drawCycle(participants, createRng("same-seed"));

    expect(second).toEqual(first);
    expect(participants).toEqual(original);
    expect([...first.cycle].sort()).toEqual([...original].sort());
  });

  it("lança DrawError com mensagem em português fora dos limites", () => {
    for (const participants of [participantIds(2), participantIds(13)]) {
      try {
        drawCycle(participants, createRng("invalid-count"));
        expect.fail("Esperava DrawError");
      } catch (error) {
        expect(error).toBeInstanceOf(DrawError);
        expect((error as Error).message).toMatch(/participantes/);
      }
    }
  });

  it("lança DrawError para ids duplicados e apresentador desconhecido", () => {
    expect(() => drawCycle(["a", "b", "a"], createRng("duplicates"))).toThrow(DrawError);
    expect(() => targetOf(["a", "b", "c"], "unknown")).toThrow(DrawError);
  });

  it("varia o primeiro apresentador entre sementes", () => {
    const participants = participantIds(8);
    const firstPresenters = new Set(
      Array.from(
        { length: 100 },
        (_, seed) => drawCycle(participants, createRng(`first-${seed}`)).firstPresenter,
      ),
    );

    expect(firstPresenters.size).toBeGreaterThan(1);
  });
});
