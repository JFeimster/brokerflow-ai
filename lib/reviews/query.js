const priorities = Object.freeze({
  High: ["high", "same_day"],
  Normal: ["normal"],
  Low: ["low"]
});
const statuses = new Set(["queued_for_human_review", "in_review", "needs_information", "reviewed"]);

export function parseReviewQuery(params = {}) {
  const rawLimit = params.limit === undefined ? 25 : Number(params.limit);
  const rawCursor = params.cursor === undefined ? 0 : Number(params.cursor);
  const search = params.search === undefined ? "" : String(params.search).trim();
  const priority = params.priority === undefined ? "All items" : String(params.priority);
  const status = params.status === undefined ? "" : String(params.status);
  if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100) throw Object.assign(new Error("limit must be between 1 and 100."), { status: 422 });
  if (!Number.isSafeInteger(rawCursor) || rawCursor < 0) throw Object.assign(new Error("cursor is invalid."), { status: 422 });
  if (search.length > 80 || /[\u0000-\u001f\u007f]/.test(search)) throw Object.assign(new Error("search must be 80 characters or fewer."), { status: 422 });
  if (priority !== "All items" && !priorities[priority]) throw Object.assign(new Error("priority is invalid."), { status: 422 });
  if (status && !statuses.has(status)) throw Object.assign(new Error("status is invalid."), { status: 422 });
  return { limit: rawLimit, cursor: rawCursor, search, priority, status };
}

export function applyReviewFilters(query, { search, priority, status }) {
  if (priority !== "All items") query.in("urgency", priorities[priority]);
  if (status) query.eq("status", status);
  // Strip PostgREST filter syntax and wildcard characters before building the OR expression.
  const term = search.replace(/[^\p{L}\p{N} .&'-]/gu, " ").replace(/\s+/g, " ").trim();
  if (term) {
    const pattern = `*${term}*`;
    query.or(["business_name", "requester_name", "review_request_id", "loan_purpose", "state", "status"].map(column => `${column}.ilike.${pattern}`).join(","));
  }
  return query;
}
