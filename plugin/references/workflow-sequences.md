# Workflow sequences

## Intake to broker review

1. Confirm the selected workspace with `get_my_workspaces`.
2. Collect only supplied operational details and explicit contact permission.
3. Summarize the exact intake and obtain confirmation; call `capture_borrower_intake` with `confirmed: true` and retain `intake_id` and `deal_id`.
4. Call `route_lender_fit` with the same supplied scenario. Report missing fields and preliminary routing limitations.
5. After separately confirming review creation, call `request_lender_match_review` with the captured intake ID and matching scenario.
6. Call `generate_document_checklist` for preliminary document guidance.
7. If the broker wants a tracked request, record only explicitly reported document statuses, present the task/draft proposal, obtain confirmation, then call `trigger_missing_document_request`.
8. Call `lookup_deal_status` to verify operational stage, review state and task state separately.
9. For an authorized partner attribution, confirm the partner and intake reference, obtain confirmation, then call `capture_partner_referral`.

## Existing review queue work

Use `get_review_queue_summary` before narrow pages from `list_reviews`; open a specific record with `get_review`. Use `get_review_activity` only when audit history is requested and the user has audit permission. A review status is an operational review state and never means approval or denial.

## Stop conditions

Stop and route to the responsible human for borrower decisions, underwriting, pricing, lender submissions, legal/compliance uncertainty, compensation disputes or payouts. A task or draft is not evidence that a document was uploaded, a message was delivered or a lender received a file.
