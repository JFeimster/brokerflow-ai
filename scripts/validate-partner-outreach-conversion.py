"""Validate Batch 2 OpenAPI contracts and live handler output (PyYAML + jsonschema)."""
import itertools
import json
from pathlib import Path
import subprocess
from collections import defaultdict

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SLUGS = ["partner-outreach-campaign", "partner-objection-response", "partner-call-prep-brief"]
METHODS = {"get", "post", "put", "patch", "delete", "head", "options", "trace"}


class UniqueKeyLoader(yaml.SafeLoader):
    """Reject duplicate YAML keys instead of silently discarding earlier entries."""


def unique_mapping(loader, node, deep=False):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            raise ValueError(f"Duplicate YAML key: {key}")
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


UniqueKeyLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)


def load(path):
    return yaml.load(path.read_text(encoding="utf-8-sig"), Loader=UniqueKeyLoader)


operations, paths, resolved_paths = defaultdict(list), defaultdict(list), defaultdict(list)
legacy_parse_errors = []
for path in sorted((ROOT / "schemas").rglob("*.yaml")):
    try:
        document = load(path)
    except (yaml.YAMLError, ValueError) as error:
        legacy_parse_errors.append(f"{path.relative_to(ROOT)}: {error}")
        # Legacy duplicate keys must not hide their remaining operations from collision checks.
        try:
            document = yaml.safe_load(path.read_text(encoding="utf-8-sig"))
        except yaml.YAMLError:
            continue
    if not isinstance(document, dict) or not isinstance(document.get("paths"), dict):
        continue
    for endpoint, item in document["paths"].items():
        paths[endpoint].append(str(path.relative_to(ROOT)))
        for server in item.get("servers", document.get("servers", [])):
            resolved_paths[server["url"].rstrip("/") + "/" + endpoint.lstrip("/")].append(str(path.relative_to(ROOT)))
        for method, operation in item.items():
            if method in METHODS and isinstance(operation, dict) and operation.get("operationId"):
                operations[operation["operationId"]].append(str(path.relative_to(ROOT)))

contracts, samples = {}, []
for slug in SLUGS:
    path = ROOT / "schemas" / f"no-auth-{slug}.schema.yaml"
    document = load(path)
    assert document["openapi"].startswith("3.1."), path
    assert document["servers"] == [{"url": "https://brokerflow-ai.vercel.app"}]
    endpoint = f"/api/no-auth/{slug}"
    assert set(document["paths"]) == {endpoint}
    operation = document["paths"][endpoint]["post"]
    assert len(operations[operation["operationId"]]) == 1, operations[operation["operationId"]]
    assert len(paths[endpoint]) == 1, paths[endpoint]
    full_endpoint = "https://brokerflow-ai.vercel.app" + endpoint
    assert len(resolved_paths[full_endpoint]) == 1, resolved_paths[full_endpoint]
    assert set(operation["responses"]) == {"200", "400", "405", "500", "502"}
    schemas = document["components"]["schemas"]
    for schema in schemas.values():
        Draft202012Validator.check_schema(schema)
    validators = {key: Draft202012Validator(schema) for key, schema in schemas.items()}
    example = operation["requestBody"]["content"]["application/json"]["example"]
    validators["PartnerRequest"].validate(example)
    for status, response in operation["responses"].items():
        media = response["content"]["application/json"]
        target = media["schema"]["$ref"].split("/")[-1]
        validators[target].validate(media["example"])
    # Exercise every request enum and all category/goal combinations through actual handlers.
    inputs = [example]
    props = schemas["PartnerRequest"]["properties"]
    for field, rule in props.items():
        inputs.extend({**example, field: value} for value in rule.get("enum", []))
    goal_field = {SLUGS[0]: "outreach_goal", SLUGS[1]: "objection_type", SLUGS[2]: "meeting_goal"}[slug]
    inputs.extend({**example, "partner_category": category, goal_field: goal}
                  for category, goal in itertools.product(props["partner_category"]["enum"], props[goal_field]["enum"]))
    inputs.append({key: example[key] for key in schemas["PartnerRequest"]["required"]})
    contracts[slug] = validators
    for body in inputs:
        validators["PartnerRequest"].validate(body)
        samples.append({"slug": slug, "body": body})

runner = r'''
import fs from "node:fs";
import { ACTIONS } from "./lib/partner-action-utils.js";
for (const config of Object.values(ACTIONS)) {
  delete process.env[`${config.env}_WEBHOOK_URL`];
  delete process.env[`${config.env}_SHARED_SECRET`];
}
globalThis.fetch = () => { throw new Error("Unexpected network access"); };
const samples = JSON.parse(fs.readFileSync(0, "utf8"));
const results = [];
for (const sample of samples) {
  const { default: handler } = await import(`./api/no-auth/${sample.slug}.js`);
  const result = { slug: sample.slug };
  await handler({ method: "POST", body: sample.body }, {
    setHeader() {}, status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; }
  });
  results.push(result);
}
process.stdout.write(JSON.stringify(results));
'''
completed = subprocess.run(["node", "--input-type=module", "-e", runner], input=json.dumps(samples), text=True, encoding="utf-8", capture_output=True, cwd=ROOT, check=True)
for result in json.loads(completed.stdout):
    assert result["status"] == 200, result
    contracts[result["slug"]]["PartnerResponse"].validate(result["body"])

legacy = ROOT / "schemas/partners/openapi-api-key-partner-outreach-campaigns.yaml"
assert load(legacy)["x-brokerflow-status"] == "reference-only"
assert len(operations["createLegacyPartnerOutreachCampaignPlan"]) == 1
print(f"PASS: 3 OpenAPI 3.1 contracts; all examples; {len(samples)} actual handler responses; new operation IDs and endpoint paths are unique.")
duplicates = {key: value for key, value in operations.items() if len(value) > 1}
duplicate_paths = {key: value for key, value in paths.items() if len(value) > 1}
print(f"Existing unrelated schema duplicates: {len(duplicates)} operation IDs, {len(duplicate_paths)} paths (non-blocking).")
for key, files in duplicates.items():
    print(f"  Existing operation: {key} ({len(files)} schemas)")
if legacy_parse_errors:
    print(f"Existing unrelated YAML parse issues: {len(legacy_parse_errors)} (new contracts were parsed strictly above).")
    for error in legacy_parse_errors:
        print(error)
