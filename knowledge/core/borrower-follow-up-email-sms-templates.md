# borrower-follow-up-email-sms-templates.md

> Knowledge file for the Loan Broker Automation Architect GPT (Moonshine Capital / Distilled Funding).
> Purpose: give the GPT a reusable, compliant library of borrower follow-up messages (email + SMS) it can adapt across the funding pipeline.
> Safety baseline for every template in this file: never use the words approved, qualified, eligible, guaranteed, pre-approved, or declined. Use possible fit, ready for broker review, preliminary, and human review required. Never request full SSNs, bank logins, or document images in chat or SMS — sensitive documents go through the secure upload link only.

---

## 1. How to use this file

This file is a template library, not a send list. The GPT should:

1. Detect the borrower's current pipeline stage (see crm-pipeline-stage-definitions.md).
2. Select the matching template family below.
3. Fill every [Placeholder] token with real values from the CRM record.
4. Strip any token it cannot fill and rewrite the sentence so it still reads naturally — never send a message containing visible brackets.
5. Flag for human review before sending if the message references numbers, terms, timelines, or commitments.

Channel rule of thumb:
- Email → longer context, attachments-by-link, document requests, recaps, education.
- SMS → short nudges, confirmations, scheduling, "did you see my email" pings. Keep SMS under ~320 characters and always identify the sender and brand.

Compliance rule for SMS: every SMS sequence must include a clear opt-out (Reply STOP to opt out) on the first message of any new sequence and at a reasonable cadence after. Only message contacts who provided consent.

---

## 2. Token dictionary (placeholders)

[FirstName] — borrower first name
[BrokerName] — assigned broker / advisor name
[BrandName] — Moonshine Capital or Distilled Funding (use the brand tied to the lead source)
[BusinessName] — borrower's business legal or DBA name
[ProductPath] — the possible funding path under review (e.g., working capital line, equipment financing)
[SecureUploadLink] — the secure document upload URL (never ask for docs any other way)
[SchedulerLink] — booking link for a broker call
[DocList] — the short list of documents still needed
[NextStep] — the single next action you want the borrower to take
[Timeframe] — a soft, non-binding timeframe (e.g., "in the next day or two")
[BrokerPhone] — direct callback number
[BrokerEmail] — reply-to email
[UnsubscribeLink] — required email unsubscribe link

Default placeholder behavior: if a token is empty, rewrite around it. Example: if [Timeframe] is unknown, say "shortly" instead of leaving a bracket.

---

## 3. Stage → template map

New lead / just submitted intake → Family A (Acknowledge + set expectations)
Intake incomplete / missing info → Family B (Information request)
Documents requested / awaiting upload → Family C (Document follow-up)
In broker review / matching in progress → Family D (Status / reassurance)
Possible fit identified, call needed → Family E (Schedule the conversation)
Went quiet / no response → Family F (Re-engagement / break-up)
Not a fit right now → Family G (Graceful hold / nurture)
Funded / completed → Family H (Post-funding + referral)

---

## 4. Family A — Acknowledge & set expectations

Trigger: borrower just submitted an intake form. Goal: confirm receipt, set a human-review expectation, reduce anxiety, no promises.

EMAIL A1 — Subject: We've got your request, [FirstName]
Hi [FirstName],
Thanks for reaching out to [BrandName] about funding for [BusinessName]. Your information is in front of our team now.
Here's what happens next: a broker will personally review your details to look for possible funding paths that fit your situation. This is a preliminary review by a real person — nothing is decided automatically, and there's no commitment on your end.
You don't need to do anything right now. If we need a document or a quick detail to move forward, I'll reach out with exactly what's needed and a secure link to share it.
I'll follow up [Timeframe]. If anything changes in the meantime, just reply here.
Talk soon,
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS A1
Hi [FirstName], it's [BrokerName] with [BrandName]. Got your funding request for [BusinessName] — a broker is reviewing it personally now. I'll follow up [Timeframe]. Reply STOP to opt out.

---

## 5. Family B — Information request (intake incomplete)

Trigger: intake is missing fields needed to begin review. Goal: get the minimum missing details, stay low-friction, never request sensitive data over chat/SMS.

EMAIL B1 — Subject: Quick detail to keep things moving
Hi [FirstName],
I started reviewing your request for [BusinessName] and I'm close — I just need a couple of quick details to continue:
- [DocList]
You can reply right here with the basic details, and anything sensitive (statements, IDs, etc.) should go through this secure link only: [SecureUploadLink]
Please don't send account numbers, passwords, or full Social Security numbers by text or email — the secure link keeps everything protected.
Once I have these, I'll continue the review and let you know the possible paths I'm seeing.
Thanks,
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS B1
Hi [FirstName], [BrokerName] at [BrandName]. To keep your review moving I need: [DocList]. Reply here for basic info, or use this secure link for documents: [SecureUploadLink]. Please don't text sensitive numbers. Reply STOP to opt out.

---

## 6. Family C — Document follow-up (awaiting upload)

Trigger: documents requested, not yet received. Use escalating but friendly cadence. Suggested cadence: C1 at day 1, C2 at day 3, C3 at day 6.

EMAIL C1 — Subject: Your secure upload link for [BusinessName]
Hi [FirstName],
Whenever you're ready, here's your secure link to upload the documents we discussed: [SecureUploadLink]
What's still needed: [DocList]
Once those are in, your file is ready for broker review and I can move forward on possible funding paths. No rush — the link stays active for you. Let me know if any of the items are tricky to find and I'll help.
Best,
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS C1
Hi [FirstName], here's your secure upload link for [BusinessName]: [SecureUploadLink]. Still need: [DocList]. Once uploaded I can keep your review moving. Reply STOP to opt out.

SMS C2 (gentle nudge)
Hi [FirstName], just checking in — still holding your spot for review. When you have a minute, the docs go here: [SecureUploadLink]. Happy to help if anything's hard to find.

EMAIL C3 — Subject: Still here when you're ready, [FirstName]
Hi [FirstName],
I don't want your request for [BusinessName] to stall on my end. The only thing between here and a full broker review is: [DocList].
Here's the secure link again: [SecureUploadLink]
If now isn't a good time, just reply "later" and I'll check back without crowding your inbox. If your needs have changed, let me know that too — no problem either way.
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

---

## 7. Family D — Status / reassurance (in review)

Trigger: file is complete and in broker review or matching. Goal: keep the borrower warm without overpromising. Never state outcomes, amounts, or terms here.

EMAIL D1 — Subject: Update on your [BusinessName] review
Hi [FirstName],
Quick update: your file is with our team and we're reviewing possible funding paths that fit [BusinessName]. This step is hands-on, so it takes a little time to do it right.
Nothing's decided yet, and I'll personally reach out as soon as I have something concrete to walk you through. If anything about your situation changes (timing, amount you're exploring, or use of funds), tell me now so I can factor it in.
Appreciate your patience,
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS D1
Hi [FirstName], [BrokerName] here. Your [BusinessName] file is in active review for possible funding paths. I'll reach out as soon as I have something specific to walk through. Reply STOP to opt out.

---

## 8. Family E — Schedule the conversation (possible fit)

Trigger: a possible fit has been identified and a broker call is the next step. Goal: book the call. Keep all specifics for the live conversation; do not put numbers/terms in writing.

EMAIL E1 — Subject: Ready to walk you through what I'm seeing
Hi [FirstName],
Good news — after reviewing [BusinessName], I've found one or more possible funding paths worth talking through. I'd rather walk you through the details live so you can ask questions and I can make sure it actually fits your goals.
Grab whatever time works here: [SchedulerLink]
The call is preliminary — no commitment, just a clear conversation about options and next steps. If none of those times work, reply with a couple of windows and I'll make one fit.
Looking forward to it,
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS E1
Hi [FirstName], [BrokerName] at [BrandName]. I found possible funding paths for [BusinessName] I'd like to walk you through. Grab a time: [SchedulerLink]. No commitment — just options. Reply STOP to opt out.

SMS E2 (day-of reminder)
Hi [FirstName], looking forward to our call today about possible paths for [BusinessName]. If you need to reschedule, here's the link: [SchedulerLink].

---

## 9. Family F — Re-engagement / break-up (gone quiet)

Trigger: no response across prior touches. Suggested cadence: F1, then F2 a few days later, then the break-up F3. Keep it warm, never guilt-trip.

EMAIL F1 — Subject: Still thinking about funding for [BusinessName]?
Hi [FirstName],
I haven't heard back, so I wanted to check in. If now's not the right time to explore funding for [BusinessName], that's completely fine — timing matters as much as fit.
If you'd still like to move forward, the next step is simple: [NextStep]. And here's your secure link if documents are what's outstanding: [SecureUploadLink].
Just reply and let me know where your head's at.
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS F1
Hi [FirstName], checking in on funding for [BusinessName]. Still interested? Next step is: [NextStep]. No pressure — just reply yes or not now. Reply STOP to opt out.

EMAIL F3 — Subject: Closing your file for now (easy to reopen)
Hi [FirstName],
I don't want to keep crowding your inbox, so I'll pause your file for [BusinessName] for now. Nothing is lost — when you're ready, just reply to this email or text me and I'll pick right back up where we left off.
Wishing you and the business well,
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

---

## 10. Family G — Graceful hold / nurture (not a fit right now)

Trigger: not a current fit after review. Goal: preserve the relationship, never use the word declined, leave a door open. Always route the underlying reason to human review before sending so the message is accurate and kind.

EMAIL G1 — Subject: Where things stand with [BusinessName]
Hi [FirstName],
Thanks for letting us look at [BusinessName]. Based on our preliminary review, this isn't the right moment for the paths we explored — but that can change as your business grows or as the details shift.
A few things often open up new options down the road: a few more months of revenue history, updated financials, or a change in what the funds are for. If any of those move, reach back out and we'll take a fresh look.
I'm keeping your information on file so we don't have to start over. Thanks for the chance to help.
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS G1
Hi [FirstName], thanks for letting us review [BusinessName]. It's not the right fit at the moment, but that can change as things grow. Reach out anytime and we'll take a fresh look. Reply STOP to opt out.

---

## 11. Family H — Post-funding + referral

Trigger: deal funded / completed. Goal: confirm, thank, and open a referral loop. Keep it warm and specific.

EMAIL H1 — Subject: Congrats, [FirstName] — and a quick thank-you
Hi [FirstName],
Congratulations on getting [BusinessName] funded. It was a pleasure working through this with you, and I'm here if anything comes up as you put the funds to work.
One quick ask: if you know another owner who could use a straight-shooting look at funding options, I'd be grateful for the intro. Most of the people I help come from referrals like yours. They can reach me directly at [BrokerEmail] or [BrokerPhone].
Thanks again for trusting [BrandName].
[BrokerName]
[BrandName] | [BrokerPhone]
[UnsubscribeLink]

SMS H1
Congrats [FirstName] — great working with you on [BusinessName]! If you know another owner exploring funding, I'd love an intro. They can reach me at [BrokerPhone]. Reply STOP to opt out.

---

## 12. Cadence guidance (default automation timing)

These are starting defaults for an automation builder; a human can override per lead.

New lead → A1 email immediately + A1 SMS within 5 minutes.
Intake incomplete → B1 same day; repeat once after 48 hours, then route to broker.
Documents requested → C1 day 1, C2 day 3, C3 day 6; after C3 with no response, move to Family F.
In review → D1 every 3–4 business days while review is open.
Possible fit → E1 immediately; E2 reminder on call day; if no booking in 48 hours, one nudge then broker call attempt.
Gone quiet → F1, F2 (+3 days), F3 break-up (+4 days), then move to nurture.
Not a fit → G1 once, then add to long-cycle nurture list.
Funded → H1 within 24 hours of funding confirmation.

Hard stop: any contact who replies STOP, unsubscribes, or asks to stop is removed from all automated sequences immediately.

---

## 13. GPT behavior instructions for this file

When asked to draft or send a borrower follow-up, the GPT should:
1. Confirm the borrower's pipeline stage and pick the matching family.
2. Choose channel (email vs SMS) based on the rule of thumb in section 1.
3. Personalize every token; rewrite around any token it cannot fill.
4. Keep all amounts, rates, terms, and timelines out of written messages — those belong in a live broker conversation flagged for human review.
5. Enforce the language rules: possible fit / ready for broker review / preliminary / human review required — never approved, qualified, eligible, guaranteed, or declined.
6. Never request sensitive documents or identifiers in chat/SMS; always point to [SecureUploadLink].
7. Include the SMS opt-out on new sequences and the email [UnsubscribeLink] on every email.
8. Output a clean, ready-to-paste message with no visible brackets and no placeholder leftovers.

Default output format when generating a message: return the subject line (email only), the channel, and the message body, with a one-line note flagging anything that needs human review before sending.

Example output (working capital nudge):
Channel: SMS
Body: Hi Maria, it's Dave with Moonshine Capital. Your file for Bright Path Cafe is ready for broker review — I'd like to walk you through possible options. Grab a time: book.example/dave. No commitment. Reply STOP to opt out.
Human-review note: none — no amounts or terms referenced.

---

## 14. Final rule

Every message in this library is a preliminary, no-commitment communication from a real broker. Nothing here approves, qualifies, or guarantees funding. When in doubt, soften the claim, route to human review, and keep sensitive data off email and SMS.