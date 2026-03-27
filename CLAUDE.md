# Synthesis Hackathon Judging

## How to Judge a Story

Each user story in `prd.json` contains a batch of 10 project IDs to evaluate from `projects.csv`.

### Step-by-step

1. Read the story's `project_ids` array
2. For each project ID, find its row in `projects.csv` using Python:
   ```python
   import csv, sys, json
   csv.field_size_limit(sys.maxsize)
   with open('projects.csv') as f:
       reader = csv.DictReader(f)
       projects = {r['id']: r for r in reader}
   ```
3. Evaluate each project on these criteria (1-10 scale):
   - **Innovation**: How novel and creative is the approach?
   - **Execution**: How well-built and functional? Consider commit count, tools used, deployed URL presence
   - **Impact**: Potential usefulness and real-world value
   - **Presentation**: Quality of description, documentation, conversation log
   - **Agent Use**: How effectively does it leverage AI agents? Parse `submission_metadata` JSON for model, tools, agentHarness, agentFramework details
4. Write output to `judgments/JUDGE-XXX.json` in this format:
   ```json
   {
     "story_id": "JUDGE-001",
     "judged_at": "2026-03-27T...",
     "projects": [
       {
         "id": "550",
         "name": "TeliGent",
         "scores": {
           "innovation": 8,
           "execution": 9,
           "impact": 8,
           "presentation": 7,
           "agentUse": 8
         },
         "total": 40,
         "rationale": "Brief explanation of scores...",
         "verdict": "Strong / Average / Weak"
       }
     ]
   }
   ```
5. Quality check: validate the JSON is parseable before committing
6. Commit, update PRD passes to true, append progress

## Scoring Guidelines

- **9-10**: Exceptional, best-in-class
- **7-8**: Strong, well above average
- **5-6**: Average, meets basic expectations
- **3-4**: Below average, significant gaps
- **1-2**: Minimal effort or fundamentally broken

## Key Signals to Look For

- `submission_metadata.commitCount`: Higher = more sustained effort
- `deployed_url` present: Project is actually live
- `repo_url` present: Code is available for review
- `conversation_log`: Shows human-agent collaboration quality
- `video_url` / `pictures`: Extra presentation effort
- `description` depth: Problem statement, technical detail, innovation claims
- `submission_metadata.agentFramework` / `agentHarness`: How the agent was used
- Status must be "publish" (drafts are excluded from judging)

## Important

- Parse `submission_metadata` as JSON — it contains critical evaluation data
- CSV requires `csv.field_size_limit(sys.maxsize)` due to large description fields
- Be fair and consistent across batches — use the scoring guidelines above
- Each verdict should be one of: "Strong", "Average", "Weak"
