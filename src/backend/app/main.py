from __future__ import annotations

from pathlib import Path

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
