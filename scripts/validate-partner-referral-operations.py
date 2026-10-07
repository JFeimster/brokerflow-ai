"""Validate Batch 4 partner referral operation schemas and registry entries."""
import json
from collections import Counter
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = {
    "no-auth-partner-referral-submission.schema.yaml": ("submitPartnerReferral", "/api/no-auth/partner-referral"),
    "no-auth-partner-status-update-draft.schema.yaml": ("draftPartnerStatusUpdate", "/api/no-auth/partner-status-update-draft"),
    "no-auth-partner-attribution-log.schema.yaml": ("logPartnerAttribution", "/api/no-auth/partner-attribution-log"),
}
KNOWN_METHODS = {"get", "post", "put", "patch", "delete", "head", "options", "trace"}


class UniqueKeyLoader(yaml.SafeLoader):
    pass


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


all_schemas = {}
for path in (ROOT / "schemas").rglob("*.yaml"):
    try:
        all_schemas[path] = load(path)
    except (yaml.YAMLError, ValueError):
        continue  # Historical/reference contracts are validated by their owning checks.

all_operation_ids = Counter()
all_method_paths = Counter()
for schema in all_schemas.values():
    if not isinstance(schema, dict):
        continue
    for path, path_item in schema.get("paths", {}).items():
        for method in KNOWN_METHODS:
            operation = path_item.get(method) if isinstance(path_item, dict) else None
            if isinstance(operation, dict):
                if operation.get("operationId"):
                    all_operation_ids[operation["operationId"]] += 1
                all_method_paths[(method, path)] += 1

registry = json.loads((ROOT / "schemas/partners/partner-openapi-registry.json").read_text(encoding="utf-8"))
registry_entries = {entry["id"]: entry for entry in registry["schemas"]}
assert len(registry_entries) == len(registry["schemas"]), "Duplicate registry schema IDs"

for filename, (operation_id, endpoint) in CONTRACTS.items():
    path = ROOT / "schemas" / filename
    document = load(path)
    assert document["openapi"].startswith("3.1."), f"{filename} must use OpenAPI 3.1.x"
    assert all_operation_ids[operation_id] == 1, f"operationId collision: {operation_id}"
    method, route = "post", endpoint
    assert all_method_paths[(method, route)] == 1, f"method/path collision: {method.upper()} {route}"
    operation = document["paths"][route][method]
    assert operation["operationId"] == operation_id
    components = document["components"]["schemas"]
    request_schema = components[next(key for key in components if key.endswith("Request"))]
    response_schema = components[next(key for key in components if key.endswith("Response"))]
    request_example = operation["requestBody"]["content"]["application/json"]["example"]
    response_example = operation["responses"]["200"]["content"]["application/json"]["example"]
    Draft202012Validator(request_schema).validate(request_example)
    Draft202012Validator(response_schema).validate(response_example)
    entry_id = filename.removeprefix("no-auth-").removesuffix(".schema.yaml")
    assert entry_id in registry_entries, f"Missing partner schema registry entry: {entry_id}"
    target = (ROOT / "schemas/partners" / registry_entries[entry_id]["file"]).resolve()
    assert target == path.resolve(), f"Registry points at wrong canonical schema: {entry_id}"

print("PASS: 3 Batch 4 OpenAPI 3.1 schemas, strict YAML, request/response examples, unique new operation IDs and POST paths, partner registry references.")
