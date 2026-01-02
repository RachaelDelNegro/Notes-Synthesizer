## System Architecture

This section describes how the system architecture maps directly to the wireframes, user journey, and personas defined earlier. The Notes Synthesizer is implemented as a **React frontend** backed by an **Express API**, with a clearly defined synthesis pipeline and observability layer.

---

### High-Level Architecture

#### Frontend (React)
The frontend manages the user journey and presentation layer. Its responsibilities include:

- Accepting meeting transcripts (paste or example load)
- Initiating synthesis requests
- Displaying streaming synthesis progress in real time
- Rendering structured outputs:
  - Summary
  - Action items
  - Decisions
  - Open questions
- Allowing users to edit synthesized content locally
- Exporting results to Markdown
- Loading previously saved synthesis runs (history)

The frontend treats AI output as **editable draft data**, not authoritative truth.

---

#### Backend (Express)
The backend owns synthesis logic, validation, and persistence. Its responsibilities include:
- Receiving raw transcript text
- Executing a multi-stage synthesis pipeline:
  - Preprocess → Extract → Parse → Validate → Normalize → Enrich
- Interfacing with the LLM provider (Gemini)
- Hardening probabilistic output using deterministic schema validation
- Streaming synthesis progress via Server-Sent Events (SSE)
- Persisting completed synthesis runs to SQLite
- Returning structured results and metadata

The backend is explicitly designed to separate:
- Probabilistic extraction (LLM output)
from
- Deterministic validation and normalization (Zod schemas)

This separation improves reliability, testability, and debuggability.

---

### Architecture Flow Summary
Non-Streaming
`User → React UI → Express API → LLM → Validation → JSON → React UI`

Streaming (SSE)
```
User → React UI → Express API
                  ↳ stream: meta / delta / final
                  ↳ persist final result
``` 

## Definitions

### Backend API

#### Endpoint List (MVP)

| Method | Endpoint              | Description                                   |
|------|-------------------------|-----------------------------------------------|
| POST | `/api/synthesize`       | Takes raw notes and returns structured output |
| POST | `/apy/synthesize/stream`| Streaming synthesis via SSE                   |
| GET  | `/api/runs`             | List recent synthesis runs                    |
| GET  | `/api/runs/run_id`      | Load a specific synthesis run                 |

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
    "source_length": 0,
    "warnings": ["string"]
  }
}
```
## `POST/api/synthesize/stream`
The streaming endpoint uses Server-Sent Events to provide incremental feedback during synthesis.

**Streamed Events**

| Event  | Description |
|------|-------------|
| `meta`  | Run metadata and warnings |
| `delta` | Human-readable progress updates |
| `final` | Final validated synthesis result |
| `error` | Terminal error message |

The final event payload matches the synchronous `/api/synthesize` response schema exactly.

---

## Persistence Layer

### Run Storage (MVP)

- SQLite database

Each run stores:
- Input text
- Source type
- Full synthesis result
- Metadata (timestamps, model, prompt version)

Runs can be reloaded via the **History UI** to support iteration and comparison.

---

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
- SQLite-backed run records
- No external logging system required

## Error Handling

### Frontend errors
- Empty input → Disable synthesize button + toast
- Network or streaming failure → Non-blocking error notification
- Partial extraction → Results shown with warnings

### Backend errors
- LLM failure or timeout → 502/500 with user-friendly message
- Invalid JSON from model → Retry once, else return 500
- Validation failures → Drop invalid items and include warnings in metadata

### UX Handling
- Loading screen displays: “This may take ~X seconds”
- Results page shows:

“Some items could not be extracted reliably”
when warnings are present 
 
Warnings are returned in `metadata.warnings` and displayed as a non-blocking banner.
Show a banner when `warnings.length > 0`

---

## Design Principles Reinforced

- AI assists; users decide
- Structured output is editable
- Probabilistic generation + deterministic validation
- Streaming improves trust and perceived responsiveness
- Persistence supports reflection and iteration