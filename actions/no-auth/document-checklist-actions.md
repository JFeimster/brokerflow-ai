# Document + Checklist Actions

File path: `actions/no-auth/document-checklist-actions.md`

## Purpose

This action family handles document collection logic around a funding scenario. It generates checklists, audits submitted documents, detects missing items, assembles an internal borrower packet, and summarizes the funding file.

These actions do **not** approve, deny, underwrite, price, fund, or submit a borrower.

## Base URL

```text
https://brokerflow-ai.vercel.app
```

## Optional environment variables

```text
DOCUMENT_CHECKLIST_SHARED_SECRET
DOCUMENT_CHECKLIST_WEBHOOK_URL
```

## Actions

| # | operationId | Endpoint |
| --- | --- | --- |
| 11 | `generateDocumentChecklist` | `POST /api/no-auth/generate-document-checklist` |
| 12 | `auditSubmittedDocuments` | `POST /api/no-auth/audit-submitted-documents` |
| 13 | `detectMissingDocuments` | `POST /api/no-auth/detect-missing-documents` |
| 14 | `createBorrowerSubmissionPacket` | `POST /api/no-auth/create-borrower-submission-packet` |
| 15 | `summarizeFundingFile` | `POST /api/no-auth/summarize-funding-file` |

## GPT Builder schema

```text
schemas/no-auth-document-checklist.schema.yaml
```

## Typical GPT flow

```text
1. generateDocumentChecklist
2. auditSubmittedDocuments
3. detectMissingDocuments
4. createBorrowerSubmissionPacket
5. summarizeFundingFile
```

## Example request

```json
{
  "source": "custom_gpt",
  "action_type": "generate_document_checklist",
  "borrower_type": "business",
  "loan_purpose": "business_working_capital",
  "primary_route": "business_working_capital",
  "requested_amount": 75000,
  "state": "VA",
  "monthly_revenue": 35000,
  "time_in_business_months": 30,
  "credit_score_range": "660_699",
  "urgency": "high"
}
```
