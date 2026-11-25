import type { MatchEvent, ParticipantId } from "./schema.ts";

export function validCandidates(
  participants: readonly ParticipantId[],
  presenter: ParticipantId,
  revealedTargets: readonly ParticipantId[],
): ParticipantId[] {
  return participants.filter(
    (participant) => participant !== presenter && !revealedTargets.includes(participant),
  );
}

export function isValidGuess(candidates: readonly ParticipantId[], target: ParticipantId): boolean {
  return candidates.includes(target);
}

export const ROUND_POINTS = { 1: 3, 2: 2, 3: 1 } as const;

export function scoresFromEvents(
  participants: readonly ParticipantId[],
  events: readonly MatchEvent[],
): Record<ParticipantId, number> {
  const scores = Object.fromEntries(participants.map((participant) => [participant, 0])) as Record<
    ParticipantId,
    number
  >;
  const presenters = new Map<number, ParticipantId>();
  const guesses = new Map<number, Extract<MatchEvent, { type: "guess_made" }>[]>();

  for (const event of events) {
    if (event.type === "turn_started") {
      presenters.set(event.turn, event.presenter);
      guesses.set(event.turn, []);
    } else if (event.type === "guess_made") {
      const turnGuesses = guesses.get(event.turn);
      if (turnGuesses) turnGuesses.push(event);
    } else if (event.type === "friend_revealed") {
      const presenter = presenters.get(event.turn);
      const turnGuesses = guesses.get(event.turn);
      if (!turnGuesses || presenter === undefined) continue;

      const scored = new Set<ParticipantId>();
      for (const guess of turnGuesses) {
        if (guess.by !== presenter && !scored.has(guess.by) && guess.target === event.target) {
          scores[guess.by] = (scores[guess.by] ?? 0) + ROUND_POINTS[guess.round];
          scored.add(guess.by);
        }
      }
    }
  }

  return scores;
}
