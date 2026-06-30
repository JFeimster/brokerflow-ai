# No-Auth Actions: Schema Examples

This file gives you **copy-paste OpenAPI snippets** for the no-auth Custom GPT Actions in this folder. Paste a snippet into the GPT Builder's Action schema editor, replace the server URL and field names, and you have a working Action.

All schemas use OpenAPI 3.1.0, declare `security: []` (no auth), and mark write Actions with `x-openai-isConsequential: true` so the GPT asks before sending. Indentation matters in YAML — keep two-space indents.

---

## 🧱 Minimal Schema Skeleton

The smallest valid no-auth Action. Start here.

    openapi: 3.1.0
    info:
      title: Loan Broker No-Auth Action
      version: 1.0.0
    servers:
      - url: https://your-domain.com
    security: []
    paths:
      /webhook/example:
        post:
          operationId: sendExampleEvent
          summary: Send an example event to the workflow
          x-openai-isConsequential: true
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  type: object
                  properties:
                    source:
                      type: string
                    event_type:
                      type: string
                    payload:
                      type: object
                  required:
                    - source
                    - event_type
          responses:
            "200":
              description: Event received
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      status:
                        type: string
                      message:
                        type: string

---

## 1. Submit Borrower Intake

    openapi: 3.1.0
    info:
      title: Borrower Intake Webhook
      version: 1.0.0
    servers:
      - url: https://your-domain.com
    security: []
    paths:
      /webhook/borrower-intake:
        post:
          operationId: submitBorrowerIntake
          summary: Send a new borrower lead to the broker workflow
          x-openai-isConsequential: true
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  type: object
                  properties:
                    source:
                      type: string
                    event_type:
                      type: string
                    human_review_required:
                      type: boolean
                      default: true
                    payload:
                      type: object
                      properties:
                        borrower:
                          type: object
                          properties:
                            first_name: { type: string }
                            last_name: { type: string }
                            email: { type: string, format: email }
                            phone: { type: string }
                          required: [email]
                        business:
                          type: object
                          properties:
                            legal_business_name: { type: string }
                            industry: { type: string }
                            state: { type: string }
                            monthly_revenue: { type: number }
                            time_in_business_months: { type: integer }
                          required: [legal_business_name]
                        funding_request:
                          type: object
                          properties:
                            product_type: { type: string }
                            funding_amount_requested: { type: number }
                            use_of_funds: { type: string }
                          required: [funding_amount_requested]
                      required: [borrower, business, funding_request]
                  required: [source, event_type, payload]
          responses:
            "200":
              description: Lead received
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      status: { type: string }
                      message: { type: string }
                      external_record_id: { type: string }

---

## 2. Missing Document Request

    openapi: 3.1.0
    info:
      title: Missing Document Request Webhook
      version: 1.0.0
    servers:
      - url: https://your-domain.com
    security: []
    paths:
      /webhook/missing-doc-request:
        post:
          operationId: createMissingDocumentRequest
          summary: Trigger a missing-document reminder for a borrower
          x-openai-isConsequential: true
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  type: object
                  properties:
                    source: { type: string }
                    event_type: { type: string }
                    payload:
                      type: object
                      properties:
                        deal_id: { type: string }
                        borrower:
                          type: object
                          properties:
                            first_name: { type: string }
                            email: { type: string, format: email }
                            phone: { type: string }
                        documents:
                          type: array
                          items:
                            type: object
                            properties:
                              document_type: { type: string }
                              display_name: { type: string }
                              status:
                                type: string
                                enum: [missing, requested, received, reviewed, rejected_needs_reupload, not_required]
                              required: { type: boolean }
                            required: [document_type, status, required]
                        reminder:
                          type: object
                          properties:
                            send_borrower_reminder: { type: boolean }
                            reminder_channel:
                              type: string
                              enum: [email, sms, both, internal_only]
                            reminder_message: { type: string }
                      required: [deal_id, documents]
                  required: [source, event_type, payload]
          responses:
            "200":
              description: Reminder triggered
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      status: { type: string }
                      message: { type: string }

---

## 3. Internal Alert / Review Task

    openapi: 3.1.0
    info:
      title: Internal Alert Webhook
      version: 1.0.0
    servers:
      - url: https://your-domain.com
    security: []
    paths:
      /webhook/broker-alert:
        post:
          operationId: sendBrokerAlert
          summary: Send an internal alert to the team
          x-openai-isConsequential: true
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  type: object
                  properties:
                    source: { type: string }
                    event_type: { type: string }
                    payload:
                      type: object
                      properties:
                        alert_title: { type: string }
                        message: { type: string }
                        deal_id: { type: string }
                        priority:
                          type: string
                          enum: [low, medium, high, urgent]
                        channel:
                          type: string
                          enum: [slack, email, discord]
                      required: [alert_title, message]
                  required: [source, event_type, payload]
          responses:
            "200":
              description: Alert sent
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      status: { type: string }
                      message: { type: string }

---

## 4. Calculator (GET style)

    openapi: 3.1.0
    info:
      title: Automation Calculator
      version: 1.0.0
    servers:
      - url: https://your-domain.com
    security: []
    paths:
      /webhook/calc-time-saved:
        post:
          operationId: calculateTimeSaved
          summary: Estimate weekly hours saved by an automation
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  type: object
                  properties:
                    payload:
                      type: object
                      properties:
                        leads_per_week: { type: number }
                        minutes_per_task: { type: number }
                        tasks_automated_per_lead: { type: number }
                      required: [leads_per_week, minutes_per_task]
                  required: [payload]
          responses:
            "200":
              description: Calculation result
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      status: { type: string }
                      result:
                        type: object
                        properties:
                          hours_saved_per_week: { type: number }
                          hours_saved_per_year: { type: number }
                          note: { type: string }

---

## 🔧 Customization Checklist

When adapting any snippet:

- [ ] Replace `https://your-domain.com` with your real webhook base URL
- [ ] Confirm `operationId` is unique and descriptive
- [ ] Keep `security: []` for no-auth Actions
- [ ] Mark write Actions with `x-openai-isConsequential: true`
- [ ] Match `enum` values to what your workflow expects
- [ ] Keep raw documents and sensitive data out of the schema
- [ ] Validate the YAML (two-space indents, no tabs)

---

## 🔗 Next

- Test before launch → `actions-no-auth-testing-checklist.md`
- Full schema templates → `../../schemas/README.md`
- Hard limits → `actions-no-auth-risk-guardrails.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*