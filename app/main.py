from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.utils import DocumentService, Output, QdrantService

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

docs_dir = Path(__file__).resolve().parent.parent / "docs"
app.mount("/static", StaticFiles(directory=docs_dir), name="static")

"""
Please create an endpoint that accepts a query string, e.g., "what happens if I steal 
from the Sept?" and returns a JSON response serialized from the Pydantic Output class.
"""

#gcache
index_service: QdrantService | None = None


@app.on_event("startup") #nts, deprecate on_event
def build_index() -> None:
    global index_service

    doc_service = DocumentService()
    docs = doc_service.create_documents()

    index_service = QdrantService(k=3)
    index_service.connect()
    index_service.load(docs, batch_size=8)


@app.get("/query", response_model=Output)
def query_endpoint(q: str = Query(..., min_length=1)) -> Output:
    if index_service is None:
        raise HTTPException(status_code=503, detail="Vector index unavailable")

    return index_service.query(q)
