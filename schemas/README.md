# Schemas

This folder holds **reusable OpenAPI schema templates** for the Custom GPT Actions used by the Loan Broker Automation Architect GPT (BrokerFlow AI). Instead of writing a schema from scratch for every Action, copy a template here, swap the server URL and fields, and paste it into the GPT Builder Action editor.

Every schema in this folder uses **OpenAPI 3.1.0**, the format the GPT Builder expects. Schemas are organized by **authentication type** to match the `/actions` folder.

---

## 📌 What an Action Schema Is

When you add an Action to a Custom GPT, you paste an OpenAPI schema that tells the GPT:

- **Where** to send the request (`servers` + `paths`)
- **How** to authenticate (`securitySchemes` + `security`)
- **What** to send (request body properties and which are required)
- **What** it gets back (response shape)
- **Whether** to confirm first (`x-openai-isConsequential`)

A good schema is the difference between an Action that "just works" and one that silently misfires.

---

## 🗂️ Suggested Files

    schemas/
    ├── README.md                       ← you are here
    ├── schema-no-auth-template.yaml     ← public webhook, security: []
    ├── schema-api-key-bearer.yaml       ← Authorization: Bearer <key>
    ├── schema-api-key-custom-header.yaml ← X-Api-Key style (Airtable, etc.)
    ├── schema-oauth-authcode.yaml        ← OAuth authorization-code flow
    └── schema-shared-components.yaml     ← common request/response components

Keep one schema per file so you can copy cleanly into GPT Builder.

---

## 🧱 Base Template (No Auth)

    openapi: 3.1.0
    info:
      title: BrokerFlow No-Auth Action
      version: 1.0.0
    servers:
      - url: https://your-domain.com
    security: []
    paths:
      /webhook/example:
        post:
          operationId: sendExampleEvent
          summary: Send an event to the broker workflow
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
                    payload: { type: object }
                  required: [source, event_type]
          responses:
            "200":
              description: Event received
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      status: { type: string }
                      message: { type: string }

---

## 🔐 Auth Building Blocks

Drop the matching block into any schema and reference it under `security`.

**API Key — Bearer**

    components:
      securitySchemes:
        bearerAuth:
          type: http
          scheme: bearer
    security:
      - bearerAuth: []

**API Key — Custom Header**

    components:
      securitySchemes:
        apiKeyAuth:
          type: apiKey
          in: header
          name: X-Api-Key
    security:
      - apiKeyAuth: []

**OAuth — Authorization Code**

    components:
      securitySchemes:
        oauth2:
          type: oauth2
          flows:
            authorizationCode:
              authorizationUrl: https://provider.com/oauth/authorize
              tokenUrl: https://provider.com/oauth/token
              scopes:
                read: Read access
                write: Write access
    security:
      - oauth2: [read]

---

## ♻️ Shared Components Pattern

Define common shapes once and reuse them with `$ref` to keep schemas consistent.

    components:
      schemas:
        StandardResponse:
          type: object
          properties:
            status: { type: string }
            message: { type: string }
            external_record_id: { type: string }
        ErrorResponse:
          type: object
          properties:
            status: { type: string }
            message: { type: string }
            errors:
              type: array
              items: { type: string }

Reference them in responses:

    responses:
      "200":
        description: Success
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/StandardResponse"
      "400":
        description: Invalid request
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"

---

## ✅ Schema Conventions for This Repo

- Always **OpenAPI 3.1.0**.
- One Action concept per schema file.
- Unique, descriptive `operationId` for every path operation.
- Mark write Actions with `x-openai-isConsequential: true`.
- Declare `security: []` explicitly for no-auth Actions.
- Use `enum` for fixed value sets (deal stages, document statuses, channels).
- Keep raw documents and sensitive PII out of every schema.
- Validate YAML (3.1.0, two-space indents, no tabs) before pasting.

---

## 🔗 Related

- Auth decision guide → `../actions/actions-authentication-decision-guide.md`
- No-auth schema examples → `../actions/no-auth/actions-no-auth-schema-examples.md`
- API key setup → `../actions/api-key/README.md`
- OAuth setup → `../actions/oauth/README.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*