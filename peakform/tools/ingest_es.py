#!/usr/bin/env python3
"""
Simple ingestion helper for Elasticsearch that uses only Python stdlib.

Features:
- Accept local file paths or HTTP(S) URLs (JSON or CSV).
- Basic field normalization via heuristics (common exercise field names).
- Create index with a simple mapping if it doesn't exist.
- Bulk-index documents using the ES HTTP Bulk API in batches.
- --dry-run to print normalized documents instead of sending them.
- --check-connection to print cluster health and exit.

This is intentionally minimal to avoid extra pip installs. For production,
prefer the official Elasticsearch client and batching with retries.
"""
import argparse
import csv
import json
import os
import sys
import time
from typing import Dict, Iterable, List

try:
    # python3 only: urllib.request for downloading and HTTP calls
    from urllib.request import Request, urlopen
    from urllib.error import HTTPError, URLError
    from base64 import b64encode
except Exception:
    print("Missing required stdlib modules", file=sys.stderr)
    raise


DEFAULT_ES = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
DEFAULT_USER = os.getenv("ELASTIC_USERNAME", "elastic")
DEFAULT_PASS = os.getenv("ELASTIC_PASSWORD", "CSE5914peakform")


def basic_auth_header(user: str, password: str) -> Dict[str, str]:
    token = b64encode(f"{user}:{password}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


def http_request(path: str, method: str = "GET", body: bytes = None, headers=None):
    url = path if path.startswith("http") else DEFAULT_ES.rstrip("/") + "/" + path.lstrip("/")
    req = Request(url, data=body, method=method)
    hdrs = headers.copy() if headers else {}
    hdrs.update(basic_auth_header(DEFAULT_USER, DEFAULT_PASS))
    for k, v in hdrs.items():
        req.add_header(k, v)
    try:
        with urlopen(req, timeout=30) as resp:
            return resp.read().decode(), resp.getcode()
    except HTTPError as e:
        return e.read().decode(), e.code
    except URLError as e:
        raise


def check_es():
    body, code = http_request("/_cluster/health?pretty")
    print(body)
    return code == 200


COMMON_FIELD_ALIASES = {
    "name": ["name", "exercise_name", "title"],
    "description": ["description", "desc", "instruction", "instructions", "how_to"],
    "muscles": ["muscle", "muscles", "primary_muscle", "target_muscles"],
    "equipment": ["equipment", "equip", "tools"],
    "difficulty": ["difficulty", "level", "skill_level"],
    "tags": ["tags", "categories", "category"],
    "id": ["id", "exercise_id", "uid"],
}


def normalize_row(d: Dict[str, str]) -> Dict:
    out = {}
    # map aliases
    lower = {k.lower(): v for k, v in d.items()}
    for target, aliases in COMMON_FIELD_ALIASES.items():
        for a in aliases:
            if a in lower and lower[a] not in (None, ""):
                val = lower[a]
                # split comma-separated lists for muscles/equipment/tags
                if target in ("muscles", "equipment", "tags"):
                    if isinstance(val, str):
                        parts = [p.strip() for p in val.split(",") if p.strip()]
                        out[target] = parts
                    else:
                        out[target] = val
                else:
                    out[target] = val
                break

    # fallback: include name or first field as name
    if "name" not in out:
        if "name" in lower:
            out["name"] = lower["name"]
        else:
            # pick first available non-empty field
            for k, v in lower.items():
                if v:
                    out.setdefault("name", v)
                    break

    out["source"] = out.get("source", "import")
    # ensure id exists
    if "id" not in out:
        out["id"] = str(int(time.time() * 1000))  # fallback: timestamp

    # short snippet
    if "description" in out and isinstance(out["description"], str):
        out["snippet"] = out["description"][0:200]
    else:
        out.setdefault("snippet", "")

    return out


def read_json_file(path: str) -> Iterable[Dict]:
    # path can be URL
    if path.startswith("http://") or path.startswith("https://"):
        data, code = http_request(path)
        if code >= 400:
            raise RuntimeError(f"Failed downloading {path}: {code}\n{data}")
        try:
            obj = json.loads(data)
        except Exception:
            # try newline-delimited
            for line in data.splitlines():
                if not line.strip():
                    continue
                yield json.loads(line)
            return
        if isinstance(obj, list):
            for item in obj:
                yield item
        elif isinstance(obj, dict):
            # assume top-level object contains list under some key
            for v in obj.values():
                if isinstance(v, list):
                    for item in v:
                        yield item
                    return
            yield obj
    else:
        with open(path, "r", encoding="utf-8") as f:
            data = f.read()
            try:
                obj = json.loads(data)
            except Exception:
                # NDJSON
                for line in data.splitlines():
                    if not line.strip():
                        continue
                    yield json.loads(line)
                return
            if isinstance(obj, list):
                for item in obj:
                    yield item
            elif isinstance(obj, dict):
                for v in obj.values():
                    if isinstance(v, list):
                        for item in v:
                            yield item
                        return
                yield obj


def read_csv_file(path: str) -> Iterable[Dict]:
    if path.startswith("http://") or path.startswith("https://"):
        data, code = http_request(path)
        if code >= 400:
            raise RuntimeError(f"Failed downloading {path}: {code}\n{data}")
        lines = data.splitlines()
        reader = csv.DictReader(lines)
        for row in reader:
            yield row
    else:
        with open(path, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                yield row


def iter_input_files(paths: List[str]) -> Iterable[Dict]:
    for p in paths:
        if p.endswith(".json"):
            yield from read_json_file(p)
        elif p.endswith(".csv"):
            yield from read_csv_file(p)
        else:
            # try JSON, fallback CSV
            try:
                yield from read_json_file(p)
            except Exception:
                yield from read_csv_file(p)


DEFAULT_MAPPING = {
    "mappings": {
        "properties": {
            "id": {"type": "keyword"},
            "name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
            "description": {"type": "text"},
            "snippet": {"type": "text"},
            "muscles": {"type": "keyword"},
            "equipment": {"type": "keyword"},
            "difficulty": {"type": "keyword"},
            "tags": {"type": "keyword"},
            "source": {"type": "keyword"},
        }
    }
}


def ensure_index(index: str):
    # check existence
    resp, code = http_request(f"/{index}", method="GET")
    if code == 200:
        print(f"Index '{index}' already exists")
        return True
    # create
    print(f"Creating index '{index}' with default mapping")
    body = json.dumps(DEFAULT_MAPPING).encode()
    resp, code = http_request(f"/{index}", method="PUT", body=body, headers={"Content-Type": "application/json"})
    if code >= 400:
        raise RuntimeError(f"Failed to create index: {code}\n{resp}")
    return True


def bulk_index(index: str, docs: Iterable[Dict], batch: int = 500, dry_run: bool = False, no_id: bool = False):
    batch_list = []
    count = 0
    for d in docs:
        doc = normalize_row({k: (v if v is not None else "") for k, v in d.items()})
        if dry_run:
            print(json.dumps(doc, ensure_ascii=False))
            continue
        if no_id:
            header = {"index": {}}
        else:
            header = {"index": {"_id": str(doc.get("id"))}}
        batch_list.append(json.dumps(header, ensure_ascii=False))
        batch_list.append(json.dumps(doc, ensure_ascii=False))
        count += 1
        if count % batch == 0:
            payload = "\n".join(batch_list) + "\n"
            resp, code = http_request(f"/{index}/_bulk", method="POST", body=payload.encode("utf-8"), headers={"Content-Type": "application/x-ndjson"})
            print(f"Bulk sent: {count} docs, status {code}")
            batch_list = []
    if batch_list and not dry_run:
        payload = "\n".join(batch_list) + "\n"
        resp, code = http_request(f"/{index}/_bulk", method="POST", body=payload.encode("utf-8"), headers={"Content-Type": "application/x-ndjson"})
        print(f"Bulk sent final: {count} docs, status {code}")


def main(argv=None):
    p = argparse.ArgumentParser(description="Minimal ES ingestion helper (stdlib-only)")
    p.add_argument("--index", required=True, help="Elasticsearch index name to write to")
    p.add_argument("--files", nargs="+", required=False, help="Local file paths or URLs (json/csv)")
    p.add_argument("--dry-run", action="store_true", help="Print normalized docs instead of indexing")
    p.add_argument("--check-connection", action="store_true", help="Check Elasticsearch cluster health and exit")
    p.add_argument("--batch", type=int, default=500, help="Bulk batch size")
    p.add_argument("--no-id", action="store_true", help="Do not send _id in bulk header (let ES assign ids)")
    args = p.parse_args(argv)

    if args.check_connection:
        ok = check_es()
        sys.exit(0 if ok else 2)

    if not args.files:
        print("No input files provided. Use --files file1.json file2.csv or URLs.")
        sys.exit(1)

    ensure_index(args.index)

    # stream docs from files
    def docs():
        for f in args.files:
            for item in iter_input_files([f]):
                # convert non-dict items to dict
                if not isinstance(item, dict):
                    yield {"name": str(item)}
                else:
                    yield item

    bulk_index(args.index, docs(), batch=args.batch, dry_run=args.dry_run, no_id=args.no_id)


if __name__ == "__main__":
    main()
