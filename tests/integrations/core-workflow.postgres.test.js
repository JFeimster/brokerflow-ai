import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import pg from "pg";
import {
  fixture,
  context,
  clientFor,
  reviewScenario,
} from "../fixtures/mcp-harness.js";
import { postgresAdapter } from "../fixtures/postgres-adapter.js";
import { normalizeIntake } from "../../lib/borrower-intake/normalize.js";
import { validateIntake } from "../../lib/borrower-intake/validation.js";

const databaseUrl = process.env.DATABASE_URL;
if (process.env.REQUIRE_POSTGRES_TESTS === "1" && !databaseUrl)
  throw new Error("DATABASE_URL is required.");
test(
  "real PostgreSQL seven-tool workflow, durable storage, permissions, retries and attribution",
  { skip: !databaseUrl },
  async (t) => {
    const admin = new pg.Pool({ connectionString: databaseUrl });
    const name = `brokerflow_core_${randomUUID().replaceAll("-", "")}`;
    await admin.query(`create database ${name}`);
    const url = new URL(databaseUrl);
    url.pathname = `/${name}`;
    const pool = new pg.Pool({ connectionString: url.href, max: 12 });
    t.after(async () => {
      await pool.end();
      await admin.query(`drop database ${name}`);
      await admin.end();
    });
    await pool.query(
      await readFile(
        new URL(
          "../../supabase/tests/platform_core_baseline.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await pool.query(
      await readFile(
        new URL("../fixtures/platform-core-leads.sql", import.meta.url),
        "utf8",
      ),
    );
    const migrationRoot = new URL(
      "../../supabase/migrations/",
      import.meta.url,
    );
    const migrationFiles = (await readdir(migrationRoot))
      .filter((name) => name.endsWith(".sql"))
      .sort();
    for (const file of migrationFiles.filter(
      (name) => !name.includes("core_workflows"),
    ))
      await pool.query(await readFile(new URL(file, migrationRoot), "utf8"));
    const baseline = (
      await pool.query(
        "select c.relname,a.attname,format_type(a.atttypid,a.atttypmod) as type,a.attnotnull from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped where n.nspname='public' and c.relkind='r' order by c.relname,a.attnum",
      )
    ).rows;
    const policies = (
      await pool.query(
        "select * from pg_policies where schemaname='public' order by tablename,policyname",
      )
    ).rows;
    for (const file of migrationFiles.filter((name) =>
      name.includes("core_workflows"),
    ))
      await pool.query(await readFile(new URL(file, migrationRoot), "utf8"));
    const db = postgresAdapter(pool);
    const ctx = context({ db });
    const client = await clientFor(t, ctx);
    const base = { organization_id: fixture.organization_id, confirmed: true };
    async function call(name, args) {
      const response = await client.callTool({
        name,
        arguments: { ...base, ...args },
      });
      assert.equal(response.isError, undefined, JSON.stringify(response));
      return response.structuredContent;
    }
    let intake, review, request, referral;
    await t.test(
      "migration preserves shared columns and policies and adds only deal/document-request storage",
      async () => {
        const after = (
          await pool.query(
            "select c.relname,a.attname,format_type(a.atttypid,a.atttypmod) as type,a.attnotnull from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped where n.nspname='public' and c.relkind='r' order by c.relname,a.attnum",
          )
        ).rows;
        assert.deepEqual(
          after.filter(
            (row) =>
              !["brokerflow_deals", "brokerflow_document_requests"].includes(
                row.relname,
              ),
          ),
          baseline,
        );
        assert.deepEqual(
          (
            await pool.query(
              "select * from pg_policies where schemaname='public' order by tablename,policyname",
            )
          ).rows,
          policies,
        );
      },
    );
    const intakeArgs = {
      intake: fixture.intake,
      idempotency_key: "synthetic-intake-capture-0001",
    };
    await t.test(
      "capture creates canonical lead and separate durable deal; repeated key and new-key duplicate are safe",
      async () => {
        intake = await call("capture_borrower_intake", intakeArgs);
        assert.ok(intake.intake_id);
        assert.ok(intake.deal_id);
        assert.equal(intake.completeness.completeness_score, 100);
        const again = await call("capture_borrower_intake", intakeArgs);
        assert.equal(again.intake_id, intake.intake_id);
        assert.equal(again.duplicate, true);
        const otherKey = await call("capture_borrower_intake", {
          ...intakeArgs,
          idempotency_key: "synthetic-intake-capture-0002",
        });
        assert.equal(otherKey.duplicate, true);
        assert.equal(
          (await pool.query("select count(*)::int as n from public.leads"))
            .rows[0].n,
          1,
        );
        const stored = (
          await pool.query("select * from public.leads where id=$1", [
            intake.intake_id,
          ])
        ).rows[0];
        assert.equal(stored.source, "brokerflow_mcp");
        assert.equal(
          stored.metadata.brokerflow_intake.consent.status,
          "granted",
        );
        assert.equal(stored.metadata.brokerflow_intake.scenario.state, "NY");
        assert.equal(stored.qualification.constructor, Object);
      },
    );
    await t.test(
      "routing, review alias and checklist share canonical records without a borrower decision",
      async () => {
        const routing = await call("route_lender_fit", {
          scenario: fixture.intake.scenario,
        });
        assert.equal(routing.preliminary, true);
        review = await call("request_lender_match_review", {
          scenario: reviewScenario,
          intake_id: intake.intake_id,
          idempotency_key: "synthetic-review-link-0001",
        });
        assert.equal(review.status, "queued_for_human_review");
        const again = await call("create_review_request", {
          scenario: reviewScenario,
          idempotency_key: "synthetic-review-link-0001",
        });
        assert.equal(again.review_id, review.review_id);
        assert.equal(again.duplicate, true);
        const list = await call("generate_document_checklist", {
          scenario: fixture.intake.scenario,
        });
        assert.equal(list.route, "equipment_financing");
        assert.equal(
          (
            await pool.query(
              "select count(*)::int as n from public.brokerflow_review_requests",
            )
          ).rows[0].n,
          1,
        );
      },
    );
    await t.test(
      "missing-document request uses persisted scenario, tracks rejected items and never claims sent",
      async () => {
        const args = {
          intake_id: intake.intake_id,
          review_id: review.review_id,
          submitted_documents: [
            { document_type: "equipment_invoice_or_quote", status: "rejected" },
          ],
          due_date: "2026-10-25",
          idempotency_key: "synthetic-documents-request-001",
        };
        request = await call("trigger_missing_document_request", args);
        assert.equal(request.status, "task_created");
        assert.equal(request.delivery_status, "not_sent");
        assert.equal(request.draft_status, "draft_prepared");
        assert.ok(
          request.missing_documents.includes("equipment_invoice_or_quote"),
        );
        assert.match(request.draft, /verified secure upload/);
        const again = await call("trigger_missing_document_request", args);
        assert.equal(again.task_id, request.task_id);
        assert.equal(again.duplicate, true);
        const stored = (
          await pool.query(
            "select * from public.brokerflow_document_requests where id=$1",
            [request.request_id],
          )
        ).rows[0];
        assert.equal(stored.checklist.template_version, "brokerflow_v1");
        assert.equal(stored.review_id, review.review_id);
        assert.equal(
          (
            await pool.query(
              "select count(*)::int as n from public.brokerflow_follow_up_task_events",
            )
          ).rows[0].n,
          1,
        );
      },
    );
    await t.test(
      "a fresh MCP connection retrieves actual deal, review and task state with distinct statuses",
      async () => {
        const refreshed = await clientFor(
          t,
          context({ db: postgresAdapter(pool) }),
        );
        const response = await refreshed.callTool({
          name: "lookup_deal_status",
          arguments: {
            organization_id: fixture.organization_id,
            deal_id: intake.deal_id,
          },
        });
        assert.equal(response.isError, undefined, JSON.stringify(response));
        const deal = response.structuredContent.items[0];
        assert.equal(deal.pipeline_stage, "documents_pending");
        assert.equal(deal.review_status, "queued_for_human_review");
        assert.equal(deal.assigned_owner, fixture.actor_id);
        assert.equal(deal.tasks[0].id, request.task_id);
        assert.ok(deal.last_activity);
      },
    );
    await t.test(
      "referral persists canonical attribution, supplied contact permission and creation/update audit events",
      async () => {
        const args = {
          partner_id: fixture.partner_id,
          intake_id: intake.intake_id,
          source_reference: "synthetic-equipment-source-01",
          permission_to_contact: true,
          warm_intro_available: true,
          idempotency_key: "synthetic-partner-referral-001",
        };
        referral = await call("capture_partner_referral", args);
        assert.equal(referral.attribution_status, "attributed");
        assert.equal(referral.deal_id, intake.deal_id);
        assert.equal(referral.review_id, review.review_id);
        const again = await call("capture_partner_referral", args);
        assert.equal(again.duplicate, true);
        assert.equal(again.referral_id, referral.referral_id);
        const other = await call("capture_partner_referral", {
          ...args,
          idempotency_key: "synthetic-partner-referral-002",
        });
        assert.equal(other.duplicate, true);
        const record = (
          await pool.query(
            "select metadata from public.referrals where id=$1",
            [referral.referral_id],
          )
        ).rows[0];
        assert.equal(record.metadata.brokerflow.permission_to_contact, true);
        assert.equal(
          record.metadata.brokerflow.scenario.requested_amount,
          85000,
        );
        const audit = (
          await pool.query(
            "select event_type,actor_user_id from public.lead_events where event_type in ('brokerflow_referral_captured','brokerflow_partner_attribution_updated')",
          )
        ).rows;
        assert.equal(audit.length, 2);
        assert.ok(
          audit.every((event) => event.actor_user_id === fixture.actor_id),
        );
        const lead = (
          await pool.query("select attribution from public.leads where id=$1", [
            intake.intake_id,
          ])
        ).rows[0];
        assert.deepEqual(lead.attribution.brokerflow_referral_ids, [
          referral.referral_id,
        ]);
      },
    );
    await t.test(
      "raw RPCs reject viewers and foreign tenants even with a forged application context",
      async () => {
        const invoke = (fn, org, actor, input, key) =>
          pool.query(`select public.${fn}($1,$2,$3${key ? ", $4" : ""})`, [
            org,
            actor,
            JSON.stringify(input),
            ...(key ? [key] : []),
          ]);
        const normalized = normalizeIntake(validateIntake(fixture.intake));
        await assert.rejects(
          () =>
            invoke(
              "brokerflow_capture_borrower_intake",
              fixture.organization_id,
              fixture.viewer_id,
              normalized,
              "synthetic-forged-viewer-001",
            ),
          { code: "42501" },
        );
        await assert.rejects(
          () =>
            invoke(
              "brokerflow_capture_borrower_intake",
              fixture.other_organization_id,
              fixture.actor_id,
              normalized,
              "synthetic-cross-tenant-001",
            ),
          { code: "42501" },
        );
        await assert.rejects(
          () =>
            invoke(
              "brokerflow_lookup_deal_status",
              fixture.other_organization_id,
              fixture.actor_id,
              {},
            ),
          { code: "42501" },
        );
        const viewer = await invoke(
          "brokerflow_lookup_deal_status",
          fixture.organization_id,
          fixture.viewer_id,
          { deal_id: intake.deal_id },
        );
        assert.equal(
          viewer.rows[0].brokerflow_lookup_deal_status.items[0].deal_id,
          intake.deal_id,
        );
        const foreignPartner = await client.callTool({
          name: "capture_partner_referral",
          arguments: {
            ...base,
            partner_id: "50000000-0000-4000-8000-000000000002",
            intake_id: intake.intake_id,
            source_reference: "cross-tenant",
            permission_to_contact: false,
            warm_intro_available: false,
            idempotency_key: "synthetic-foreign-partner-001",
          },
        });
        assert.equal(foreignPartner.structuredContent.status, 404);
        await pool.query(
          "update public.memberships set status='inactive' where organization_id=$1 and user_id=$2",
          [fixture.organization_id, fixture.actor_id],
        );
        await assert.rejects(
          () =>
            invoke(
              "brokerflow_capture_borrower_intake",
              fixture.organization_id,
              fixture.actor_id,
              normalized,
              intakeArgs.idempotency_key,
            ),
          { code: "42501" },
        );
        await pool.query(
          "update public.memberships set status='active' where organization_id=$1 and user_id=$2",
          [fixture.organization_id, fixture.actor_id],
        );
      },
    );
    await t.test(
      "changed retries conflict, cross-linked references fail and empty results are explicit",
      async () => {
        const conflict = await client.callTool({
          name: "capture_borrower_intake",
          arguments: {
            ...base,
            ...intakeArgs,
            intake: {
              ...fixture.intake,
              contact_name: "Changed synthetic contact",
            },
          },
        });
        assert.equal(conflict.structuredContent.status, 409);
        const foreign = await client.callTool({
          name: "lookup_deal_status",
          arguments: {
            organization_id: fixture.organization_id,
            deal_id: randomUUID(),
          },
        });
        assert.equal(foreign.structuredContent.status, 404);
        const empty = await db.rpc("brokerflow_lookup_deal_status", {
          p_organization_id: fixture.other_organization_id,
          p_actor_user_id: "10000000-0000-4000-8000-000000000004",
          p_input: {},
        });
        assert.deepEqual(empty.data.items, []);
        const noReference = await client.callTool({
          name: "trigger_missing_document_request",
          arguments: { ...base, idempotency_key: "synthetic-no-reference-001" },
        });
        assert.equal(noReference.structuredContent.status, 422);
        const wrongScenario = await client.callTool({
          name: "request_lender_match_review",
          arguments: {
            ...base,
            intake_id: intake.intake_id,
            scenario: { ...reviewScenario, requested_amount: 99000 },
            idempotency_key: "synthetic-wrong-scenario-001",
          },
        });
        assert.equal(wrongScenario.structuredContent.status, 422);
        const falseRef = await client.callTool({
          name: "trigger_missing_document_request",
          arguments: {
            ...base,
            intake_id: intake.intake_id,
            review_id: randomUUID(),
            idempotency_key: "synthetic-wrong-review-001",
          },
        });
        assert.equal(falseRef.structuredContent.status, 404);
        const before = (
          await pool.query(
            "select count(*)::int as n from public.brokerflow_follow_up_tasks",
          )
        ).rows[0].n;
        const checklist = await call("generate_document_checklist", {
          scenario: fixture.intake.scenario,
        });
        const complete = await call("trigger_missing_document_request", {
          intake_id: intake.intake_id,
          submitted_documents: checklist.items
            .filter((item) => item.required)
            .map((item) => ({
              document_type: item.document_type,
              status: "verified",
            })),
          idempotency_key: "synthetic-no-missing-docs-001",
        });
        assert.equal(complete.status, "no_missing_documents");
        assert.equal(complete.task_id, null);
        assert.equal(
          (
            await pool.query(
              "select count(*)::int as n from public.brokerflow_follow_up_tasks",
            )
          ).rows[0].n,
          before,
        );
      },
    );
    await t.test(
      "lead/deal creation rolls back if its attributable audit write fails",
      async () => {
        await pool.query(
          "create function public.synthetic_fail_intake_event() returns trigger language plpgsql as $$ begin if new.event_type='brokerflow_intake_captured' then raise exception 'synthetic audit failure'; end if;return new;end $$;create trigger synthetic_audit_failure before insert on public.lead_events for each row execute function public.synthetic_fail_intake_event()",
        );
        const response = await client.callTool({
          name: "capture_borrower_intake",
          arguments: {
            ...base,
            intake: {
              ...fixture.intake,
              external_reference: "synthetic-rollback-intake",
            },
            idempotency_key: "synthetic-rollback-intake-001",
          },
        });
        assert.equal(response.structuredContent.status, 503);
        assert.equal(
          (
            await pool.query(
              "select count(*)::int as n from public.leads where external_id='brokerflow:synthetic-rollback-intake'",
            )
          ).rows[0].n,
          0,
        );
        await pool.query(
          "drop trigger synthetic_audit_failure on public.lead_events;drop function public.synthetic_fail_intake_event()",
        );
      },
    );
    await t.test(
      "conflicting permission is rejected and denial is retained without external contact",
      async () => {
        const denied = await call("capture_borrower_intake", {
          intake: {
            ...fixture.intake,
            external_reference: "synthetic-denied-consent",
            consent: {
              status: "denied",
              channels: [],
              source: "synthetic denial",
            },
          },
          idempotency_key: "synthetic-denied-consent-001",
        });
        const args = {
          ...base,
          intake_id: denied.intake_id,
          partner_id: fixture.partner_id,
          source_reference: "synthetic-denied-permission",
          permission_to_contact: true,
          warm_intro_available: false,
          idempotency_key: "synthetic-denied-referral-001",
        };
        const conflict = await client.callTool({
          name: "capture_partner_referral",
          arguments: args,
        });
        assert.equal(conflict.structuredContent.status, 422);
        const saved = await call("capture_partner_referral", {
          ...args,
          permission_to_contact: false,
        });
        assert.equal(saved.next_action, "collect_borrower_contact_permission");
      },
    );
    await t.test(
      "parallel intake retries create one new canonical lead and one deal",
      async () => {
        const args = {
          intake: {
            ...fixture.intake,
            external_reference: "synthetic-parallel-intake",
          },
          idempotency_key: "synthetic-parallel-capture-001",
        };
        const results = await Promise.all(
          Array.from({ length: 5 }, () =>
            call("capture_borrower_intake", args),
          ),
        );
        assert.equal(new Set(results.map((item) => item.intake_id)).size, 1);
        assert.equal(results.filter((item) => !item.duplicate).length, 1);
        const page1 = await call("lookup_deal_status", { limit: 1 });
        assert.equal(page1.items.length, 1);
        assert.equal(page1.next_cursor, 1);
        const page2 = await call("lookup_deal_status", {
          limit: 1,
          cursor: page1.next_cursor,
        });
        assert.equal(page2.items.length, 1);
        assert.notEqual(page2.items[0].deal_id, page1.items[0].deal_id);
        assert.equal(page2.next_cursor, 2);
        const page3 = await call("lookup_deal_status", {
          limit: 1,
          cursor: page2.next_cursor,
        });
        assert.equal(page3.items.length, 1);
        assert.equal(page3.next_cursor, null);
      },
    );
    await t.test(
      "completed document tasks remain distinct from document receipt and deal stage",
      async () => {
        await call("complete_follow_up_task", {
          task_id: request.task_id,
          idempotency_key: "synthetic-document-completion-001",
        });
        const page = await call("lookup_deal_status", {
          deal_id: intake.deal_id,
        });
        assert.equal(page.items[0].tasks[0].status, "completed");
        assert.equal(page.items[0].pipeline_stage, "documents_pending");
        assert.equal(page.items[0].next_action, "broker_review_document_state");
        assert.equal(
          (
            await pool.query(
              "select delivery_status from public.brokerflow_document_requests where id=$1",
              [request.request_id],
            )
          ).rows[0].delivery_status,
          "not_sent",
        );
      },
    );
    await t.test(
      "new tables and RPCs deny direct anon/authenticated access",
      async () => {
        for (const role of ["anon", "authenticated"]) {
          const connection = await pool.connect();
          try {
            await connection.query(`set role ${role}`);
            for (const table of [
              "brokerflow_deals",
              "brokerflow_document_requests",
            ])
              await assert.rejects(
                () => connection.query(`select * from public.${table}`),
                { code: "42501" },
              );
            await assert.rejects(
              () =>
                connection.query(
                  "select public.brokerflow_lookup_deal_status($1,$2,$3)",
                  [fixture.organization_id, fixture.actor_id, "{}"],
                ),
              { code: "42501" },
            );
          } finally {
            await connection.query("reset role");
            connection.release();
          }
        }
        const flags = (
          await pool.query(
            "select relrowsecurity from pg_class where oid in ('public.brokerflow_deals'::regclass,'public.brokerflow_document_requests'::regclass)",
          )
        ).rows;
        assert.ok(flags.every((item) => item.relrowsecurity));
      },
    );
    await client.closeWithServer();
  },
);
