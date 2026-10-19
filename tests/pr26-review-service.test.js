import test from "node:test";
import assert from "node:assert/strict";
import { assertTransition, STATUS, validateReview } from "../lib/reviews/validation.js";
import { jsonBody } from "../lib/reviews/http.js";
import session from "../api/console/session.js";
import reviews from "../api/console/reviews.js";
import activity from "../api/console/activity.js";
import ingest, { createIngestHandler } from "../api/ingest/lender-match-review.js";
import { consumeRateLimit } from "../lib/reviews/rate-limit.js";
import config from "../api/console/config.js";

const valid = { source:"custom_gpt",action_type:"lender_match_review",requester_name:"Broker intake",borrower_type:"business",loan_purpose:"equipment_financing",requested_amount:185000,state:"NY",human_review_required:true };
function response(){return {headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;return this;},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}};}

test("review validation keeps required fields, enums, amount bounds and human review",()=>{
  assert.equal(validateReview(valid).human_review_required,true);
  assert.throws(()=>validateReview({...valid,human_review_required:false}),{status:422});
  assert.throws(()=>validateReview({...valid,loan_purpose:"approve"}),{status:422});
  assert.throws(()=>validateReview({...valid,requested_amount:0}),{status:422});
  assert.throws(()=>validateReview({...valid,requester_name:undefined}),{status:422});
  assert.throws(()=>validateReview({...valid,notes:"SSN 123-45-6789"}),{status:422});
  assert.throws(()=>validateReview({...valid,notes:"Email borrower@example.com"}),{status:422});
  assert.throws(()=>validateReview({...valid,business_name:{name:"Example"}}),{status:422});
  assert.throws(()=>validateReview({...valid,business_name:"x".repeat(161)}),{status:422});
  assert.equal(validateReview({...valid,business_name:"  Example Business  "}).business_name,"Example Business");
});
test("review normalization stores only the approved scenario allowlist",()=>{
  const normalized=validateReview({...valid,phone:"555-0100",access_token:"secret",notes:"Check completeness"});
  assert.equal(normalized.phone,undefined);assert.equal(normalized.access_token,undefined);assert.equal(normalized.notes,"Check completeness");assert.equal(normalized.human_review_required,true);
});
test("review state machine permits only human operational transitions",()=>{
  assert.equal(assertTransition(STATUS.QUEUED,"start_review"),STATUS.IN_REVIEW);
  assert.equal(assertTransition(STATUS.NEEDS_INFO,"start_review"),STATUS.IN_REVIEW);
  assert.equal(assertTransition(STATUS.IN_REVIEW,"request_information"),STATUS.NEEDS_INFO);
  assert.equal(assertTransition(STATUS.IN_REVIEW,"mark_reviewed"),STATUS.REVIEWED);
  assert.throws(()=>assertTransition(STATUS.REVIEWED,"start_review"),{status:409});
  assert.throws(()=>assertTransition(STATUS.QUEUED,"mark_reviewed"),{status:409});
});
test("session rejects missing bearer token before touching storage",async()=>{
  const res=response();await session({method:"GET",headers:{}},res);
  assert.equal(res.statusCode,401);assert.equal(res.headers["Cache-Control"],"no-store");
});
test("reviews route rejects unsupported methods and marks response no-store",async()=>{
  const res=response();await reviews({method:"DELETE",headers:{}},res);
  assert.equal(res.statusCode,405);assert.equal(res.headers.Allow,"GET, POST");assert.equal(res.headers["Cache-Control"],"no-store");
});
test("activity route rejects unsupported methods",async()=>{
  const res=response();await activity({method:"POST",headers:{}},res);
  assert.equal(res.statusCode,405);assert.equal(res.headers.Allow,"GET");
});
test("JSON API bodies are capped before service validation",()=>{
  assert.throws(()=>jsonBody({headers:{"content-type":"application/json"},body:{notes:"x".repeat(66000)}}),{status:413});
});
test("integration ingestion rejects absent credentials without persistence",async()=>{
  const res=response();await ingest({method:"POST",headers:{"content-type":"application/json",authorization:"Bearer invalid"},body:valid},res);
  assert.equal(res.statusCode,503);assert.equal(res.body.persisted,undefined);
});
test("protected ingestion authenticates, validates, scopes, persists, and returns a stable replay identifier",async()=>{
  const prior={key:process.env.BROKERFLOW_INGEST_API_KEY,org:process.env.BROKERFLOW_INGEST_ORGANIZATION_ID};
  process.env.BROKERFLOW_INGEST_API_KEY="synthetic-bearer-credential";process.env.BROKERFLOW_INGEST_ORGANIZATION_ID="org-synthetic";
  const calls=[];let duplicate=false;
  const db={from(table){assert.equal(table,"organizations");return{select(columns){assert.equal(columns,"id,status");return{eq(field,value){assert.equal(field,"id");assert.equal(value,"org-synthetic");return{async maybeSingle(){return{data:{id:value,status:"active"},error:null};}};}};}};}};
  const handler=createIngestHandler({database:()=>db,consumeRateLimit:async(...args)=>calls.push(["limit",...args.slice(1)]),createReview:async(_context,org,scenario,key,actor)=>{calls.push(["create",org,scenario,key,actor]);return{review_request_id:"lmr_synthetic_stable",status:"queued_for_human_review",duplicate};}});
  const protectedInput={...valid};delete protectedInput.source;
  const req={method:"POST",headers:{"content-type":"application/json",authorization:"Bearer synthetic-bearer-credential","idempotency-key":"synthetic-intake-key-0001"},body:protectedInput};
  try{
    const first=response();await handler(req,first);assert.equal(first.statusCode,201);assert.equal(first.body.review_request_id,"lmr_synthetic_stable");assert.equal(first.body.duplicate,false);assert.equal(first.body.next_step,"manual_review");
    duplicate=true;const replay=response();await handler(req,replay);assert.equal(replay.statusCode,200);assert.equal(replay.body.review_request_id,first.body.review_request_id);assert.equal(replay.body.duplicate,true);
    assert.equal(calls.filter(call=>call[0]==="create").length,2);assert.ok(calls.every(call=>call[0]!=="create"||call[3]==="synthetic-intake-key-0001"));
    const malformed=response();await handler({...req,body:{...valid,human_review_required:false}},malformed);assert.equal(malformed.statusCode,422);
    const denied=response();await handler({...req,headers:{...req.headers,authorization:"Bearer wrong"}},denied);assert.equal(denied.statusCode,401);
    assert.equal(calls.filter(call=>call[0]==="create").length,2);
  }finally{if(prior.key===undefined)delete process.env.BROKERFLOW_INGEST_API_KEY;else process.env.BROKERFLOW_INGEST_API_KEY=prior.key;if(prior.org===undefined)delete process.env.BROKERFLOW_INGEST_ORGANIZATION_ID;else process.env.BROKERFLOW_INGEST_ORGANIZATION_ID=prior.org;}
});
test("durable rate-limit wrapper fails closed and returns 429 retry guidance",async()=>{
  const args=[];const db={async rpc(name,input){args.push({name,input});return{data:{allowed:true,remaining:2,retry_after:60},error:null};}};
  await consumeRateLimit(db,"trusted_ingest","synthetic-org",60,60);assert.equal(args[0].name,"brokerflow_consume_rate_limit");
  db.rpc=async()=>({data:{allowed:false,retry_after:17},error:null});await assert.rejects(consumeRateLimit(db,"trusted_ingest","synthetic-org",60,60),error=>error.status===429&&error.retryAfter===17);
  db.rpc=async()=>({data:null,error:new Error("db offline")});await assert.rejects(consumeRateLimit(db,"trusted_ingest","synthetic-org",60,60),{status:503});
});
test("live configuration stays live and fails closed when backend keys are missing",()=>{
  const oldMode=process.env.BROKERFLOW_CONSOLE_MODE,oldUrl=process.env.SUPABASE_URL,oldPublic=process.env.SUPABASE_PUBLISHABLE_KEY,oldSecret=process.env.SUPABASE_SECRET_KEY;
  process.env.BROKERFLOW_CONSOLE_MODE="live";delete process.env.SUPABASE_URL;delete process.env.SUPABASE_PUBLISHABLE_KEY;process.env.SUPABASE_SECRET_KEY="server-secret-test-only";
  try{const res=response();config({method:"GET"},res);assert.equal(res.body.mode,"live");assert.equal(res.body.configured,false);assert.equal("secret_key" in res.body,false);assert.equal(res.headers["Cache-Control"],"no-store");}
  finally{for(const [key,value] of [["BROKERFLOW_CONSOLE_MODE",oldMode],["SUPABASE_URL",oldUrl],["SUPABASE_PUBLISHABLE_KEY",oldPublic],["SUPABASE_SECRET_KEY",oldSecret]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
