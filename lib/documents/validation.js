export function validateBody(body = {}, expectedActionType) {
  if (!body.source)
    return { error: "missing_required_field", message: "source is required." };
  if (!body.action_type)
    return {
      error: "missing_required_field",
      message: "action_type is required.",
    };
  if (expectedActionType && body.action_type !== expectedActionType)
    return {
      error: "validation_error",
      message: `action_type must be ${expectedActionType}.`,
    };
  return null;
}
