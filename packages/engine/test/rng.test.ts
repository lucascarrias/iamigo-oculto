import { describe, expect, it } from "vitest";
import { createRng } from "../src/rng.ts";

describe("RNG com semente", () => {
  it("repete a sequência para a mesma semente e diferencia sementes distintas", () => {
    const first = createRng("mesma-semente");
    const second = createRng("mesma-semente");
    expect(Array.from({ length: 1_000 }, () => first.nextUint32())).toEqual(
      Array.from({ length: 1_000 }, () => second.nextUint32()),
    );
    expect(createRng("semente-a").nextUint32()).not.toBe(createRng("semente-b").nextUint32());
  });

  it("mantém valores dourados para sementes publicadas", () => {
    // Alterar esta sequência quebra toda reprodução publicada que usa a semente prototipo.
    const prototype = createRng("prototipo");
    expect(Array.from({ length: 5 }, () => prototype.nextUint32())).toEqual([
      2744734564, 2327000818, 91734335, 3160139706, 2818953293,
    ]);
    const empty = createRng("");
    expect(Array.from({ length: 5 }, () => empty.nextUint32())).toEqual([
      2420727049, 3315390910, 31621017, 4095259433, 4180064351,
    ]);
  });

  it("produz frações entre zero e um", () => {
    const rng = createRng("frações");
    for (let index = 0; index < 10_000; index += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it.each([1, 2, 3, 7, 12, 1_000])("int(%i) fica no intervalo", (maxExclusive) => {
    const rng = createRng(`inteiro-${maxExclusive}`);
    for (let index = 0; index < 10_000; index += 1) {
      const value = rng.int(maxExclusive);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(maxExclusive);
    }
  });

  it("int(1) é sempre zero e rejeita limites inválidos", () => {
    const rng = createRng("limites");
    for (let index = 0; index < 100; index += 1) expect(rng.int(1)).toBe(0);
    for (const value of [0, -1, 1.5, Number.NaN]) {
      expect(() => rng.int(value)).toThrow(RangeError);
    }
  });

  it("pick escolhe um elemento e rejeita listas vazias", () => {
    const rng = createRng("escolha");
    expect(["a", "b", "c"]).toContain(rng.pick(["a", "b", "c"]));
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it("permite desestruturar métodos sem perder o estado do RNG", () => {
    const { pick, shuffle, int } = createRng("x");
    expect([1, 2, 3]).toContain(pick([1, 2, 3]));
    expect(shuffle([1, 2, 3])).toHaveLength(3);
    expect(int(5)).toBeGreaterThanOrEqual(0);
    expect(int(5)).toBeLessThan(5);
  });

  it("embaralha sem mutar, preserva os itens e é determinístico", () => {
    const items = Array.from({ length: 12 }, (_, index) => index);
    const original = [...items];
    const first = createRng("embaralhar").shuffle(items);
    expect(items).toEqual(original);
    expect([...first].sort((a, b) => a - b)).toEqual(original);
    expect(first).toEqual(createRng("embaralhar").shuffle(items));
    expect(["a", "b", "c", "d"].map((seed) => createRng(seed).shuffle(items))).not.toEqual([
      items,
      items,
      items,
      items,
    ]);
  });
});
