# Document + Checklist Testing Checklist

File path: `docs/document-checklist-testing-checklist.md`

## Endpoints

```text
POST /api/no-auth/generate-document-checklist
POST /api/no-auth/audit-submitted-documents
POST /api/no-auth/detect-missing-documents
POST /api/no-auth/create-borrower-submission-packet
POST /api/no-auth/summarize-funding-file
```

## Schema

```text
schemas/no-auth-document-checklist.schema.yaml
```

## Test payload

Change `action_type` for each endpoint.

```json
{
  "source": "custom_gpt",
  "action_type": "audit_submitted_documents",
  "borrower_type": "business",
  "loan_purpose": "business_working_capital",
  "primary_route": "business_working_capital",
  "requested_amount": 75000,
  "state": "VA",
  "monthly_revenue": 35000,
  "time_in_business_months": 30,
  "credit_score_range": "660_699",
  "submitted_documents": [
    { "document_type": "business_application", "filename": "application.pdf" },
    { "document_type": "owner_id", "filename": "id.pdf" }
  ]
}
```

## Expected behavior

- Checklist endpoint returns required and optional items.
- Audit endpoint returns completion score and missing documents.
- Missing-docs endpoint returns request-ready missing document messages.
- Packet endpoint returns internal review packet sections.
- Summary endpoint returns file strengths, gaps, and next steps.

## Guardrail

No endpoint should claim approval, denial, underwriting, pricing, funding, or lender submission.
