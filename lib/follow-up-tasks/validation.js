const TASK_TYPES = Object.freeze([
  "call",
  "email",
  "request_information",
  "document_follow_up",
  "internal_review",
  "other",
]);

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const personalData = /\b\d{3}-\d{2}-\d{4}\b|\b\d{12,}\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/i;

function invalid(message) {
  return Object.assign(new Error(message), { status: 422, code: "invalid_input" });
}

export function validateTaskInput(input = {}) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (!title || title.length > 160) throw invalid("title must be between 1 and 160 characters.");
  if (description.length > 500) throw invalid("description must be 500 characters or fewer.");
  if (personalData.test(`${title} ${description}`)) throw invalid("Task text must not contain sensitive personal identifiers or contact details.");
  if (!TASK_TYPES.includes(input.task_type)) throw invalid("task_type is invalid.");
  if (input.assigned_to != null && !uuid.test(input.assigned_to)) throw invalid("assigned_to must be a user UUID.");
  if (input.review_id != null && !uuid.test(input.review_id)) throw invalid("review_id must be a review UUID.");
  if (input.due_date != null && (!/^\d{4}-\d{2}-\d{2}$/.test(input.due_date) || Number.isNaN(Date.parse(`${input.due_date}T00:00:00Z`)) || new Date(`${input.due_date}T00:00:00Z`).toISOString().slice(0, 10) !== input.due_date)) {
    throw invalid("due_date must be a valid YYYY-MM-DD date.");
  }
  if (typeof input.idempotency_key !== "string" || input.idempotency_key.length < 16 || input.idempotency_key.length > 200) {
    throw invalid("idempotency_key must be between 16 and 200 characters.");
  }
  return {
    title,
    description,
    task_type: input.task_type,
    assigned_to: input.assigned_to || null,
    review_id: input.review_id || null,
    due_date: input.due_date || null,
    idempotency_key: input.idempotency_key,
  };
}

export { TASK_TYPES };
