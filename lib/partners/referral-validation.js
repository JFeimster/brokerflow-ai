import { ACTIONS, validatePartnerInput } from "../partner-action-utils.js";
export function validateReferral(input) {
  const error = validatePartnerInput(input, ACTIONS.referral);
  if (error)
    throw Object.assign(new Error(error), {
      status: 422,
      code: "invalid_input",
    });
  return input;
}
