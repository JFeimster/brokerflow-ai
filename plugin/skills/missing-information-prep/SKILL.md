---
name: missing-information-prep
description: Prepare clear, privacy-safe drafts and internal tasks for review items marked needs information.
---

# Missing information preparation

See `../../references/safety-and-data-handling.md`; missing information and document status must be based on reported or authorized data.

Use `get_my_workspaces` when the authorized organization is unclear. Start from reviews actually marked `needs_information`; inspect one selected item with `get_review` only when necessary. Use fields already present in the review to identify known gaps. If the record does not say what is missing, state that the gap is unknown and ask the broker what to request rather than inventing documents or facts.

Draft a concise checklist or request for broker review. Exclude SSNs, account numbers, personal contact details, private documents, credentials, and unsupported claims. Clearly label the text as a draft. Never send it.

An explicit request to create an internal follow-up task may use `create_follow_up_task` when the workspace grants write access. Link the review and set an owner or due date only when supplied or requested. An explicit request to change a review to `needs_information` may use `apply_review_action` after reading the current version; include only a short, non-sensitive operational note. The workflow state does not determine borrower eligibility or outcome.
