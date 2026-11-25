import { DrawError } from "./errors.ts";
import type { Rng } from "./rng.ts";
import type { ParticipantId } from "./schema.ts";
import { MAX_PARTICIPANTS, MIN_PARTICIPANTS } from "./schema.ts";

export type Draw = { cycle: ParticipantId[]; firstPresenter: ParticipantId };

export function drawCycle(participants: readonly ParticipantId[], rng: Rng): Draw {
  if (participants.length < MIN_PARTICIPANTS || participants.length > MAX_PARTICIPANTS) {
    throw new DrawError(
      `A partida deve ter entre ${MIN_PARTICIPANTS} e ${MAX_PARTICIPANTS} participantes`,
    );
  }

  if (new Set(participants).size !== participants.length) {
    throw new DrawError("A lista de participantes não pode conter identificadores duplicados");
  }

  const cycle = rng.shuffle(participants);
  const firstPresenter = cycle[0];
  if (firstPresenter === undefined) {
    throw new DrawError("Não foi possível definir o primeiro apresentador");
  }

  return { cycle, firstPresenter };
}

export function targetOf(cycle: readonly ParticipantId[], presenter: ParticipantId): ParticipantId {
  const index = cycle.indexOf(presenter);
  if (index === -1) throw new DrawError("Apresentador desconhecido no ciclo do sorteio");

  const target = cycle[(index + 1) % cycle.length];
  if (target === undefined) throw new DrawError("O ciclo do sorteio está vazio");
  return target;
}
