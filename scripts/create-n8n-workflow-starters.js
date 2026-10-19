import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const workflows = [
  {
    file: "borrower-intake-to-crm.n8n.json",
    name: "BrokerFlow - Borrower Intake to CRM (Preview Only)",
    path: "brokerflow-intake-to-crm-preview",
    required: ["intake_id", "organization_id", "borrower_type", "loan_purpose", "requested_amount", "state"],
    next: "Review the sanitized field list, then connect an approved CRM adapter manually.",
  },
  {
    file: "missing-doc-reminder-workflow.n8n.json",
    name: "BrokerFlow - Missing Document Reminder (Draft Only)",
    path: "brokerflow-missing-document-draft",
    required: ["intake_id", "missing_document_types", "contact_permission"],
    next: "Have a broker review a separate draft and authorized delivery channel.",
  },
  {
    file: "referral-partner-lead-routing.n8n.json",
    name: "BrokerFlow - Partner Referral Routing (Preview Only)",
    path: "brokerflow-partner-referral-preview",
    required: ["referral_id", "organization_id", "partner_id", "intake_id"],
    next: "Verify partner and intake attribution in the authorized BrokerFlow workspace.",
  },
  {
    file: "renewal-reminder-workflow.n8n.json",
    name: "BrokerFlow - Renewal Reminder (Draft Only)",
    path: "brokerflow-renewal-reminder-draft",
    required: ["deal_id", "renewal_date", "contact_permission"],
    next: "Ask the assigned broker to verify timing and separately authorize outreach.",
  },
  {
    file: "daily-pipeline-summary.n8n.json",
    name: "BrokerFlow - Daily Pipeline Summary (Preview Only)",
    path: "brokerflow-pipeline-summary-preview",
    required: ["organization_id", "snapshot_generated_at", "stage_counts"],
    next: "Review counts from an authorized source; this template does not read the BrokerFlow database or deliver a digest.",
  },
];

const directory = resolve("workflows/n8n");
await mkdir(directory, { recursive: true });
for (const [index, spec] of workflows.entries()) {
  const code = [
    "const input = $input.first().json.body ?? $input.first().json;",
    `const required = ${JSON.stringify(spec.required)};`,
    'const missing = required.filter((key) => input[key] === undefined || input[key] === null || input[key] === "");',
    "return [{ json: {",
    "  success: missing.length === 0,",
    `  workflow: ${JSON.stringify(spec.file)},`,
    '  mode: "preview_only",',
    "  missing_required_fields: missing,",
    `  next_step: ${JSON.stringify(spec.next)},`,
    '  external_write: "not_configured",',
    '  delivery_status: "not_sent"',
    "} }];",
  ].join("\n");
  const names = ["Authenticated Webhook", "Validate and Prepare Preview", "Return Preview"];
  const nodes = [
    {
      parameters: { httpMethod: "POST", path: spec.path, authentication: "headerAuth", responseMode: "responseNode" },
      id: `brokerflow-preview-webhook-${index + 1}`,
      name: names[0],
      type: "n8n-nodes-base.webhook",
      typeVersion: 2.1,
      position: [0, 0],
      credentials: { httpHeaderAuth: { id: "CONFIGURE_IN_N8N", name: "Configure BrokerFlow Workflow Token" } },
    },
    {
      parameters: { mode: "runOnceForAllItems", language: "javaScript", jsCode: code },
      id: `brokerflow-preview-code-${index + 1}`,
      name: names[1],
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [260, 0],
    },
    {
      parameters: { respondWith: "json", responseBody: "={{ JSON.stringify($json) }}" },
      id: `brokerflow-preview-response-${index + 1}`,
      name: names[2],
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.4,
      position: [520, 0],
    },
  ];
  const workflow = {
    name: spec.name,
    nodes,
    connections: {
      [names[0]]: { main: [[{ node: names[1], type: "main", index: 0 }]] },
      [names[1]]: { main: [[{ node: names[2], type: "main", index: 0 }]] },
    },
    active: false,
    settings: { executionOrder: "v1" },
    pinData: {},
    versionId: `e11a9f5b-3d98-4c61-99aa-c37a438f02${index + 1}`,
    meta: { templateCredsSetupCompleted: false },
    tags: [{ name: "brokerflow" }, { name: "preview-only" }],
  };
  await writeFile(resolve(directory, spec.file), `${JSON.stringify(workflow, null, 2)}\n`, "utf8");
}
process.stdout.write(`Generated ${workflows.length} inactive, credential-placeholder n8n preview workflows.\n`);
