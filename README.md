# Application Setup

This repo contains a FastAPI backend that indexes `docs/laws.pdf` into an in-memory
Qdrant vector store and exposes a semantic search endpoint. A lightweight Next.js
client lives in `frontend/` (see its own README for details).

## Prerequisites
- Python 3.12
- Node.js 18+ (only if you plan to run the frontend)
- An OpenAI API key with access to embeddings (set as `chatter_key`)

## Backend Setup
1. Create and activate a virtual environment:
   ```bash
   python3.12 -m venv venv
   source venv/bin/activate
   ```
2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Export your OpenAI key (replace the value with your key):
   ```bash
   export chatter_key="sk-..."
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```
   On startup the app loads `docs/laws.pdf`, generates embeddings with
   `text-embedding-3-small`, and caches the index in memory.

## Available Endpoint
- `GET /query?q=<question>`  
  Returns a JSON payload matching `app.utils.Output` containing the original
  question, the generated response, and supporting citations. Example:
  ```bash
  curl "http://localhost:8000/query?q=what happens if I steal?"
  ```

## Frontend (Optional)
Refer to `frontend/README.md` for instructions if you want to run the companion
Next.js client.
