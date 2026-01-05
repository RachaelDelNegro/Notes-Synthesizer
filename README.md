# Notes Synthesizer
An end-to-end application that transforms unstructured meeting notes into structured, actionable outputs such as **action items, decisions, and open questions**.  
Rather than raw summarization, the system emphasizes **structured synthesis**—producing validated, explainable data objects that users can review, edit, persist, and export.

This project was built to explore **LLM-backed data pipelines**, system observability, and product-oriented AI design rather than prompt-only workflows.

[Intro Documentation](https://docs.google.com/document/d/1J16S8O1OiZSHXDA9ncjwuBZkhnqmvojvpCz6Yl_HH_I/edit?usp=sharing)

[Associated Maps](https://docs.google.com/spreadsheets/d/1vui22r4MFwIyGT7NRWnc56Q1NG9muh6NOQigZfNjEyw/edit?gid=0#gid=0)

## Demo
Short walkthrough demonstrating:
- Raw notes input
- Gemini-powered synthesis
- Structured outputs (actions, decisions, questions)
- Run history + reload

https://github.com/user-attachments/assets/fba8eba7-aa81-48fa-8998-5950d14afad4

## Key Features
- Paste or upload raw meeting notes or transcripts
- Synthesize structured outputs:
  - Summary
  - Action Items
  - Decisions
  - Open Questions
- Client-side editing before persistence
- Export results as Markdown
- Full traceability: each extracted item links back to source text
- Run history with reloadable past syntheses (SQLite)
- Streaming support (Server-Sent Events) for progressive synthesis

---

## Architecture

**Frontend**
- React + Vite
- shadcn/ui (Radix primitives + Tailwind)
- Typed integration with backend response schema

**Backend**
- Express (Node.js)
- SQLite (better-sqlite3) for persistent run history
- Modular LLM adapter layer (Gemini implemented; others swappable)
- Clear separation between:
  - request validation
  - synthesis
  - persistence
  - metrics collection

**Pipeline**
preprocess → memory selection → LLM synthesis → validation → normalization → persistence

---

## Model & Performance

The backend integrates **Google Gemini (gemini-2.5-flash)** via a pluggable LLM adapter.

Measured on real usage data (persisted runs):

- **Average end-to-end latency:** ~3.3 seconds per synthesis
- **Average structured outputs per run:** ~3.9 items
- **Persistence latency:** ~1–2ms (SQLite)
- **LLM time dominates latency** (~99%), with negligible database overhead
- Metrics captured per run:
  - total latency
  - LLM execution time
  - memory selection time
  - database write time

Latency and item counts are recorded per run and stored alongside synthesis metadata for analysis and debugging.

---

## Run Locally

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker
The application supports containerized deployment using Docker Compose:
- Frontend served via Nginx
- Backend runs as a Node service
- SQLite persisted via volume mount
```bash
docker compose up --build
```

---

## Known Issues & Limitations
- Model assumption leak
  - "Due Date" in `Actions` may be inferred incorrectly if notes are ambigious
    -  Model does not know today's data unless provided in the notes
  - Streaming currently simulates token deltas (Gemini streaming not yet wired)

--- 

## Future Work
- Fine-grained confidence calibration per extracted item
- User-authenticated run ownership
- Dedicated metrics columns for analytics
- True token-level streaming from Gemini
- Evaluation harness for precision/recall on structured extraction
