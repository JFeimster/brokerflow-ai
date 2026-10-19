import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";
import { applyAction, requireWorkspace } from "../lib/reviews/service.js";
import { applyReviewFilters, parseReviewQuery } from "../lib/reviews/query.js";
import { validateProtectedReview } from "../lib/reviews/validation.js";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
function browserContext(script, additions = {}) {
  const window = {};
  const storage = new Map();
  const sessionStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };
  const context = { window, sessionStorage, crypto: webcrypto, TextEncoder, URL, URLSearchParams, Date, ...additions };
  vm.runInNewContext(script, context);
  return { window, storage, sessionStorage, context };
}

test("OTP uses GoTrue create_user=false and redirect_to for the review queue callback", async () => {
  const calls = [];
  const location = { origin: "https://preview.example", hostname: "preview.example", pathname: "/app/review-queue", search: "", hash: "" };
  const { window } = browserContext(read("../console-auth.js"), {
    location,
    history: { replaceState() {} },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ mode: "live", configured: true, supabase_url: "https://project.supabase.co", publishable_key: "public-key" }) };
    }
  });
  await window.BrokerFlowAuth.init();
  await window.BrokerFlowAuth.login("invited@example.com");
  const call = calls.at(-1);
  const requestUrl = new URL(call.url);
  assert.equal(requestUrl.pathname, "/auth/v1/otp");
  assert.equal(requestUrl.searchParams.get("redirect_to"), "https://preview.example/app/review-queue");
  assert.deepEqual(JSON.parse(call.options.body), { email: "invited@example.com", create_user: false });
  assert.equal("options" in JSON.parse(call.options.body), false);
  const vercel = JSON.parse(read("../vercel.json"));
  assert.ok(vercel.rewrites.some(rule => rule.source === "/app/review-queue" && rule.destination === "/app"));
});

test("review queue callback consumes the GoTrue token fragment and keeps the callback route", async () => {
  const location = { origin: "https://preview.example", hostname: "preview.example", pathname: "/app/review-queue", search: "?from=magic-link", hash: "#access_token=access-1&refresh_token=refresh-1&expires_in=3600&token_type=bearer" };
  const historyCalls = [];
  const { window } = browserContext(read("../console-auth.js"), {
    location,
    history: { replaceState(...args) { historyCalls.push(args); } },
    fetch: async () => ({ ok: true, json: async () => ({ mode: "live", configured: true }) })
  });
  await window.BrokerFlowAuth.init();
  assert.equal(window.BrokerFlowAuth.read().access_token, "access-1");
  assert.equal(window.BrokerFlowAuth.read().refresh_token, "refresh-1");
  assert.equal(await window.BrokerFlowAuth.token(), "access-1");
  assert.equal(historyCalls[0][2], "/app/review-queue?from=magic-link");
});

test("action replay returns the original RPC result without reading current state first", async () => {
  const input = { review_id: "review-1", action: "start_review", expected_version: 1, idempotency_key: "same-action-key-1234" };
  const storedResult = { id: "review-1", status: "in_review", version: 2, duplicate: false };
  const calls = [];
  const context = {
    user: { id: "user-1" },
    db: {
      from() { assert.fail("action replay must not validate a stale current row before the idempotency RPC"); },
      async rpc(name, args) {
        calls.push({ name, args });
        return { data: structuredClone(storedResult), error: null };
      }
    }
  };
  const first = await applyAction(context, "org-1", input);
  const replay = await applyAction(context, "org-1", input);
  assert.deepEqual(first, storedResult);
  assert.deepEqual(replay, storedResult);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].args.p_next_status, "in_review");
  assert.equal(calls[1].args.p_idempotency_key, calls[0].args.p_idempotency_key);
});

test("SQL action replay returns the stored event result before transition validation and under the row lock", () => {
  const sql = read("../supabase/migrations/20261018000100_brokerflow_reviews.sql");
  const actionFunction = sql.slice(sql.indexOf("create or replace function public.brokerflow_apply_review_action"));
  const replayCheck = actionFunction.indexOf("return coalesce(v_event.result");
  const versionCheck = actionFunction.indexOf("if v_review.version <> p_expected_version");
  assert.ok(replayCheck >= 0 && replayCheck < versionCheck);
  assert.match(actionFunction, /for update/);
  assert.match(actionFunction, /request_fingerprint,result\)/);
  assert.match(actionFunction, /v_fingerprint,v_result\)/);
});

test("client retry keys survive lost responses for create and state-change requests", async () => {
  const { window } = browserContext(read("../client-idempotency.js"));
  for (const [scope, payload] of [
    ["review-create:org-1", { organization_id: "org-1", business_name: "Example Co", requested_amount: 10000 }],
    ["review-action:review-1:start_review:1", { review_id: "review-1", action: "start_review", expected_version: 1 }]
  ]) {
    const initialAttemptKey = await window.BrokerFlowIdempotency.key(scope, payload);
    // Simulate the server committing while its response is lost; UI retry asks for the same logical key.
    const retryKey = await window.BrokerFlowIdempotency.key(scope, payload);
    assert.equal(retryKey, initialAttemptKey);
    await window.BrokerFlowIdempotency.complete(scope, payload);
    assert.notEqual(await window.BrokerFlowIdempotency.key(scope, payload), retryKey);
  }
});

test("partial live API failures remain independent and missing audit permission is explained", () => {
  const { window } = browserContext(read("../console-live-state.js"));
  const state = window.BrokerFlowLiveState;
  state.update("reviews", { source: "live-error", error: { message: "Reviews unavailable" } });
  state.update("activity", { source: "live", data: [] });
  assert.match(state.get("reviews"), /Reviews unavailable/);
  assert.equal(state.get("activity"), "");

  state.update("activity", { source: "live-error", error: { code: "audit_access_denied", message: "forbidden" } });
  state.update("reviews", { source: "live", data: [] });
  assert.equal(state.get("reviews"), "");
  assert.match(state.get("activity"), /permission to view review activity/);
});

test("each live endpoint failure is returned independently when the other request succeeds", async () => {
  const { window } = browserContext(read("../data.js"));
  window.BrokerFlowAuth = {
    config: { mode: "live" },
    async request(path) {
      if (path.startsWith("/api/console/activity")) throw Object.assign(new Error("Activity denied"), { status: 403, code: "audit_access_denied" });
      return { items: [{ id: "review-1", business_name: "Example Co", loan_purpose: "equipment_financing", requested_amount: 10000, status: "queued_for_human_review", urgency: "normal", created_at: "2026-01-01T00:00:00Z" }], counts: { open: 1 } };
    }
  };
  window.BrokerFlowSession = { workspace: { id: "org-1" } };
  const reviews = await window.BrokerFlowData.get("reviews");
  const activity = await window.BrokerFlowData.get("activity");
  assert.equal(reviews.source, "live");
  assert.equal(reviews.data.length, 1);
  assert.equal(activity.source, "live-error");
  assert.equal(activity.error.code, "audit_access_denied");
});

test("live queue pages through older open reviews and sends full-dataset search and priority filters", async () => {
  const rows = Array.from({ length: 205 }, (_, index) => ({
    id: `review-${index}`,
    review_request_id: `lmr_${index}`,
    business_name: index === 175 ? "Long Ago Equipment Co" : `Business ${index}`,
    requester_name: "Broker intake",
    loan_purpose: "equipment_financing",
    state: "NY",
    requested_amount: 10000 + index,
    status: index % 4 === 0 ? "reviewed" : index % 4 === 1 ? "in_review" : index % 4 === 2 ? "queued_for_human_review" : "needs_information",
    urgency: ["low", "normal", "high", "same_day"][index % 4],
    created_at: new Date(Date.UTC(2026, 0, 1) - index * 60000).toISOString()
  }));
  rows[175].status = "queued_for_human_review";
  const requests = [];
  const { window } = browserContext(read("../data.js"));
  window.BrokerFlowAuth = {
    config: { mode: "live" },
    async request(path) {
      const params = new URL(path, "https://console.example").searchParams;
      requests.push(Object.fromEntries(params));
      const priority = params.get("priority") || "All items";
      const urgency = { High: ["high", "same_day"], Normal: ["normal"], Low: ["low"] }[priority];
      const search = (params.get("search") || "").toLowerCase();
      let filtered = rows.filter(row => !urgency || urgency.includes(row.urgency));
      if (search) filtered = filtered.filter(row => [row.business_name, row.requester_name, row.review_request_id, row.loan_purpose, row.state].some(value => value.toLowerCase().includes(search)));
      const offset = Number(params.get("cursor") || 0), limit = Number(params.get("limit"));
      const items = filtered.slice(offset, offset + limit);
      return {
        items,
        counts: {
          open: rows.filter(row => row.status !== "reviewed").length,
          high_priority: rows.filter(row => ["high", "same_day"].includes(row.urgency) && row.status !== "reviewed").length,
          reviewed: rows.filter(row => row.status === "reviewed").length
        },
        total_count: filtered.length,
        next_cursor: offset + items.length < filtered.length ? String(offset + items.length) : null
      };
    }
  };
  window.BrokerFlowSession = { workspace: { id: "org-1" } };

  const first = await window.BrokerFlowData.get("reviews", { priority: "All items" });
  assert.equal(first.data.length, 100);
  assert.equal(first.nextCursor, "100");
  assert.equal(first.data.some(row => row.id === "review-175"), false);
  assert.equal(first.counts.open, rows.filter(row => row.status !== "reviewed").length);

  const second = await window.BrokerFlowData.get("reviews", { priority: "All items", cursor: first.nextCursor });
  assert.equal(second.data.length, 100);
  assert.equal(second.data.some(row => row.id === "review-175"), true);
  assert.equal(second.nextCursor, "200");

  const search = await window.BrokerFlowData.get("reviews", { priority: "All items", search: "Long Ago Equipment Co" });
  assert.equal(search.data.length, 1);
  assert.equal(search.data[0].id, "review-175");
  assert.equal(search.totalCount, 1);
  const high = await window.BrokerFlowData.get("reviews", { priority: "High", search: "Long Ago" });
  assert.equal(high.totalCount, 1);
  assert.equal(requests[0].organization_id, "org-1");
  assert.equal(requests[0].limit, "100");
  assert.equal(requests[1].cursor, "100");
  assert.equal(requests[3].priority, "High");
});

test("server review filters apply search and priority before pagination without weakening organization scope", () => {
  const calls = [];
  const query = {
    in(field, values) { calls.push(["in", field, values]); return this; },
    eq(field, value) { calls.push(["eq", field, value]); return this; },
    or(expression) { calls.push(["or", expression]); return this; }
  };
  const filters = parseReviewQuery({ limit: "100", cursor: "100", priority: "High", search: "Old Business, (ignored)" });
  applyReviewFilters(query, filters);
  assert.equal(filters.cursor, 100);
  assert.deepEqual(calls[0], ["in", "urgency", ["high", "same_day"]]);
  assert.match(calls[1][1], /business_name\.ilike\./);
  assert.doesNotMatch(calls[1][1], /, \(ignored\)/);
  assert.throws(() => parseReviewQuery({ search: "x".repeat(81) }), { status: 422 });
  assert.throws(() => parseReviewQuery({ priority: "Unknown" }), { status: 422 });
});

test("read-only workspaces retain read access but fail the server write gate; writers pass both gates", () => {
  const { window } = browserContext(read("../console-live-state.js"));
  const readOnly = { id: "org-1", can_read: true, can_write: false };
  const writer = { id: "org-1", can_read: true, can_write: true };
  assert.equal(window.BrokerFlowLiveState.canWrite(readOnly), false);
  assert.equal(window.BrokerFlowLiveState.canWrite(writer), true);

  const context = { workspaces: [{ id: "org-1", canRead: true, canWrite: false }] };
  assert.equal(requireWorkspace(context, "org-1").canRead, true);
  assert.throws(() => requireWorkspace(context, "org-1", true), { status: 403 });
  context.workspaces[0].canWrite = true;
  assert.equal(requireWorkspace(context, "org-1", true).canWrite, true);
});

test("live activity can open a review absent from the loaded queue; sample navigation still requires a row", () => {
  const { window } = browserContext(read("../console-live-state.js"));
  const state = window.BrokerFlowLiveState;
  const loaded = [{ id: "review-loaded" }];
  assert.deepEqual(state.resolveReviewTarget("review-loaded", loaded, true), loaded[0]);
  assert.equal(state.resolveReviewTarget("review-outside-page", loaded, true).id, "review-outside-page");
  assert.equal(state.resolveReviewTarget("review-outside-page", loaded, false), null);
});

test("all review actions reject notes longer than the database limit before calling persistence", async () => {
  let rpcCalls = 0;
  const context = { user: { id: "user-1" }, db: { async rpc() { rpcCalls++; return { data: {}, error: null }; } } };
  for (const action of ["start_review", "request_information", "mark_reviewed"]) {
    await assert.rejects(applyAction(context, "org-1", { review_id: "review-1", action, note: "x".repeat(501), expected_version: 1, idempotency_key: `note-limit-key-${action}` }), { status: 422 });
  }
  assert.equal(rpcCalls, 0);
  for (const action of ["start_review", "request_information", "mark_reviewed"]) {
    await applyAction(context, "org-1", { review_id: "review-1", action, note: "x".repeat(500), expected_version: 1, idempotency_key: `note-boundary-key-${action}` });
  }
  assert.equal(rpcCalls, 3);
});

test("protected ingestion rejects contact fields that its persistence allowlist cannot store", () => {
  const input = { action_type: "lender_match_review", requester_name: "Broker intake", borrower_type: "business", business_name: "Example Co", loan_purpose: "equipment_financing", requested_amount: 185000, state: "NY", human_review_required: true };
  const normalized = validateProtectedReview(input);
  assert.equal(normalized.source, "custom_gpt");
  assert.equal(normalized.business_name, "Example Co");
  for (const field of ["borrower_name", "email", "phone", "consent_to_contact"]) {
    assert.throws(() => validateProtectedReview({ ...input, [field]: "unsupported" }), { status: 422 });
  }
});
