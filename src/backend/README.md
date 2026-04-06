Phasr Sage knowledge backend

Files added here:
- `run-scraper.py` -> discovers and scrapes seed knowledge sources into JSON
- `run-embedding.py` -> reads `_blog.json` files, chunks them, embeds them, and upserts to Pinecone
- `app/main.py` -> FastAPI endpoint for Sage RAG
- `app/core/scraper.py` -> lightweight website scraper
- `app/services/rag.py` -> Pinecone query + Groq answer flow

Expected environment variables:
- `PINECONE_API_KEY`
- `PINECONE_INDEX_HOST`
- `PINECONE_INDEX_NAME=phasr-knowledge`
- `PINECONE_NAMESPACE=__default__`
- `PINECONE_EMBED_MODE=integrated`
- `GROQ_API_KEY`
- `GROQ_MODEL=llama-3.3-70b-versatile`

If you use `PINECONE_EMBED_MODE=integrated`, you do not need `OPENAI_API_KEY`.
Only use `OPENAI_API_KEY` if you intentionally switch to external embeddings later.

Suggested local flow:
1. `python run-scraper.py`
2. `python run-embedding.py`
3. `uvicorn app.main:app --reload`

Suggested frontend env:
- `VITE_SAGE_RAG_URL=http://localhost:8000`
