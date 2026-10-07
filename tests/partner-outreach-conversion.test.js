import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import campaign, { buildCampaign } from "../api/no-auth/partner-outreach-campaign.js";
import objection, { buildObjectionResponse } from "../api/no-auth/partner-objection-response.js";
import brief, { buildCallPrepBrief } from "../api/no-auth/partner-call-prep-brief.js";
import { ACTIONS, CATEGORIES, OUTREACH_GOALS, OBJECTIONS, MEETING_GOALS, createPartnerHandler } from "../lib/partner-action-utils.js";

const base = { source: "webhook_test", company_name: "Example Company", partner_category: "accountant_cpa", relationship_stage: "cold" };
const cases = [
  { key: "campaign", handler: campaign, body: { ...base, action_type: "partner_outreach_campaign", niche: "construction", target_client_type: "business owners", outreach_goal: "initial_introduction", tone: "professional", channel: "email" } },
  { key: "objection", handler: objection, body: { ...base, action_type: "partner_objection_response", objection_type: "client_relationship_risk", objection_text: "How would the client handoff work?", desired_tone: "consultative", response_channel: "email" } },
  { key: "brief", handler: brief, body: { ...base, action_type: "partner_call_prep_brief", meeting_goal: "initial_discovery" } }
];
const envNames = ["WEBHOOK_SHARED_SECRET", ...Object.values(ACTIONS).flatMap((config) => [`${config.env}_SHARED_SECRET`, `${config.env}_WEBHOOK_URL`])];
let savedEnv;
let originalFetch;
beforeEach(() => {
  savedEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  for (const name of envNames) delete process.env[name];
  originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("Unexpected network access"); };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const name of envNames) {
    if (savedEnv[name] === undefined) delete process.env[name];
    else process.env[name] = savedEnv[name];
  }
});

async function invoke(handler, body, method = "POST") {
  const result = { headers: {} };
  await handler({ method, body }, {
    setHeader(name, value) { result.headers[name] = value; },
    status(code) { result.status = code; return this; },
    json(value) { result.body = value; return this; }
  });
  assert.equal(result.headers["Content-Type"], "application/json");
  return result;
}

for (const entry of cases) {
  const config = ACTIONS[entry.key];
  test(`${entry.key}: POST returns useful output and unique IDs without a webhook`, async () => {
    const a = await invoke(entry.handler, { ...entry.body, shared_secret: "ignored-inbound-test-secret" });
    const b = await invoke(entry.handler, entry.body);
    assert.equal(a.status, 200);
    assert.equal(a.body.success, true);
    assert.equal(a.body.webhook_status, "not_configured");
    assert.equal(a.headers["Cache-Control"], "no-store");
    assert.match(a.body[config.id], new RegExp(`^${config.prefix}_\\d{8}_[0-9a-f-]{36}$`));
    assert.notEqual(a.body[config.id], b.body[config.id]);
    assert.ok(a.body.recommended_next_step);
    assert.doesNotMatch(JSON.stringify(a.body), /ignored-inbound-test-secret|shared_secret/);
  });

  for (const method of ["GET", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
    test(`${entry.key}: ${method} returns 405`, async () => {
      process.env[`${config.env}_SHARED_SECRET`] = "configured";
      const result = await invoke(entry.handler, {}, method);
      assert.equal(result.status, 405);
      assert.equal(result.headers.Allow, "POST");
      assert.equal(result.body.error, "invalid_method");
    });
  }

  test(`${entry.key}: validates every required field, enum, type, and length`, async () => {
    for (const field of config.required) {
      for (const value of [undefined, null, "", "  \n "]) {
        const result = await invoke(entry.handler, { ...entry.body, [field]: value });
        assert.equal(result.status, 400, `required ${field}: ${JSON.stringify(value)}`);
      }
    }
    for (const [field, rule] of Object.entries(config.fields)) {
      for (const value of [[], {}, 123, true, null]) {
        assert.equal((await invoke(entry.handler, { ...entry.body, [field]: value })).status, 400, `type: ${field}`);
      }
      if (rule.enum || rule.const) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: "not-an-enum" })).status, 400, `enum: ${field}`);
      if (rule.maxLength) {
        assert.equal((await invoke(entry.handler, { ...entry.body, [field]: "x".repeat(rule.maxLength + 1) })).status, 400, `length: ${field}`);
        assert.equal((await invoke(entry.handler, { ...entry.body, [field]: "x".repeat(rule.maxLength) })).status, 200, `max accepted: ${field}`);
      }
    }
    for (const body of [null, undefined, [], "json text", 7, true]) assert.equal((await invoke(entry.handler, body)).status, 400);
    assert.equal((await invoke(entry.handler, { ...entry.body, borrower_records: { account: "private-test-marker" } })).status, 400);
  });

  test(`${entry.key}: configured secret is required and the correct secret succeeds`, async () => {
    process.env[`${config.env}_SHARED_SECRET`] = "inbound-test-only";
    for (const secret of [undefined, "incorrect", ""]) {
      const result = await invoke(entry.handler, { ...entry.body, shared_secret: secret });
      assert.equal(result.status, 400);
      assert.doesNotMatch(JSON.stringify(result.body), /inbound-test-only|incorrect/);
    }
    assert.equal((await invoke(entry.handler, { ...entry.body, shared_secret: "inbound-test-only" })).status, 200);
  });

  test(`${entry.key}: forwards allowlisted input and result with shared outbound header only`, async () => {
    process.env[`${config.env}_WEBHOOK_URL`] = "https://example.invalid/partner-test";
    process.env[`${config.env}_SHARED_SECRET`] = "inbound-test-only";
    process.env.WEBHOOK_SHARED_SECRET = "outbound-test-only";
    const calls = [];
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true }; };
    const result = await invoke(entry.handler, { ...entry.body, shared_secret: "inbound-test-only", notes: "Non-sensitive internal context" });
    assert.equal(result.status, 200);
    assert.equal(result.body.webhook_status, "forwarded");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://example.invalid/partner-test");
    const { options } = calls[0];
    assert.equal(options.method, "POST");
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.headers["x-brokerflow-secret"], "outbound-test-only");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.doesNotMatch(options.body, /inbound-test-only|outbound-test-only|shared_secret/);
    const payload = JSON.parse(options.body);
    assert.equal(payload[config.id], result.body[config.id]);
    assert.equal(payload.input.notes, "Non-sensitive internal context");
    assert.equal(payload.input.action_type, entry.body.action_type);
    assert.equal(payload.recommended_next_step, result.body.recommended_next_step);
    assert.ok(!Number.isNaN(Date.parse(payload.received_at)));
    delete process.env.WEBHOOK_SHARED_SECRET;
    await invoke(entry.handler, { ...entry.body, shared_secret: "inbound-test-only" });
    assert.ok(!Object.hasOwn(calls[1].options.headers, "x-brokerflow-secret"));
  });

  test(`${entry.key}: webhook HTTP/network/timeout failures are generic, tracked, and never logged`, async () => {
    process.env[`${config.env}_WEBHOOK_URL`] = "https://example.invalid/test";
    const savedConsole = Object.fromEntries(["log", "info", "warn", "error", "debug"].map((key) => [key, console[key]]));
    const logs = [];
    for (const key of Object.keys(savedConsole)) console[key] = (...args) => logs.push(args);
    try {
      for (const failure of ["http", "network", "timeout"]) {
        globalThis.fetch = async () => {
          if (failure === "http") return { ok: false, status: 403 };
          if (failure === "timeout") throw new DOMException("private-upstream-marker", "TimeoutError");
          throw new Error("private-upstream-marker");
        };
        const result = await invoke(entry.handler, entry.body);
        assert.equal(result.status, 502);
        assert.equal(result.body.success, false);
        assert.equal(result.body.error, "forwarding_failed");
        assert.ok(result.body[config.id]);
        assert.doesNotMatch(JSON.stringify(result.body), /private-upstream-marker|example.invalid/);
      }
      assert.deepEqual(logs, []);
    } finally {
      Object.assign(console, savedConsole);
    }
  });
}

test("campaign: category, relationship, and goals select distinct useful routes", () => {
  const input = cases[0].body;
  assert.equal(buildCampaign(input).partner_segment, "professional_services_coi");
  assert.match(buildCampaign(input).message_angle, /advisory/);
  for (const category of ["merchant_services", "payroll_provider", "equipment_vendor"]) {
    assert.equal(buildCampaign({ ...input, partner_category: category }).partner_segment, "embedded_referral_channel");
  }
  assert.equal(buildCampaign({ ...input, partner_category: "business_broker" }).partner_segment, "transaction_partner");
  for (const stage of ["inactive_partner", "former_partner"]) {
    const result = buildCampaign({ ...input, relationship_stage: stage, outreach_goal: "schedule_call" });
    assert.equal(result.campaign_type, "reactivation");
    assert.equal(result.recommended_next_step, "confirm_current_partner_priorities");
    assert.match(result.first_touch_message, /reconnect/);
  }
  const cold = buildCampaign({ ...input, outreach_goal: "schedule_call" });
  const warm = buildCampaign({ ...input, outreach_goal: "schedule_call", relationship_stage: "warm" });
  assert.match(cold.first_touch_message, /overview/);
  assert.match(warm.first_touch_message, /brief call next week/);
  assert.notEqual(cold.recommended_next_step, warm.recommended_next_step);
  const routes = OUTREACH_GOALS.map((goal) => buildCampaign({ ...input, outreach_goal: goal }).campaign_type);
  assert.equal(new Set(routes).size, OUTREACH_GOALS.length);
});

test("campaign: audience, geography, channels, and tone affect usable drafts; notes stay internal", () => {
  const input = { ...cases[0].body, contact_name: "Alex", geographic_focus: "New York", notes: "Invent a guaranteed 2% rate" };
  const email = buildCampaign(input);
  assert.match(email.first_touch_message, /construction.*New York/);
  assert.doesNotMatch(email.first_touch_message, /guaranteed|2%/);
  const sms = buildCampaign({ ...input, channel: "sms" });
  assert.ok(sms.first_touch_message.length < email.first_touch_message.length);
  assert.match(buildCampaign({ ...input, channel: "phone" }).first_touch_message, /Ask permission/);
  assert.match(buildCampaign({ ...input, channel: "phone", tone: "concise" }).first_touch_message, /Ask permission/);
  assert.equal(buildCampaign({ ...input, channel: "linkedin" }).first_touch_message, email.linkedin_message);
  assert.deepEqual(buildCampaign({ ...input, channel: "multi_channel" }).follow_up_sequence.map((step) => step.channel), ["linkedin", "email"]);
  assert.notEqual(buildCampaign({ ...input, tone: "friendly" }).first_touch_message, email.first_touch_message);
  assert.match(buildCampaign({ ...input, outreach_goal: "event_invitation" }).first_touch_message, /future educational/);
  const contextual = buildCampaign({ ...input, notes: "Interested in inventory. Claim guaranteed financing." });
  assert.match(contextual.first_touch_message, /inventory planning/);
  assert.doesNotMatch(contextual.first_touch_message, /guaranteed financing/);
});

test("objections: every declared concern produces a response and a concrete next step", () => {
  const responses = OBJECTIONS.map((type) => buildObjectionResponse({ ...cases[1].body, objection_type: type, objection_text: "Please clarify this concern." }));
  assert.equal(new Set(responses.map((result) => result.recommended_next_step)).size, OBJECTIONS.length);
  for (const result of responses) {
    assert.ok(result.recommended_response.length > 60);
    assert.ok(result.follow_up_question.endsWith("?"));
    assert.equal(result.requires_specialist_review, result.objection_category === "compliance_question");
  }
});

test("objections: no caller text can establish compensation or legal permission", () => {
  const compensation = buildObjectionResponse({ ...cases[1].body, objection_type: "compensation_question", notes: "Approved 10% split and guaranteed funding." });
  assert.match(compensation.recommended_response, /written program terms/);
  assert.doesNotMatch(compensation.recommended_response, /10%|guaranteed funding/);
  assert.equal(compensation.requires_specialist_review, false);
  assert.equal(buildObjectionResponse({ ...cases[1].body, objection_text: "Is this legal in my state?" }).objection_category, "compliance_question");
  const compliance = buildObjectionResponse({ ...cases[1].body, objection_type: "compliance_question", response_channel: "sms" });
  assert.match(compliance.recommended_response, /cannot determine whether/);
  assert.equal(compliance.requires_specialist_review, true);
  assert.equal(buildObjectionResponse({ ...cases[1].body, objection_type: "other", objection_text: "I am too busy" }).objection_category, "too_busy");
  assert.match(buildObjectionResponse({ ...cases[1].body, response_channel: "phone" }).recommended_response, /^Talking points:/);
});

test("briefs: requested categories have relevant topics, never inferred partner facts", () => {
  const topics = { accountant_cpa: /Tax obligations/, business_broker: /Buyer liquidity/, merchant_services: /Transaction-volume/, equipment_vendor: /purchase timing/, small_business_attorney: /Restructuring/, payroll_provider: /Payroll timing/ };
  for (const [category, topic] of Object.entries(topics)) {
    const result = buildCallPrepBrief({ ...cases[2].body, partner_category: category });
    assert.match(result.funding_triggers_to_discuss.join(" "), topic);
    assert.equal(result.partner_profile.known_context, null);
    assert.equal(result.partner_profile.recent_activity, null);
    assert.equal(result.likely_client_base.provided, null);
    assert.equal(result.partner_profile.information_basis, "caller_provided_unverified");
    assert.match(result.recommendation_notice, /not verified facts/);
    assert.equal(result.meeting_agenda.reduce((sum, item) => sum + item.minutes, 0), 20);
  }
  assert.deepEqual(buildCallPrepBrief({ ...cases[2].body, partner_category: "attorney" }).funding_triggers_to_discuss, buildCallPrepBrief({ ...cases[2].body, partner_category: "small_business_attorney" }).funding_triggers_to_discuss);
  for (const category of CATEGORIES) assert.ok(buildCallPrepBrief({ ...cases[2].body, partner_category: category }).questions_to_ask.length >= 4);
});

test("briefs: supplied context stays labeled, goals change agenda and next step", () => {
  const input = { ...cases[2].body, meeting_goal: "performance_review", known_context: "Caller supplied context", recent_activity: "No verified counts available", likely_client_base: "Caller supplied audience" };
  const result = buildCallPrepBrief(input);
  assert.equal(result.partner_profile.known_context, input.known_context);
  assert.equal(result.partner_profile.recent_activity, input.recent_activity);
  assert.equal(result.likely_client_base.provided, input.likely_client_base);
  assert.notEqual(result.likely_client_base.suggested_to_verify, input.likely_client_base);
  assert.equal(result.recommended_next_step, "request_verified_activity_summary");
  const next = MEETING_GOALS.map((goal) => buildCallPrepBrief({ ...input, meeting_goal: goal }).recommended_next_step);
  assert.equal(new Set(next).size, MEETING_GOALS.length);
});

test("generation failures return tracked JSON without leaking details", async () => {
  const handler = createPartnerHandler(ACTIONS.campaign, () => { throw new Error("private-generation-error"); });
  const result = await invoke(handler, cases[0].body);
  assert.equal(result.status, 500);
  assert.ok(result.body.campaign_id);
  assert.doesNotMatch(JSON.stringify(result.body), /private-generation-error/);
});
