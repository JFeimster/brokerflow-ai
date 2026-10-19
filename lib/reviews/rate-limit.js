export async function consumeRateLimit(
  db,
  scope,
  identity,
  limit,
  windowSeconds = 60,
) {
  const { data, error } = await db.rpc("brokerflow_consume_rate_limit", {
    p_scope: scope,
    p_identity: identity,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error || !data || typeof data.allowed !== "boolean") {
    throw Object.assign(
      new Error("Rate limit service is temporarily unavailable."),
      { status: 503 },
    );
  }
  if (!data.allowed) {
    throw Object.assign(
      new Error(
        "Too many requests. Try again after the current rate-limit window.",
      ),
      {
        status: 429,
        retryAfter: data.retry_after,
      },
    );
  }
  return data;
}
