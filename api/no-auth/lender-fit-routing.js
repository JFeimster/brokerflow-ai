import { validatePayload } from "../../lib/lender-fit/validation.js";
import { routeScenario } from "../../lib/lender-fit/service.js";
function sendJson(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json");
  return res.status(statusCode).json(payload);
}

function makeId(prefix) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${datePart}_${randomPart}`;
}

async function forwardToAutomation(payload) {
  const webhookUrl = process.env.LENDER_FIT_ROUTING_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("No LENDER_FIT_ROUTING_WEBHOOK_URL configured. Payload logged only.");
    console.log(JSON.stringify(payload, null, 2));
    return { forwarded: false, destination: "console" };
  }

  const headers = { "Content-Type": "application/json" };

  if (process.env.WEBHOOK_SHARED_SECRET) {
    headers["x-brokerflow-secret"] = process.env.WEBHOOK_SHARED_SECRET;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(`Webhook forwarding failed with status ${response.status}: ${responseText}`);
  }

  return { forwarded: true, destination: "automation_webhook" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, {
      success: false,
      error: "invalid_method",
      message: "Only POST requests are allowed."
    });
  }

  try {
    const body = req.body || {};

    if (process.env.LENDER_FIT_ROUTING_SHARED_SECRET && body.shared_secret !== process.env.LENDER_FIT_ROUTING_SHARED_SECRET) {
      return sendJson(res, 400, {
        success: false,
        error: "validation_error",
        message: "Invalid or missing shared_secret."
      });
    }

    const validationError = validatePayload(body);

    if (validationError) {
      return sendJson(res, 400, {
        success: false,
        error: validationError.error,
        message: validationError.message
      });
    }

    const routing_id = makeId("lfr");
    const routing = routeScenario(body);

    const payload = {
      success: true,
      routing_id,
      scenario_id: body.scenario_id || null,
      received_at: new Date().toISOString(),
      source: body.source,
      action_type: "lender_fit_routing",
      requester_name: body.requester_name || null,
      borrower_type: body.borrower_type,
      loan_purpose: body.loan_purpose,
      requested_amount: body.requested_amount,
      state: body.state,
      credit_score_range: body.credit_score_range || "unknown",
      monthly_revenue: body.monthly_revenue ?? null,
      annual_revenue: body.annual_revenue ?? null,
      time_in_business_months: body.time_in_business_months ?? null,
      property_type: body.property_type || null,
      occupancy_type: body.occupancy_type || null,
      collateral_available: body.collateral_available ?? null,
      urgency: body.urgency || "normal",
      consent_to_contact: body.consent_to_contact ?? null,
      notes: body.notes || null,
      compliance_notice: "Routing only. No approval, denial, underwriting, pricing, funding, or lender submission has been made.",
      ...routing
    };

    await forwardToAutomation(payload);

    return sendJson(res, 200, {
      success: true,
      routing_id,
      primary_route: routing.primary_route,
      secondary_routes: routing.secondary_routes,
      fit_score: routing.fit_score,
      fit_tier: routing.fit_tier,
      automation_actions: routing.automation_actions,
      missing_information: routing.missing_information,
      next_step: routing.next_step
    });
  } catch (error) {
    console.error("Lender fit routing error:", error);
    return sendJson(res, 500, {
      success: false,
      error: "server_error",
      message: "Unable to route lender fit scenario."
    });
  }
}
