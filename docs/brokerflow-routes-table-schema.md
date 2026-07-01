# BrokerFlow Routes Table Schema

File path: `docs/brokerflow-routes-table-schema.md`

## Purpose

This table stores routed lender-fit events received from the `routeLenderFitScenario` GPT Action.

## Table name

```text
BrokerFlow Routes
```

## Columns

| Column | Type | Source |
| --- | --- | --- |
| `routing_id` | Text | `Body.routing_id` |
| `received_at` | Text | `Body.received_at` |
| `primary_route` | Text | `Body.primary_route` |
| `secondary_routes` | Text | `Body.secondary_routes` |
| `fit_score` | Number | `Body.fit_score` |
| `fit_tier` | Text | `Body.fit_tier` |
| `requested_amount` | Number | `Body.requested_amount` |
| `state` | Text | `Body.state` |
| `borrower_type` | Text | `Body.borrower_type` |
| `loan_purpose` | Text | `Body.loan_purpose` |
| `monthly_revenue` | Number | `Body.monthly_revenue` |
| `time_in_business_months` | Number | `Body.time_in_business_months` |
| `urgency` | Text | `Body.urgency` |
| `next_step` | Text | `Body.next_step` |
| `automation_actions` | Text | `Body.automation_actions` |
| `missing_information` | Text | `Body.missing_information` |
| `raw_payload` | Text | Full webhook body or raw body |

## Mapping note

Activepieces may require sample trigger data before body fields appear in the mapping selector.

If sample fields do not appear:

1. Open `Catch Webhook`.
2. Run/test the trigger.
3. Fire `routeLenderFitScenario` from GPT Builder again.
4. Return to `Create Record(s)`.
5. Map fields from `Catch Webhook → Body`.

## Practical fallback

If Activepieces Tables are slow or unreliable in the UI, use the same columns in Google Sheets or Airtable. The action flow already works; the storage destination can change without changing the GPT action or Vercel endpoint.
