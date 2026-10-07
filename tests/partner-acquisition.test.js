import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import signup from "../api/no-auth/affiliate-partner-signup.js";
import prospect, { classifyProspect } from "../api/no-auth/channel-partner-prospect.js";
import scoring, { scoreProspect } from "../api/no-auth/coi-niche-scoring.js";

const cases = [
  { name: "signup", handler: signup, env: "AFFILIATE_PARTNER_SIGNUP", id: "partner_signup_id", required: ["source", "action_type", "partner_name", "email", "partner_type", "business_type", "compliance_acknowledged", "consent_to_contact"], invalids: [{ source: "bogus" }, { partner_type: "bogus" }, { business_type: "bogus" }, { email: "invalid" }, { expected_referral_volume: -1 }, { consent_to_contact: false }, { partner_name: "x".repeat(161) }], body: { source: "webhook_test", action_type: "affiliate_partner_signup", partner_name: "Alex Morgan", email: "alex@example.com", partner_type: "affiliate", business_type: "accountant_cpa", compliance_acknowledged: true, consent_to_contact: true, expected_referral_volume: 5 } },
  { name: "prospect", handler: prospect, env: "CHANNEL_PARTNER_PROSPECT", id: "prospect_id", required: ["source", "action_type", "company_name", "contact_name", "partner_category", "niche", "target_client_type", "estimated_referral_potential", "relationship_strength"], invalids: [{ source: "bogus" }, { partner_category: "bogus" }, { estimated_referral_potential: "bogus" }, { relationship_strength: "bogus" }, { outreach_priority: "bogus" }, { website: "javascript:alert(1)" }, { company_name: "x".repeat(201) }], body: { source: "webhook_test", action_type: "channel_partner_prospect", company_name: "Northside Accounting", contact_name: "Alex Morgan", partner_category: "accountant_cpa", niche: "construction", target_client_type: "small_business_owner", estimated_referral_potential: "high", relationship_strength: "aware", outreach_priority: "normal", city: "Buffalo", state: "NY", website: "https://example.com" } },
  { name: "scoring", handler: scoring, env: "COI_NICHE_SCORING", id: "scoring_id", required: ["source", "action_type", "company_name", "partner_category", "niche", "client_access_level", "funding_trigger_frequency", "trust_authority_level", "repeat_referral_potential", "relationship_strength", "urgency_signals"], invalids: [{ source: "bogus" }, { client_access_level: "bogus" }, { funding_trigger_frequency: "bogus" }, { trust_authority_level: "bogus" }, { repeat_referral_potential: "bogus" }, { relationship_strength: "bogus" }, { urgency_signals: "bogus" }, { company_name: "x".repeat(201) }], body: { source: "webhook_test", action_type: "coi_niche_scoring", prospect_id: "cpp_123", company_name: "Northside Accounting", partner_category: "accountant_cpa", niche: "construction", client_access_level: "direct", funding_trigger_frequency: "frequent", trust_authority_level: "primary_advisor", repeat_referral_potential: "recurring", relationship_strength: "engaged", urgency_signals: "emerging" } }
];
const envNames = ["WEBHOOK_SHARED_SECRET", ...cases.flatMap(({ env }) => [`${env}_SHARED_SECRET`, `${env}_WEBHOOK_URL`])];
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
  return result;
}

for (const entry of cases) {
  test(`${entry.name}: accepts valid POST and returns unique tracking IDs`, async () => {
    const a = await invoke(entry.handler, entry.body);
    const b = await invoke(entry.handler, entry.body);
    assert.equal(a.status, 200);
    assert.equal(a.body.success, true);
    assert.ok(a.body[entry.id]);
    assert.notEqual(a.body[entry.id], b.body[entry.id]);
  });
  test(`${entry.name}: rejects non-POST requests and missing/invalid required fields`, async () => {
    const method = await invoke(entry.handler, {}, "GET");
    assert.equal(method.status, 405);
    assert.equal(method.headers.Allow, "POST");
    for (const field of entry.required) {
      assert.equal((await invoke(entry.handler, { ...entry.body, [field]: undefined })).status, 400, field);
    }
    for (const changes of entry.invalids) assert.equal((await invoke(entry.handler, { ...entry.body, ...changes })).status, 400, JSON.stringify(changes));
  });
  test(`${entry.name}: enforces optional request secret and excludes it from webhook`, async () => {
    process.env[`${entry.env}_SHARED_SECRET`] = "request-secret";
    assert.equal((await invoke(entry.handler, entry.body)).status, 400);
    process.env[`${entry.env}_WEBHOOK_URL`] = "https://example.invalid/hook";
    process.env.WEBHOOK_SHARED_SECRET = "outbound-secret";
    const calls = [];
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true }; };
    const response = await invoke(entry.handler, { ...entry.body, shared_secret: "request-secret" });
    assert.equal(response.status, 200);
    assert.equal(calls[0].options.headers["x-brokerflow-secret"], "outbound-secret");
    assert.doesNotMatch(calls[0].options.body, /request-secret|outbound-secret|shared_secret/);
  });
  test(`${entry.name}: reports configured webhook failures without exposing details`, async () => {
    process.env[`${entry.env}_WEBHOOK_URL`] = "https://example.invalid/hook";
    globalThis.fetch = async () => ({ ok: false, status: 500 });
    const response = await invoke(entry.handler, entry.body);
    assert.equal(response.status, 502);
    assert.equal(response.body.error, "forwarding_failed");
    assert.doesNotMatch(JSON.stringify(response.body), /example\.invalid|private/);
  });
}

test("Batch 1 partner scoring remains internal partner development", () => {
  assert.match(JSON.stringify(scoreProspect(cases[2].body)), /\d+/);
  assert.equal(classifyProspect(cases[1].body).recommended_priority, "normal");
  assert.equal(JSON.stringify(scoreProspect(cases[2].body)).includes("borrower"), false);
});
