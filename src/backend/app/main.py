from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.request import Request, urlopen

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.core.env_loader import load_backend_env
from app.services.rag import answer_with_rag


load_backend_env(Path(__file__).resolve().parents[1])
app = FastAPI(title="Phasr Sage Knowledge API")


class SageRAGRequest(BaseModel):
    question: str = Field(..., min_length=1)
    system_prompt: str = Field(..., min_length=1)
    messages: list[dict[str, str]] = Field(default_factory=list)
    top_k: int = 6


class PlanGenerateRequest(BaseModel):
    system_prompt: str = Field(..., min_length=1)
    user_message: str = Field(..., min_length=1)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/sage/rag")
def sage_rag(payload: SageRAGRequest) -> dict:
    try:
        return answer_with_rag(
            question=payload.question,
            system_prompt=payload.system_prompt,
            messages=payload.messages,
            top_k=payload.top_k,
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.post("/api/plan/generate")
def plan_generate(payload: PlanGenerateRequest) -> dict[str, str]:
    groq_api_key = os.getenv("GROQ_API_KEY", "")
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured")

    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    request_body = json.dumps({
        "model": groq_model,
        "temperature": 0.2,
        "max_tokens": 1200,
        "messages": [
            {"role": "system", "content": payload.system_prompt},
            {"role": "user", "content": payload.user_message},
        ],
    }).encode("utf-8")

    request = Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=request_body,
        headers={
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=60) as response:
            data = json.loads(response.read().decode("utf-8"))
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            return {"content": content}
    except Exception as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
