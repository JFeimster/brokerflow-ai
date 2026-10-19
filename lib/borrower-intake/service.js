import { validateIntake } from "./validation.js";
import { normalizeIntake } from "./normalize.js";
import { workflowRpc } from "../workflows/rpc.js";
export async function captureBorrowerIntake(
  context,
  organizationId,
  input,
  key,
) {
  return workflowRpc(
    context,
    organizationId,
    "brokerflow_capture_borrower_intake",
    normalizeIntake(validateIntake(input)),
    key,
  );
}
