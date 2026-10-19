import { createMcpAuthenticator, unauthorizedChallenge } from "../lib/mcp/auth.js";
import { handleMcpRequest } from "../lib/mcp/server.js";

export const config = { api: { bodyParser: { sizeLimit: "256kb" } } };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  try {
    await createMcpAuthenticator()(req);
  } catch (error) {
    if (error.status === 401) res.setHeader("WWW-Authenticate", unauthorizedChallenge(process.env, error.code === "invalid_token"));
    if (error.status === 429 && error.retryAfter) res.setHeader("Retry-After", String(error.retryAfter));
    return res.status(error.status || 503).json({ error: error.code || "mcp_unavailable", message: error.status && error.status < 500 ? error.message : "MCP service is temporarily unavailable." });
  }
  return handleMcpRequest(req, res, { authenticateMcp: createMcpAuthenticator() });
}
