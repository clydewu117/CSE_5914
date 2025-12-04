Minimal ES ingestion helper

This folder contains a small, dependency-free Python script `ingest_es.py` to help bulk-index JSON/CSV exercise datasets into your local Elasticsearch instance.

Usage examples (run from the `peakform` folder):

Check connection to Elasticsearch:

```bash
python3 tools/ingest_es.py --check-connection
```

Dry-run to print normalized documents (no indexing):

```bash
python3 tools/ingest_es.py --index exercises --dry-run --files data/ex1.json data/ex2.csv
```

Index files into ES:

```bash
python3 tools/ingest_es.py --index exercises --files data/ex1.json data/ex2.csv
```

Notes:
- The script expects Elasticsearch at `http://localhost:9200` by default and uses credentials from environment variables `ELASTIC_USERNAME` and `ELASTIC_PASSWORD` (defaults to `elastic` / `CSE5914peakform`).
- It will create a simple mapping for you if the index does not exist.
- For production or large imports, consider using the official Python client or Logstash for more robust error handling and retries.
