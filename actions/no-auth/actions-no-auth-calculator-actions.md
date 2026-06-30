# No-Auth Actions: Calculators

This file defines the **no-auth calculator Actions** for the Loan Broker Automation Architect GPT. Calculators are simple, stateless endpoints that take a few inputs and return a number or estimate — automation ROI, time saved, task volume, and funding-readiness scoring for internal review.

Calculators are ideal no-auth Actions because they handle **no sensitive data**, require **no credentials**, and are **easy to test**. They make the GPT feel useful and concrete without touching borrower records or funding decisions.

---

## 📋 Actions in This File

| Action Name | Description | Required Inputs | Optional Inputs | Result | Human Review |
|-------------|-------------|-----------------|-----------------|--------|--------------|
| Calculate Time Saved | Estimates weekly hours saved by an automation | Leads per week, minutes per task | Tasks automated, weeks | Hours/week + annual estimate | No |
| Calculate Automation ROI | Estimates ROI of an automation build | Time saved per week, hourly value | Build cost, monthly tool cost | ROI %, payback period | No |
| Estimate Task Volume | Projects monthly task load from lead flow | Leads per month, tasks per lead | Team size | Tasks/month, per-person load | No |
| Score Funding Readiness (Internal) | Internal-only readiness score for triage | Time in business, monthly revenue, doc completeness | Industry, requested amount | Readiness score + notes | Yes (internal use only) |

---

## 🔑 Shared Conventions

- **Auth type:** None
- **Method:** POST (GET acceptable for pure calculations)
- **Stateless:** no records created, nothing stored — just math in, result out.
- **Readiness scoring is internal triage only** and never shown to borrowers as an approval signal.

---

## 1. Calculate Time Saved

**Endpoint**

    POST https://your-domain.com/webhook/calc-time-saved

**Required inputs:** leads per week, minutes per task
**Optional inputs:** tasks automated per lead, weeks per year

**Request**

    {
      "source": "custom_gpt",
      "event_type": "calc_time_saved",
      "payload": {
        "leads_per_week": 15,
        "minutes_per_task": 8,
        "tasks_automated_per_lead": 4,
        "weeks_per_year": 50
      }
    }

**Response**

    {
      "status": "processed",
      "result": {
        "hours_saved_per_week": 8.0,
        "hours_saved_per_year": 400,
        "note": "Estimate based on 15 leads/week and 4 automated tasks at 8 minutes each."
      }
    }

---

## 2. Calculate Automation ROI

**Endpoint**

    POST https://your-domain.com/webhook/calc-roi

**Required inputs:** time saved per week (hours), hourly value
**Optional inputs:** one-time build cost, monthly tool cost

**Request**

    {
      "source": "custom_gpt",
      "event_type": "calc_roi",
      "payload": {
        "time_saved_per_week_hours": 8,
        "hourly_value": 50,
        "build_cost": 1500,
        "monthly_tool_cost": 40
      }
    }

**Response**

    {
      "status": "processed",
      "result": {
        "monthly_value": 1733.33,
        "monthly_net": 1693.33,
        "payback_period_months": 0.9,
        "first_year_roi_percent": 1162,
        "note": "Rough estimate. Adjust hourly value to your real cost of time."
      }
    }

---

## 3. Estimate Task Volume

**Endpoint**

    POST https://your-domain.com/webhook/calc-task-volume

**Required inputs:** leads per month, tasks per lead
**Optional inputs:** team size

**Request**

    {
      "source": "custom_gpt",
      "event_type": "calc_task_volume",
      "payload": {
        "leads_per_month": 60,
        "tasks_per_lead": 6,
        "team_size": 2
      }
    }

**Response**

    {
      "status": "processed",
      "result": {
        "tasks_per_month": 360,
        "tasks_per_person": 180,
        "note": "Use this to decide which repetitive tasks to automate first."
      }
    }

---

## 4. Score Funding Readiness (Internal)

A lightweight **internal triage** score to help brokers prioritize files. This is **not** an approval, eligibility, or qualification signal.

**Endpoint**

    POST https://your-domain.com/webhook/calc-readiness

**Required inputs:** time in business (months), monthly revenue, document completeness (%)
**Optional inputs:** industry, requested amount

**Request**

    {
      "source": "custom_gpt",
      "event_type": "calc_readiness_internal",
      "human_review_required": true,
      "payload": {
        "time_in_business_months": 38,
        "monthly_revenue": 85000,
        "document_completeness_percent": 60,
        "industry": "Transportation",
        "requested_amount": 75000
      }
    }

**Response**

    {
      "status": "processed",
      "result": {
        "readiness_score": 72,
        "band": "needs_docs",
        "internal_note": "Strong revenue and tenure; missing documents reduce readiness. For internal triage only — not an approval or eligibility decision.",
        "next_step": "Request remaining documents, then broker review."
      }
    }

**Guardrail:** Never present the readiness score to a borrower as an approval likelihood. Label it clearly as internal triage.

---

## 🛡️ Calculator Guardrails

- Calculators are **estimates** — always include a "rough estimate" note.
- Readiness scoring is **internal triage only**, never a borrower-facing approval signal.
- Use **plain-English caveats** so users do not over-trust the numbers.
- No sensitive data is needed — keep inputs to ranges and aggregates.
- Never let a calculator output drive an automated funding decision.

---

## 🔗 Next

- Copy-paste OpenAPI → `actions-no-auth-schema-examples.md`
- Test before launch → `actions-no-auth-testing-checklist.md`
- Hard limits → `actions-no-auth-risk-guardrails.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*