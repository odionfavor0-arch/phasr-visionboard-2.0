from __future__ import annotations

import json
import os
from typing import Any
from urllib.request import Request, urlopen
from urllib.error import URLError

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_HOST = os.getenv("PINECONE_INDEX_HOST", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "phasr-knowledge")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "__default__")
PINECONE_EMBED_MODE = os.getenv("PINECONE_EMBED_MODE", "integrated").strip().lower()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")


def _pinecone_request(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    if not PINECONE_API_KEY or not PINECONE_INDEX_HOST:
        raise RuntimeError("PINECONE_API_KEY and PINECONE_INDEX_HOST are required.")

    request = Request(
        f"https://{PINECONE_INDEX_HOST}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Api-Key": PINECONE_API_KEY,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def query_pinecone(question: str, top_k: int = 6) -> list[dict[str, Any]]:
    if PINECONE_EMBED_MODE == "integrated":
        result = _pinecone_request(
            f"/records/namespaces/{PINECONE_NAMESPACE}/search",
            {
                "query": {
                    "top_k": top_k,
                    "inputs": {
                        "text": question,
                    },
                },
                "fields": ["text", "title", "url", "source", "type", "domain"],
            },
        )
        return result.get("result", {}).get("hits", [])

    from app.services.embeddings import get_embedding

    vector = get_embedding(question)
    result = _pinecone_request("/query", {
        "vector": vector,
        "topK": top_k,
        "includeMetadata": True,
    })
    return result.get("matches", [])


def search_firecrawl(query: str, limit: int = 3) -> list[dict[str, Any]]:
    """Search the live web via Firecrawl and return simplified result dicts."""
    if not FIRECRAWL_API_KEY:
        return []

    payload = json.dumps({"query": query, "limit": limit}).encode("utf-8")

    request = Request(
        "https://api.firecrawl.dev/v1/search",
        data=payload,
        headers={
            "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (URLError, TimeoutError):
        return []

    results = []
    for item in data.get("data", []):
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "text": item.get("description", "") or item.get("markdown", "")[:500],
        })
    return results


def build_context(
    pinecone_matches: list[dict[str, Any]],
    firecrawl_results: list[dict[str, Any]] | None = None,
) -> str:
    sections: list[str] = []

    if pinecone_matches:
        blocks: list[str] = []
        for match in pinecone_matches:
            metadata = match.get("metadata") or {}
            if not metadata and isinstance(match.get("fields"), dict):
                metadata = match.get("fields", {})
            title = metadata.get("title", "Untitled source")
            url = metadata.get("url", "")
            text = metadata.get("text", "") or metadata.get("chunk_text", "")
            domain = metadata.get("domain", "general")
            blocks.append(f"[{domain}] {title}\nURL: {url}\n{text}")
        sections.append("## Stored Knowledge\n\n" + "\n\n---\n\n".join(blocks))

    if firecrawl_results:
        blocks = []
        for item in firecrawl_results:
            title = item.get("title", "Web result")
            url = item.get("url", "")
            text = item.get("text", "")
            blocks.append(f"{title}\nURL: {url}\n{text}")
        sections.append("## Live Web Results\n\n" + "\n\n---\n\n".join(blocks))

    return "\n\n====\n\n".join(sections)


def call_groq_with_context(
    system_prompt: str,
    question: str,
    context: str,
    messages: list[dict[str, str]] | None = None,
) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is required.")

    conversation = []
    for message in messages or []:
        role = message.get("role")
        content = str(message.get("content", "")).strip()
        if role in {"user", "assistant"} and content:
            conversation.append({"role": role, "content": content})

    prompt = (
        f"{system_prompt}\n\n"
        f"User question: {question}\n\n"
        f"Relevant context:\n{context}\n\n"
        "Instructions:\n"
        "- Use the context above to answer. Prioritize Live Web Results for current resources.\n"
        "- Give concrete, specific, actionable advice — not generic guidance.\n"
        "- When referencing a resource from the context, wrap it as readable anchor text in markdown: "
        "e.g. [Watch this](url) or [Read this guide](url). Never paste raw URLs.\n"
        "- If no relevant URL is available, do not fabricate one.\n"
        "- If you don't know something, say so honestly.\n"
        "- Keep the answer practical and specific."
    )

    payload = json.dumps({
        "model": GROQ_MODEL,
        "max_tokens": 1000,
        "messages": [
            {"role": "system", "content": prompt},
            *conversation,
        ],
    }).encode("utf-8")

    request = Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urlopen(request, timeout=60) as response:
        data = json.loads(response.read().decode("utf-8"))
        return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()


def answer_with_rag(
    question: str,
    system_prompt: str,
    messages: list[dict[str, str]] | None = None,
    top_k: int = 6,
) -> dict[str, Any]:
    pinecone_matches = query_pinecone(question, top_k=top_k)
    firecrawl_results = search_firecrawl(question)
    context = build_context(pinecone_matches, firecrawl_results)
    answer = call_groq_with_context(system_prompt, question, context, messages=messages)
    return {
        "answer": answer,
        "matches": pinecone_matches,
        "web_results": firecrawl_results,
        "index": PINECONE_INDEX_NAME,
    }
