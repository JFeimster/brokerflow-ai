import test from "node:test";
import assert from "node:assert/strict";
import { validateTaskInput } from "../lib/follow-up-tasks/validation.js";
import { createFollowUpTask, completeFollowUpTask } from "../lib/follow-up-tasks/service.js";

const org = "00000000-0000-4000-8000-000000000001";
const taskId = "00000000-0000-4000-8000-000000000002";

test("task input validates types, dates, idempotency, and excludes common personal data", () => {
  const input = { title: "Prepare broker call", task_type: "call", assigned_to: org, review_id: taskId, due_date: "2026-10-25", idempotency_key: "synthetic-task-key-001" };
  assert.deepEqual(validateTaskInput(input), { ...input, description: "" });
  assert.throws(() => validateTaskInput({ ...input, due_date: "2026-02-30" }), { status: 422 });
  assert.throws(() => validateTaskInput({ ...input, task_type: "approve_borrower" }), { status: 422 });
  assert.throws(() => validateTaskInput({ ...input, title: "Email borrower person@example.com" }), { status: 422 });
  assert.throws(() => validateTaskInput({ ...input, description: "SSN 123-45-6789" }), { status: 422 });
  assert.throws(() => validateTaskInput({ ...input, idempotency_key: "short" }), { status: 422 });
});

test("task services call the organization-scoped atomic RPCs with validated attribution inputs", async () => {
  const calls = [];
  const context = { user: { id: "user-1" }, db: { async rpc(name, args) { calls.push({ name, args }); return { data: { id: taskId, organization_id: org, status: name.includes("complete") ? "completed" : "open", duplicate: false }, error: null }; } } };
  const created = await createFollowUpTask(context, org, { title: "Call broker", task_type: "call", idempotency_key: "synthetic-task-key-002" });
  assert.equal(created.status, "open");
  assert.equal(calls[0].name, "brokerflow_create_follow_up_task");
  assert.equal(calls[0].args.p_actor_user_id, "user-1");
  assert.equal(calls[0].args.p_task.title, "Call broker");
  const completed = await completeFollowUpTask(context, org, taskId, "synthetic-task-complete-001");
  assert.equal(completed.status, "completed");
  assert.equal(calls[1].name, "brokerflow_complete_follow_up_task");
  assert.equal(calls[1].args.p_task_id, taskId);
  assert.equal(calls[1].args.p_actor_user_id, "user-1");
});

test("task service maps idempotency and reference failures to safe public errors", async () => {
  const context = { user: { id: "user-1" }, db: { async rpc() { return { data: null, error: { code: "23503" } }; } } };
  await assert.rejects(createFollowUpTask(context, org, { title: "Call broker", task_type: "call", idempotency_key: "synthetic-task-key-003" }), { status: 422, code: "invalid_reference" });
});
