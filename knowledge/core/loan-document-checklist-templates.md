# Loan Document Checklist Templates

## Purpose

This knowledge file gives Loan Broker Automation Architect GPT reusable document checklist templates for loan brokers, funding agencies, processors, referral partners, and broker operations teams.

Use this file to help the GPT generate borrower document requests, missing-document follow-up workflows, document collection automations, CRM checklist fields, and secure upload instructions.

The goal is not to determine approval, qualification, eligibility, underwriting, or funding outcome. The goal is to help brokers collect and organize documents for human review.

---

## Core Document Collection Principle

Document collection should be:

1. Clear for the borrower
2. Easy for the broker to track
3. Secure for sensitive financial information
4. Flexible by product type
5. Routed to human review before lender submission
6. Designed to reduce back-and-forth

A good document checklist does not overwhelm the borrower. It asks for the minimum useful documents first, then adds product-specific documents only when needed.

---

## Universal Guardrail

Never ask the borrower to paste sensitive financial documents, account numbers, Social Security numbers, tax IDs, bank logins, or raw statements directly into GPT chat.

Use secure upload links, client portals, encrypted forms, CRM upload tools, lender portals, or document collection platforms.

Use safe language:

- “Upload through the secure link.”
- “Send this for broker review.”
- “This helps organize your file.”
- “A broker should review before submission.”
- “Additional documents may be requested.”

Avoid unsafe language:

- “Upload this and you’ll be approved.”
- “These documents guarantee funding.”
- “You qualify if you provide these.”
- “This lender will accept your file.”
- “Send me your full bank login.”
- “Paste your bank statement here.”

---

## Standard Document Statuses

Use these statuses in CRM, Notion, Airtable, HubSpot, GoHighLevel, Pipedrive, Google Sheets, or document collection tools.

| Status | Meaning | Recommended Automation |
|---|---|---|
| Not Requested | Document has not been requested yet. | Wait for broker review. |
| Requested | Borrower has been asked to provide the document. | Start reminder timer. |
| Received | Borrower uploaded or sent the document. | Notify broker or processor. |
| Needs Review | Document is received but has not been checked. | Create review task. |
| Accepted for File | Broker or processor marked it usable for the file. | Move checklist forward. |
| Rejected / Needs Replacement | Document is unreadable, outdated, incomplete, or incorrect. | Send replacement request. |
| Missing | Document is required but not yet received. | Send missing-doc reminder. |
| Not Applicable | Document is not needed for this scenario. | Exclude from reminders. |
| Expired | Document is too old or stale. | Request updated version. |

---

## Recommended Document Tracking Fields

Use these fields for document collection databases, CRM custom fields, task systems, or automation payloads.

| Field | Type | Purpose |
|---|---|---|
| Borrower name | Text / Relation | Links checklist to borrower. |
| Business name | Text / Relation | Links checklist to business. |
| Deal / opportunity ID | Text / Relation | Links checklist to funding request. |
| Document name | Text / Select | Name of requested document. |
| Document category | Select | Identity, bank, tax, business, lender, etc. |
| Required? | Checkbox | Shows whether document is mandatory. |
| Status | Select | Requested, received, missing, accepted, etc. |
| Requested date | Date | Tracks when borrower was asked. |
| Received date | Date | Tracks when document arrived. |
| Reviewed date | Date | Tracks processor/broker review. |
| Expiration date | Date | Useful for time-sensitive documents. |
| Uploaded file link | URL / File | Secure upload or storage location. |
| Secure folder link | URL | Borrower folder or portal link. |
| Notes | Text | Processor notes or issue details. |
| Owner | Person | Broker, processor, or VA responsible. |
| Reminder count | Number | Tracks follow-up attempts. |
| Last reminder sent | Date | Prevents over-messaging. |
| Human review required | Checkbox | Should usually be true. |

---

## Universal Starter Checklist

Use this as a broad starting checklist for most business funding or loan broker files.

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed funding application | Yes | Should include borrower, business, and funding request details. |
| 2 | Government-issued ID | Usually | Needed for identity verification by broker/lender process. |
| 3 | Last 3 months business bank statements | Usually | Common starting point for revenue review. |
| 4 | Voided business check or bank verification document | Sometimes | Used for account verification when required. |
| 5 | Business formation documents | Sometimes | Articles of organization, incorporation, or equivalent. |
| 6 | EIN confirmation letter | Sometimes | Useful for business identity confirmation. |
| 7 | Current debt or advance statements | If applicable | Helps identify existing obligations. |
| 8 | Tax returns or financial statements | Product-dependent | More common for SBA, bank, term, or larger requests. |
| 9 | Profit and loss statement | Product-dependent | May be needed for larger or more traditional products. |
| 10 | Balance sheet | Product-dependent | May be needed for larger or more traditional products. |
| 11 | Lease, mortgage, or property documents | Product-dependent | Relevant for commercial real estate or location-based businesses. |
| 12 | Invoices, purchase orders, or contracts | Product-dependent | Relevant for invoice financing, PO financing, or contract-based funding. |

---

## Minimum Viable Document Request

Use this when the broker wants the simplest first document request.

### Best For

- New business funding lead
- Early-stage broker review
- Borrower not yet matched to a specific lender
- Low-friction intake
- Fast first review

### Checklist

| Document | Notes |
|---|---|
| Completed funding application | Captures business, owner, revenue, and funding request details. |
| Last 3 months business bank statements | Common first review document. |
| Government-issued ID | Used for identity verification workflows. |
| Current funding or debt statements, if applicable | Helps review existing obligations. |

### Borrower Message

Subject: Documents needed for broker review

Hi [Borrower Name],

Thanks for submitting your funding request. To move your file to broker review, please upload the documents below through the secure link:

1. Completed funding application
2. Last 3 months business bank statements
3. Government-issued ID
4. Current funding or debt statements, if applicable

Secure upload link:
[Secure Upload Link]

Once received, your file can be organized for broker review. Additional documents may be requested depending on the funding product or lender requirements.

Thanks,
[Broker / Team Name]

---

## Business Funding Checklist

Use this for general small-business funding requests.

### Best For

- Working capital
- Revenue-based funding
- Alternative business funding
- Business term funding
- Broker pre-review

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed business funding application | Yes | Should include owner and business details. |
| 2 | Last 3 to 6 months business bank statements | Usually | Number of months depends on broker/lender requirements. |
| 3 | Government-issued ID for owner(s) | Usually | Use secure upload only. |
| 4 | Voided business check or bank verification document | Sometimes | Required by some funders or processors. |
| 5 | Business formation documents | Sometimes | Articles of organization, incorporation, or registration. |
| 6 | EIN confirmation letter | Sometimes | Useful for matching business identity. |
| 7 | Existing funding or advance statements | If applicable | Helps review current positions. |
| 8 | Business tax returns | Product-dependent | Often required for bank-style or larger requests. |
| 9 | Profit and loss statement | Product-dependent | Useful for larger or more traditional requests. |
| 10 | Balance sheet | Product-dependent | Useful for larger or more traditional requests. |

### Automation Notes

- If business bank statements are missing, mark file as `Docs Partially Received`.
- If existing debt is mentioned but no statements are uploaded, create a missing-document task.
- If bank statements are older than the accepted review window, mark them `Expired` or `Needs Replacement`.
- If owner ID is missing, ask for secure upload but do not request it inside chat.

---

## Merchant Cash Advance / Revenue-Based Financing Checklist

Use this for MCA-style or revenue-based funding review workflows.

### Best For

- Short-term working capital
- Daily/weekly remittance products
- Revenue-based funding
- Fast broker pre-review

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed funding application | Yes | Should include funding amount and use of funds. |
| 2 | Last 3 to 6 months business bank statements | Usually | Core document for review. |
| 3 | Government-issued ID | Usually | Secure upload only. |
| 4 | Voided business check | Often | Used for account verification when needed. |
| 5 | Existing MCA or business debt statements | If applicable | Needed if borrower has current positions. |
| 6 | Payment processing statements | Sometimes | Relevant if card sales drive revenue. |
| 7 | Business lease or proof of location | Sometimes | May be requested for certain industries. |

### Missing-Doc Reminder

Hi [Borrower Name],

We received part of your file, but the following items are still missing:

[Missing Document List]

Please upload them here:
[Secure Upload Link]

Once received, the file can continue to broker review. This request does not guarantee approval or funding.

---

## Business Line of Credit Checklist

Use this for revolving credit, bank line, fintech line, or working capital line requests.

### Best For

- Revolving credit
- Working capital flexibility
- Bank or fintech line pre-review
- Stronger-credit borrowers

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed line of credit application | Yes | Should include requested limit and use of funds. |
| 2 | Last 3 to 6 months business bank statements | Usually | Used for business cash-flow review. |
| 3 | Government-issued ID | Usually | Secure upload only. |
| 4 | Business tax returns | Sometimes | More likely for bank-style products. |
| 5 | Profit and loss statement | Sometimes | Useful for larger limits. |
| 6 | Balance sheet | Sometimes | Useful for larger limits. |
| 7 | Business formation documents | Sometimes | Used for entity confirmation. |
| 8 | Existing business debt schedule | If applicable | Helps broker review obligations. |

### Automation Notes

- Ask for business bank statements first.
- Add tax returns and financial statements only if product type or lender path requires them.
- Route larger requests to manual broker review before requesting extensive documents.

---

## Term Loan Checklist

Use this for fixed-payment business term loan workflows.

### Best For

- Business term loans
- Expansion capital
- Larger working capital requests
- Bank or alternative term products

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed loan application | Yes | Captures borrower and business profile. |
| 2 | Last 3 to 6 months business bank statements | Usually | Required for cash-flow review. |
| 3 | Government-issued ID | Usually | Secure upload only. |
| 4 | Business tax returns, last 1 to 2 years | Product-dependent | More common for larger or traditional loans. |
| 5 | Profit and loss statement, year-to-date | Product-dependent | Useful for current performance. |
| 6 | Balance sheet | Product-dependent | Useful for financial review. |
| 7 | Business formation documents | Sometimes | Entity verification. |
| 8 | Debt schedule | If applicable | Existing loans, advances, leases, or lines. |
| 9 | Use-of-funds explanation | Recommended | Helps broker understand purpose. |

### Borrower Message

Subject: Documents for term loan review

Hi [Borrower Name],

To organize your file for broker review, please upload the following through the secure link:

1. Completed loan application
2. Last 3 to 6 months business bank statements
3. Government-issued ID
4. Current debt schedule or existing loan statements, if applicable
5. Year-to-date profit and loss statement, if available
6. Business tax returns, if available

Secure upload link:
[Secure Upload Link]

A broker may request additional documents depending on the product path and lender requirements.

---

## SBA / Traditional Bank Loan Checklist

Use this for SBA-style, bank-style, or highly documented business loan requests.

### Best For

- SBA loans
- Bank loans
- Larger business financing
- Real estate or acquisition financing
- Longer underwriting timelines

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed loan application | Yes | Include owner, business, and requested loan details. |
| 2 | Personal financial statement | Often | Use secure upload only. |
| 3 | Personal tax returns, last 2 to 3 years | Often | Product/lender dependent. |
| 4 | Business tax returns, last 2 to 3 years | Often | Product/lender dependent. |
| 5 | Year-to-date profit and loss statement | Often | Current business performance. |
| 6 | Balance sheet | Often | Current financial position. |
| 7 | Debt schedule | Often | Business debts, leases, loans, notes. |
| 8 | Business formation documents | Often | Entity verification. |
| 9 | Ownership breakdown | Often | Ownership percentages and key principals. |
| 10 | Business plan or project summary | Sometimes | Especially for startups, expansions, or acquisitions. |
| 11 | Lease or property documents | If applicable | Needed for real estate or location-based deals. |
| 12 | Purchase agreement | If applicable | Needed for acquisition or real estate purchase. |
| 13 | Franchise agreement | If applicable | Needed for franchise-related financing. |

### Guardrail

The GPT should not give SBA eligibility opinions, legal interpretations, tax advice, or underwriting conclusions.

Use:

- “These documents are commonly requested for bank-style review.”
- “A broker or lender should confirm the final requirements.”
- “This is a preparation checklist, not an approval checklist.”

---

## Equipment Financing Checklist

Use this for equipment loans, leases, or vendor financing workflows.

### Best For

- Equipment purchase
- Heavy machinery
- Trucks and vehicles
- Restaurant equipment
- Medical equipment
- Construction equipment
- Vendor financing

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed equipment financing application | Yes | Include equipment type and requested amount. |
| 2 | Equipment quote or invoice | Usually | Core document for equipment review. |
| 3 | Vendor information | Usually | Vendor name, contact, website, and invoice details. |
| 4 | Government-issued ID | Usually | Secure upload only. |
| 5 | Business bank statements | Sometimes | Often requested depending on product. |
| 6 | Business formation documents | Sometimes | Entity verification. |
| 7 | Equipment description | Recommended | Make, model, year, serial number if available. |
| 8 | Proof of insurance | Sometimes | May be required before funding/closing. |
| 9 | Existing equipment debt or lease statements | If applicable | Useful for review. |

### Automation Notes

- If no equipment quote is provided, mark file `Intake Incomplete`.
- If vendor information is missing, create a task to collect vendor details.
- If equipment is used, request year, make, model, condition, and seller details.

---

## Commercial Real Estate Financing Checklist

Use this for purchase, refinance, bridge, or investment property financing requests.

### Best For

- Commercial property purchase
- Commercial refinance
- Investor real estate
- Mixed-use property
- Bridge financing
- DSCR-style commercial workflows

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed commercial financing application | Yes | Include property and borrower details. |
| 2 | Property address | Yes | Required for file organization. |
| 3 | Purchase agreement | If purchase | Required for acquisition review. |
| 4 | Current mortgage statement | If refinance | Required for refinance review. |
| 5 | Rent roll | If income-producing | Shows tenant income. |
| 6 | Operating statements | Often | Property income and expenses. |
| 7 | Appraisal | If available | Optional early, may be required later. |
| 8 | Property photos | Sometimes | Useful for broker/lender context. |
| 9 | Business or personal financial statements | Product-dependent | Depends on borrower type and lender path. |
| 10 | Entity documents | If borrower is entity | LLC or corporation documents. |
| 11 | Insurance information | Sometimes | May be needed later in process. |
| 12 | Environmental or property reports | Sometimes | Depends on property and lender. |

### Guardrail

Do not provide legal, tax, appraisal, valuation, or underwriting conclusions.

Use:

- “This helps prepare the property file for review.”
- “A lender or broker should confirm the final list.”
- “Additional property documents may be required.”

---

## Invoice Financing / Factoring Checklist

Use this for accounts receivable financing, invoice factoring, or contract receivables workflows.

### Best For

- B2B invoices
- Factoring
- Invoice advance
- Receivables financing
- Contractor/vendor invoice financing

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed invoice financing application | Yes | Captures business and receivable details. |
| 2 | Aging report | Usually | Shows outstanding receivables. |
| 3 | Sample invoices | Usually | Shows invoice amounts and debtors. |
| 4 | Customer/debtor list | Usually | Identifies who owes payment. |
| 5 | Business bank statements | Sometimes | Helps business review. |
| 6 | Articles of organization or incorporation | Sometimes | Entity verification. |
| 7 | Contracts or purchase orders | If applicable | Supports invoice validity. |
| 8 | Proof of delivery or completion | If applicable | May be required for invoice validation. |
| 9 | Existing factoring agreement | If applicable | Needed if currently factoring. |

### Automation Notes

- If invoice list is uploaded but no aging report exists, request aging report.
- If invoices are customer-facing, avoid exposing sensitive customer details in chat.
- Route documents to secure storage.

---

## Purchase Order Financing Checklist

Use this for purchase order funding or supplier payment workflows.

### Best For

- Product-based businesses
- Large purchase orders
- Supplier financing
- Inventory fulfillment
- Contract-based delivery

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed financing application | Yes | Includes borrower and order details. |
| 2 | Purchase order from customer | Usually | Core document for review. |
| 3 | Supplier quote or invoice | Usually | Shows cost to fulfill order. |
| 4 | Customer information | Usually | Buyer/debtor details. |
| 5 | Supplier information | Usually | Vendor/manufacturer details. |
| 6 | Contract or order terms | Often | Payment, delivery, and cancellation terms. |
| 7 | Business bank statements | Sometimes | Business review. |
| 8 | Business formation documents | Sometimes | Entity verification. |
| 9 | Proof of past performance | Sometimes | Prior fulfillment history, invoices, references. |

### Guardrail

Do not guarantee that a purchase order is financeable. Use “possible review path” or “may be worth broker review.”

---

## Startup Funding Checklist

Use this for early-stage businesses, new founders, or pre-revenue scenarios.

### Best For

- Startup capital exploration
- New business funding review
- Founder preparation
- Alternative startup funding paths

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Founder intake form | Yes | Captures founder, business, and funding goal. |
| 2 | Business plan or summary | Recommended | Helps explain model and use of funds. |
| 3 | Use-of-funds breakdown | Recommended | Shows how funds would be used. |
| 4 | Revenue or traction summary | If available | Sales, pipeline, waitlist, contracts, LOIs. |
| 5 | Personal financial snapshot | Product-dependent | Secure upload only. |
| 6 | Credit profile range | Optional | Self-reported range only. |
| 7 | Business formation documents | If formed | Entity documents. |
| 8 | Bank statements | If operating | Business or personal, depending on path and secure process. |
| 9 | Pitch deck | If available | Useful for equity, investor, or grant paths. |

### Guardrail

The GPT should be careful with startup funding expectations.

Use:

- “Possible funding paths”
- “Preparation checklist”
- “Broker review”
- “May need alternative options”

Avoid:

- “You qualify for startup funding”
- “This will get funded”
- “You are eligible”

---

## Real Estate Investor / Fix-and-Flip Checklist

Use this for fix-and-flip, rental, bridge, or investor deal review.

### Best For

- Fix-and-flip loans
- Bridge loans
- Rental property acquisition
- Investor funding
- DSCR-style deal preparation

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed investor financing application | Yes | Captures borrower and property details. |
| 2 | Property address | Yes | Required for file setup. |
| 3 | Purchase contract | If purchase | Required for acquisition deals. |
| 4 | Current mortgage statement | If refinance | Required for refinance deals. |
| 5 | Rehab budget | If fix-and-flip | Line-item estimate preferred. |
| 6 | Scope of work | If fix-and-flip | Describes repairs and improvements. |
| 7 | Property photos | Recommended | Useful for review. |
| 8 | Rent roll or lease | If rental | Income evidence. |
| 9 | Insurance information | Sometimes | May be needed later. |
| 10 | Entity documents | If borrowing entity | LLC/corporation docs. |
| 11 | Experience summary | Sometimes | Prior projects or rental ownership. |
| 12 | Bank statements or proof of funds | Sometimes | Depending on product and lender path. |

### Automation Notes

- If fix-and-flip is selected, request rehab budget and scope of work.
- If rental/DSCR is selected, request lease, rent roll, or income details.
- If refinance is selected, request mortgage statement.

---

## Franchise Financing Checklist

Use this for franchise startup, acquisition, or expansion funding.

### Best For

- Franchise purchase
- Franchise expansion
- Franchise startup
- SBA or bank-style franchise financing
- Equipment or buildout funding

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed franchise financing application | Yes | Includes borrower and franchise details. |
| 2 | Franchise disclosure document | Sometimes | Often relevant for review. |
| 3 | Franchise agreement | If signed | Key franchise document. |
| 4 | Project cost breakdown | Recommended | Buildout, equipment, fees, working capital. |
| 5 | Business plan | Often | More common for startup franchise financing. |
| 6 | Personal financial statement | Product-dependent | Secure upload only. |
| 7 | Tax returns | Product-dependent | Often for bank-style financing. |
| 8 | Bank statements | Product-dependent | Business or personal depending on scenario. |
| 9 | Lease or site information | If location-based | Site or lease details. |
| 10 | Resume or operator background | Sometimes | Useful for operator review. |

---

## Medical / Professional Practice Financing Checklist

Use this for healthcare, dental, veterinary, legal, accounting, or other professional practice financing.

### Best For

- Practice acquisition
- Practice expansion
- Equipment financing
- Working capital
- Professional services lending

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed practice financing application | Yes | Captures practice and owner details. |
| 2 | Professional license | Often | Needed for regulated professions. |
| 3 | Practice financial statements | Often | P&L, balance sheet, or tax returns. |
| 4 | Business bank statements | Usually | Cash-flow review. |
| 5 | Tax returns | Product-dependent | Business and/or personal. |
| 6 | Purchase agreement | If acquisition | Required for buying a practice. |
| 7 | Equipment quote | If equipment | Required for equipment financing. |
| 8 | Lease or location details | Sometimes | Useful for practice context. |
| 9 | Debt schedule | If applicable | Existing loans or leases. |
| 10 | Ownership documents | Sometimes | Entity and ownership verification. |

### Guardrail

Do not provide licensing, legal, tax, accounting, or medical business compliance advice. Route those questions to qualified professionals.

---

## Construction / Contractor Financing Checklist

Use this for contractors, trades, construction companies, and project-based businesses.

### Best For

- Contractor working capital
- Equipment purchases
- Project financing
- Invoice factoring
- Purchase order financing
- Seasonal cash-flow support

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed contractor financing application | Yes | Captures business and project details. |
| 2 | Business bank statements | Usually | Cash-flow review. |
| 3 | Current project list | Recommended | Helps understand workload. |
| 4 | Contracts or purchase orders | If applicable | Useful for project/invoice financing. |
| 5 | Accounts receivable aging report | If applicable | Useful for invoice financing. |
| 6 | Equipment quote | If equipment | Needed for equipment financing. |
| 7 | Business license | Sometimes | Industry/location dependent. |
| 8 | Insurance certificate | Sometimes | May be requested for contracts. |
| 9 | Tax returns or financial statements | Product-dependent | Larger/traditional requests. |
| 10 | Existing debt schedule | If applicable | Existing obligations. |

---

## Restaurant / Food Service Financing Checklist

Use this for restaurants, cafes, bars, food trucks, catering companies, and food service businesses.

### Best For

- Working capital
- Equipment financing
- Expansion
- Buildout
- Seasonal cash-flow
- Revenue-based funding

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed funding application | Yes | Captures business and funding request. |
| 2 | Business bank statements | Usually | Core review document. |
| 3 | Merchant processing statements | Sometimes | Useful if card sales are significant. |
| 4 | Lease or location details | Sometimes | Useful for restaurant/location review. |
| 5 | Equipment quote | If equipment | Required for equipment financing. |
| 6 | Business license or permits | Sometimes | Food service dependent. |
| 7 | Tax returns or financial statements | Product-dependent | Larger/traditional requests. |
| 8 | Existing debt or advance statements | If applicable | Important for review. |
| 9 | Sales reports from POS | Sometimes | Useful for revenue verification. |
| 10 | Government-issued ID | Usually | Secure upload only. |

---

## Trucking / Transportation Financing Checklist

Use this for trucking companies, owner-operators, fleet expansion, and transportation businesses.

### Best For

- Truck financing
- Trailer financing
- Working capital
- Fuel cash-flow
- Invoice factoring
- Fleet expansion

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed transportation financing application | Yes | Captures business and funding request. |
| 2 | Business bank statements | Usually | Cash-flow review. |
| 3 | Equipment quote or invoice | If truck/equipment | Required for equipment financing. |
| 4 | Vehicle details | If truck/equipment | Year, make, model, mileage, VIN if available. |
| 5 | MC/DOT authority information | Sometimes | Transportation-specific context. |
| 6 | Insurance certificate | Sometimes | May be needed for equipment or contracts. |
| 7 | Freight invoices or factoring statements | If applicable | Useful for factoring review. |
| 8 | Tax returns or financial statements | Product-dependent | Larger/traditional requests. |
| 9 | Existing truck/equipment loan statements | If applicable | Existing obligations. |
| 10 | Government-issued ID | Usually | Secure upload only. |

---

## E-Commerce Business Financing Checklist

Use this for Shopify, Amazon, marketplace sellers, digital product sellers, and online businesses.

### Best For

- E-commerce working capital
- Inventory financing
- Marketplace sellers
- Shopify/Amazon revenue review
- Ad spend financing

### Checklist

| # | Document | Required? | Notes |
|---:|---|---|---|
| 1 | Completed e-commerce funding application | Yes | Captures store and funding request. |
| 2 | Business bank statements | Usually | Cash-flow review. |
| 3 | Marketplace or platform sales reports | Often | Amazon, Shopify, Stripe, PayPal, etc. |
| 4 | Payment processor statements | Sometimes | Stripe, PayPal, Square, etc. |
| 5 | Inventory report | If inventory financing | Current inventory and cost details. |
| 6 | Advertising spend summary | Sometimes | Useful for growth funding context. |
| 7 | Business formation documents | Sometimes | Entity verification. |
| 8 | Tax returns or financial statements | Product-dependent | Larger/traditional requests. |
| 9 | Existing debt or advance statements | If applicable | Current obligations. |
| 10 | Government-issued ID | Usually | Secure upload only. |

---

## Document Request Message Templates

### Initial Document Request

Subject: Documents needed for broker review

Hi [Borrower Name],

Thanks for sharing your funding request. To organize your file for broker review, please upload the following documents through the secure link below:

[Document List]

Secure upload link:
[Secure Upload Link]

Once received, your file can be reviewed and the next step can be determined. Additional documents may be requested depending on the funding product, lender path, or file details.

Thanks,
[Broker / Team Name]

---

### Missing Document Reminder

Subject: Missing documents for your file

Hi [Borrower Name],

We received part of your file, but the following documents are still missing:

[Missing Document List]

Please upload them here:
[Secure Upload Link]

Once these are received, your file can continue to broker review.

Thanks,
[Broker / Team Name]

---

### Replacement Document Request

Subject: Replacement document needed

Hi [Borrower Name],

Thanks for uploading your documents. One or more items may need to be replaced or updated before the file can continue review:

[Document Issue List]

Please upload the replacement document here:
[Secure Upload Link]

Common reasons include unreadable pages, missing pages, outdated statements, incorrect document type, or incomplete information.

Thanks,
[Broker / Team Name]

---

### Documents Received Confirmation

Subject: Documents received

Hi [Borrower Name],

Thanks — we received the uploaded documents.

Next step: your file can be organized for broker review. If anything else is needed, we’ll follow up with a specific request.

Thanks,
[Broker / Team Name]

---

### Final Reminder Before File Goes Stale

Subject: Final reminder: documents still needed

Hi [Borrower Name],

We’re still missing the following documents needed to continue organizing your file for broker review:

[Missing Document List]

Upload link:
[Secure Upload Link]

If you’re no longer looking for funding right now, no problem — you can reply and let us know.

Thanks,
[Broker / Team Name]

---

## Missing Document Automation Logic

Use this logic for document request workflows.

### Basic Reminder Flow

Document request sent
→ Wait 24 hours
→ Check document status
→ If all required docs received, notify broker
→ If docs missing, send reminder 1
→ Wait 48 hours
→ Check document status
→ If docs missing, send reminder 2
→ Wait 72 hours
→ Check document status
→ If docs missing, create broker/processor follow-up task
→ If no response after final reminder, mark file as stalled

### Suggested Reminder Timing

| Reminder | Timing | Message Type |
|---|---|---|
| Initial request | Immediately after broker approval | Email/SMS |
| Reminder 1 | 24 hours later | Friendly reminder |
| Reminder 2 | 48 to 72 hours later | Specific missing-doc reminder |
| Reminder 3 | 5 to 7 days later | Final reminder |
| Manual task | After final reminder | Broker/processor follow-up |

### Guardrail

Do not send aggressive or threatening messages. Keep the tone direct, professional, and helpful.

---

## Document Completeness Rules

Use these checks to flag common document problems.

| Document Type | Completeness Check |
|---|---|
| Bank statements | Required months present, all pages included, readable, correct business. |
| ID | Not expired, readable, name visible, secure upload. |
| Tax returns | Correct year, all relevant schedules if required, readable. |
| P&L | Date range included, business name included, readable. |
| Balance sheet | Date included, business name included, readable. |
| Voided check | Business name visible if required, account details handled securely. |
| Equipment quote | Vendor name, equipment description, price, date. |
| Purchase agreement | Buyer, seller, property/business, price, signatures if applicable. |
| Invoices | Customer name, amount, date, due date, invoice number. |
| Aging report | Customer balances, invoice dates, aging buckets. |
| Debt statements | Lender/funder name, balance, payment amount, date. |

---

## Secure Upload Instructions

Use this language when instructing borrowers.

### Recommended Language

Please upload documents through the secure link below. Do not paste sensitive financial information into email, SMS, or chat.

Secure upload link:
[Secure Upload Link]

If you have trouble uploading, reply and we’ll help route the documents safely.

### Avoid

- “Paste your bank statement here.”
- “Send your full account number in chat.”
- “Upload wherever is easiest.”
- “Text me screenshots of sensitive documents.”
- “Send your bank login.”

---

## Folder Structure for Document Storage

Use this structure for Google Drive, Dropbox, Box, SharePoint, CRM file storage, or secure client portals.

Borrower Folder:
[Borrower Name] - [Business Name] - [Deal ID]

Subfolders:

1. Intake Application
2. Identity Documents
3. Bank Statements
4. Tax Returns
5. Financial Statements
6. Business Documents
7. Debt / Existing Funding
8. Product-Specific Documents
9. Lender Submission Packages
10. Internal Notes and Review

### Naming Convention

Use clear file names:

[BusinessName]_[DocumentType]_[Period]_[ReceivedDate]

Examples:

AcmeLLC_BankStatement_Jan2026_2026-06-30
AcmeLLC_BankStatement_Feb2026_2026-06-30
AcmeLLC_DebtStatement_FunderName_2026-06-30
AcmeLLC_EquipmentQuote_VendorName_2026-06-30

---

## Document Checklist by Funding Type

Use this quick reference when selecting the right template.

| Funding Type | Start With | Add If Needed |
|---|---|---|
| General business funding | Application, bank statements, ID | Debt statements, voided check, tax returns |
| Revenue-based financing | Bank statements, application, ID | Processing statements, existing advance statements |
| Line of credit | Application, bank statements, ID | Tax returns, P&L, balance sheet |
| Term loan | Application, bank statements, ID | Tax returns, financial statements, debt schedule |
| SBA / bank loan | Application, tax returns, financial statements | PFS, business plan, ownership docs |
| Equipment financing | Application, equipment quote, vendor info | Bank statements, insurance, equipment details |
| Commercial real estate | Application, property docs | Rent roll, operating statements, mortgage statement |
| Invoice factoring | Application, invoices, aging report | Contracts, proof of delivery, debtor list |
| Purchase order financing | Application, PO, supplier quote | Contracts, proof of past performance |
| Startup funding | Founder intake, business plan, use of funds | Pitch deck, traction summary, personal financial docs |
| Fix-and-flip | Application, property address, purchase contract | Rehab budget, scope of work, photos |
| Franchise financing | Application, franchise documents | Project cost breakdown, business plan |
| Medical/professional practice | Application, license, financials | Acquisition agreement, equipment quote |
| Contractor financing | Application, bank statements | Contracts, AR aging, equipment quote |
| Restaurant financing | Application, bank statements | POS reports, processing statements, lease |
| Trucking financing | Application, bank statements | Vehicle details, MC/DOT info, invoices |
| E-commerce financing | Application, bank statements | Platform sales reports, processor statements, inventory report |

---

## GPT Behavior Instructions

When the user asks for a document checklist, the GPT should:

1. Ask what type of funding or workflow the checklist is for.
2. Identify whether the file is early intake, broker review, or lender submission prep.
3. Recommend the minimum useful checklist first.
4. Add product-specific documents only when relevant.
5. Tell the user to use secure upload for sensitive files.
6. Include human review before lender submission.
7. Avoid approval, qualification, or eligibility language.
8. Offer a missing-document reminder flow if automation is needed.
9. Create a clean checklist table.
10. End with a clear next step.

---

## Default Output Format

Use this format when generating a checklist.

# Document Checklist: [Funding Type or Workflow Name]

## 1. Purpose
Explain what this checklist is for.

## 2. Best For
List the borrower or funding scenarios where this checklist fits.

## 3. Starter Documents
List the minimum documents to request first.

## 4. Full Checklist
Provide a table with document name, required status, and notes.

## 5. Secure Upload Instructions
Tell the user how borrowers should submit documents safely.

## 6. Human Review Points
List what a broker or processor must review manually.

## 7. Missing-Document Follow-Up
Provide reminder timing and message copy.

## 8. Automation Notes
Explain how to track statuses, reminders, and alerts.

## 9. Final Recommendation
Suggest the next step to implement the checklist.

---

## Example Automation Payload

Use this as a generic structure for document request automation.

{
  "source": "custom_gpt",
  "action_type": "document_request",
  "borrower": {
    "name": "",
    "email": "",
    "phone": ""
  },
  "business": {
    "business_name": "",
    "deal_id": ""
  },
  "funding_type": "",
  "document_request": {
    "request_date": "",
    "secure_upload_link": "",
    "documents": [
      {
        "document_name": "Completed funding application",
        "category": "intake",
        "required": true,
        "status": "requested",
        "notes": ""
      },
      {
        "document_name": "Last 3 months business bank statements",
        "category": "bank_statements",
        "required": true,
        "status": "requested",
        "notes": ""
      }
    ]
  },
  "routing": {
    "assigned_owner": "",
    "human_review_required": true,
    "next_status": "Docs Requested"
  },
  "reminders": {
    "send_initial_request": true,
    "send_reminders": true,
    "reminder_schedule_days": [1, 3, 7],
    "max_reminders": 3
  }
}

---

## Final Rule

The document checklist should make the file easier to review, not create false certainty.

Automate document requests, missing-document reminders, secure upload routing, status tracking, and broker review tasks.

Do not automate approval decisions, underwriting conclusions, lender submissions, or borrower-facing promises without human review.