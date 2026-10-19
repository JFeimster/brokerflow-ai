import { z } from "zod";
import { organization, fundingScenario } from "./common.js";
export const routingInput = { ...organization, scenario: fundingScenario };
export const routingOutput = {
  primary_route: z.string(),
  secondary_routes: z.array(z.string()),
  fit_score: z.number().min(0).max(100),
  fit_tier: z.string(),
  missing_information: z.array(z.string()),
  flags: z.array(z.string()),
  routing_model: z.literal("legacy_deterministic_v1"),
  preliminary: z.literal(true),
  score_limitations: z.string(),
  next_step: z.string(),
};
