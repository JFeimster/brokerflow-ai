import { createClient } from "@supabase/supabase-js";
import { targetStatus, validateReview } from "./validation.js";

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY;
export function database() {
  if (!URL || !KEY) throw Object.assign(new Error("Review storage is not configured."), { status: 503 });
  return createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function authenticate(req) {
  const token = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || "")?.[1];
  if (!token) throw Object.assign(new Error("Authentication required."), { status: 401 });
  const db = database();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw Object.assign(new Error("Authentication required."), { status: 401 });
  const { data: memberships, error: membershipError } = await db.from("memberships").select("organization_id,status,roles!inner(id,key,name),organizations!inner(id,name,status)").eq("user_id", data.user.id).eq("status", "active").eq("organizations.status", "active");
  if (membershipError) throw Object.assign(new Error("Unable to verify workspace access."), { status: 503 });
  const workspaces = [];
  for (const m of memberships || []) {
    const { data: grants, error: grantError } = await db.from("role_permissions").select("permissions!inner(key)").eq("organization_id", m.organization_id).eq("role_id", m.roles.id);
    if (grantError) throw Object.assign(new Error("Unable to verify review access."), { status: 503 });
    const permissions = (grants || []).map(x => x.permissions.key);
    const read = permissions.includes("brokerflow.reviews.read");
    const write = permissions.includes("brokerflow.reviews.write");
    if (read) workspaces.push({ id: m.organization_id, name: m.organizations.name, role: m.roles.key, canRead: true, canWrite: write, canAudit: permissions.includes("brokerflow.reviews.audit") });
  }
  return { db, user: { id: data.user.id, email: data.user.email }, workspaces };
}
export function requireWorkspace(context, id, write = false) {
  const workspace = context.workspaces.find(x => x.id === id);
  if (!workspace) throw Object.assign(new Error("Workspace access denied."), { status: 403 });
  if (!workspace.canRead || (write && !workspace.canWrite)) throw Object.assign(new Error("Workspace access denied."), { status: 403 });
  return workspace;
}
export async function createReview(context, organizationId, input, key, actor = context.user?.id || null) {
  const scenario = validateReview(input);
  if (typeof key !== "string" || key.length < 16 || key.length > 200) throw Object.assign(new Error("A 16-200 character Idempotency-Key is required."), { status: 422 });
  const { data, error } = await context.db.rpc("brokerflow_create_review", { p_organization_id: organizationId, p_actor_user_id: actor, p_idempotency_key: key, p_scenario: scenario });
  if (error) throw Object.assign(new Error(error.code === "23505" ? "Idempotency conflict." : "Unable to persist review."), { status: error.code === "23505" ? 409 : 503 });
  return data;
}
export async function applyAction(context, organizationId, input) {
  const { review_id: reviewId, action, note = "", expected_version: expectedVersion, idempotency_key: key } = input || {};
  if (!reviewId || !Number.isInteger(expectedVersion) || expectedVersion < 1 || typeof key !== "string" || key.length < 16 || key.length > 200) throw Object.assign(new Error("Review, expected_version, and idempotency_key are required."), { status: 422 });
  if (typeof note !== "string" || (action === "request_information" && (!note.trim() || note.length > 500)) || /\b\d{3}-\d{2}-\d{4}\b|\b\d{12,}\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/i.test(note)) throw Object.assign(new Error("Review note is outside the allowed content limits."), { status: 422 });
  const nextStatus = targetStatus(action);
  const { data, error } = await context.db.rpc("brokerflow_apply_review_action", { p_organization_id: organizationId, p_review_id: reviewId, p_actor_user_id: context.user.id, p_action: action, p_note: note.trim(), p_expected_version: expectedVersion, p_idempotency_key: key, p_next_status: nextStatus });
  if (error) throw Object.assign(new Error(error.code === "P0002" ? "Review not found." : error.code === "40001" || error.code === "22023" || error.code === "23505" ? "Review changed or the requested transition is not valid." : "Unable to persist review action."), { status: error.code === "P0002" ? 404 : error.code === "40001" || error.code === "22023" || error.code === "23505" ? 409 : 503 });
  return data;
}
