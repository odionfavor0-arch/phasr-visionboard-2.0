from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from app.core.text_utils import chunk_text
from app.core.env_loader import load_backend_env


BASE_DIR = Path(__file__).resolve().parent
load_backend_env(BASE_DIR)
DATA_DIR = BASE_DIR / "data" / "knowledge"
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_HOST = os.getenv("PINECONE_INDEX_HOST", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "phasr-knowledge")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "__default__")
PINECONE_EMBED_MODE = os.getenv("PINECONE_EMBED_MODE", "integrated").strip().lower()


def pinecone_upsert(vectors: list[dict]) -> None:
    if not PINECONE_API_KEY or not PINECONE_INDEX_HOST:
        raise RuntimeError("PINECONE_API_KEY and PINECONE_INDEX_HOST are required.")

    request = Request(
        f"https://{PINECONE_INDEX_HOST}/vectors/upsert",
        data=json.dumps({"vectors": vectors}).encode("utf-8"),
        headers={
            "Api-Key": PINECONE_API_KEY,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=60) as response:
            response.read()
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Pinecone upsert failed {error.code}: {body}") from error


def pinecone_upsert_records(records: list[dict]) -> None:
    if not PINECONE_API_KEY or not PINECONE_INDEX_HOST:
        raise RuntimeError("PINECONE_API_KEY and PINECONE_INDEX_HOST are required.")

    body = "\n".join(json.dumps(record, ensure_ascii=False) for record in records).encode("utf-8")
    request = Request(
        f"https://{PINECONE_INDEX_HOST}/records/namespaces/{PINECONE_NAMESPACE}/upsert",
        data=body,
        headers={
            "Api-Key": PINECONE_API_KEY,
            "Content-Type": "application/x-ndjson",
            "X-Pinecone-Api-Version": "2025-10",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=60) as response:
            response.read()
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Pinecone record upsert failed {error.code}: {body}") from error


def embed_file(path: Path) -> None:
    with path.open("r", encoding="utf-8") as handle:
        content = json.load(handle)

    filename_domain = path.stem.replace("_blog", "")
    total = 0

    for url, data in content.items():
        text = data.get("content", "")
        title = data.get("metadata", {}).get("title") or data.get("title") or url
        page_type = data.get("metadata", {}).get("type", "article")
        chunks = chunk_text(text, max_chars=500)

        for index, chunk in enumerate(chunks):
            record_id = f"{path.stem}:{index}:{abs(hash(url))}"
            if PINECONE_EMBED_MODE == "integrated":
                record = {
                    "_id": record_id,
                    "text": chunk,
                    "title": title,
                    "url": url,
                    "source": "external",
                    "type": page_type,
                    "domain": filename_domain,
                }
                pinecone_upsert_records([record])
            else:
                from app.services.embeddings import get_embedding

                vector = {
                    "id": record_id,
                    "values": get_embedding(chunk),
                    "metadata": {
                        "url": url,
                        "title": title,
                        "source": "external",
                        "type": page_type,
                        "domain": filename_domain,
                        "text": chunk,
                    },
                }
                pinecone_upsert([vector])
            total += 1

    print(f"Embedded {total} chunks from {path.name} into {PINECONE_INDEX_NAME}")


def embed_text_document(path: Path) -> None:
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        print(f"Skipped empty knowledge document {path.name}")
        return

    domain = path.stem
    title = path.stem.replace("_", " ").replace("-", " ").strip().title() or path.stem
    chunks = chunk_text(text, max_chars=500)
    total = 0

    for index, chunk in enumerate(chunks):
        record_id = f"{path.stem}:manual:{index}"
        if PINECONE_EMBED_MODE == "integrated":
            record = {
                "_id": record_id,
                "text": chunk,
                "title": title,
                "url": f"local://{path.name}",
                "source": "manual",
                "type": "knowledge_doc",
                "domain": domain,
            }
            pinecone_upsert_records([record])
        else:
            from app.services.embeddings import get_embedding

            vector = {
                "id": record_id,
                "values": get_embedding(chunk),
                "metadata": {
                    "url": f"local://{path.name}",
                    "title": title,
                    "source": "manual",
                    "type": "knowledge_doc",
                    "domain": domain,
                    "text": chunk,
                },
            }
            pinecone_upsert([vector])
        total += 1

    print(f"Embedded {total} chunks from {path.name} into {PINECONE_INDEX_NAME}")


def run() -> None:
    if not DATA_DIR.exists():
        raise RuntimeError(f"Knowledge data folder not found: {DATA_DIR}")

    for path in sorted(DATA_DIR.glob("*_blog.json")):
        embed_file(path)

    for path in sorted(DATA_DIR.glob("*.txt")):
        embed_text_document(path)

    for path in sorted(DATA_DIR.glob("*.md")):
        embed_text_document(path)

    print("Pinecone embedding complete.")


if __name__ == "__main__":
    run()
