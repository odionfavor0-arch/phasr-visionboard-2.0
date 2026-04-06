from __future__ import annotations

import json
import os
from typing import Any
from urllib.request import Request, urlopen

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_HOST = os.getenv("PINECONE_INDEX_HOST", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "phasr-knowledge")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "__default__")
PINECONE_EMBED_MODE = os.getenv("PINECONE_EMBED_MODE", "integrated").strip().lower()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


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


def build_context(matches: list[dict[str, Any]]) -> str:
    blocks: list[str] = []
    for match in matches:
        metadata = match.get("metadata") or {}
        if not metadata and isinstance(match.get("fields"), dict):
            metadata = match.get("fields", {})
        title = metadata.get("title", "Untitled source")
        url = metadata.get("url", "")
        text = metadata.get("text", "") or metadata.get("chunk_text", "")
        domain = metadata.get("domain", "general")
        blocks.append(f"[{domain}] {title}\nURL: {url}\n{text}")
    return "\n\n---\n\n".join(blocks)


def call_groq_with_context(system_prompt: str, question: str, context: str, messages: list[dict[str, str]] | None = None) -> str:
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
        "- Use the context above to answer.\n"
        "- If you don't know, say that honestly.\n"
        "- Don't make things up.\n"
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


def answer_with_rag(question: str, system_prompt: str, messages: list[dict[str, str]] | None = None, top_k: int = 6) -> dict[str, Any]:
    matches = query_pinecone(question, top_k=top_k)
    context = build_context(matches)
    answer = call_groq_with_context(system_prompt, question, context, messages=messages)
    return {
        "answer": answer,
        "matches": matches,
        "index": PINECONE_INDEX_NAME,
    }
