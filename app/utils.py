from pydantic import BaseModel
# import qdrant_client
from qdrant_client import QdrantClient
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core.schema import Document
from llama_index.core import VectorStoreIndex, ServiceContext
from llama_index.core.node_parser import SentenceSplitter
from dataclasses import dataclass
import os
from llama_index.readers.file import PDFReader
from llama_index.core import SimpleDirectoryReader
from pathlib import Path
# https://www.llamaindex.ai/blog/llamaindex-v0-10-838e735948f8
# why tho
import re
from llama_index.core.query_engine import CitationQueryEngine
from llama_index.core import Settings
import time



key = os.environ['chatter_key']


@dataclass
class Input:
    query: str
    file_path: str

@dataclass
class Citation:
    source: str
    text: str

class Output(BaseModel):
    query: str
    response: str
    citations: list[Citation]

class DocumentService:
    """
    Update this service to load the pdf and extract its contents.
    The example code below will help with the data structured required
    when using the QdrantService.load() method below. Note: for this
    exercise, ignore the subtle difference between llama-index's 
    Document and Node classes (i.e, treat them as interchangeable).
     """
    # example code
    def create_documents(self) -> list[Document]:
        """
        Bad: Can't get correct spacing from reader. Everythingislikethisunfortunately
        """
        reader = PDFReader()
        docs_path = Path(__file__).resolve().parent.parent / "docs" / "laws.pdf"
        raws = reader.load_data(file=docs_path)
        full = "\n".join([raw.text for raw in raws])
        pattern = r'(\d+(?:\.\d+)*)\.\s+'
        matches = list(re.finditer(pattern, full))

        docs = []

        for i, match in enumerate(matches):
            number = match.group().rstrip('. ')
            text_start = match.end()
            
            if i + 1 < len(matches):
                text_end = matches[i + 1].start()
            else:
                text_end = len(full)
            
            text = full[text_start:text_end].strip()
            
            docs.append(
                Document(metadata={"Section": number}, text=text))

        return docs

class QdrantService:
    def __init__(self, k: int = 2):
        self.ncount = k
        #added for load wraparound
        self.client: QdrantClient | None = None
        self.vstore: QdrantVectorStore | None = None
        self.vindex: VectorStoreIndex | None = None
        self.qengine: CitationQueryEngine | None = None
    
    def connect(self) -> None:
        Settings.llm = OpenAI(api_key=key, model="gpt-3.5-turbo")
        Settings.embed_model = OpenAIEmbedding(api_key=key, model="text-embedding-3-small")
        self.client = QdrantClient(location=":memory:")
        self.vstore = QdrantVectorStore(client=self.client, collection_name='temp')
        self.vindex = VectorStoreIndex.from_vector_store(self.vstore)
        

    def load(self, docs: list[Document], batch_size):
        if self.vindex is None:
            raise ValueError("VSI non-initialized")
        
        for i in range(0, len(docs), batch_size):
            self.vindex.insert_nodes(docs[i: i+batch_size])

    
    def query(self, query_str: str) -> Output:

        """
        This method needs to initialize the query engine, run the query, and return
        the result as a pydantic Output class. This is what will be returned as
        JSON via the FastAPI endpount. Fee free to do this however you'd like, but
        a its worth noting that the llama-index package has a CitationQueryEngine...

        Also, be sure to make use of self.k (the number of vectors to return based
        on semantic similarity).
        """
        assert self.vindex is not None, "Vindex non-init"

        if self.qengine is None:
            self.qengine = CitationQueryEngine.from_args(
                index = self.vindex,
                similarity_top_k = self.ncount
            )

        #
        rec_res = self.qengine.query(query_str)
        gen_res = str(rec_res)
        gen_cit = [
            Citation(
                source=node.metadata.get("Section", "unknown"),
                text=node.node.get_content().replace("\n", "").split(":")[1]
            )
            for node in rec_res.source_nodes
        ]

        #post processing

        #no responses
        if(gen_res.startswith("None of the provided sources")):
            gen_cit = []

        #Sections
        for x in gen_cit:
            dot_count = x.source.count(".")
            if dot_count == 0:
                x.source = "Section " + x.source + ":"
            elif dot_count == 1:
                x.source = "Law " + x.source + ":"
            elif dot_count == 1:
                x.source = "Specification " + x.source + ":"
        


        #
        return Output(
            query=query_str, 
            response=gen_res, 
            citations=gen_cit
            )
       

if __name__ == "__main__":
    
    #Loop params
    batch_size = 16
    ncount = 3

    # Example workflow
    doc_service = DocumentService() 
    docs = doc_service.create_documents() 

    index = QdrantService(k=ncount) 
    
    index.connect() # implemented
    print("Connected")
    index.load(docs, batch_size) # implemented
    print("Loaded")
    res = index.query("what happens if I steal?") # NOT implemented
    print("Queried")
    print(res)
    """

    """


