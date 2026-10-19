import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../../lib/mcp/server.js";
import { readFileSync } from "node:fs";
export const fixture = JSON.parse(
  readFileSync(new URL("./core-workflow.json", import.meta.url)),
);
export const coreNames = [
  "capture_borrower_intake",
  "route_lender_fit",
  "request_lender_match_review",
  "generate_document_checklist",
  "trigger_missing_document_request",
  "lookup_deal_status",
  "capture_partner_referral",
];
export function context(overrides = {}) {
  return {
    user: { id: fixture.actor_id },
    db: {
      from() {
        throw new Error("Unexpected read");
      },
      rpc() {
        throw new Error("Unexpected write");
      },
    },
    workspaces: [
      {
        id: fixture.organization_id,
        name: "Synthetic workspace",
        canRead: true,
        canWrite: true,
        canAudit: true,
        role: "broker",
      },
    ],
    ...overrides,
  };
}
export async function clientFor(t, ctx = context(), options = {}) {
  const server = createMcpServer({
    authenticateMcp: async () => ctx,
    rateLimit: async () => {},
    ...options,
  });
  const client = new Client({
    name: "synthetic-core-workflow",
    version: "1.0.0",
  });
  const [a, b] = InMemoryTransport.createLinkedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });
  await Promise.all([server.connect(b), client.connect(a)]);
  return client;
}
export const reviewScenario = {
  action_type: "lender_match_review",
  requester_name: "Synthetic broker",
  ...fixture.intake.scenario,
  state: "NY",
  human_review_required: true,
};
