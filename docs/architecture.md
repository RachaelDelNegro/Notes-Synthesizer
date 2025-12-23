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

## 8. Definitions

### 8.1 Backend API

#### 8.1.1 Endpoint List (MVP)

| Method | Endpoint              | Description                                   |
|------|-----------------------|-----------------------------------------------|
| POST | `/api/synthesize`     | Takes raw notes and returns structured output |
| GET  | `/api/examples`       | Returns list of built-in example transcripts  |
| GET  | `/api/examples/:id`   | Returns the text of a selected example        |

---

#### 8.1.2 `POST /api/synthesize` Contract

##### Request
```json
{
  "text": "string",
  "sourceType": "pasted | uploaded | example",
  "options": {
    "includeConfidence": true,
    "includeSourceText": true
  }
}

##### Response
{
  "runId": "string",
  "summary": ["string"],
  "actionItems": [
    {
      "id": "string",
      "description": "string",
      "owner": "string",
      "dueDate": "string|null",
      "priority": "low|medium|high",
      "sourceText": "string",
      "confidence": 0.0
    }
  ],
  "decisions": [
    {
      "description": "string",
      "sourceText": "string",
      "confidence": 0.0
    }
  ],
  "questions": [
    {
      "description": "string",
      "sourceText": "string",
      "confidence": 0.0
    }
  ],
  "metadata": {
    "createdAt": "ISO string",
    "promptVersion": "string",
    "model": "string",
    "stageTimingsMs": {
      "preprocess": 0,
      "extract": 0,
      "validate": 0
    }
  }
}

