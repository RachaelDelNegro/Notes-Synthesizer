# Database Schema Design

## Core Entities

### synthesis_runs
Stores metadata about each synthesis operation:
```sql
CREATE TABLE synthesis_runs (
    run_id TEXT PRIMARY KEY,      -- UUID for the run
    source_text TEXT NOT NULL,    -- Original input text
    source_type TEXT NOT NULL,    -- 'pasted' | 'uploaded' | 'example'
    created_at TEXT NOT NULL,     -- ISO timestamp
    prompt_version TEXT NOT NULL, -- Version of prompt used
    model TEXT NOT NULL,         -- Model used for synthesis
    metadata JSON                -- Additional run metadata (timings etc)
);
```

### action_items
Stores action items extracted from the synthesis:
```sql
CREATE TABLE action_items (
    item_id TEXT PRIMARY KEY,     -- UUID for the item
    run_id TEXT NOT NULL,         -- References synthesis_runs
    description TEXT NOT NULL,    -- The action to be taken
    owner TEXT,                   -- Assigned person/team
    due_date TEXT,               -- Optional due date
    priority TEXT,               -- 'low' | 'medium' | 'high'
    source_text TEXT,            -- Original text snippet
    confidence REAL,             -- Extraction confidence score
    FOREIGN KEY (run_id) REFERENCES synthesis_runs(run_id)
);
```

### decisions
Captures key decisions from the meeting:
```sql
CREATE TABLE decisions (
    decision_id TEXT PRIMARY KEY, -- UUID for the decision
    run_id TEXT NOT NULL,        -- References synthesis_runs
    description TEXT NOT NULL,   -- The decision made
    source_text TEXT,           -- Original text snippet
    confidence REAL,            -- Extraction confidence score
    FOREIGN KEY (run_id) REFERENCES synthesis_runs(run_id)
);
```

### questions
Tracks open questions and blockers:
```sql
CREATE TABLE questions (
    question_id TEXT PRIMARY KEY, -- UUID for the question
    run_id TEXT NOT NULL,        -- References synthesis_runs
    description TEXT NOT NULL,   -- The open question
    source_text TEXT,           -- Original text snippet
    confidence REAL,            -- Extraction confidence score
    FOREIGN KEY (run_id) REFERENCES synthesis_runs(run_id)
);
```

## Design Notes

1. **Simple Foreign Key Relationships**
   - All entities link back to synthesis_runs through run_id
   - No complex many-to-many relationships needed for v1

2. **Source Text Traceability**
   - Each extracted item (action/decision/question) includes source_text
   - Enables verification and context preservation

3. **Confidence Scoring**
   - Confidence fields help identify potentially unreliable extractions
   - Clients can use this for UI feedback

4. **Metadata Flexibility**
   - JSON metadata column allows for extensibility
   - Can store timing data, processing stats, etc.

5. **No Edit History**
   - Client-side edits aren't persisted
   - No need for revision tracking tables

6. **Text-Heavy Design**
   - SQLite TEXT type used for most fields
   - UUIDs stored as TEXT for simplicity
   - ISO format dates stored as TEXT

## API Considerations

The schema supports these key operations:
- Creating new synthesis runs
- Retrieving full run history
- Loading complete run results
- Querying runs by date/metadata

## Future Extensibility

While keeping v1 minimal, the schema could later expand to support:
- User authentication and run ownership
- Persistent edits and revision history
- Tags/categories for runs
- Related run linking
- Custom metadata fields