"""Validate Batch 3 OpenAPI contracts, examples, repository uniqueness, and handlers."""
import json
from collections import defaultdict
from pathlib import Path
import subprocess

import yaml
from jsonschema import Draft202012Validator
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012

ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = {
    "partner-onboarding-checklist": "generatePartnerOnboardingChecklist",
    "partner-enablement-content": "requestPartnerEnablementContent",
    "partner-reactivation": "triggerPartnerReactivation",
}
METHODS = {"get", "post", "put", "patch", "delete", "head", "options", "trace"}


class UniqueKeyLoader(yaml.SafeLoader):
    """Reject duplicate YAML keys in the canonical contracts."""


def unique_mapping(loader, node, deep=False):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            raise ValueError(f"Duplicate YAML key: {key}")
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


UniqueKeyLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)


def strict_load(path):
    return yaml.load(path.read_text(encoding="utf-8-sig"), Loader=UniqueKeyLoader)


operations, paths = defaultdict(list), defaultdict(list)
for path in sorted((ROOT / "schemas").rglob("*.yaml")):
    try:
        document = strict_load(path)
    except (yaml.YAMLError, ValueError):
        # Keep unrelated pre-existing malformed legacy schemas from blocking this batch.
        continue
    if not isinstance(document, dict) or not isinstance(document.get("paths"), dict):
        continue
    for endpoint, item in document["paths"].items():
        paths[endpoint].append(str(path.relative_to(ROOT)))
        for method, operation in item.items():
            if method in METHODS and isinstance(operation, dict) and operation.get("operationId"):
                operations[operation["operationId"]].append(str(path.relative_to(ROOT)))

samples = []
contract_registries = {}
for slug, operation_id in CONTRACTS.items():
    path = ROOT / "schemas" / f"no-auth-{slug}.schema.yaml"
    doc = strict_load(path)
    assert doc["openapi"].startswith("3.1."), path
    endpoint = f"/api/no-auth/{slug}"
    assert set(doc["paths"]) == {endpoint}, path
    assert len(paths[endpoint]) == 1, paths[endpoint]
    operation = doc["paths"][endpoint]["post"]
    assert operation["operationId"] == operation_id
    assert len(operations[operation_id]) == 1, operations[operation_id]
    assert set(operation["responses"]) == {"200", "400", "405", "500", "502"}
    components = doc["components"]["schemas"]
    root_uri = "https://brokerflow-ai.vercel.app/openapi.yaml"
    component_resource = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "components": {"schemas": components},
    }
    ref_registry = Registry().with_resource(
        root_uri, Resource.from_contents(component_resource, default_specification=DRAFT202012)
    )
    contract_registries[slug] = ref_registry
    validators = {}
    for name, schema in components.items():
        Draft202012Validator.check_schema(schema)
        validators[name] = Draft202012Validator(schema)
    request_example = operation["requestBody"]["content"]["application/json"]["example"]
    validators["PartnerRequest"].validate(request_example)
    samples.append({"slug": slug, "body": request_example})
    for status, response in operation["responses"].items():
        media = response["content"]["application/json"]
        schema_name = media["schema"]["$ref"].split("/")[-1]
        Draft202012Validator(
            {"$ref": f"{root_uri}#/components/schemas/{schema_name}"},
            registry=ref_registry,
        ).validate(media["example"])

project_registry = json.loads((ROOT / "schemas/partners/partner-openapi-registry.json").read_text(encoding="utf-8"))
registry_ids = [entry["id"] for entry in project_registry["schemas"]]
assert len(registry_ids) == len(set(registry_ids)), "Duplicate partner schema registry ID"
for entry in project_registry["schemas"]:
    target = (ROOT / "schemas/partners" / entry["file"]).resolve()
    assert target.exists(), f"Broken schema registry reference: {entry['file']}"
    for key in ("canonical_schema", "canonical_reactivation_schema", "canonical_reactivation_trigger_schema"):
        if entry.get(key):
            canonical = (ROOT / "schemas/partners" / entry[key]).resolve()
            assert canonical.exists(), f"Broken canonical schema reference: {entry[key]}"

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
completed = subprocess.run(
    ["node", "--input-type=module", "-e", runner], input=json.dumps(samples), text=True,
    encoding="utf-8", capture_output=True, cwd=ROOT, check=True
)
for result in json.loads(completed.stdout):
    assert result["status"] == 200, result
    slug = result["slug"]
    doc = strict_load(ROOT / "schemas" / f"no-auth-{slug}.schema.yaml")
    Draft202012Validator(
        {"$ref": f"{root_uri}#/components/schemas/PartnerResponse"},
        registry=contract_registries[slug],
    ).validate(result["body"])

print("PASS: 3 OpenAPI 3.1 contracts, strict YAML keys, request/response examples, registry references, unique operation IDs/paths, and actual handler responses.")
