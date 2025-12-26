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
    model TEXT NOT NULL,          -- Model used for synthesis
    metadata_json TEXT NOT NULL DEFAULT '{}'   -- Additional run metadata (timings etc)
);
```

### items
Stores all extracted items (action items, decisions, and questions) in a unified table:
```sql
CREATE TABLE items (
    item_id TEXT PRIMARY KEY,     -- UUID for the item
    run_id TEXT NOT NULL,         -- References synthesis_runs
    type TEXT NOT NULL,           -- 'action' | 'decision' | 'question'
    description TEXT NOT NULL,    -- The item's content (action/decision/question)
    source_text TEXT,            -- Original text snippet
    confidence REAL,             -- Extraction confidence score
    
    -- Action item specific fields (nullable for decisions/questions)
    owner TEXT,                  -- Assigned person/team
    due_date TEXT,              -- Optional due date
    priority TEXT,              -- 'low' | 'medium' | 'high'
    
    FOREIGN KEY (run_id) REFERENCES synthesis_runs(run_id),
    CHECK (type IN ('action', 'decision', 'question')),
    CHECK (
        (type = 'action') OR
        (type IN ('decision', 'question') AND owner IS NULL AND due_date IS NULL AND priority IS NULL)
    )
);
```

## Design Notes

1. **Unified Item Storage**
   - Single table handles all item types (actions, decisions, questions)
   - Type field clearly distinguishes between different items
   - CHECK constraints ensure data integrity and proper field usage
   - Reduces schema complexity while maintaining data organization

2. **Simple Foreign Key Relationships**
   - All items link back to synthesis_runs through run_id
   - Maintains clean one-to-many relationship structure

3. **Source Text Traceability**
   - Each extracted item includes source_text
   - Enables verification and context preservation
   - Helps users validate extraction accuracy

4. **Confidence Scoring**
   - Confidence fields help identify potentially unreliable extractions
   - Consistent scoring across all item types
   - Clients can use this for UI feedback and filtering

5. **Type-Specific Fields**
   - Action items have additional fields (owner, due_date, priority)
   - CHECK constraints prevent these fields from being used with other types
   - Maintains data integrity while sharing common structure

6. **Text-Heavy Design**
   - SQLite TEXT type used for most fields
   - UUIDs stored as TEXT for simplicity
   - ISO format dates stored as TEXT

## API Considerations

The unified schema supports these key operations:
- Creating new synthesis runs
- Adding items of any type to a run
- Retrieving items by type or across all types
- Filtering items by various criteria
- Loading complete run results
- Querying runs by date/metadata

## Future Extensibility

While keeping v1 minimal, the schema could later expand to support:
- User authentication and run ownership
- Persistent edits and revision history
- Tags/categories for items and runs
- Related item linking
- Custom metadata fields per item type
- Status tracking for items