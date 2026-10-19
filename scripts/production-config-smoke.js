const baseUrl = (process.env.BROKERFLOW_PRODUCTION_URL || "").replace(/\/$/, "");

if (!baseUrl || !/^https:\/\//i.test(baseUrl)) {
  throw new Error("BROKERFLOW_PRODUCTION_URL must be an HTTPS URL.");
}

const configResponse = await fetch(`${baseUrl}/api/console/config`, {
  headers: { Accept: "application/json" },
  cache: "no-store",
  signal: AbortSignal.timeout(10_000),
});
if (!configResponse.ok) {
  throw new Error(`Production config endpoint returned HTTP ${configResponse.status}.`);
}

const config = await configResponse.json();
if (config.mode !== "live" || config.configured !== true) {
  throw new Error("Production console is not configured for live mode.");
}
const publicConfigFields = new Set([
  "success",
  "mode",
  "configured",
  "supabase_url",
  "publishable_key",
]);
if (Object.keys(config).some((key) => !publicConfigFields.has(key))) {
  throw new Error("Production config response contains a server-only field name.");
}

const authResponse = await fetch(`${baseUrl}/api/console/session`, {
  headers: {
    Accept: "application/json",
    Authorization: "Bearer invalid-production-smoke-token",
  },
  cache: "no-store",
  signal: AbortSignal.timeout(10_000),
});
if (authResponse.status !== 401) {
  throw new Error(`Protected session endpoint returned HTTP ${authResponse.status}; expected 401 for an invalid token.`);
}

console.log("Production live config is present, no server credential fields are exposed, and Supabase rejected an invalid session token.");
