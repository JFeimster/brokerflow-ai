# Revenue + Agency Testing Checklist

## Endpoints

```text
POST /api/no-auth/package-automation-offer
POST /api/no-auth/generate-automation-audit
POST /api/no-auth/create-agency-client-roadmap
POST /api/no-auth/recommend-paid-service-path
POST /api/no-auth/create-project-scope
```

## Router

```text
api/no-auth/ops-router.js
```

## Test payload

Change `action_type` for each endpoint.

```json
{
  "source": "custom_gpt",
  "action_type": "recommend_paid_service_path",
  "client_type": "funding_broker",
  "current_tools": ["Tally", "email", "spreadsheet"],
  "pain_points": ["manual_follow_up", "missing_documents", "unclear_routing"],
  "monthly_lead_volume": 75,
  "team_size": 3,
  "target_offer": "broker_automation_package"
}
```
