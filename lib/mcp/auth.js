import { authenticate } from "../reviews/service.js";

function accessToken(req) {
  return /^Bearer\s+([^\s]+)$/i.exec(req.headers?.authorization || "")?.[1];
}

function readClaims(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function audienceMatches(actual, expected) {
  return Array.isArray(actual) ? actual.includes(expected) : actual === expected;
}

export function validateMcpOAuthClaims(claims, { issuer, audience, now = Date.now(), clientIds = [] }) {
  if (!claims || typeof claims !== "object") return false;
  if (claims.iss !== issuer || !audienceMatches(claims.aud, audience)) return false;
  if (typeof claims.sub !== "string" || claims.sub.length < 1) return false;
  if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= now) return false;
  if (typeof claims.client_id !== "string" || !claims.client_id) return false;
  if (clientIds.length && !clientIds.includes(claims.client_id)) return false;
  return true;
}

export function createMcpAuthenticator({ verifyUser = authenticate, env = process.env } = {}) {
  return async function authenticateMcp(req) {
    const token = accessToken(req);
    if (!token) throw Object.assign(new Error("Authentication required."), { status: 401, code: "unauthorized" });
    const resource = env.BROKERFLOW_MCP_RESOURCE;
    const expectedAudience = env.BROKERFLOW_MCP_AUDIENCE;
    const projectUrl = env.SUPABASE_URL?.replace(/\/$/, "");
    const clientIds = (env.BROKERFLOW_MCP_OAUTH_CLIENT_IDS || "").split(",").map(value => value.trim()).filter(Boolean);
    if (!resource || !expectedAudience || resource !== expectedAudience || !projectUrl || !env.SUPABASE_SECRET_KEY || !clientIds.length) {
      throw Object.assign(new Error("MCP OAuth is not configured."), { status: 503, code: "mcp_oauth_unavailable" });
    }
    // authenticate() calls Supabase Auth getUser(token), which verifies the token
    // with the configured Auth service before any claims are used below.
    const context = await verifyUser(req);
    const claims = readClaims(token);
    if (!validateMcpOAuthClaims(claims, {
      issuer: `${projectUrl}/auth/v1`,
      audience: expectedAudience,
      clientIds,
    }) || claims.sub !== context.user.id) {
      throw Object.assign(new Error("The access token is not valid for this MCP resource."), { status: 401, code: "invalid_token" });
    }
    return context;
  };
}

export function mcpResourceMetadata(env = process.env) {
  const resource = env.BROKERFLOW_MCP_RESOURCE || "https://brokerflow-ai.vercel.app/mcp";
  const authUrl = env.SUPABASE_URL?.replace(/\/$/, "");
  if (!authUrl) throw Object.assign(new Error("Supabase OAuth is not configured."), { status: 503 });
  return {
    resource,
    authorization_servers: [`${authUrl}/auth/v1`],
    scopes_supported: ["openid", "email", "profile"],
    bearer_methods_supported: ["header"],
    resource_documentation: "https://github.com/JFeimster/brokerflow-ai/blob/main/docs/MCP_OAUTH_SETUP.md",
  };
}

export function unauthorizedChallenge(env = process.env, invalidToken = false) {
  const resource = env.BROKERFLOW_MCP_RESOURCE || "https://brokerflow-ai.vercel.app/mcp";
  const metadata = new URL("/.well-known/oauth-protected-resource/mcp", resource).toString();
  return `Bearer resource_metadata="${metadata}"${invalidToken ? ', error="invalid_token"' : ""}`;
}
