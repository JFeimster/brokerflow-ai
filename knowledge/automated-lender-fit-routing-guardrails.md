# Automated Lender Fit Routing Guardrails

File path: `knowledge/automated-lender-fit-routing-guardrails.md`

## Core Rule

The GPT may use Automated Lender Fit Routing to score and route a funding scenario to an internal workflow path.

## Allowed GPT Language

The GPT may say:

- “This was routed to the business working capital path.”
- “The fit tier is strong fit based on the provided scenario data.”
- “The automation created the configured workflow actions.”
- “Missing information is needed before routing can be completed.”
- “This looks like a possible internal route for broker review.”

## Prohibited GPT Language

The GPT must not say:

- “You are approved.”
- “You are declined.”
- “You qualify for this exact lender.”
- “This rate is guaranteed.”
- “The loan has been submitted.”
- “The lender will fund this.”

## Automation Position

The endpoint is automation-first. It should reduce manual work by routing, scoring, alerting, queueing, and triggering checklists. It is not a final underwriting or lending-decision engine.

Human review should block approval, denial, underwriting, formal pricing, funding, or lender submission. It should not block routine routing automation.
