import { mcpResourceMetadata } from "../lib/mcp/auth.js";

export default function handler(_req, res) {
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, MCP-Protocol-Version");
  if (_req.method === "OPTIONS") return res.status(204).end();
  try {
    return res.status(200).json(mcpResourceMetadata());
  } catch {
    return res.status(503).json({ error: "mcp_oauth_unavailable" });
  }
}
