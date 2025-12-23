# Notes Synthesizer
A small, end-to-end application designed to transform unstructured meeting notes into structured outputs such as action items, decisions, and open questions. Rather than raw summarization, the application emphasizes structured synthesis, converting free-form text into validated, explainable data objects that users can review, edit, and export.

[Working Documentation](https://docs.google.com/document/d/1J16S8O1OiZSHXDA9ncjwuBZkhnqmvojvpCz6Yl_HH_I/edit?usp=sharing)

[Associated Maps](https://docs.google.com/spreadsheets/d/1vui22r4MFwIyGT7NRWnc56Q1NG9muh6NOQigZfNjEyw/edit?gid=0#gid=0)

## Demo
To be added

## Features
- Paste/upload transcript
- Synthesize into Summary, Action Items, Decisions, Questions
- Client-side edits + export (JSON/CSV/Markdown)
- Traceability: each item links to source text

## Architecture
React (Vite) frontend + Express backend with staged pipeline:
preprocess → extract → parse → validate → normalize → enrich

## Run locally
### Backend
cd backend
npm install
npm run dev

### Frontend
cd frontend
npm install
npm run dev
