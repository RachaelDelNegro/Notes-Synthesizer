## System Architecture

This section describes how the system architecture maps directly to the wireframes, user journey, and personas defined earlier. The Notes Synthesizer is implemented as a **React frontend** backed by an **Express API**, with a clearly defined synthesis pipeline and observability layer.

---

### High-Level Architecture

#### Frontend (React)
The frontend manages the user journey and presentation layer. Its responsibilities include:

- Accepting meeting transcripts (paste or upload)
- Displaying synthesis progress and loading states
- Rendering structured outputs:
  - Summary
  - Action items
  - Decisions
  - Open questions
- Allowing users to edit synthesized content
- Exporting validated results in multiple formats

The frontend treats AI output as **editable draft data**, not authoritative truth.

---

#### Backend (Express)
The backend owns synthesis logic and data integrity. Its responsibilities include:

- Receiving raw transcript text
- Executing a multi-stage synthesis pipeline:
  - Preprocess → Extract → Parse → Validate → Normalize → Enrich
- Returning structured JSON results
- Producing run metadata (timestamps, model, prompt version)
- Logging key events for observability (System Observer)

The backend is designed to separate **probabilistic extraction** from **deterministic validation** for clarity and testability.

---

### Architecture Flow Summary
User → React UI → Express API → Synthesis Pipeline → Structured JSON → React UI

## Definitions

### Backend API

#### Endpoint List (MVP)

| Method | Endpoint              | Description                                   |
|------|-----------------------|-----------------------------------------------|
| POST | `/api/synthesize`     | Takes raw notes and returns structured output |
| GET  | `/api/examples`       | Returns list of built-in example transcripts  |
| GET  | `/api/examples/:id`   | Returns the text of a selected example        |

---

#### 8.1.2 `POST /api/synthesize` Contract
Each synthesis is treated as a run with metadata, and extracted outputs are normalized into typed items.

```json
##### Request
{
  "text": "string",
  "sourceType": "pasted | uploaded | example"
}

##### Response
{
  "summary": "string",
  "items": [
    {
      "item_id": "string",
      "type": "action | decision | question",
      "description": "string",
      "source_text": "string | null",
      "confidence": 0.0,
      "owner": "string | null",
      "due_date": "ISO string | null",
      "priority": "low | medium | high | null"
    }
  ],
  "metadata": {
    "run_id": "string",
    "created_at": "ISO string",
    "model": "string",
    "prompt_version": "string",
    "duration_ms": 0,
    "source_type": "pasted | uploaded | example",
    "source_length": 0
  }
}
```
## System Observer

### MVP Observability Signals
The System Observer captures:
- `runId`
- Stage start/end times
- Prompt version and model name
- Counts
  - Action Items
  - Decisions
  - Questions
- Parse and validation errors (sanitized)
- Export events

### Log Store (MVP)
For the MVP:
- Console logging
- Optional local artifact: `runs/<runId>.json`
- No external logging system required

## Error Handling

### Input errors (Frontend)
- Empty input → Disable synthesize button + inline error
- Invalid file type → "Please upload a .txt file"

### Backend errors
- LLM failure or timeout → 502/500 with user-friendly message
- Invalid JSON from model → Retry once, else return 500
- Validation failures → Drop invalid items and include warnings in metadata

### UX Handling
- Loading screen displays: “This may take ~X seconds”
- Results page shows:

“Some items could not be extracted reliably”
when warnings are present

