import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (process.env.REQUIRE_POSTGRES_TESTS === "1" && !databaseUrl) {
  throw new Error("DATABASE_URL is required when REQUIRE_POSTGRES_TESTS=1.");
}
const orgA = "20000000-0000-4000-8000-000000000001";
const orgB = "20000000-0000-4000-8000-000000000002";
const brokerA = "10000000-0000-4000-8000-000000000001";
const viewerA = "10000000-0000-4000-8000-000000000002";
const partnerA = "10000000-0000-4000-8000-000000000003";
const brokerB = "10000000-0000-4000-8000-000000000004";
const migrationPaths = [
  new URL("../supabase/migrations/20261018000100_brokerflow_reviews.sql", import.meta.url),
  new URL("../supabase/migrations/20261019000100_brokerflow_rate_limits.sql", import.meta.url),
  new URL("../supabase/migrations/20261019125615_brokerflow_follow_up_tasks.sql", import.meta.url)
];
const fixturePath = new URL("../supabase/tests/platform_core_baseline.sql", import.meta.url);

function scenario(overrides = {}) {
  return {
    source: "custom_gpt",
    action_type: "lender_match_review",
    requester_name: "Synthetic broker intake",
    borrower_type: "business",
    business_name: `Synthetic Business ${randomUUID()}`,
    loan_purpose: "equipment_financing",
    requested_amount: 125000,
    state: "NY",
    urgency: "normal",
    human_review_required: true,
    ...overrides
  };
}

async function createReview(client, orgId, actorId, key, reviewScenario = scenario()) {
  const result = await client.query(
    "select public.brokerflow_create_review($1::uuid,$2::uuid,$3::text,$4::jsonb) as result",
    [orgId, actorId, key, JSON.stringify(reviewScenario)]
  );
  return result.rows[0].result;
}

async function action(client, orgId, reviewId, actorId, actionName, note, expectedVersion, key) {
  const nextStatus = { start_review: "in_review", request_information: "needs_information", mark_reviewed: "reviewed" }[actionName];
  const result = await client.query(
    "select public.brokerflow_apply_review_action($1::uuid,$2::uuid,$3::uuid,$4::text,$5::text,$6::integer,$7::text,$8::text) as result",
    [orgId, reviewId, actorId, actionName, note, expectedVersion, key, nextStatus]
  );
  return result.rows[0].result;
}

async function createTask(client, orgId, actorId, key, task) {
  const result = await client.query(
    "select public.brokerflow_create_follow_up_task($1::uuid,$2::uuid,$3::text,$4::jsonb) as result",
    [orgId, actorId, key, JSON.stringify(task)]
  );
  return result.rows[0].result;
}

async function completeTask(client, orgId, taskId, actorId, key) {
  const result = await client.query(
    "select public.brokerflow_complete_follow_up_task($1::uuid,$2::uuid,$3::uuid,$4::text) as result",
    [orgId, taskId, actorId, key]
  );
  return result.rows[0].result;
}

async function migrationBaselineSnapshot(pool) {
  const tables = await pool.query(`
    select c.relname as table_name,
           json_agg(json_build_array(a.attname, format_type(a.atttypid, a.atttypmod), a.attnotnull) order by a.attnum) as columns
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
    where n.nspname = 'public' and c.relkind = 'r'
    group by c.relname order by c.relname`);
  const policies = await pool.query("select tablename, policyname, permissive, roles, cmd, qual, with_check from pg_policies where schemaname='public' order by tablename, policyname");
  return { tables: tables.rows, policies: policies.rows };
}

test("PostgreSQL 17 migration, transactions, concurrency, grants, and tenant scoping", { skip: !databaseUrl }, async t => {
  const pool = new Pool({ connectionString: databaseUrl, max: 12 });
  t.after(async () => pool.end());
  const fixture = await readFile(fixturePath, "utf8");
  await pool.query(fixture);
  const baseline = await migrationBaselineSnapshot(pool);
  for (const migrationPath of migrationPaths) await pool.query(await readFile(migrationPath, "utf8"));

  await t.test("migrations add only the three prefixed tables and leave baseline tables and policies intact", async () => {
    const after = await migrationBaselineSnapshot(pool);
    assert.deepEqual(after.tables.filter(row => baseline.tables.some(base => base.table_name === row.table_name)), baseline.tables);
    assert.deepEqual(after.policies, baseline.policies);
    assert.deepEqual(after.tables.map(row => row.table_name), [...baseline.tables.map(row => row.table_name), "brokerflow_follow_up_task_events", "brokerflow_follow_up_tasks", "brokerflow_rate_limits", "brokerflow_review_events", "brokerflow_review_requests"].sort());
    const rls = await pool.query("select relname, relrowsecurity from pg_class where oid in ('public.brokerflow_review_requests'::regclass,'public.brokerflow_review_events'::regclass,'public.brokerflow_rate_limits'::regclass,'public.brokerflow_follow_up_tasks'::regclass,'public.brokerflow_follow_up_task_events'::regclass) order by relname");
    assert.deepEqual(rls.rows, [
      { relname: "brokerflow_follow_up_task_events", relrowsecurity: true },
      { relname: "brokerflow_follow_up_tasks", relrowsecurity: true },
      { relname: "brokerflow_rate_limits", relrowsecurity: true },
      { relname: "brokerflow_review_events", relrowsecurity: true },
      { relname: "brokerflow_review_requests", relrowsecurity: true }
    ]);
    const indexes = await pool.query("select indexname from pg_indexes where schemaname='public' and indexname like 'brokerflow_review_%_idx' order by indexname");
    assert.deepEqual(indexes.rows.map(row => row.indexname), ["brokerflow_review_events_idx", "brokerflow_review_events_review_idx", "brokerflow_review_queue_idx"]);
    const taskIndexes = await pool.query("select indexname from pg_indexes where schemaname='public' and indexname like 'brokerflow_follow_up_%_idx' order by indexname");
    assert.deepEqual(taskIndexes.rows.map(row => row.indexname), ["brokerflow_follow_up_task_events_task_idx", "brokerflow_follow_up_tasks_owner_idx", "brokerflow_follow_up_tasks_queue_idx", "brokerflow_follow_up_tasks_review_idx"]);
    const fks = await pool.query(`
      select conrelid::regclass::text as table_name, confrelid::regclass::text as referenced_table
      from pg_constraint where contype='f' and conrelid in ('public.brokerflow_review_requests'::regclass,'public.brokerflow_review_events'::regclass)
      order by table_name, referenced_table`);
    assert.deepEqual(fks.rows, [
      { table_name: "brokerflow_review_events", referenced_table: "auth.users" },
      { table_name: "brokerflow_review_events", referenced_table: "brokerflow_review_requests" },
      { table_name: "brokerflow_review_events", referenced_table: "organizations" },
      { table_name: "brokerflow_review_requests", referenced_table: "auth.users" },
      { table_name: "brokerflow_review_requests", referenced_table: "organizations" }
    ]);
    const taskForeignKeys = await pool.query(`
      select distinct conrelid::regclass::text as table_name, confrelid::regclass::text as referenced_table
      from pg_constraint where contype='f' and conrelid in ('public.brokerflow_follow_up_tasks'::regclass,'public.brokerflow_follow_up_task_events'::regclass)
      order by table_name, referenced_table`);
    assert.deepEqual(taskForeignKeys.rows, [
      { table_name: "brokerflow_follow_up_task_events", referenced_table: "auth.users" },
      { table_name: "brokerflow_follow_up_task_events", referenced_table: "brokerflow_follow_up_tasks" },
      { table_name: "brokerflow_follow_up_task_events", referenced_table: "organizations" },
      { table_name: "brokerflow_follow_up_tasks", referenced_table: "auth.users" },
      { table_name: "brokerflow_follow_up_tasks", referenced_table: "brokerflow_review_requests" },
      { table_name: "brokerflow_follow_up_tasks", referenced_table: "organizations" }
    ]);
  });

  await t.test("PostgreSQL rate limiting is atomic under concurrent requests and isolates scopes", async () => {
    const identity = `synthetic-integration-${randomUUID()}`;
    const requests = await Promise.all(Array.from({ length: 24 }, () => pool.query(
      "select public.brokerflow_consume_rate_limit('trusted_ingest',$1,7,60) as result", [identity]
    )));
    const results = requests.map(result => result.rows[0].result);
    assert.equal(results.filter(result => result.allowed).length, 7);
    assert.equal(results.filter(result => !result.allowed).length, 17);
    const otherScope = await pool.query("select public.brokerflow_consume_rate_limit('review_create',$1,7,60) as result", [identity]);
    assert.equal(otherScope.rows[0].result.allowed, true);
    const stored = await pool.query("select request_count from public.brokerflow_rate_limits where scope='trusted_ingest' and identity_hash=encode(sha256(convert_to($1,'UTF8')),'hex')", [identity]);
    assert.deepEqual(stored.rows, [{ request_count: 24 }]);
  });

  await t.test("create is atomic, correctly attributed, idempotent under concurrency, and rejects key conflicts", async () => {
    const key = `create-${randomUUID()}`;
    const request = scenario();
    const [one, two] = await Promise.all([
      createReview(pool, orgA, brokerA, key, request),
      createReview(pool, orgA, brokerA, key, request)
    ]);
    assert.equal(one.id, two.id);
    assert.deepEqual([one.duplicate, two.duplicate].sort(), [false, true]);
    const saved = await pool.query("select id, organization_id, created_by, status, version from public.brokerflow_review_requests where id=$1", [one.id]);
    assert.deepEqual(saved.rows[0], { id: one.id, organization_id: orgA, created_by: brokerA, status: "queued_for_human_review", version: 1 });
    const events = await pool.query("select event_type, actor_user_id, actor_source, new_status, version from public.brokerflow_review_events where review_id=$1", [one.id]);
    assert.deepEqual(events.rows, [{ event_type: "review_created", actor_user_id: brokerA, actor_source: "user", new_status: "queued_for_human_review", version: 1 }]);
    await assert.rejects(createReview(pool, orgA, brokerA, key, scenario({ requested_amount: 250000 })), error => error.code === "23505");
    const count = await pool.query("select count(*)::int as count from public.brokerflow_review_events where review_id=$1", [one.id]);
    assert.equal(count.rows[0].count, 1);
  });

  await t.test("follow-up tasks enforce organization references, persist attribution, and replay create and completion idempotently", async () => {
    const review = await createReview(pool, orgA, brokerA, `task-review-${randomUUID()}`);
    const key = `task-create-${randomUUID()}`;
    const payload = { title: "Prepare broker follow-up", description: "Check the requested equipment quote.", task_type: "request_information", assigned_to: viewerA, review_id: review.id, due_date: "2026-10-25" };
    const [first, concurrentReplay] = await Promise.all([
      createTask(pool, orgA, brokerA, key, payload),
      createTask(pool, orgA, brokerA, key, payload)
    ]);
    assert.equal(first.id, concurrentReplay.id);
    assert.deepEqual([first.duplicate, concurrentReplay.duplicate].sort(), [false, true]);
    assert.equal(first.assigned_to, viewerA);
    assert.equal(first.review_id, review.id);
    assert.equal(first.status, "open");
    assert.equal(first.created_by, brokerA);
    await assert.rejects(createTask(pool, orgA, brokerA, key, { ...payload, title: "Changed request" }), error => error.code === "23505");
    const createdEvents = await pool.query("select event_type, actor_user_id, organization_id from public.brokerflow_follow_up_task_events where task_id=$1 order by created_at", [first.id]);
    assert.deepEqual(createdEvents.rows, [{ event_type: "task_created", actor_user_id: brokerA, organization_id: orgA }]);

    const completionKey = `task-complete-${randomUUID()}`;
    const [completed, completionReplay] = await Promise.all([
      completeTask(pool, orgA, first.id, brokerA, completionKey),
      completeTask(pool, orgA, first.id, brokerA, completionKey)
    ]);
    assert.equal(completed.status, "completed");
    assert.equal(completionReplay.status, "completed");
    assert.deepEqual([completed.duplicate, completionReplay.duplicate].sort(), [false, true]);
    assert.equal(completed.completed_by, brokerA);
    assert.ok(completed.completed_at);
    await assert.rejects(completeTask(pool, orgA, first.id, brokerA, `other-completion-${randomUUID()}`), error => error.code === "40001");
    const taskEvents = await pool.query("select event_type, actor_user_id, organization_id from public.brokerflow_follow_up_task_events where task_id=$1 order by created_at", [first.id]);
    assert.deepEqual(taskEvents.rows, [
      { event_type: "task_created", actor_user_id: brokerA, organization_id: orgA },
      { event_type: "task_completed", actor_user_id: brokerA, organization_id: orgA }
    ]);
    await assert.rejects(createTask(pool, orgA, brokerA, `task-cross-owner-${randomUUID()}`, { ...payload, assigned_to: brokerB }), error => error.code === "23503");
    const reviewB = await createReview(pool, orgB, brokerB, `task-review-b-${randomUUID()}`);
    await assert.rejects(createTask(pool, orgA, brokerA, `task-cross-review-${randomUUID()}`, { ...payload, review_id: reviewB.id }), error => error.code === "23503");
    await assert.rejects(completeTask(pool, orgA, first.id, brokerB, `task-cross-complete-${randomUUID()}`), error => error.code === "P0002");
  });

  await t.test("task and task-event writes roll back together when audit insertion fails", async () => {
    const client = await pool.connect();
    const key = `task-rollback-${randomUUID()}`;
    try {
      await client.query(`create function app_private.reject_test_task_event() returns trigger language plpgsql as $$ begin if current_setting('brokerflow_test.fail_task_event', true) = 'on' then raise exception 'synthetic task event failure'; end if; return new; end $$`);
      await client.query("create trigger reject_test_task_event before insert on public.brokerflow_follow_up_task_events for each row execute function app_private.reject_test_task_event()");
      await client.query("begin");
      await client.query("select set_config('brokerflow_test.fail_task_event','on',true)");
      await assert.rejects(createTask(client, orgA, brokerA, key, { title: "Synthetic rollback task", task_type: "other" }), /synthetic task event failure/);
      await client.query("rollback");
      const absent = await pool.query("select count(*)::int as count from public.brokerflow_follow_up_tasks where organization_id=$1 and created_by=$2 and create_idempotency_hash=encode(sha256(convert_to($3,'UTF8')),'hex')", [orgA, brokerA, key]);
      assert.equal(absent.rows[0].count, 0);
    } finally {
      await client.query("rollback").catch(() => {});
      await client.query("drop trigger if exists reject_test_task_event on public.brokerflow_follow_up_task_events");
      await client.query("drop function if exists app_private.reject_test_task_event()");
      client.release();
    }
  });

  await t.test("trusted integration intake is organization-bound and immediately visible in the human review queue", async () => {
    const key = `trusted-ingest-${randomUUID()}`;
    const request = scenario({ requester_name: "Synthetic trusted GPT intake", business_name: "Synthetic Intake LLC" });
    const first = await createReview(pool, orgA, null, key, request);
    const replay = await createReview(pool, orgA, null, key, request);
    assert.equal(replay.id, first.id);
    assert.equal(replay.duplicate, true);
    assert.equal(first.status, "queued_for_human_review");
    const queue = await pool.query("select review_request_id, organization_id, status, business_name from public.brokerflow_review_requests where review_request_id=$1 and organization_id=$2", [first.review_request_id, orgA]);
    assert.deepEqual(queue.rows, [{ review_request_id: first.review_request_id, organization_id: orgA, status: "queued_for_human_review", business_name: "Synthetic Intake LLC" }]);
    const event = await pool.query("select actor_user_id, actor_source, event_type, new_status from public.brokerflow_review_events where review_id=$1", [first.id]);
    assert.deepEqual(event.rows, [{ actor_user_id: null, actor_source: "trusted_integration", event_type: "review_created", new_status: "queued_for_human_review" }]);
    const otherOrganization = await pool.query("select count(*)::int as count from public.brokerflow_review_requests where review_request_id=$1 and organization_id=$2", [first.review_request_id, orgB]);
    assert.equal(otherOrganization.rows[0].count, 0);
  });

  await t.test("constraints reject invalid records and enforce foreign keys and note limits", async () => {
    const review = await createReview(pool, orgA, brokerA, `constraint-${randomUUID()}`);
    await assert.rejects(pool.query("update public.brokerflow_review_requests set status='approved' where id=$1", [review.id]), error => error.code === "23514");
    await assert.rejects(pool.query("update public.brokerflow_review_requests set requested_amount=0 where id=$1", [review.id]), error => error.code === "23514");
    await assert.rejects(pool.query("update public.brokerflow_review_requests set organization_id=$2 where id=$1", [review.id, "90000000-0000-4000-8000-000000000001"]), error => error.code === "23503");
    await assert.rejects(pool.query(`
      insert into public.brokerflow_review_events(organization_id,review_id,event_type,actor_source,new_status,version,idempotency_hash,request_fingerprint,note)
      values($1,$2,'review_started','user','in_review',2,'constraint-key','constraint-fingerprint',$3)`,
    [orgA, review.id, "n".repeat(501)]), error => error.code === "23514");
    await assert.rejects(pool.query(`
      insert into public.brokerflow_review_events(organization_id,review_id,event_type,actor_source,new_status,version,idempotency_hash,request_fingerprint)
      values($1,$2,'review_started','user','in_review',2,'orphan-key','orphan-fingerprint')`,
    [orgA, "90000000-0000-4000-8000-000000000001"]), error => error.code === "23503");
  });

  await t.test("lifecycle persists each transition and returns the stored result after a lost response", async () => {
    const review = await createReview(pool, orgA, brokerA, `lifecycle-${randomUUID()}`);
    const startKey = `start-${randomUUID()}`;
    const [first, concurrentReplay] = await Promise.all([
      action(pool, orgA, review.id, brokerA, "start_review", "", 1, startKey),
      action(pool, orgA, review.id, brokerA, "start_review", "", 1, startKey)
    ]);
    assert.deepEqual(concurrentReplay, first);
    // The first result is intentionally treated as lost; replay must return that stored result.
    const replay = await action(pool, orgA, review.id, brokerA, "start_review", "", 1, startKey);
    assert.deepEqual(replay, first);
    assert.equal(replay.status, "in_review");
    await assert.rejects(action(pool, orgA, review.id, brokerA, "start_review", "different payload", 1, startKey), error => error.code === "23505");
    const requested = await action(pool, orgA, review.id, brokerA, "request_information", "Please provide current equipment quote", 2, `info-${randomUUID()}`);
    assert.equal(requested.status, "needs_information");
    const resumed = await action(pool, orgA, review.id, brokerA, "start_review", "", 3, `resume-${randomUUID()}`);
    assert.equal(resumed.status, "in_review");
    const complete = await action(pool, orgA, review.id, brokerA, "mark_reviewed", "", 4, `complete-${randomUUID()}`);
    assert.equal(complete.status, "reviewed");
    assert.equal(complete.version, 5);
    const events = await pool.query("select event_type, previous_status, new_status, note, version, actor_user_id, organization_id from public.brokerflow_review_events where review_id=$1 order by version", [review.id]);
    assert.deepEqual(events.rows.map(row => [row.event_type, row.previous_status, row.new_status, row.version]), [
      ["review_created", null, "queued_for_human_review", 1],
      ["review_started", "queued_for_human_review", "in_review", 2],
      ["information_requested", "in_review", "needs_information", 3],
      ["review_started", "needs_information", "in_review", 4],
      ["review_marked_reviewed", "in_review", "reviewed", 5]
    ]);
    assert.equal(events.rows[2].note, "Please provide current equipment quote");
    assert.ok(events.rows.every(row => row.actor_user_id === brokerA && row.organization_id === orgA));
  });

  await t.test("invalid transitions and stale versions fail, while concurrent same-version writers serialize", async () => {
    const invalid = await createReview(pool, orgA, brokerA, `invalid-${randomUUID()}`);
    await assert.rejects(action(pool, orgA, invalid.id, brokerA, "mark_reviewed", "", 1, `bad-${randomUUID()}`), error => error.code === "22023");
    const writers = await Promise.allSettled([
      action(pool, orgA, invalid.id, brokerA, "start_review", "", 1, `concurrent-${randomUUID()}`),
      action(pool, orgA, invalid.id, brokerA, "start_review", "", 1, `concurrent-${randomUUID()}`)
    ]);
    assert.equal(writers.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(writers.filter(result => result.status === "rejected" && result.reason.code === "40001").length, 1);
    await assert.rejects(action(pool, orgA, invalid.id, brokerA, "request_information", "Need a document", 1, `stale-${randomUUID()}`), error => error.code === "40001");
  });

  await t.test("database rollback leaves neither a partially created review nor an orphaned transition event", async () => {
    const client = await pool.connect();
    const nameOnFailedCreate = `Synthetic rollback ${randomUUID()}`;
    try {
      await client.query(`create function app_private.reject_test_review_event() returns trigger language plpgsql as $$ begin if current_setting('brokerflow_test.fail_event', true) = 'on' then raise exception 'synthetic event insert failure'; end if; return new; end $$`);
      await client.query("create trigger reject_test_review_event before insert on public.brokerflow_review_events for each row execute function app_private.reject_test_review_event()");
      await client.query("begin");
      await client.query("select set_config('brokerflow_test.fail_event','on',true)");
      await assert.rejects(createReview(client, orgA, brokerA, `rollback-create-${randomUUID()}`, scenario({ business_name: nameOnFailedCreate })), /synthetic event insert failure/);
      await client.query("rollback");
      const absent = await pool.query("select count(*)::int as count from public.brokerflow_review_requests where business_name=$1", [nameOnFailedCreate]);
      assert.equal(absent.rows[0].count, 0);

      await client.query("begin");
      await client.query("select set_config('brokerflow_test.fail_event','on',true)");
      const review = await pool.query("select id from public.brokerflow_review_requests where organization_id=$1 and status='queued_for_human_review' order by created_at desc limit 1", [orgA]);
      const before = review.rows[0];
      await assert.rejects(action(client, orgA, before.id, brokerA, "start_review", "", 1, `rollback-action-${randomUUID()}`), /synthetic event insert failure/);
      await client.query("rollback");
      const after = await pool.query("select status, version from public.brokerflow_review_requests where id=$1", [before.id]);
      assert.deepEqual(after.rows[0], { status: "queued_for_human_review", version: 1 });
      const history = await pool.query("select count(*)::int as count from public.brokerflow_review_events where review_id=$1", [before.id]);
      assert.equal(history.rows[0].count, 1);
    } finally {
      await client.query("rollback").catch(() => {});
      await client.query("drop trigger if exists reject_test_review_event on public.brokerflow_review_events");
      await client.query("drop function if exists app_private.reject_test_review_event()");
      client.release();
    }
  });

  await t.test("anonymous and authenticated roles cannot read or mutate review/rate-limit tables or execute privileged RPCs", async () => {
    for (const role of ["anon", "authenticated"]) {
      const privileges = await pool.query(`
        select has_table_privilege($1,'public.brokerflow_review_requests','SELECT') as can_read_reviews,
               has_table_privilege($1,'public.brokerflow_review_requests','INSERT') as can_insert_reviews,
               has_table_privilege($1,'public.brokerflow_review_requests','DELETE') as can_delete_reviews,
               has_table_privilege($1,'public.brokerflow_review_events','INSERT') as can_insert_events,
               has_table_privilege($1,'public.brokerflow_review_events','UPDATE') as can_update_events,
               has_table_privilege($1,'public.brokerflow_review_events','DELETE') as can_delete_events,
               has_table_privilege($1,'public.brokerflow_rate_limits','SELECT') as can_read_rate_limits,
               has_table_privilege($1,'public.brokerflow_rate_limits','INSERT') as can_insert_rate_limits,
               has_function_privilege($1,'public.brokerflow_create_review(uuid,uuid,text,jsonb)','EXECUTE') as can_create,
               has_function_privilege($1,'public.brokerflow_apply_review_action(uuid,uuid,uuid,text,text,integer,text,text)','EXECUTE') as can_apply,
               has_function_privilege($1,'public.brokerflow_consume_rate_limit(text,text,integer,integer)','EXECUTE') as can_rate_limit`, [role]);
      assert.deepEqual(privileges.rows[0], { can_read_reviews: false, can_insert_reviews: false, can_delete_reviews: false, can_insert_events: false, can_update_events: false, can_delete_events: false, can_read_rate_limits: false, can_insert_rate_limits: false, can_create: false, can_apply: false, can_rate_limit: false });
    }
    const service = await pool.query(`
      select has_table_privilege('service_role','public.brokerflow_review_requests','SELECT') as can_read_reviews,
             has_function_privilege('service_role','public.brokerflow_create_review(uuid,uuid,text,jsonb)','EXECUTE') as can_create,
             has_function_privilege('service_role','public.brokerflow_apply_review_action(uuid,uuid,uuid,text,text,integer,text,text)','EXECUTE') as can_apply,
             has_function_privilege('service_role','public.brokerflow_consume_rate_limit(text,text,integer,integer)','EXECUTE') as can_rate_limit,
             has_table_privilege('service_role','public.brokerflow_rate_limits','SELECT') as can_read_rate_limits,
             has_table_privilege('service_role','public.brokerflow_rate_limits','INSERT') as can_insert_rate_limits,
             has_table_privilege('service_role','public.brokerflow_rate_limits','UPDATE') as can_update_rate_limits,
             has_table_privilege('service_role','public.brokerflow_rate_limits','DELETE') as can_delete_rate_limits,
             (select prosecdef from pg_proc where oid='public.brokerflow_create_review(uuid,uuid,text,jsonb)'::regprocedure) as create_is_definer`);
    assert.deepEqual(service.rows[0], { can_read_reviews: true, can_create: true, can_apply: true, can_rate_limit: true, can_read_rate_limits: true, can_insert_rate_limits: false, can_update_rate_limits: false, can_delete_rate_limits: false, create_is_definer: true });
    const client = await pool.connect();
    try {
      for (const role of ["anon", "authenticated"]) {
        await client.query("reset role");
        await client.query(`set role ${role}`);
        await assert.rejects(client.query("select * from public.brokerflow_review_requests limit 1"), error => error.code === "42501");
        await assert.rejects(client.query("select * from public.brokerflow_rate_limits limit 1"), error => error.code === "42501");
        await assert.rejects(client.query("select public.brokerflow_create_review($1,$2,$3,$4::jsonb)", [orgA, brokerA, randomUUID(), JSON.stringify(scenario())]), error => error.code === "42501");
        await assert.rejects(client.query("select public.brokerflow_consume_rate_limit('trusted_ingest','test',60,60)"), error => error.code === "42501");
      }
      await client.query("reset role");
    } finally {
      await client.query("reset role");
      client.release();
    }
  });

  await t.test("task tables and transactional task RPCs keep least-privilege grants", async () => {
    for (const role of ["anon", "authenticated"]) {
      const privileges = await pool.query(`
        select has_table_privilege($1,'public.brokerflow_follow_up_tasks','SELECT') as can_read_tasks,
               has_table_privilege($1,'public.brokerflow_follow_up_tasks','INSERT') as can_insert_tasks,
               has_table_privilege($1,'public.brokerflow_follow_up_tasks','UPDATE') as can_update_tasks,
               has_table_privilege($1,'public.brokerflow_follow_up_task_events','SELECT') as can_read_events,
               has_table_privilege($1,'public.brokerflow_follow_up_task_events','INSERT') as can_insert_events,
               has_function_privilege($1,'public.brokerflow_create_follow_up_task(uuid,uuid,text,jsonb)','EXECUTE') as can_create,
               has_function_privilege($1,'public.brokerflow_complete_follow_up_task(uuid,uuid,uuid,text)','EXECUTE') as can_complete`, [role]);
      assert.deepEqual(privileges.rows[0], { can_read_tasks: false, can_insert_tasks: false, can_update_tasks: false, can_read_events: false, can_insert_events: false, can_create: false, can_complete: false });
    }
    const service = await pool.query(`
      select has_table_privilege('service_role','public.brokerflow_follow_up_tasks','SELECT') as can_read_tasks,
             has_table_privilege('service_role','public.brokerflow_follow_up_tasks','INSERT') as can_insert_tasks,
             has_table_privilege('service_role','public.brokerflow_follow_up_tasks','UPDATE') as can_update_tasks,
             has_table_privilege('service_role','public.brokerflow_follow_up_task_events','SELECT') as can_read_events,
             has_table_privilege('service_role','public.brokerflow_follow_up_task_events','INSERT') as can_insert_events,
             has_function_privilege('service_role','public.brokerflow_create_follow_up_task(uuid,uuid,text,jsonb)','EXECUTE') as can_create,
             has_function_privilege('service_role','public.brokerflow_complete_follow_up_task(uuid,uuid,uuid,text)','EXECUTE') as can_complete,
             (select prosecdef from pg_proc where oid='public.brokerflow_create_follow_up_task(uuid,uuid,text,jsonb)'::regprocedure) as create_is_definer,
             (select prosecdef from pg_proc where oid='public.brokerflow_complete_follow_up_task(uuid,uuid,uuid,text)'::regprocedure) as complete_is_definer`);
    assert.deepEqual(service.rows[0], { can_read_tasks: true, can_insert_tasks: false, can_update_tasks: false, can_read_events: true, can_insert_events: false, can_create: true, can_complete: true, create_is_definer: true, complete_is_definer: true });
    const client = await pool.connect();
    try {
      for (const role of ["anon", "authenticated"]) {
        await client.query("reset role");
        await client.query(`set role ${role}`);
        await assert.rejects(client.query("select * from public.brokerflow_follow_up_tasks limit 1"), error => error.code === "42501");
        await assert.rejects(client.query("select * from public.brokerflow_follow_up_task_events limit 1"), error => error.code === "42501");
        await assert.rejects(client.query("select public.brokerflow_create_follow_up_task($1,$2,$3,$4::jsonb)", [orgA, brokerA, randomUUID(), JSON.stringify({ title: "Denied", task_type: "other" })]), error => error.code === "42501");
        await assert.rejects(client.query("select public.brokerflow_complete_follow_up_task($1,$2,$3,$4)", [orgA, randomUUID(), brokerA, randomUUID()]), error => error.code === "42501");
      }
      await client.query("reset role");
    } finally {
      await client.query("reset role");
      client.release();
    }
  });

  await t.test("synthetic platform-core membership policies and RPC organization predicates stay scoped", async () => {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("set local role authenticated");
      await client.query("select set_config('request.jwt.claim.sub',$1,true)", [brokerA]);
      const visibleOrganizations = await client.query("select id from public.organizations order by id");
      assert.deepEqual(visibleOrganizations.rows.map(row => row.id), [orgA]);
      for (const userId of [brokerA, viewerA, partnerA]) {
        await client.query("select set_config('request.jwt.claim.sub',$1,true)", [userId]);
        const permission = await client.query("select app_private.has_permission($1,'brokerflow.reviews.read') as allowed", [orgA]);
        assert.equal(permission.rows[0].allowed, false);
      }
      await client.query("rollback");
    } finally {
      await client.query("rollback").catch(() => {});
      client.release();
    }
    const reviewB = await createReview(pool, orgB, brokerB, `tenant-${randomUUID()}`);
    await assert.rejects(action(pool, orgA, reviewB.id, brokerA, "start_review", "", 1, `cross-org-${randomUUID()}`), error => error.code === "P0002");
    const organizationAReviews = await pool.query("select count(*)::int as count from public.brokerflow_review_requests where organization_id=$1", [orgA]);
    const organizationBReviews = await pool.query("select count(*)::int as count from public.brokerflow_review_requests where organization_id=$1", [orgB]);
    assert.ok(organizationAReviews.rows[0].count > 0);
    assert.equal(organizationBReviews.rows[0].count, 1);
  });
});
