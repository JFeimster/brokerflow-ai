import test from "node:test";
import assert from "node:assert/strict";
import { getReviewQueueSummary } from "../lib/reviews/queue-summary.js";

const org = "00000000-0000-4000-8000-000000000001";
const otherOrg = "00000000-0000-4000-8000-000000000002";
const now = new Date("2026-10-19T12:00:00.000Z");

function review(id, organizationId, status, urgency, ageHours) {
  const createdAt = new Date(now.getTime() - ageHours * 3_600_000).toISOString();
  return { id: `review-${id}`, review_request_id: `lmr_${id}`, organization_id: organizationId, status, urgency, created_at: createdAt, updated_at: createdAt };
}

function fakeDb(rows) {
  return {
    from(table) {
      assert.equal(table, "brokerflow_review_requests");
      const filters = [];
      let limit = null;
      const sortFields = [];
      const query = {
        select(_columns, options) { this.head = options?.head === true; return this; },
        eq(field, value) { filters.push(row => row[field] === value); return this; },
        in(field, values) { filters.push(row => values.includes(row[field])); return this; },
        lt(field, value) { filters.push(row => row[field] < value); return this; },
        gte(field, value) { filters.push(row => row[field] >= value); return this; },
        order(field, options = {}) { sortFields.push({ field, ascending: options.ascending !== false }); return this; },
        limit(value) { limit = value; return this; },
        then(resolve, reject) {
          const selected = rows.filter(row => filters.every(filter => filter(row))).sort((left, right) => {
            for (const sort of sortFields) {
              const compared = left[sort.field] < right[sort.field] ? -1 : left[sort.field] > right[sort.field] ? 1 : 0;
              if (compared) return sort.ascending ? compared : -compared;
            }
            return 0;
          });
          const value = this.head
            ? { count: selected.length, data: null, error: null }
            : { count: null, data: limit === null ? selected : selected.slice(0, limit), error: null };
          return Promise.resolve(value).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

test("queue summary counts status, open urgency, aging, overdue, and needs-information inside one organization", async () => {
  const rows = [
    review("a", org, "queued_for_human_review", "same_day", 25),
    review("b", org, "in_review", "high", 50),
    review("c", org, "needs_information", "normal", 30),
    review("d", org, "queued_for_human_review", "low", 200),
    review("e", org, "reviewed", "same_day", 500),
    review("outside", otherOrg, "queued_for_human_review", "high", 500),
  ];
  const summary = await getReviewQueueSummary(fakeDb(rows), org, now);
  assert.deepEqual(summary.counts_by_status, {
    queued_for_human_review: 2,
    in_review: 1,
    needs_information: 1,
    reviewed: 1,
  });
  assert.deepEqual(summary.counts_by_urgency, { same_day: 1, high: 1, normal: 1, low: 1 });
  assert.equal(summary.open_review_count, 4);
  assert.equal(summary.overdue_review_count, 3);
  assert.deepEqual(summary.overdue_by_urgency, { same_day: 1, high: 1, normal: 0, low: 1 });
  assert.deepEqual(Object.fromEntries(Object.entries(summary.aging_buckets).map(([key, value]) => [key, value.count])), {
    under_1_day: 0,
    "1_to_3_days": 3,
    "3_to_7_days": 0,
    over_7_days: 1,
  });
  assert.equal(summary.needs_information_count, 1);
  assert.equal(summary.needs_information_reviews[0].status, "needs_information");
  assert.equal(summary.needs_information_reviews[0].review_request_id, "lmr_c");
  assert.equal(summary.oldest_outstanding_reviews[0].review_request_id, "lmr_d");
  assert.ok(summary.suggested_next_steps.some(step => step.priority === "high" && step.count === 3));
  assert.equal(summary.overdue_threshold_hours_by_urgency.same_day, 24);
  assert.equal(summary.oldest_outstanding_reviews.some(item => "business_name" in item), false);
});
