import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpAuthenticator } from "./auth.js";
import { applyAction, createReview } from "../reviews/service.js";
import { consumeRateLimit } from "../reviews/rate-limit.js";
import {
  createFollowUpTask,
  completeFollowUpTask,
} from "../follow-up-tasks/service.js";
import { registerWorkspaces } from "./tools/workspaces.js";
import { registerReviews } from "./tools/reviews.js";
import { registerFollowUpTasks } from "./tools/follow-up-tasks.js";
import { registerRouteLenderFit } from "./tools/route-lender-fit.js";
import { registerGenerateDocumentChecklist } from "./tools/generate-document-checklist.js";
import { registerRequestLenderMatchReview } from "./tools/request-lender-match-review.js";
import { registerCaptureBorrowerIntake } from "./tools/capture-borrower-intake.js";
import { registerTriggerMissingDocumentRequest } from "./tools/trigger-missing-document-request.js";
import { registerLookupDealStatus } from "./tools/lookup-deal-status.js";
import { registerCapturePartnerReferral } from "./tools/capture-partner-referral.js";
export { handleMcpRequest } from "./transport.js";

export function createMcpServer({
  authenticateMcp = createMcpAuthenticator(),
  request,
  create = createReview,
  apply = applyAction,
  createTask = createFollowUpTask,
  completeTask = completeFollowUpTask,
  rateLimit = consumeRateLimit,
  ...services
} = {}) {
  const server = new McpServer({ name: "brokerflow-ai", version: "1.0.0" });
  const contextFor = (extra) =>
    authenticateMcp(request || extra.requestInfo?.request || extra);
  const dependencies = {
    contextFor,
    create,
    apply,
    createTask,
    completeTask,
    rateLimit,
    ...services,
  };
  registerWorkspaces(server, dependencies);
  registerReviews(server, dependencies);
  registerFollowUpTasks(server, dependencies);
  registerRouteLenderFit(server, dependencies);
  registerGenerateDocumentChecklist(server, dependencies);
  registerRequestLenderMatchReview(server, dependencies);
  registerCaptureBorrowerIntake(server, dependencies);
  registerTriggerMissingDocumentRequest(server, dependencies);
  registerLookupDealStatus(server, dependencies);
  registerCapturePartnerReferral(server, dependencies);
  return server;
}
