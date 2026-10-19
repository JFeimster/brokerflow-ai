import { timingSafeEqual } from "node:crypto";
import { createReview, database } from "../../lib/reviews/service.js";
import { consumeRateLimit } from "../../lib/reviews/rate-limit.js";
import { validateProtectedReview } from "../../lib/reviews/validation.js";
import { fail, jsonBody, method, reply } from "../../lib/reviews/http.js";
function equal(a, b) {
  const x = Buffer.from(a || ""),
    y = Buffer.from(b || "");
  return x.length === y.length && timingSafeEqual(x, y);
}
export function createIngestHandler(deps = {}) {
  const getDatabase = deps.database || database,
    create = deps.createReview || createReview,
    limit = deps.consumeRateLimit || consumeRateLimit;
  return async function handler(req, res) {
    if (!method(req, res, "POST")) return;
    try {
      const expected = process.env.BROKERFLOW_INGEST_API_KEY,
        org = process.env.BROKERFLOW_INGEST_ORGANIZATION_ID;
      const token = /^Bearer\s+(.+)$/i.exec(
        req.headers.authorization || "",
      )?.[1];
      if (!expected || !org)
        throw Object.assign(new Error("Integration is not configured."), {
          status: 503,
        });
      if (!equal(token, expected))
        throw Object.assign(new Error("Unauthorized."), { status: 401 });
      const body = jsonBody(req);
      const scenario = validateProtectedReview(body);
      const db = getDatabase();
      const { data: organization, error } = await db
        .from("organizations")
        .select("id,status")
        .eq("id", org)
        .maybeSingle();
      if (error || !organization || organization.status !== "active")
        throw Object.assign(new Error("Integration workspace unavailable."), {
          status: 503,
        });
      await limit(db, "trusted_ingest", org, 60, 60);
      const data = await create(
        { db },
        org,
        scenario,
        req.headers["idempotency-key"],
        null,
      );
      return reply(res, data.duplicate ? 200 : 201, {
        success: true,
        review_request_id: data.review_request_id,
        status: data.status,
        next_step: "manual_review",
        persisted: true,
        duplicate: Boolean(data.duplicate),
      });
    } catch (e) {
      return fail(res, e);
    }
  };
}
export default createIngestHandler();
