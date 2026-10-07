import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import onboarding, { buildOnboardingChecklist } from "../api/no-auth/partner-onboarding-checklist.js";
import enablement, { buildEnablementContent } from "../api/no-auth/partner-enablement-content.js";
import reactivation, { buildReactivation } from "../api/no-auth/partner-reactivation.js";
import { ACTIONS } from "../lib/partner-action-utils.js";

const cases = [
  { key: "onboarding", handler: onboarding, body: { source: "webhook_test", action_type: "partner_onboarding_checklist", partner_type: "professional_services_coi", business_type: "accounting practice", referral_model: "warm_introduction", compensation_model: "non_compensated_coi", training_required: true, approved_messaging_required: true, crm_setup_required: true, current_onboarding_status: "in_progress", completed_items: ["profile_setup"] } },
  { key: "enablement", handler: enablement, body: { source: "webhook_test", action_type: "partner_enablement_content", partner_category: "accountant_cpa", business_type: "accounting practice", content_type: "funding_trigger_guide", target_audience: "small business clients", funding_product_focus: "working capital", tone: "consultative", format: "bullet_guide", distribution_channel: "email", notes: "Do not expose this internal note in public content." } },
  { key: "reactivation", handler: reactivation, body: { source: "webhook_test", action_type: "partner_reactivation", reactivation_segment: "inactive_90_days", partner_name: "Alex Rivera", partner_category: "accountant_cpa", last_activity_date: "2026-06-15", last_referral_date: "2026-04-20", relationship_strength: "established", preferred_channel: "email", known_context: "Seasonal resources requested." } }
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
  assert.equal(result.headers["Cache-Control"], "no-store");
  return result;
}

for (const entry of cases) {
  const config = ACTIONS[entry.key];
  test(`${entry.key}: POST returns tracked output and unique IDs`, async () => {
    const a = await invoke(entry.handler, { ...entry.body, shared_secret: "ignored-test-secret" });
    const b = await invoke(entry.handler, entry.body);
    assert.equal(a.status, 200);
    assert.equal(a.body.success, true);
    assert.equal(a.body.webhook_status, "not_configured");
    assert.match(a.body[config.id], new RegExp(`^${config.prefix}_\\d{8}_[0-9a-f-]{36}$`));
    assert.notEqual(a.body[config.id], b.body[config.id]);
    assert.ok(a.body.recommended_next_step);
    assert.doesNotMatch(JSON.stringify(a.body), /ignored-test-secret|shared_secret/);
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

  test(`${entry.key}: validates required fields, types, enums, lengths, and allowed properties`, async () => {
    for (const field of config.required) {
      for (const value of [undefined, null, "", "  \n "]) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: value })).status, 400, `required ${field}`);
    }
    for (const [field, rule] of Object.entries(config.fields)) {
      if (rule.type === "array") {
        for (const value of ["wrong", {}, 1, null]) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: value })).status, 400, `array type: ${field}`);
        if (rule.items?.enum) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: ["invalid-item"] })).status, 400, `array item: ${field}`);
        if (rule.uniqueItems) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: ["profile_setup", "profile_setup"] })).status, 400, `array unique: ${field}`);
        continue;
      }
      if (rule.type === "boolean") {
        for (const value of ["true", 0, null, [], {}]) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: value })).status, 400, `boolean type: ${field}`);
        continue;
      }
      for (const value of [[], {}, 123, true, null]) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: value })).status, 400, `type: ${field}`);
      if (rule.enum) {
        assert.equal((await invoke(entry.handler, { ...entry.body, [field]: "not-an-enum" })).status, 400, `enum: ${field}`);
        for (const value of rule.enum) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: value })).status, 200, `allowed enum ${field}=${value}`);
      }
      if (rule.const) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: "not-an-enum" })).status, 400, `const: ${field}`);
      if (rule.maxLength) {
        assert.equal((await invoke(entry.handler, { ...entry.body, [field]: "x".repeat(rule.maxLength + 1) })).status, 400, `length: ${field}`);
        const maxValue = rule.format === "date" ? "2026-01-31" : "x".repeat(rule.maxLength);
        assert.equal((await invoke(entry.handler, { ...entry.body, [field]: maxValue })).status, 200, `max accepted: ${field}`);
      }
      if (rule.format === "date") {
        for (const value of ["2026-02-30", "", "not-a-date"]) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: value })).status, 400, `date: ${field}`);
      }
    }
    for (const body of [null, undefined, [], "json text", 7, true]) assert.equal((await invoke(entry.handler, body)).status, 400);
    assert.equal((await invoke(entry.handler, { ...entry.body, borrower_records: { private: "marker" } })).status, 400);
  });

  test(`${entry.key}: configured request secret is required and never returned`, async () => {
    process.env[`${config.env}_SHARED_SECRET`] = "request-only-test-secret";
    for (const shared_secret of [undefined, "incorrect", ""]) {
      const result = await invoke(entry.handler, { ...entry.body, shared_secret });
      assert.equal(result.status, 400);
      assert.doesNotMatch(JSON.stringify(result.body), /request-only-test-secret|incorrect/);
    }
    assert.equal((await invoke(entry.handler, { ...entry.body, shared_secret: "request-only-test-secret" })).status, 200);
  });

  test(`${entry.key}: webhook uses shared outbound header and excludes request secret`, async () => {
    process.env[`${config.env}_WEBHOOK_URL`] = "https://example.invalid/action-test";
    process.env[`${config.env}_SHARED_SECRET`] = "request-only-test-secret";
    process.env.WEBHOOK_SHARED_SECRET = "outbound-test-secret";
    const calls = [];
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true }; };
    const result = await invoke(entry.handler, { ...entry.body, shared_secret: "request-only-test-secret" });
    assert.equal(result.status, 200);
    assert.equal(result.body.webhook_status, "forwarded");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.method, "POST");
    assert.equal(calls[0].options.redirect, "error");
    assert.ok(calls[0].options.signal instanceof AbortSignal);
    assert.equal(calls[0].options.headers["x-brokerflow-secret"], "outbound-test-secret");
    const forwarded = calls[0].options.body;
    assert.doesNotMatch(forwarded, /request-only-test-secret|outbound-test-secret|shared_secret/);
    assert.equal(JSON.parse(forwarded)[config.id], result.body[config.id]);
  });

  test(`${entry.key}: webhook failure returns generic tracked 502`, async () => {
    process.env[`${config.env}_WEBHOOK_URL`] = "https://example.invalid/action-test";
    globalThis.fetch = async () => ({ ok: false, status: 500 });
    const result = await invoke(entry.handler, entry.body);
    assert.equal(result.status, 502);
    assert.equal(result.body.error, "forwarding_failed");
    assert.ok(result.body[config.id]);
    assert.doesNotMatch(JSON.stringify(result.body), /example.invalid|private/);
  });
}

test("onboarding: partner context changes checklist and completion deterministically", () => {
  const coi = buildOnboardingChecklist(cases[0].body);
  const affiliate = buildOnboardingChecklist({ ...cases[0].body, partner_type: "affiliate", referral_model: "affiliate_link" });
  assert.ok(coi.missing_items.includes("client_introduction_process"));
  assert.ok(affiliate.missing_items.includes("referral_link_setup"));
  assert.ok(affiliate.missing_items.includes("attribution_process"));
  assert.equal(coi.completed_items.includes("profile_setup"), true);
  assert.equal(coi.recommended_next_step, "complete_first_referral_steps");
  assert.equal(buildOnboardingChecklist({ ...cases[0].body, current_onboarding_status: "blocked" }).onboarding_priority, "high");
  assert.doesNotMatch(JSON.stringify(coi), /approve compensation|calculate payout|legal eligibility/i);
});

test("enablement: category guidance changes and untrusted notes stay out of draft", () => {
  const cpa = buildEnablementContent(cases[1].body);
  const broker = buildEnablementContent({ ...cases[1].body, partner_category: "business_broker" });
  assert.match(cpa.draft_content, /tax payments|tax-payment timing/i);
  assert.match(broker.draft_content, /acquisition financing/i);
  assert.doesNotMatch(cpa.draft_content, /internal note|Do not expose/i);
  assert.match(cpa.draft_content, /does not guarantee approval, rates, terms, lender acceptance, or funding/i);
  const email = buildEnablementContent({ ...cases[1].body, format: "email", tone: "friendly" });
  const faq = buildEnablementContent({ ...cases[1].body, format: "faq", tone: "concise" });
  assert.match(email.draft_content, /Subject:.*\n\nHi,/);
  assert.match(faq.draft_content, /Q: What should a partner listen for/);
  assert.notEqual(email.draft_content, faq.draft_content);
});

test("reactivation: segment, channel, message, and bounded cadence are deterministic", () => {
  const noContact = buildReactivation({ ...cases[2].body, reactivation_segment: "prospect_never_contacted", preferred_channel: "multi_channel" });
  assert.match(noContact.recommended_message, /reaching out/);
  assert.match(noContact.message, /Initial partner outreach/);
  assert.deepEqual(noContact.follow_up_schedule.map((step) => step.channel), ["email", "linkedin", "email"]);
  const highValue = buildReactivation({ ...cases[2].body, reactivation_segment: "high_value_dormant_partner", preferred_channel: undefined });
  assert.equal(highValue.recommended_channel, "phone");
  assert.equal(highValue.recommended_next_step, "assign_relationship_manager_follow_up");
  const noResponse = buildReactivation({ ...cases[2].body, reactivation_segment: "prospect_contacted_no_response" });
  assert.ok(noResponse.follow_up_schedule.length <= 3);
  assert.match(noResponse.recommended_message, /No problem if the timing is not right/);
});
