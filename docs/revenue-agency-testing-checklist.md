# Revenue + Agency Testing Checklist

## Endpoints

```text
POST /api/no-auth/package-automation-offer
POST /api/no-auth/generate-automation-audit
POST /api/no-auth/create-agency-client-roadmap
POST /api/no-auth/recommend-paid-service-path
POST /api/no-auth/create-project-scope
```

## Schema

```text
schemas/no-auth-revenue-agency.schema.yaml
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
  "target_offer": "broker_automation_package",
  "implementation_timeline": "standard"
}
```

## Expected behavior

- Offer endpoint returns package name, deliverables, and positioning.
- Audit endpoint returns score, gaps, and recommendations.
- Roadmap endpoint returns implementation phases.
- Path endpoint returns recommended service path.
- Scope endpoint returns workstreams, assumptions, and exclusions.
