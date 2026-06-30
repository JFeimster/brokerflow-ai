# referral-partner-workflow-templates.md

> Knowledge file for the Loan Broker Automation Architect GPT (Moonshine Capital / Distilled Funding).
> Purpose: give the GPT reusable workflows, messages, and structures for recruiting, onboarding, activating, and managing referral partners who send business-funding leads.
> Safety baseline for every template in this file: never use the words approved, qualified, eligible, guaranteed, pre-approved, or declined when describing borrower outcomes. Use possible fit, ready for broker review, preliminary, and human review required. Never request or route sensitive borrower documents through a partner or through chat/SMS — sensitive docs go through the secure upload link only. Make no promises about partner earnings; describe commissions as potential and tied to actual funded deals.

---

## 1. Who referral partners are

A referral partner is any outside person or business that sends funding leads to the brokerage. Common partner types:

- Accountants / bookkeepers / CPAs — trusted advisors to SMB owners.
- Business coaches / consultants — see clients with growth or cash-flow needs.
- Industry vendors — POS providers, equipment dealers, marketing agencies, web/SaaS sellers.
- Real estate / commercial brokers — clients needing bridge or CRE capital.
- Existing borrowers and satisfied clients — warm word-of-mouth.
- Affiliates / influencers — content creators in the SMB / finance space.

The GPT should detect partner type when drafting outreach and tailor the value proposition accordingly (see section 4).

---

## 2. Partner lifecycle stages

Prospect → identified, not yet contacted
Contacted → first outreach sent, no reply yet
Conversation → replied / call booked / discussing fit
Agreement → terms reviewed, partner agreement signed
Onboarded → has referral link/form, knows how to submit, expectations set
Active → has sent at least one lead in the trailing 90 days
Dormant → previously active, no lead in 90+ days
Offboarded → ended relationship (mutual or compliance-driven)

Each stage has a matching message family in section 5. The GPT picks the family from the partner's current stage.

---

## 3. What a partner needs to succeed (onboarding checklist)

When onboarding a new partner, ensure these are in place:

- Signed referral / partner agreement (commission terms, term length, compliance language).
- A unique referral method: partner link, co-branded intake form, or tracked submission email.
- A one-page "how to refer" guide: who's a good fit, what to say, what not to promise.
- Clear handoff expectation: partner introduces, broker takes it from there; partner never collects sensitive documents.
- A point of contact and response-time expectation.
- Tracking set up in the CRM so credit is attributed to the partner automatically.
- Payout method and cadence on file.

Compliance note the GPT must reinforce: partners may not state or imply that a borrower is approved, qualified, or guaranteed funding, and may not quote rates, amounts, or terms. Partners introduce; the brokerage reviews.

---

## 4. Value propositions by partner type (for tailoring outreach)

Accountant / CPA — "Help your clients access capital without becoming a finance expert; you stay the trusted advisor while we handle the funding legwork, and you earn on funded deals."
Business coach / consultant — "When a client's growth plan needs capital, you have a vetted path instead of a dead end — and a potential revenue stream."
Vendor (POS, equipment, agency) — "Help customers afford what you sell; financing options can shorten their decision and you earn on funded referrals."
Real estate / commercial broker — "A funding partner for clients needing bridge, equipment, or working capital outside your core deals."
Existing borrower / client — "If we helped you, we'd love to help people you trust — and thank you for every funded intro."
Affiliate / creator — "Monetize your SMB audience with a genuinely useful funding resource and earn on funded referrals."

The GPT should weave the relevant value prop into outreach, never overpromising earnings.

---

## 5. Message families

Token dictionary:
[PartnerFirstName] — partner contact first name
[PartnerBusiness] — partner's business name
[BrokerName] — assigned broker / advisor
[BrandName] — Moonshine Capital or Distilled Funding
[PartnerType] — accountant, coach, vendor, etc.
[ReferralLink] — partner's unique referral link or co-branded form
[AgreementLink] — link to the referral agreement
[SchedulerLink] — booking link for a partner call
[GuideLink] — link to the one-page "how to refer" guide
[CommissionTerms] — plain-language summary of the commission structure
[BrokerPhone] / [BrokerEmail] — contact details
[UnsubscribeLink] — required email unsubscribe link
[ClientFirstName] — a referred client's first name (for status updates)

Default placeholder behavior: fill every token from CRM data; if a token is empty, rewrite the sentence so no brackets are ever visible.

### Family A — Prospect outreach (cold/warm intro)

EMAIL A1 — Subject: A simple way to help your clients with funding
Hi [PartnerFirstName],
I work with business owners at [BrandName] to find possible funding paths — working capital, equipment, lines of credit, and more — and handle the heavy lifting for them.
I think there could be a natural fit with [PartnerBusiness]. When one of your clients needs capital, you'd have a straightforward, no-pressure path to send them, and you'd earn on any deal that actually funds. You stay the trusted advisor; we do the legwork and keep you in the loop.
Worth a 15-minute conversation to see if it makes sense? Here's my calendar: [SchedulerLink].
Best,
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS A1
Hi [PartnerFirstName], it's [BrokerName] with [BrandName]. We help business owners find possible funding paths and I think there's a fit with [PartnerBusiness] — a simple path for your clients and earnings on funded referrals. Open to a quick call? [SchedulerLink]. Reply STOP to opt out.

### Family B — Conversation / nurture (replied, not yet signed)

EMAIL B1 — Subject: Great talking — here's how a referral partnership works
Hi [PartnerFirstName],
Thanks for the conversation. Quick recap of how this works:
- You introduce a client who's exploring funding (a name + a quick heads-up, or you send them my way).
- We take it from there: a broker reviews their situation for possible funding paths — nothing is promised, and every file gets a real human review.
- You earn on deals that actually fund. Plain-language terms: [CommissionTerms].
- You never have to quote rates, collect documents, or play finance expert — that's on us.
If that sounds good, here's the partner agreement to review: [AgreementLink]. Happy to answer any questions first.
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS B1
Hi [PartnerFirstName], here's the quick version: you intro a client, we review for possible funding paths and handle everything, you earn on funded deals ([CommissionTerms]). Agreement to review: [AgreementLink]. Questions? Just reply.

### Family C — Agreement & onboarding (signed → ready to refer)

EMAIL C1 — Subject: You're set up — here's everything you need to refer
Hi [PartnerFirstName],
Welcome aboard. Here's your referral toolkit:
- Your unique referral link / form: [ReferralLink]
- One-page guide on who's a good fit and what to say: [GuideLink]
- Your commission terms: [CommissionTerms]
A few ground rules that keep everyone protected: please introduce clients without promising approval, amounts, rates, or timelines, and never collect sensitive documents yourself — clients always upload through our secure link. Just point them to me and I'll take it from there.
Send your first intro whenever you're ready, and reach me anytime at [BrokerPhone] or [BrokerEmail].
[BrokerName]
[BrandName]
[UnsubscribeLink]

SMS C1
Welcome aboard, [PartnerFirstName]! Your referral link: [ReferralLink]. How-to-refer guide: [GuideLink]. Reminder: intro only — no promises on approval/amounts, and no collecting docs. I handle the rest. — [BrokerName]

### Family D — Activation nudge (onboarded, no leads yet)

EMAIL D1 — Subject: Easiest first referral for [PartnerBusiness]
Hi [PartnerFirstName],
No rush, but I wanted to make your first referral effortless. The easiest place to start: any client who's mentioned cash flow being tight, wanting to buy equipment, hire, expand, or smooth out slow seasons.
You don't have to pitch anything — just say "I know a team that helps business owners explore funding options; want an intro?" and send them my way or share your link: [ReferralLink].
Here's the quick guide again if helpful: [GuideLink]. I'll handle the rest and keep you posted.
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS D1
Hi [PartnerFirstName], easiest first intro: any client with tight cash flow, an equipment need, or expansion plans. Just send them my way or share [ReferralLink] — I handle everything. — [BrokerName]

### Family E — Lead received (confirmation to partner)

EMAIL E1 — Subject: Got your referral — thank you
Hi [PartnerFirstName],
Thanks for introducing [ClientFirstName] — I've received the referral and a broker will personally review their situation for possible funding paths. I'll keep you posted on progress (without sharing anything confidential), and you're credited as the referring partner.
Appreciate you thinking of us.
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS E1
Thanks [PartnerFirstName]! Got your intro for [ClientFirstName] — a broker is reviewing for possible funding paths and you're credited as the referrer. I'll keep you posted. — [BrokerName]

### Family F — Status update to partner (in progress)

EMAIL F1 — Subject: Quick update on your referral [ClientFirstName]
Hi [PartnerFirstName],
Quick note: [ClientFirstName]'s file is in active broker review for possible funding paths. Nothing's decided yet, and everything's moving along. I'll let you know when there's a meaningful update. Thanks again for the intro.
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS F1
Hi [PartnerFirstName], update: [ClientFirstName] is in active review for possible funding paths. I'll flag you when there's a meaningful update. Thanks again! — [BrokerName]

### Family G — Funded / payout (referral funded)

EMAIL G1 — Subject: Your referral funded — thank you (and what's next)
Hi [PartnerFirstName],
Great news: the deal you referred has funded. Per your terms, that means a commission is on the way — here's the summary: [CommissionTerms]. You'll receive payout on our normal cadence, and I'll make sure the details hit your inbox.
This is exactly the kind of partnership that works. Who else comes to mind that could use a look at funding options?
Thank you,
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS G1
[PartnerFirstName] — your referral funded! Commission is on the way per [CommissionTerms]. Thank you. Who else might need a funding look? — [BrokerName]

### Family H — Dormant re-engagement (no leads in 90+ days)

EMAIL H1 — Subject: Still here whenever a client needs funding
Hi [PartnerFirstName],
It's been a little while, so I wanted to reconnect. Nothing needed on your end — just a reminder that whenever a client at [PartnerBusiness] is exploring capital, your referral link is live: [ReferralLink], and I'm a quick message away.
If anything's changed about how you'd like to work together, tell me and we'll adjust. Always glad to help your clients.
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS H1
Hi [PartnerFirstName], reconnecting — your referral link is still live whenever a client needs funding: [ReferralLink]. Anything I can do to make referring easier? — [BrokerName] Reply STOP to opt out.

### Family I — Offboarding (graceful exit)

EMAIL I1 — Subject: Wrapping up our referral partnership
Hi [PartnerFirstName],
I wanted to close the loop cleanly on our referral arrangement. Any referrals already in motion will be honored under your existing terms, and I'm happy to confirm those details. The door's always open if you'd like to restart down the road.
Thanks for the work we did together.
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

---

## 6. Referral submission workflow (end-to-end map)

Partner identifies a client who may need funding →
Partner introduces (shares [ReferralLink], forwards client, or emails a heads-up) →
CRM captures referral and attributes it to the partner →
Auto-send Family E confirmation to partner + Family A acknowledgment to borrower →
Broker reviews borrower for possible funding paths (human review required) →
Periodic Family F status updates to partner while review is open →
If funded: Family G payout message + commission triggered →
If not a fit: partner gets a brief, non-confidential "not a fit right now" note; borrower enters nurture →
Partner credit and outcome logged for reporting.

Attribution rule: the referring partner is credited at the moment the referral is captured, and credit persists through the funding outcome regardless of how long review takes (subject to the agreement's term length).

---

## 7. Tracking & reporting fields (CRM)

For each partner, track:
- Partner name, type, contact, lifecycle stage
- Agreement status + signed date + term length
- Referral link / form ID
- Leads referred (count, trailing 90 days, all-time)
- Leads in review / funded / not-a-fit
- Conversion rate (funded ÷ referred)
- Commission owed / paid / pending
- Last referral date and last contact date

For each referred lead, track:
- Referring partner (attribution)
- Borrower stage (see crm-pipeline-stage-definitions.md)
- Outcome and funded date (if applicable)
- Commission status

Suggested partner health flags: Active (lead in 90 days), At-risk (no lead in 60–89 days), Dormant (90+ days), Star (multiple funded referrals).

---

## 8. Commission handling guidance (language only — not legal/financial advice)

The GPT should describe commissions in plain, non-binding language and always defer exact figures and legal terms to the signed agreement. Acceptable framing:
- "You earn a commission on deals that actually fund, per your agreement."
- "Commissions are potential and tied to funded outcomes — not to submissions or reviews."
- "Exact structure and timing are in your partner agreement: [CommissionTerms]."

Never: promise specific dollar amounts as guaranteed, imply earnings without a funded deal, or state commission terms that conflict with the signed agreement. When unsure, route to human review.

---

## 9. GPT behavior instructions for this file

When asked to draft partner-facing communication or design a partner workflow, the GPT should:
1. Identify the partner type and lifecycle stage; select the matching message family.
2. Choose channel (email for detail/onboarding, SMS for nudges/confirmations).
3. Personalize every token; rewrite around any token it cannot fill; never leave visible brackets.
4. Keep borrower outcomes in compliant language: possible fit / ready for broker review / preliminary / human review required — never approved, qualified, eligible, guaranteed, or declined.
5. Frame commissions as potential and funded-deal-based; defer specifics to the agreement.
6. Reinforce that partners introduce only — no quoting terms, no collecting sensitive documents (always the secure upload link).
7. Include the SMS opt-out on new sequences and the email [UnsubscribeLink] on every email.
8. Output clean, ready-to-send copy plus a one-line human-review note if anything references money, terms, or commitments.

Default output format: return channel, subject (email only), body, and a one-line human-review note.

Example output (activation nudge):
Channel: Email
Subject: Easiest first referral for Summit Bookkeeping
Body: Hi Rosa, no rush — your easiest first intro is any client who's mentioned tight cash flow or plans to buy equipment. Just say "I know a team that helps owners explore funding options — want an intro?" and share your link: refer.example/rosa. I handle the rest and keep you posted. — Dave, Moonshine Capital
Human-review note: none — no amounts or commission specifics stated.

---

## 10. Final rule

Referral partners are introducers, not underwriters. Every message keeps borrower outcomes preliminary and human-reviewed, keeps commissions tied to funded deals and the signed agreement, and keeps sensitive documents off email, SMS, and partner hands. When in doubt, soften the claim and route to human review.