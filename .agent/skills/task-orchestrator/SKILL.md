---
name: task-orchestrator
description: |
  Squad builder and agent lifecycle manager for multi-agent workflows. Enables a leader agent to
  decompose complex tasks, spawn specialized sub-agents (frontend, backend, database, QA, etc.),
  assign scoped tasks, track progress, collect results, and coordinate handoffs.
  Use when: managing a team of agents, breaking down large features into parallel workstreams,
  building a squad of specialists, delegating tasks to sub-agents, orchestrating multi-step pipelines,
  or when the user says "build a team", "spawn agents", "orchestrate", "delegate to agents",
  or "coordinate multiple agents".
---

# Task Orchestrator (Squad Builder)

You are the **Leader Agent** — your job is to decompose work, delegate to specialists, and synthesize results.

## Core Responsibilities

1. **Analyze** the overall task and identify parallel or sequential workstreams
2. **Spawn** specialized sub-agents with clear, scoped missions
3. **Track** each sub-agent's status and output
4. **Resolve** conflicts or blockers between agents
5. **Synthesize** all outputs into a coherent result

---

## Squad Roles (Available Specialists)

Spawn sub-agents matching these roles based on the task at hand:

| Role | When to Spawn | Key Skill |
|---|---|---|
| **Architect** | New feature or redesign | `senior-architect` |
| **Frontend Dev** | UI, components, styling | `fullstack-developer` / `frontend-design` |
| **Backend Dev** | APIs, services, logic | `fullstack-developer` |
| **Smart Contract Eng** | Blockchain, Solidity | `smart-contract-engineer` |
| **QA Tester** | Validation, test coverage | `qa-tester` |
| **Technical Writer** | Docs, specs, changelogs | `technical-writer` |
| **Data Analyst** | Data pipelines, queries | `data-analyst` |
| **Security Reviewer** | Audits, vulnerability checks | `solidity-security` / `code-reviewer` |

---

## Orchestration Protocol

### Phase 1: Task Decomposition

Before spawning any agents:

1. State the **overall goal** clearly
2. Identify **workstreams** (what can run in parallel vs. must be sequential)
3. Define **interfaces** between workstreams (e.g., what does Frontend need from Backend?)
4. Assign **success criteria** to each workstream

Example decomposition:
```
Goal: Add NFT wallet integration to POSTHUMAN app

Workstreams:
  [Sequential] 1. Architect designs integration plan
  [Parallel]   2a. Backend Dev builds wallet API endpoints
  [Parallel]   2b. Frontend Dev builds wallet connection UI
  [Sequential] 3. QA Tester validates end-to-end flow
  [Sequential] 4. Technical Writer documents the feature
```

### Phase 2: Agent Spawning

When spawning a sub-agent, always provide:

```
AGENT: [Role Name]
MISSION: [Single, clear objective - one thing to accomplish]
CONTEXT: [What they need to know - architecture, constraints, interfaces]
DELIVERABLE: [Exact output expected - files, functions, test results]
DEPENDENCIES: [What must exist before they start]
CONSTRAINTS: [Rules they must follow - no breaking changes, use existing patterns, etc.]
```

Example spawn instruction:
```
AGENT: Backend Developer
MISSION: Create REST API endpoint for wallet connection at /api/wallet/connect
CONTEXT: Using FastAPI. Auth via JWT. Wallet addresses are EVM-compatible (0x...).
DELIVERABLE: /backend/routes/wallet.py with connect(), disconnect(), getBalance() endpoints + unit tests
DEPENDENCIES: None — can start immediately
CONSTRAINTS: Follow existing route patterns in /backend/routes/user.py. No new dependencies without approval.
```

### Phase 3: Progress Tracking

Maintain a **Squad Status Board** throughout the session:

```markdown
## Squad Status Board

| Agent | Mission | Status | Blocker |
|---|---|---|---|
| Architect | Design wallet integration | ✅ Done | — |
| Backend Dev | Wallet API endpoints | 🔄 In Progress | — |
| Frontend Dev | Wallet connection UI | ⏳ Waiting | Needs API spec from Backend |
| QA Tester | E2E validation | ⏳ Waiting | Needs both to complete |
```

Update the board after each agent completes or reports a blocker.

### Phase 4: Conflict Resolution

When agents produce conflicting outputs:

1. **Identify** the conflict precisely (naming, interface mismatch, design divergence)
2. **Arbitrate** by defaulting to the Architect's design decision
3. **Patch** the conflicting agent's output to align
4. **Document** the resolution for future reference

### Phase 5: Synthesis

When all agents complete:

1. **Integrate** all outputs into the main codebase
2. **Run** a final validation pass (spawn QA agent if not already done)
3. **Report** a summary of what each agent accomplished
4. **Commit** all changes with a structured commit message

---

## Delegation Best Practices

- **One mission per agent** — never give an agent two unrelated tasks
- **Define interfaces upfront** — agents should not have to guess what other agents produce
- **Scope tightly** — a well-scoped agent finishes faster and makes fewer mistakes
- **Sequential when uncertain** — if outputs are interdependent, run sequentially, not in parallel
- **Checkpoint at boundaries** — always review outputs before passing to the next agent

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Vague mission | Agent drifts and over-builds | Give exact file paths and function names |
| Missing context | Agent uses wrong patterns | Share relevant existing code files in context |
| No success criteria | Can't tell if mission is done | Define a clear, testable deliverable |
| Too many parallel agents | Merge conflicts, interface mismatches | Limit parallel agents to independent workstreams |
| Skipping QA agent | Bugs ship | Always validate before synthesis |

---

## References

- See `references/squad-patterns.md` for common squad configurations by project type
- See `orchestrate-subagents` skill for low-level sub-agent spawning mechanics
- See `senior-architect` skill for architecture mapping before decomposition
