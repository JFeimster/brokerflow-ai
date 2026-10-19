export function publicError(error) {
  const status = [401, 403, 404, 409, 422, 429, 503].includes(error?.status)
    ? error.status
    : 500;
  const codes = {
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    409: "conflict",
    422: "invalid_input",
    429: "rate_limited",
    503: "unavailable",
    500: "internal_error",
  };
  const message =
    status < 500
      ? error.message
      : "The BrokerFlow service is temporarily unavailable.";
  const detail = { error: error?.code || codes[status], status, message };
  return {
    isError: true,
    structuredContent: detail,
    content: [
      { type: "text", text: `${detail.error} (${status}): ${message}` },
    ],
  };
}
