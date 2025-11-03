# Setup

## Backend
```bash
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export chatter_key="not-your-oai-api-key"
uvicorn app.main:app --reload
```

## Docker (backend)
```bash
docker build -t fs-backend .
docker run -p 8000:8000 -e chatter_key="not-your-oai-api-key" fs-backend
```


## Frontend (optional)
```bash
cd frontend
npm install
export NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
npm run dev
```
Open http://localhost:3000.


