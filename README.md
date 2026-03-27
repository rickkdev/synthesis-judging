# Synthesis Judging - AI Judge System

This repository contains the judging infrastructure for evaluating hackathon project submissions using AI agents (particularly OpenClaw agents). Each agent evaluates batches of 10 projects and produces structured judgments with scores and rationale.

## Overview

- **projects.csv** - All hackathon submissions (800+ projects)
- **prd.json** - Product Requirements Document defining judging criteria, user stories (batches), and output format
- **judgments/** - Output directory for completed judgments (one JSON file per batch)

## How to Use This System (For AI Agents)

### Step 1: Read prd.json

Start by reading `prd.json` to understand:

1. **Project description** - What you're judging and why
2. **Judging criteria** - The 5 dimensions you'll score each project on (1-10 scale)
3. **User stories** - Batches of 10 projects (JUDGE-001, JUDGE-002, etc.)
4. **Output format** - Structure of the judgment JSON you'll produce

### Step 2: Select a User Story (Batch)

Each user story in `prd.json` represents one batch of 10 projects to judge. Pick one that hasn't been completed yet:

```json
{
  "id": "JUDGE-001",
  "title": "Judge projects batch 1",
  "project_ids": ["550", "67", "143", ...],
  "project_names": ["TeliGent", "Crustocean", ...],
  "priority": 1,
  "passes": false
}
```

Check `judgments/` directory to see which batches are already done.

### Step 3: Extract Project Data

Read the corresponding `batch<N>.csv` or `batch<N>_projects.json` file for detailed project information. Each project includes:

- **id** - Unique project identifier
- **name** - Project name
- **description** - Full project description including problem statement
- **deployed_url** - Live deployment (if available)
- **repo_url** - GitHub repository
- **video_url** - Demo video (if available)
- **conversation_log** - Human-agent collaboration history
- **submission_metadata** - Technical details (tools, commits, agent framework)

Alternatively, you can extract these projects directly from `projects.csv` using the project_ids from the user story.

### Step 4: Evaluate Each Project

For each of the 10 projects in your batch, score them on **5 criteria** (each 1-10):

#### 1. Innovation (1-10)
- How novel and creative is the project?
- Does it introduce new concepts, architectures, or combinations?
- Is the core idea genuinely original or derivative?

#### 2. Execution (1-10)
- How well-built and functional is the project?
- Is it deployed and working, or just a concept?
- Code quality, test coverage, production readiness?
- Evidence of real usage/traction?

#### 3. Impact (1-10)
- What is the potential impact or usefulness?
- Does it solve a real problem people care about?
- How many users/agents could benefit?
- Is the impact measurable or theoretical?

#### 4. Presentation (1-10)
- How well is the project described and documented?
- Clear problem statement and solution?
- Quality of README, demo video, deployment?
- Completeness of submission materials?

#### 5. Agent Use (1-10)
- How effectively does the project use AI agents?
- Are agents first-class participants or just decorative?
- Autonomous behavior, multi-agent coordination?
- Does the agent design show sophistication?

### Step 5: Write Rationale

For each criterion, write a 2-4 sentence rationale explaining your score. Good rationale:

- **Cites specific evidence** from the submission (commits, deployment, features)
- **Compares** to other projects when relevant
- **Identifies** both strengths and weaknesses
- **Justifies** the numeric score

Example:
```json
{
  "innovation": "Novel combination of deterministic scam detection + AI fallback + real-time learning. The 'threat intelligence as API services' for agent-to-agent commerce is creative. ERC-8004 identity + multi-protocol integration shows systems thinking."
}
```

### Step 6: Write Summary Judgment

Write a 3-5 sentence summary that:
- Captures the project's core contribution
- Highlights the strongest aspects
- Notes any concerns or weaknesses
- Provides an overall assessment

### Step 7: Identify Strengths and Concerns

List 3-5 **notable_strengths** (specific, evidence-based)
List any **concerns** (weaknesses, gaps, risks)

### Step 8: Generate Output JSON

Create a JSON file at `judgments/<story_id>.json` with this structure:

```json
{
  "batch_id": "JUDGE-001",
  "evaluated_at": "2026-03-27T20:08:00Z",
  "evaluator": "Your Agent Name",
  "projects": [
    {
      "project_id": "550",
      "project_name": "TeliGent",
      "scores": {
        "innovation": 8,
        "execution": 9,
        "impact": 9,
        "presentation": 9,
        "agentUse": 9
      },
      "rationale": {
        "innovation": "...",
        "execution": "...",
        "impact": "...",
        "presentation": "...",
        "agentUse": "..."
      },
      "summary": "...",
      "notable_strengths": [
        "Strength 1",
        "Strength 2"
      ],
      "concerns": [
        "Concern 1 (if any)"
      ]
    },
    // ... 9 more projects
  ]
}
```

## Judging Philosophy

### Be Fair and Rigorous
- **Read thoroughly** - Look at deployed URL, repo, video, conversation log
- **Compare fairly** - A deployed, working project beats a beautiful idea with no code
- **Cite evidence** - Every score should be backed by specific observations
- **Be consistent** - Apply the same standards across all projects in your batch

### Distinguish Proof-of-Concept from Production
- **POC** (5-7 range) - Works locally, no deployment, no users, conceptual
- **Beta** (7-8 range) - Deployed, functional, some usage/testing
- **Production** (8-10 range) - Live, real users, measurable traction, battle-tested

### Value Real Agent Sophistication
- **Decoration** (4-6) - Agent is a wrapper around API calls, no autonomy
- **Functional** (6-8) - Agent has real decision-making, multi-step reasoning
- **Advanced** (8-10) - Multi-agent coordination, autonomous behavior, agent-to-agent commerce

### Watch for Red Flags
- No deployed URL and no video → likely incomplete (dock execution points)
- Generic description without specifics → poor presentation
- "Will do X" vs "Did X" → vaporware vs shipped (huge difference)
- Overclaiming impact without evidence → dock impact points

## Example Workflow (OpenClaw Agent)

```bash
# 1. Read the PRD
cat prd.json

# 2. Pick a batch that needs judging
ls judgments/  # See what's done
# Pick JUDGE-002 (not yet in judgments/)

# 3. Extract the 10 projects for JUDGE-002
# Read batch2_projects.json or extract from projects.csv using project_ids from prd.json

# 4. For each project:
#    - Read description, problem statement, technical details
#    - Visit deployed_url if available
#    - Check repo_url for code quality, commits
#    - Watch video_url if available
#    - Read conversation_log for context
#    - Score on 5 criteria with detailed rationale

# 5. Generate judgments/JUDGE-002.json with all 10 project evaluations

# 6. Commit and push
git add judgments/JUDGE-002.json
git commit -m "Complete JUDGE-002 evaluation"
git push
```

## Quality Standards

Your judgments should be:

1. **Specific** - Cite project features, commits, metrics, not generics
2. **Evidence-based** - Every claim backed by observable facts
3. **Comparative** - When relevant, compare to similar projects in the batch
4. **Balanced** - Acknowledge both strengths and weaknesses
5. **Consistent** - Similar projects get similar scores

## Common Pitfalls to Avoid

❌ **Vague rationale** - "Good execution" → Why? What evidence?
❌ **Score inflation** - Don't give 10s unless truly exceptional
❌ **Ignoring deployment** - A working demo beats a perfect README
❌ **Agent theater** - Don't reward "agent" marketing over actual agent sophistication
❌ **Theoretical impact** - "Could help millions" → How many does it help today?

## Files Reference

- **prd.json** - Master judging specification (read this first!)
- **projects.csv** - All 800+ projects with full details
- **batch1.csv, batch1_projects.json, etc.** - Pre-extracted project data per batch
- **judgments/*.json** - Completed evaluations (one per batch)

## Questions?

If you're an AI agent working through this:
1. Read `prd.json` in full before starting
2. Look at `judgments/JUDGE-001.json` as a reference example
3. Follow the 5-criteria scoring system strictly
4. Write detailed, evidence-based rationale
5. Be fair, rigorous, and consistent

The goal: produce judgments that help identify the best projects based on innovation, execution, impact, presentation, and agent sophistication.

---

**For humans reviewing agent judgments:** Check that rationale cites specific evidence, scores are justified and consistent, and the agent distinguished between shipped projects and concepts.
