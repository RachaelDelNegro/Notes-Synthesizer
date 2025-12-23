## Personas

This section defines the core personas supported by the **Notes Synthesizer** application.  
Each persona maps directly to stages in the user journey and helps clarify responsibilities, permissions, and system interactions.

---

### Persona Overview

| Name             | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| Notes Contributor | User who provides raw meeting notes or transcripts to be synthesized         |
| Notes Reviewer    | User who reviews, edits, and validates synthesized outputs                   |
| Notes Consumer    | User who reads exported or saved synthesized notes but does not edit them    |
| System Observer   | Non-interactive role representing logging, auditing, and system introspection|

---

### Persona Descriptions

#### Notes Contributor
**Role:** Input Provider  
**Primary Goal:** Convert raw meeting notes into a structured synthesis

**Responsibilities:**
- Upload or paste raw meeting notes or transcripts
- Initiate the synthesis process
- Ensure the provided input reflects the meeting content

**Mapped User Journey Steps:**
- Preparing Meeting Notes
- Inputting Notes into the Application
- Initiating Synthesis

---

#### Notes Reviewer
**Role:** Validator and Editor  
**Primary Goal:** Ensure synthesized outputs are accurate, clear, and actionable

**Responsibilities:**
- Review synthesized summaries, action items, decisions, and blockers
- Edit extracted content (e.g., ownership, deadlines, wording)
- Validate outputs against original source notes
- Regenerate synthesis if needed

**Mapped User Journey Steps:**
- Reviewing Synthesized Results
- Editing and Validation by the User

---

#### Notes Consumer
**Role:** Information Consumer  
**Primary Goal:** Quickly understand meeting outcomes without editing content

**Responsibilities:**
- Read finalized synthesized notes
- Reference summaries, action items, and decisions
- Use exported outputs for follow-up work

**Mapped User Journey Steps:**
- Taking Next Actions
- Viewing Saved or Exported Results

---

#### System Observer
**Role:** Non-Interactive System Role  
**Primary Goal:** Ensure transparency, reliability, and accountability of the system

**Responsibilities:**
- Log synthesis requests and system events
- Capture processing metadata (e.g., timestamps, input size, output structure)
- Support auditing, debugging, and performance monitoring

**Mapped User Journey Steps:**
- Processing and Feedback
- All background system operations

---

### Persona-to-Journey Mapping Summary

| User Journey Stage              | Contributor | Reviewer | Consumer | System Observer |
|--------------------------------|-------------|----------|----------|-----------------|
| Preparing Meeting Notes        | ✓           |          |          |                 |
| Inputting Notes                | ✓           |          |          | ✓               |
| Initiating Synthesis           | ✓           |          |          | ✓               |
| Processing and Feedback        |             |          |          | ✓               |
| Reviewing Synthesized Results  |             | ✓        |          |                 |
| Editing and Validation         |             | ✓        |          | ✓               |
| Taking Next Actions            |             | ✓        | ✓        |                 |

---
