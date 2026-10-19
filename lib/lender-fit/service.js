import { validatePayload } from "./validation.js";
import { routeScenario } from "./routing-rules.js";
export { routeScenario };
export function routeLenderFit(scenario) {
  const error = validatePayload({
    ...scenario,
    source: "custom_gpt",
    action_type: "lender_fit_routing",
  });
  if (error)
    throw Object.assign(new Error(error.message), {
      status: 422,
      code: "invalid_input",
    });
  const { automation_actions, next_step, ...routing } = routeScenario(scenario);
  return {
    ...routing,
    routing_model: "legacy_deterministic_v1",
    preliminary: true,
    flags: [
      ...(routing.missing_information.length ? ["incomplete_scenario"] : []),
      "broker_review_required",
    ],
    score_limitations:
      "Legacy numeric scores and tiers are internal routing heuristics, not underwriting determinations, borrower eligibility, or verified current lender offers.",
    next_step: routing.missing_information.length
      ? "collect_missing_information_then_broker_review"
      : "broker_review",
  };
}
