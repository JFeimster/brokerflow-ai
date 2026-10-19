import { intakeSchema } from "../mcp/schemas/borrower.js";
export function validateIntake(input) {
  const parsed = intakeSchema.safeParse(input);
  if (!parsed.success)
    throw Object.assign(
      new Error("Invalid intake fields or contact consent metadata."),
      { status: 422, code: "invalid_input" },
    );
  return parsed.data;
}
