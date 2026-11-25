import { z } from "zod";
import { MatchValidationError } from "./errors.ts";

export const SCHEMA_VERSION = 1 as const;
export const MIN_PARTICIPANTS = 3;
export const MAX_PARTICIPANTS = 12;

export const participantIdSchema = z.string();
export const participantSchema = z.strictObject({
  id: participantIdSchema,
  name: z.string(),
  dossier: z.string(),
  model: z.string(),
  provider: z.string(),
  color: z.string().optional(),
  avatar: z.string().optional(),
});
export const giftSchema = z.strictObject({ name: z.string(), line: z.string() });
export const eventMetaSchema = z.strictObject({
  model: z.string(),
  provider: z.string(),
  attempts: z.number().int().min(1).max(4),
  fallback: z.boolean(),
  usage: z
    .strictObject({
      inputTokens: z.number().int().nonnegative(),
      outputTokens: z.number().int().nonnegative(),
      costUsd: z.number().nonnegative().optional(),
    })
    .optional(),
  latencyMs: z.number().nonnegative(),
});
export const roundSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const common = { seq: z.number().int().positive(), at: z.iso.datetime() };
const turn = z.number().int().positive();
const meta = eventMetaSchema.optional();
export const matchStartedSchema = z.strictObject({
  ...common,
  type: z.literal("match_started"),
  participants: z.array(participantIdSchema),
  firstPresenter: participantIdSchema,
});
export const drawCompletedSchema = z.strictObject({
  ...common,
  type: z.literal("draw_completed"),
  cycle: z.array(participantIdSchema),
});
export const giftChosenSchema = z.strictObject({
  ...common,
  type: z.literal("gift_chosen"),
  by: participantIdSchema,
  gift: giftSchema,
  meta,
});
export const turnStartedSchema = z.strictObject({
  ...common,
  type: z.literal("turn_started"),
  turn,
  presenter: participantIdSchema,
});
export const hintGivenSchema = z.strictObject({
  ...common,
  type: z.literal("hint_given"),
  turn,
  round: roundSchema,
  text: z.string(),
  meta,
});
export const guessMadeSchema = z.strictObject({
  ...common,
  type: z.literal("guess_made"),
  turn,
  round: roundSchema,
  by: participantIdSchema,
  target: participantIdSchema,
  quip: z.string().optional(),
  meta,
});
export const roundScoredSchema = z.strictObject({
  ...common,
  type: z.literal("round_scored"),
  turn,
  round: roundSchema,
  hits: z.number(),
  total: z.number(),
});
export const friendRevealedSchema = z.strictObject({
  ...common,
  type: z.literal("friend_revealed"),
  turn,
  presenter: participantIdSchema,
  target: participantIdSchema,
});
export const giftDeliveredSchema = z.strictObject({
  ...common,
  type: z.literal("gift_delivered"),
  turn,
  from: participantIdSchema,
  to: participantIdSchema,
});
export const thanksGivenSchema = z.strictObject({
  ...common,
  type: z.literal("thanks_given"),
  turn,
  by: participantIdSchema,
  to: participantIdSchema,
  text: z.string(),
  meta,
});
export const matchFinishedSchema = z.strictObject({
  ...common,
  type: z.literal("match_finished"),
  scores: z.record(participantIdSchema, z.number()),
});
export const matchEventSchema = z.discriminatedUnion("type", [
  matchStartedSchema,
  drawCompletedSchema,
  giftChosenSchema,
  turnStartedSchema,
  hintGivenSchema,
  guessMadeSchema,
  roundScoredSchema,
  friendRevealedSchema,
  giftDeliveredSchema,
  thanksGivenSchema,
  matchFinishedSchema,
]);

export const matchSchema = z
  .strictObject({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    schemaVersion: z.literal(SCHEMA_VERSION),
    seed: z.string(),
    createdAt: z.iso.datetime(),
    participants: z.array(participantSchema).min(MIN_PARTICIPANTS).max(MAX_PARTICIPANTS),
    events: z.array(matchEventSchema),
  })
  .superRefine((match, ctx) => {
    const ids = new Set<string>();
    match.participants.forEach((participant, index) => {
      if (ids.has(participant.id))
        ctx.addIssue({
          code: "custom",
          path: ["participants", index, "id"],
          message: "Identificador de participante duplicado",
        });
      ids.add(participant.id);
    });
    match.events.forEach((event, index) => {
      if (event.seq !== index + 1)
        ctx.addIssue({
          code: "custom",
          path: ["events", index, "seq"],
          message: "Sequência de eventos deve ser contígua a partir de 1",
        });
      const check = (id: string, ...path: (string | number)[]) => {
        if (!ids.has(id))
          ctx.addIssue({
            code: "custom",
            path: ["events", index, ...path],
            message: "Participante desconhecido",
          });
      };
      switch (event.type) {
        case "match_started":
          event.participants.forEach((id, i) => {
            check(id, "participants", i);
          });
          check(event.firstPresenter, "firstPresenter");
          break;
        case "draw_completed":
          event.cycle.forEach((id, i) => {
            check(id, "cycle", i);
          });
          break;
        case "gift_chosen":
          check(event.by, "by");
          break;
        case "turn_started":
          check(event.presenter, "presenter");
          break;
        case "guess_made":
          check(event.by, "by");
          check(event.target, "target");
          break;
        case "friend_revealed":
          check(event.presenter, "presenter");
          check(event.target, "target");
          break;
        case "gift_delivered":
          check(event.from, "from");
          check(event.to, "to");
          break;
        case "thanks_given":
          check(event.by, "by");
          check(event.to, "to");
          break;
        case "match_finished":
          Object.keys(event.scores).forEach((id) => {
            check(id, "scores", id);
          });
          break;
      }
    });
  });
export type ParticipantId = z.infer<typeof participantIdSchema>;
export type Participant = z.infer<typeof participantSchema>;
export type Gift = z.infer<typeof giftSchema>;
export type EventMeta = z.infer<typeof eventMetaSchema>;
export type Round = z.infer<typeof roundSchema>;
export type MatchStarted = z.infer<typeof matchStartedSchema>;
export type DrawCompleted = z.infer<typeof drawCompletedSchema>;
export type GiftChosen = z.infer<typeof giftChosenSchema>;
export type TurnStarted = z.infer<typeof turnStartedSchema>;
export type HintGiven = z.infer<typeof hintGivenSchema>;
export type GuessMade = z.infer<typeof guessMadeSchema>;
export type RoundScored = z.infer<typeof roundScoredSchema>;
export type FriendRevealed = z.infer<typeof friendRevealedSchema>;
export type GiftDelivered = z.infer<typeof giftDeliveredSchema>;
export type ThanksGiven = z.infer<typeof thanksGivenSchema>;
export type MatchFinished = z.infer<typeof matchFinishedSchema>;
export type MatchEvent = z.infer<typeof matchEventSchema>;
export type Match = z.infer<typeof matchSchema>;

export function parseMatch(input: unknown): Match {
  const result = matchSchema.safeParse(input);
  if (!result.success) {
    throw new MatchValidationError(
      `Partida inválida: ${result.error.issues.map((issue) => `${issue.path.join(".") || "raiz"}: ${issue.code === "custom" ? issue.message : "valor inválido"}`).join("; ")}`,
    );
  }
  return result.data;
}
