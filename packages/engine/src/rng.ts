export type Rng = {
  nextUint32(): number;
  next(): number;
  int(maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
};

// cyrb128 + sfc32 são fixos para manter as sementes reproduzíveis entre versões.
function cyrb128(text: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    h1 = h2 ^ Math.imul(h1 ^ code, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ code, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ code, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ code, 2716044179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);

  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export function createRng(seed: string): Rng {
  let [a, b, c, d] = cyrb128(seed);

  const nextUint32 = (): number => {
    const result = (a + b + d) >>> 0;
    d = (d + 1) >>> 0;
    a = (b ^ (b >>> 9)) >>> 0;
    b = (c + (c << 3)) >>> 0;
    c = ((c << 21) | (c >>> 11)) >>> 0;
    c = (c + result) >>> 0;
    return result;
  };

  // O descarte inicial faz parte do algoritmo público e permanece fixo.
  for (let index = 0; index < 15; index += 1) nextUint32();

  const int = (maxExclusive: number): number => {
    if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 2 ** 32) {
      throw new RangeError("O limite deve ser um inteiro entre 1 e 2³²");
    }
    const range = 2 ** 32;
    const limit = Math.floor(range / maxExclusive) * maxExclusive;
    let value = nextUint32();
    while (value >= limit) value = nextUint32();
    return value % maxExclusive;
  };

  return {
    nextUint32,
    next: () => nextUint32() / 2 ** 32,
    int,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new RangeError("Não é possível escolher de uma lista vazia");
      return items[int(items.length)] as T;
    },
    shuffle<T>(items: readonly T[]): T[] {
      const result = [...items];
      for (let index = result.length - 1; index > 0; index -= 1) {
        const other = int(index + 1);
        [result[index], result[other]] = [result[other] as T, result[index] as T];
      }
      return result;
    },
  };
}
