# No-Auth Actions: Documents

This file defines the **no-auth document Actions** for the Loan Broker Automation Architect GPT. These Actions help generate document checklists, request missing documents, and signal document status — without ever transmitting raw document contents.

Document collection is one of the biggest time sinks for brokers, which makes these Actions high-utility. They stay safe by sending **metadata and requests only**, never the files themselves.

---

## 📋 Actions in This File

| Action Name | Description | Required Inputs | Optional Inputs | Result | Human Review |
|-------------|-------------|-----------------|-----------------|--------|--------------|
| Generate Document Checklist | Returns a checklist based on product/employment type | Product type | Employment type, property type, deal stage | Checklist returned | No |
| Create Missing Document Request | Sends a missing-doc list to a reminder workflow | Deal ID, borrower contact, document list | Reminder channel, message | Reminder triggered | Optional |
| Update Document Status | Signals which docs are missing/received/reviewed | Deal ID, document list with status | Notes | Status event recorded | Optional |
| Request Document Upload Link | Asks the workflow to send a secure upload link | Deal ID, borrower contact | Document types needed | Upload link request sent | Optional |

---

## 🔑 Shared Conventions

- **Auth type:** None
- **Method:** POST (GET acceptable for static checklist lookups)
- **Critical rule:** payloads carry **document metadata only** — type, display name, status, and optional secure URL. Never raw file bytes or document text.

---

## 1. Generate Document Checklist

Returns a borrower-specific checklist the GPT can show in chat.

**Endpoint**

    POST https://your-domain.com/webhook/document-checklist

**Required inputs:** product type
**Optional inputs:** employment type, property type, deal stage

**Request**

    {
      "source": "custom_gpt",
      "event_type": "document_checklist",
      "event_id": "evt_20001",
      "payload": {
        "product_type": "working_capital",
        "employment_type": "business_owner",
        "deal_stage": "application"
      }
    }

**Response**

    {
      "status": "received",
      "checklist": {
        "identity_documents": ["Owner driver's license"],
        "income_documents": ["Last 4 months business bank statements"],
        "business_documents": ["Voided business check", "Business license"],
        "additional_conditions": ["Debt schedule if existing loans"]
      }
    }

**Guardrail:** Checklists are guidance, not approval criteria. Final document requirements come from the lender.

---

## 2. Create Missing Document Request

Triggers a borrower reminder for outstanding documents.

**Endpoint**

    POST https://your-domain.com/webhook/missing-doc-request

**Required inputs:** deal ID, borrower contact, document list
**Optional inputs:** reminder channel, reminder message

**Request**

    {
      "source": "custom_gpt",
      "event_type": "missing_doc_request",
      "event_id": "evt_20100",
      "submitted_at": "2026-06-30T14:30:00-04:00",
      "human_review_required": false,
      "payload": {
        "deal_id": "deal_12345",
        "borrower": {
          "first_name": "Sam",
          "email": "sam@example.com",
          "phone": "+15555550123",
          "preferred_contact_method": "sms"
        },
        "documents": [
          { "document_type": "bank_statements", "display_name": "Last 4 months of business bank statements", "status": "missing", "required": true },
          { "document_type": "voided_check", "display_name": "Voided business check", "status": "missing", "required": false }
        ],
        "reminder": {
          "send_borrower_reminder": true,
          "reminder_channel": "sms",
          "reminder_message": "Please upload the missing documents so your file can move to broker review."
        }
      }
    }

**Response**

    {
      "status": "accepted",
      "message": "Missing-document reminder triggered.",
      "external_record_id": "task_88010"
    }

---

## 3. Update Document Status

Records the current state of each document so the pipeline reflects reality.

**Endpoint**

    POST https://your-domain.com/webhook/document-status

**Required inputs:** deal ID, document list with status
**Optional inputs:** notes

**Allowed status values**

    missing | requested | received | reviewed | rejected_needs_reupload | not_required

**Request**

    {
      "source": "custom_gpt",
      "event_type": "document_status_update",
      "event_id": "evt_20200",
      "payload": {
        "deal_id": "deal_12345",
        "documents": [
          { "document_type": "bank_statements", "status": "received", "required": true },
          { "document_type": "driver_license", "status": "reviewed", "required": true }
        ],
        "notes": "Bank statements received; awaiting voided check."
      }
    }

**Response**

    { "status": "accepted", "message": "Document status updated." }

---

## 4. Request Document Upload Link

Asks the workflow to send the borrower a **secure** upload link. The GPT never handles the file.

**Endpoint**

    POST https://your-domain.com/webhook/document-upload-link

**Required inputs:** deal ID, borrower contact
**Optional inputs:** document types needed

**Request**

    {
      "source": "custom_gpt",
      "event_type": "document_upload_link_request",
      "event_id": "evt_20300",
      "payload": {
        "deal_id": "deal_12345",
        "borrower": { "first_name": "Sam", "email": "sam@example.com" },
        "documents_needed": ["bank_statements", "voided_check"]
      }
    }

**Response**

    {
      "status": "queued",
      "message": "Secure upload link will be sent to the borrower."
    }

---

## 🛡️ Document Guardrails

- **Never** send raw document contents, scans, or extracted text through a no-auth Action.
- Use **secure upload links** and **metadata** only (type, display name, status, optional URL).
- Treat any `file_url` as a **secure, access-controlled** link — never a public file.
- Keep credit, tax, and banking data out of the payload beyond a status flag.
- Document reminders are fine to automate; document **review** stays human.

---

## 🔗 Next

- Alerts and tasks → `actions-no-auth-internal-alert-actions.md`
- Follow-up sequences → `actions-no-auth-followup-actions.md`
- Hard limits → `actions-no-auth-risk-guardrails.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*