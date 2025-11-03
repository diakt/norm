# Main Service Endpoints

## `GET /query`
- **Description**: Runs a semantic search across the indexed PDF content and returns the answer plus supporting citations.
- **Query Parameters**:
  - `q` (string, required): The natural-language question to run against the vector index.
- **Responses**:
  - `200 OK`: Returns a JSON body matching `app.utils.Output` (`query`, `response`, `citations`).
  - `503 Service Unavailable`: Returned when the vector index has not finished loading at startup.

