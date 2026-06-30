# Lender Matching Rules Framework

## Purpose

This knowledge file gives Loan Broker Automation Architect GPT a safe, structured framework for preliminary lender matching for loan brokers, funding agencies, processors, referral partners, and broker operations teams.

Use this file to help the GPT organize borrower information, suggest possible product paths, build rule-based "possible fit" logic, design lender matching worksheets, and route files to human review.

The goal is not to approve, decline, qualify, underwrite, price, or guarantee funding. The goal is to help a broker quickly see which products and lenders may be worth a closer human review.

---

## The One Rule That Controls Everything

Lender matching in this framework is always preliminary, never final.

The GPT and any automation must always frame results as:

- "Possible fit"
- "Worth broker review"
- "Preliminary match"
- "May be a fit based on the information provided"
- "Needs manual review before submission"

The GPT and any automation must never state:

- "Approved"
- "Qualified"
- "Eligible"
- "Guaranteed"
- "This lender will fund you"
- "You will get funding"
- "Pre-approved"
- "Underwritten"

Matching organizes options. Humans and lenders make decisions.

---

## Core Matching Principle

Preliminary lender matching should answer four questions:

1. What product types might fit this borrower?
2. Which lenders or funders might consider this profile?
3. What disqualifiers or red flags need human review?
4. What is the next human step before submission?

A good matching framework narrows the field and flags risks. It does not promise outcomes.

---

## Matching Inputs

These are the borrower and business attributes used to suggest possible product paths.

### Required Inputs

| Input | Why It Matters |
|---|---|
| Funding amount requested | Filters products by typical funding ranges. |
| Use of funds | Aligns products to purpose. |
| Monthly or annual revenue | Core input for most business funding paths. |
| Time in business | Major filter for product availability. |
| Industry | Some industries are restricted or specialized. |
| State / location | Affects product and lender availability. |

### Recommended Inputs

| Input | Why It Matters |
|---|---|
| Credit score range | Self-reported range only; affects possible paths. |
| Existing debt or advances | Affects positions, stacking, and review. |
| Product interest | Borrower preference, if any. |
| Funding timeline | Urgency affects product path. |
| Bank balance / cash flow indicators | Useful for revenue-based review. |
| Collateral or assets | Relevant for secured products. |

### Optional Inputs

| Input | Why It Matters |
|---|---|
| Personal credit details | Secure handling only; product-dependent. |
| Business entity type | Some products require certain structures. |
| Profit/loss indicators | Useful for larger or traditional products. |
| Equipment or property details | Relevant for asset-based products. |
| Prior funding history | Useful context for review. |

---

## Product Path Library

These are general business funding product categories with typical, non-binding profile indicators. Always treat thresholds as broker-configurable starting points, not lender rules.

### Merchant Cash Advance / Revenue-Based Financing

| Attribute | Typical Starting Indicator |
|---|---|
| Time in business | 3 to 6+ months |
| Monthly revenue | $10k+ (broker-configurable) |
| Credit | Flexible; lower ranges sometimes considered |
| Speed | Fast |
| Core document | Business bank statements |
| Common use | Working capital, short-term needs |
| Review flags | Existing advances, negative days, stacking |

### Business Line of Credit

| Attribute | Typical Starting Indicator |
|---|---|
| Time in business | 6 to 12+ months |
| Monthly revenue | Consistent revenue preferred |
| Credit | Mid to higher ranges preferred |
| Speed | Moderate |
| Core document | Bank statements, sometimes financials |
| Common use | Flexible working capital |
| Review flags | Thin revenue, high existing debt |

### Term Loan

| Attribute | Typical Starting Indicator |
|---|---|
| Time in business | 1 to 2+ years |
| Revenue | Stable revenue preferred |
| Credit | Mid to higher ranges preferred |
| Speed | Moderate |
| Core document | Bank statements, financials, sometimes tax returns |
| Common use | Expansion, larger projects, refinancing |
| Review flags | Inconsistent revenue, heavy obligations |

### SBA / Bank Loan

| Attribute | Typical Starting Indicator |
|---|---|
| Time in business | 2+ years (varies) |
| Revenue | Stronger financial profile |
| Credit | Higher ranges typically preferred |
| Speed | Slow |
| Core document | Tax returns, financial statements, PFS, business plan |
| Common use | Acquisition, real estate, large expansion |
| Review flags | Weak documentation, complex ownership |

### Equipment Financing

| Attribute | Typical Starting Indicator |
|---|---|
| Time in business | Varies; startups sometimes considered |
| Revenue | Product-dependent |
| Credit | Range affects terms |
| Speed | Moderate |
| Core document | Equipment quote/invoice, vendor info |
| Common use | Purchasing equipment or vehicles |
| Review flags | Used equipment, private-party sales |

### Commercial Real Estate / Investor Financing

| Attribute | Typical Starting Indicator |
|---|---|
| Property type | Commercial, mixed-use, investment |
| Income | Property income often key |
| Credit | Range affects path |
| Speed | Slow to moderate |
| Core document | Property docs, rent roll, operating statements |
| Common use | Purchase, refinance, bridge |
| Review flags | Property condition, vacancy, valuation |

### Invoice Factoring / AR Financing

| Attribute | Typical Starting Indicator |
|---|---|
| Business type | B2B with receivables |
| Revenue | Invoice-driven |
| Credit | Often debtor-focused |
| Speed | Moderate |
| Core document | Aging report, sample invoices, debtor list |
| Common use | Cash flow from outstanding invoices |
| Review flags | Existing factoring, concentration risk |

### Purchase Order Financing

| Attribute | Typical Starting Indicator |
|---|---|
| Business type | Product/inventory-based |
| Order size | Larger confirmed orders |
| Credit | Often buyer-focused |
| Speed | Moderate |
| Core document | Customer PO, supplier quote |
| Common use | Fulfilling large orders |
| Review flags | Unconfirmed orders, thin margins |

### Startup / Early-Stage Paths

| Attribute | Typical Starting Indicator |
|---|---|
| Time in business | Pre-revenue to early |
| Revenue | Limited or none |
| Credit | Personal credit often relevant |
| Speed | Varies |
| Core document | Plan, use of funds, personal profile |
| Common use | Launch, early growth |
| Review flags | No revenue, high risk, limited options |

---

## Preliminary Matching Logic

Use this as the default decision flow for suggesting possible product paths.

Step 1: Capture required inputs
→ If missing required inputs, request them before matching

Step 2: Apply hard filters
→ Remove products clearly outside borrower profile (e.g., time in business far below threshold)

Step 3: Apply soft indicators
→ Rank remaining products as stronger or weaker possible fits

Step 4: Flag review items
→ Mark disqualifiers, red flags, and missing data

Step 5: Produce possible-fit list
→ Label every result as preliminary and requiring human review

Step 6: Recommend next human step
→ Route to broker review before any submission

---

## Hard Filters

Hard filters remove products that are clearly outside the borrower profile. These are broker-configurable starting points, not lender decisions.

| Filter | Example Logic |
|---|---|
| Minimum time in business | If product typically needs 12+ months and business is 2 months old, mark product as unlikely. |
| Minimum revenue | If product typically needs higher revenue and borrower is far below, mark as unlikely. |
| Product-industry mismatch | If product does not serve borrower's industry, exclude. |
| State availability | If product/lender does not operate in borrower's state, exclude. |
| Required document type missing entirely | If product requires receivables and borrower has none, exclude. |

### Guardrail

Hard filters should never tell the borrower they are "declined" or "ineligible." They only narrow the broker's review list. Use "unlikely fit based on the information provided."

---

## Soft Indicators

Soft indicators rank remaining products as stronger or weaker possible fits.

| Indicator | Effect |
|---|---|
| Strong revenue for product range | Stronger possible fit. |
| Longer time in business | Stronger possible fit for traditional products. |
| Clean bank statements | Stronger possible fit for revenue-based products. |
| Higher self-reported credit range | Opens more possible paths. |
| Clear, fundable use of funds | Stronger possible fit. |
| Existing heavy debt or advances | Weaker fit; flag for review. |
| Inconsistent or seasonal revenue | Weaker fit; flag for review. |
| Very short time in business | Limits options; flag for review. |

---

## Review Flags

Review flags are items that require human review before any submission. They never trigger automatic decisions.

| Flag | Why It Needs Review |
|---|---|
| Existing advances / stacking | Affects fit, positions, and lender appetite. |
| Negative balance days | Affects revenue-based review. |
| Recent NSFs or overdrafts | Affects review of bank statements. |
| Restricted or high-risk industry | May limit product/lender options. |
| Large gap between requested amount and revenue | Requires expectation-setting and review. |
| Missing or unreadable documents | Cannot complete review. |
| Inconsistent borrower-provided numbers | Requires verification. |
| Complex ownership structure | May affect documentation needs. |
| Recent bankruptcy or major derogatory items | Requires careful human review. |
| Out-of-profile credit range | Requires review of possible paths. |

---

## Possible-Fit Output Format

When the GPT produces a preliminary match, it should use this format.

# Preliminary Lender Match: [Business Name]

## Disclaimer
This is a preliminary match based on the information provided. It is not an approval, qualification, eligibility determination, or funding guarantee. A broker must review before any lender submission.

## Borrower Snapshot
- Requested amount:
- Use of funds:
- Monthly revenue:
- Time in business:
- Industry:
- State:
- Credit range (self-reported):
- Existing debt/advances:

## Possible Product Paths
List ranked possible fits with a short reason for each.

## Stronger Possible Fits
Products that align well with the profile.

## Weaker / Conditional Fits
Products that may work but need review.

## Unlikely Fits (For Now)
Products that appear outside the current profile, with reasons.

## Review Flags
List items a broker must review before submission.

## Missing Information
List inputs needed to improve the match.

## Recommended Next Step
State the next human action (usually broker review).

---

## Lender Matching Worksheet

Use this worksheet structure for CRM, Airtable, Notion, Google Sheets, or a matching database.

| Field | Type | Purpose |
|---|---|---|
| Borrower name | Text | Identifies file. |
| Business name | Text | Identifies business. |
| Requested amount | Number | Filters products. |
| Use of funds | Text/Select | Aligns products. |
| Monthly revenue | Number/Range | Core matching input. |
| Time in business | Select/Number | Major filter. |
| Industry | Select | Filter and flag. |
| State | Select | Availability filter. |
| Credit range | Select | Path filter. |
| Existing debt/advances | Text/Number | Review flag. |
| Possible product paths | Multi-select | Output of matching. |
| Match strength | Select | Strong, conditional, unlikely. |
| Review flags | Multi-select | Items needing review. |
| Missing info | Text | Inputs still needed. |
| Match status | Select | Draft, broker-reviewed, ready. |
| Human review required | Checkbox | Should be true. |
| Next step | Text | Action needed. |

---

## Lender Profile Template

Use this template to store lender/funder criteria so matching stays organized. Keep all values broker-maintained.

| Field | Example |
|---|---|
| Lender/funder name | [Name] |
| Product types | MCA, LOC, term, equipment, etc. |
| Min time in business | [Broker-entered] |
| Min monthly revenue | [Broker-entered] |
| Credit preference | [Range] |
| Funding range | [Min to max] |
| Industries served | [List] |
| Restricted industries | [List] |
| States served | [List] |
| Required documents | [List] |
| Speed | Fast / moderate / slow |
| Notes | Stacking policy, positions, quirks |
| Submission method | Portal, email, form |
| Contact | [Contact or portal] |
| Last updated | [Date] |

### Guardrail

Lender criteria change frequently. Always treat stored criteria as a starting reference and confirm current requirements with the lender or broker before relying on them.

---

## Matching Strength Scale

Use a simple, transparent scale instead of implying approval odds.

| Strength | Meaning |
|---|---|
| Strong possible fit | Profile aligns well with typical product indicators. |
| Conditional possible fit | May fit, but specific items need review. |
| Weak possible fit | Some alignment, multiple concerns. |
| Unlikely fit (for now) | Profile appears outside typical indicators. |
| Needs more info | Not enough data to assess. |

### Guardrail

Never convert this scale into a percentage chance of approval or a funding guarantee.

---

## Use-of-Funds Mapping

Use this to align borrower goals to possible product categories.

| Use of Funds | Possible Product Paths |
|---|---|
| Short-term working capital | MCA/revenue-based, line of credit |
| Ongoing flexible cash flow | Line of credit |
| Equipment purchase | Equipment financing |
| Inventory purchase | Line of credit, PO financing, revenue-based |
| Large order fulfillment | Purchase order financing |
| Outstanding invoices | Invoice factoring / AR financing |
| Expansion or buildout | Term loan, SBA/bank, equipment |
| Real estate purchase/refi | Commercial real estate financing |
| Business acquisition | SBA/bank, acquisition financing |
| Startup launch | Startup/early-stage paths |
| Debt consolidation | Term loan (review existing debt carefully) |

---

## Industry Considerations

Use this as a general flagging guide. Always confirm current lender policies.

| Industry Category | Common Consideration |
|---|---|
| Restaurants / food service | Often served by revenue-based products; seasonality matters. |
| Construction / contractors | Project-based revenue; consider AR/PO options. |
| Trucking / transportation | Equipment and factoring options common. |
| Retail / e-commerce | Processing and platform sales relevant. |
| Professional services | Often broad eligibility; financials matter. |
| Medical / dental | Specialized practice financing exists. |
| Real estate investors | Asset-based and DSCR-style paths. |
| Restricted/high-risk industries | May limit options; always flag for review. |

### Guardrail

Do not assert that an industry is "ineligible." Flag industry considerations for human review and note that lender policies vary.

---

## Expectation-Setting Logic

When the requested amount is far above what the profile typically supports, the GPT should set expectations safely.

### Recommended Language

Based on the information provided, the requested amount may be higher than what typically aligns with this profile. A broker should review options, which may include a smaller starting amount, a different product, or a staged approach.

### Avoid

- "You won't get that amount."
- "You don't qualify for that."
- "No lender will fund this."

Use instead:

- "May need broker review."
- "A smaller or staged amount may be worth discussing."
- "Possible alternative paths exist."

---

## Matching Automation Examples

### Example 1: Preliminary Match on Intake

Trigger:
Intake completed with required fields

Flow:
Intake complete
→ Validate required matching inputs
→ Apply hard filters
→ Apply soft indicators
→ Generate possible-fit list
→ Add review flags
→ Create broker review task
→ Do not contact lenders automatically

Human Review:
Required before any submission.

### Example 2: Missing Info Before Matching

Trigger:
Match requested but inputs incomplete

Flow:
Match requested
→ Check required inputs
→ If missing, create missing-info task
→ Request missing inputs from borrower or broker
→ Once complete, run preliminary match

Human Review:
Required before submission.

### Example 3: Review Flag Escalation

Trigger:
Review flag detected (e.g., existing advances)

Flow:
Review flag detected
→ Mark match as conditional
→ Add flag to file
→ Create broker review task
→ Hold for human review before any submission

Human Review:
Required.

---

## GPT Behavior Instructions

When the user asks for lender matching help, the GPT should:

1. Confirm it is producing a preliminary match, not an approval.
2. Collect required matching inputs.
3. Apply hard filters to remove clearly unlikely products.
4. Rank remaining products as possible fits.
5. Add review flags for risks and missing data.
6. List missing information needed to improve the match.
7. Recommend the next human step.
8. Use safe language throughout.
9. Avoid approval, eligibility, qualification, pricing, and guarantee language.
10. Route the file to broker review before submission.

---

## Default Output Format

Use this format when generating a lender matching framework or worksheet.

# Lender Matching Blueprint: [Workflow or Business Name]

## 1. Purpose
Explain what this matching workflow is for.

## 2. Required Inputs
List the inputs needed to run a match.

## 3. Hard Filters
Define which products to remove and why.

## 4. Soft Indicators
Define how to rank remaining products.

## 5. Review Flags
List items that require human review.

## 6. Possible-Fit Output
Show how results should be presented.

## 7. Human Review Points
Show where broker review is mandatory.

## 8. Missing Information Handling
Explain how to handle incomplete data.

## 9. Automation Notes
Explain triggers, tasks, and routing.

## 10. Final Recommendation
Give the next human step.

---

## Example Matching Payload

Use this as a generic structure for matching automation.

{
  "source": "custom_gpt",
  "action_type": "preliminary_lender_match",
  "disclaimer": "Preliminary match only. Not an approval, qualification, or funding guarantee. Human review required.",
  "borrower": {
    "name": "",
    "business_name": "",
    "state": "",
    "industry": ""
  },
  "matching_inputs": {
    "requested_amount": "",
    "use_of_funds": "",
    "monthly_revenue": "",
    "time_in_business": "",
    "credit_range": "",
    "existing_debt_or_advances": "",
    "funding_timeline": ""
  },
  "match_results": {
    "strong_possible_fits": [],
    "conditional_possible_fits": [],
    "unlikely_fits": [],
    "review_flags": [],
    "missing_info": []
  },
  "routing": {
    "match_status": "draft",
    "human_review_required": true,
    "next_step": "Broker review before any lender submission",
    "review_task_created": true
  }
}

---

## Final Rule

Lender matching should help a broker decide what to review next, not what to fund.

Automate input collection, filtering, ranking, flagging, worksheet creation, and review-task routing.

Do not automate approval decisions, eligibility determinations, pricing, lender submissions, or borrower-facing funding promises without human review.