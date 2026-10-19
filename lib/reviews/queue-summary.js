export const OPEN_REVIEW_STATUSES = Object.freeze([
  "queued_for_human_review",
  "in_review",
  "needs_information",
]);

export const REVIEW_AGE_BUCKETS = Object.freeze([
  { key: "under_1_day", label: "Under 1 day", minHours: 0, maxHours: 24 },
  { key: "1_to_3_days", label: "1 to 3 days", minHours: 24, maxHours: 72 },
  { key: "3_to_7_days", label: "3 to 7 days", minHours: 72, maxHours: 168 },
  { key: "over_7_days", label: "Over 7 days", minHours: 168, maxHours: null },
]);

export const OVERDUE_HOURS_BY_URGENCY = Object.freeze({
  same_day: 24,
  high: 48,
  normal: 120,
  low: 168,
});

const REVIEW_STATUSES = [...OPEN_REVIEW_STATUSES, "reviewed"];
const URGENCIES = ["same_day", "high", "normal", "low"];

function countQuery(db, organizationId, configure = () => {}) {
  let query = db.from("brokerflow_review_requests").select("id", { count: "exact", head: true }).eq("organization_id", organizationId);
  query = configure(query) || query;
  return query.then(({ count, error }) => {
    if (error) throw Object.assign(new Error("Unable to summarize the review queue."), { status: 503, code: "storage_unavailable" });
    return count || 0;
  });
}

function ageCutoff(now, hours) {
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

export async function getReviewQueueSummary(db, organizationId, now = new Date()) {
  const countsByStatusPromise = Promise.all(REVIEW_STATUSES.map(async status => [
    status,
    await countQuery(db, organizationId, query => query.eq("status", status)),
  ]));
  const countsByUrgencyPromise = Promise.all(URGENCIES.map(async urgency => [
    urgency,
    await countQuery(db, organizationId, query => query.eq("urgency", urgency).in("status", OPEN_REVIEW_STATUSES)),
  ]));
  const overdueByUrgencyPromise = Promise.all(URGENCIES.map(async urgency => [
    urgency,
    await countQuery(db, organizationId, query => query.eq("urgency", urgency).in("status", OPEN_REVIEW_STATUSES).lt("created_at", ageCutoff(now, OVERDUE_HOURS_BY_URGENCY[urgency]))),
  ]));
  const agingPromise = Promise.all(REVIEW_AGE_BUCKETS.map(async bucket => {
    let filter;
    if (bucket.maxHours === null) filter = query => query.in("status", OPEN_REVIEW_STATUSES).lt("created_at", ageCutoff(now, bucket.minHours));
    else if (bucket.minHours > 0) filter = query => query.in("status", OPEN_REVIEW_STATUSES).lt("created_at", ageCutoff(now, bucket.minHours)).gte("created_at", ageCutoff(now, bucket.maxHours));
    else filter = query => query.in("status", OPEN_REVIEW_STATUSES).gte("created_at", ageCutoff(now, bucket.maxHours));
    return [bucket, await countQuery(db, organizationId, filter)];
  }));
  const oldestPromise = db.from("brokerflow_review_requests")
    .select("id,review_request_id,status,urgency,created_at,updated_at")
    .eq("organization_id", organizationId)
    .in("status", OPEN_REVIEW_STATUSES)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(5);
  const needsInformationPromise = db.from("brokerflow_review_requests")
    .select("id,review_request_id,status,urgency,created_at")
    .eq("organization_id", organizationId)
    .eq("status", "needs_information")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(5);

  const [statusPairs, urgencyPairs, overduePairs, agingPairs, oldestResult, needsInformationResult] = await Promise.all([
    countsByStatusPromise,
    countsByUrgencyPromise,
    overdueByUrgencyPromise,
    agingPromise,
    oldestPromise,
    needsInformationPromise,
  ]);
  if (oldestResult.error || needsInformationResult.error) throw Object.assign(new Error("Unable to summarize the review queue."), { status: 503, code: "storage_unavailable" });

  const countsByStatus = Object.fromEntries(statusPairs);
  const countsByUrgency = Object.fromEntries(urgencyPairs);
  const openCount = OPEN_REVIEW_STATUSES.reduce((sum, status) => sum + countsByStatus[status], 0);
  const needsInformation = countsByStatus.needs_information;
  const overdueByUrgency = Object.fromEntries(overduePairs);
  const overdueCount = Object.values(overdueByUrgency).reduce((sum, count) => sum + count, 0);
  const agingBuckets = Object.fromEntries(agingPairs.map(([bucket, count]) => [bucket.key, { label: bucket.label, count }]));
  const oldestOutstanding = (oldestResult.data || []).map(item => ({
    review_id: item.id,
    review_request_id: item.review_request_id,
    status: item.status,
    urgency: item.urgency,
    created_at: item.created_at,
    age_hours: Math.max(0, Math.floor((now.getTime() - Date.parse(item.created_at)) / 3_600_000)),
  }));
  const needsInformationReviews = (needsInformationResult.data || []).map(item => ({
    review_id: item.id,
    review_request_id: item.review_request_id,
    status: item.status,
    urgency: item.urgency,
    created_at: item.created_at,
    age_hours: Math.max(0, Math.floor((now.getTime() - Date.parse(item.created_at)) / 3_600_000)),
  }));
  const suggestedNextSteps = [];
  if (overdueCount) suggestedNextSteps.push({ priority: "high", action: "Review overdue items in age order and assign or confirm an accountable owner.", count: overdueCount });
  if (needsInformation) suggestedNextSteps.push({ priority: "normal", action: "Check open needs-information items and prepare concise, non-sensitive follow-up requests.", count: needsInformation });
  const stale = agingBuckets["over_7_days"].count;
  if (stale) suggestedNextSteps.push({ priority: "normal", action: "Inspect reviews open for more than 7 days and record the next operational step.", count: stale });
  if (!suggestedNextSteps.length && openCount) suggestedNextSteps.push({ priority: "normal", action: "Continue processing the open queue by urgency and assign follow-up owners where needed.", count: openCount });
  if (!openCount) suggestedNextSteps.push({ priority: "low", action: "No open reviews currently need triage.", count: 0 });

  return {
    counts_by_status: countsByStatus,
    counts_by_urgency: countsByUrgency,
    open_review_count: openCount,
    overdue_review_count: overdueCount,
    overdue_by_urgency: overdueByUrgency,
    overdue_threshold_hours_by_urgency: OVERDUE_HOURS_BY_URGENCY,
    aging_buckets: agingBuckets,
    needs_information_count: needsInformation,
    needs_information_reviews: needsInformationReviews,
    oldest_outstanding_reviews: oldestOutstanding,
    suggested_next_steps: suggestedNextSteps,
    as_of: now.toISOString(),
  };
}
