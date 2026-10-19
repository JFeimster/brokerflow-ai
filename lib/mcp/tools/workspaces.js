import { z } from "zod";
import { registerTool, result } from "../registry.js";
import { requireWorkspace } from "../context.js";

export function registerWorkspaces(
  server,
  { contextFor, create, apply, createTask, completeTask, rateLimit },
) {
  registerTool(
    server,
    "get_my_workspaces",
    {
      title: "List my BrokerFlow workspaces",
      description:
        "List active organizations where the authenticated user has review read access and their current role capabilities.",
      inputSchema: {},
      outputSchema: {
        workspaces: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            role: z.string(),
            can_read: z.boolean(),
            can_write: z.boolean(),
            can_audit: z.boolean(),
          }),
        ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (_input, extra) => {
      const context = await contextFor(extra);
      return result({
        workspaces: context.workspaces.map(
          ({ id, name, role, canRead, canWrite, canAudit }) => ({
            id,
            name,
            role,
            can_read: canRead,
            can_write: canWrite,
            can_audit: canAudit,
          }),
        ),
      });
    },
  );
}
