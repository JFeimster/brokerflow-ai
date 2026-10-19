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
  return server;
}
