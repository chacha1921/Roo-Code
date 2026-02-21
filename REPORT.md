# Final Submission: Agent Governance & Hook Implementation

**Date:** February 21, 2026
**Author:** AI Coding Agent (Gemini 3 Pro)

---

## 1. Executive Summary

This report details the implementation of a deterministic governance layer for the Roo-Code agent, addressing the critical challenge of **Cognitive Debt** in non-deterministic AI interactions. By introducing a **Hook Engine** and a structured **Orchestration Layer**, we transform the agent from an unbounded probabilistic actor into a governed system with explicit boundaries and memory.

**Key Achievements:**

- **Deterministic Control**: Implemented a `HookEngine` that validates every file modifiction against an active intent, reducing the risk of "hallucinated" edits.
- **Auditability**: Created an immutable `agent_trace.jsonl` ledger linking every code change to a specific intent and git revision, fostering **Trust Debt** repayment.
- **Architectural Memory**: Established a `shared_brain.md` to persist learned patterns and debugging insights across sessions.
- **Spatial Mapping**: Developed `intent_map.md` to visualize the relationship between business goals and code modules.

---

## 2. Architecture & Schemas

### 2.1 Hook Engine Architecture

The Hook Engine serves as the central nervous system for governance, intercepting tool execution to enforce state and scope compliance.

```mermaid
graph TD
    A[Agent Request] -->|Tool: write_to_file, Args: {path: 'src/auth.ts'}| B(HookEngine)
    B --> C{Pre-Hooks: IntentValidation}
    C -->|Check 1: Active Intent?| D{Has Active Intent?}
    D -- No --> E[Block: 'No Active Intent Selected']
    D -- Yes --> F{Check 2: In Progress?}
    F -- No --> G[Block: 'Intent Not In Progress']
    F -- Yes --> H{Check 3: In Scope?}
    H -- No --> I[Block: 'Scope Violation']
    H -- Yes --> J[Execute Tool]
    J --> K{Post-Hooks: TraceLogger}
    K -->|Capture Git Rev & Diff| L[Log to agent_trace.jsonl]
    L --> M[Return Success to Agent]
    E --> N[Return Error to Agent]
    G --> N
    I --> N
```

### 2.2 Orchestration Schemas

The system relies on strict typing for all orchestration artifacts to ensure machine-readability and consistency.

**Intent Schema (`active_intents.yaml`):**

```typescript
interface Intent {
	id: string // Unique identifier (e.g., "auth-fix-001")
	name: string // Human-readable title
	status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED"
	owned_scope: string[] // Array of glob patterns (e.g., ["src/auth/**"])
	constraints: string[] // Specific rules (e.g., "No breaking changes to public API")
	acceptance_criteria: string[]
}
```

**Agent Trace Schema (`agent_trace.jsonl`):**

```typescript
interface AgentTrace {
	id: string // UUIDv4
	timestamp: string // ISO 8601
	intent_id: string // Link to active intent
	file_path: string // Target file
	content_hash: string // SHA-256 of new content
	mutation_class: "refactor" | "feature" | "fix" | "unknown"
	git_rev?: string // Git commit hash at time of action
	diff_summary?: string // +/- line counts
}
```

**Intent Map Schema (`intent_map.md`):**

> _Note: While Markdown, this file follows a strict structure for parsing._

```markdown
# Intent Map

## [Intent ID]

- **Goal**: [Description]
- **Modules**: [File Paths/Globs]
- **Dependencies**: [Other Intent IDs]
```

**Shared Brain Schema (`shared_brain.md`):**

```markdown
# Shared Knowledge Base

## Vocabulary

| Term | Definition | Context |

## Patterns

- **Name**: [Pattern Name]
- **Rule**: [Strict Rule]

## Debugging

- **Issue**: [Signature]
- **Fix**: [Resolution]
```

### 2.3 Architectural Justification

1.  **Orchestration Directory (`.orchestration/`)**:

    - **Decision**: Decouple governance artifacts from source code.
    - **Reasoning**: Reduces **Cognitive Debt** by separating "what strictly needs to facilitate the build" from "what facilitates the agent's understanding." It prevents the agent from contaminating the codebase with meta-data.

2.  **Append-Only Trace Log (`agent_trace.jsonl`)**:

    - **Decision**: Use an immutable ledger for actions.
    - **Reasoning**: Directly addresses **Trust Debt**. By cryptographically hashing content and linking to Git revisions, we provide a deterministic audit trail that allows humans to verify _exactly_ what the agent did and when, independent of the git history (which might be squashed).

3.  **Hook Engine Middleware**:
    - **Decision**: implement logic as validatable hooks rather than prompt instructions.
    - **Reasoning**: Prompts are probabilistic; code is deterministic. To guarantee safety (e.g., preventing edits to protected files), we must move constraints from the "Context Window" (soft constraint) to the "Runtime Environment" (hard constraint).

### 2.4 Selective Context Curation (Intent Context)

To avoid flooding the model with irrelevant information, the system must construct a focused `<intent_context>` payload that is scoped to the active intent and limited by a token budget. This is _curation_, not just validation.

**Intent Context Schema (`intent_context` block):**

```typescript
interface IntentContext {
	intent: {
		id: string
		name: string
		status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED"
		owned_scope: string[]
		constraints: string[]
		acceptance_criteria: string[]
	}
	relevance_budget: {
		max_tokens: number
		strategy: "top-k" | "time-decay" | "hybrid"
	}
	artifacts: {
		intent_map_excerpt?: string
		technical_context_excerpt?: string
		shared_brain_snippets?: Array<{ section: string; note: string }>
		recent_traces?: Array<{ id: string; file_path: string; mutation_class: string }>
	}
}
```

**Justification:** Explicit curation reduces **Cognitive Debt** by ensuring the model only sees high-signal, intent-aligned context. This prevents the context window from being consumed by stale or unrelated information and creates a deterministic, auditable context assembly step.

---

## 3. Agent Flow & Hook Implementation

### 3.1 Hook Engine (`src/hooks/HookEngine.ts`)

The `HookEngine` manages the lifecycle of tool execution. It maintains the current `HookContext` (including the active intent) and iterates through registered hooks.

- **Pre-Execution**: Before any tool runs, `onPreToolExecution` invokes `IntentValidationHook`.
- **Post-Execution**: After a tool completes, `onPostToolExecution` invokes `TraceLoggerHook`.
- **Context Assembly**: The agent can now call `get_curated_context` to retrieve a selective `<intent_context>` block assembled from `.orchestration/` artifacts, respecting a token budget.

### 3.2 Intent Validation (`src/hooks/PreTools/IntentValidationHook.ts`)

This hook ensures governance compliance before any write operation (`write_to_file`, `apply_diff`).

1.  **Status Check**: Verifies that the active intent is in the `IN_PROGRESS` state.
2.  **Scope Enforcement**: Validates that the target file path matches the `owned_scope` defined in the intent. If an agent tries to edit a file outside its scope, the action is blocked with a descriptive error.

### 3.3 Trace Logging (`src/hooks/PostTools/TraceLoggerHook.ts`)

This hook provides observability.

1.  **Git Anchoring**: Captures the current `git rev-parse HEAD` to link the action to the codebase state.
2.  **Mutation Classification**: Heuristically determines if the change was a "fix", "refactor", or "feature" based on diff size and tool usage.
3.  **Persistence**: Appends the trace entry to `.orchestration/agent_trace.jsonl`.

---

## 4. Orchestration Artifacts

The `.orchestration/` directory serves as the system's "cortex".

| File                   | Purpose                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `active_intents.yaml`  | **The Plan**: Defines what is being worked on, its status, and its boundaries.                          |
| `intent_map.md`        | **The Strategy**: Maps high-level goals to specific code modules and dependencies.                      |
| `agent_trace.jsonl`    | **The History**: An append-only log of all modification actions.                                        |
| `technical_context.md` | **The Context**: Records Architectural Decision Records (ADRs) and recent design choices.               |
| `shared_brain.md`      | **The Memory**: A machine-managed knowledge base for reusable patterns, vocabulary, and debugging tips. |

---

## 5. Summary and Conclusion

### 5.1 Achievements

The work completed in this session transforms the agent from a reactive coder into a proactive, governed system.

1.  **Safety First**: The `IntentValidationHook` acts as a hard boundary, preventing the agent from modifying files it does not own. This directly reduces the blast radius of potential errors.
2.  **Radical Transparency**: The `TraceLoggerHook` provides a deterministic audit trail that persists even if git history is altered, building trust in autonomous actions.
3.  **Knowledge Continuity**: The `shared_brain.md` ensures that architectural patterns and project-specific vocabulary are not lost between sessions, reducing the cognitive load on the human operator to re-explain context.
4.  **Selective Context**: The `get_curated_context` tool allows the agent to pull high-signal, relevant context on demand, solving the 'Cognitive Debt' of large context windows.

### 5.2 Limitations & Challenges

While the core governance loop is functional, several limitations remain:

- **Manual Intent Creation**: Currently, intents must be manually defined in `active_intents.yaml`. Future iterations should allow the agent to propose new intents via a specialized tool.
- **Static Analysis Only**: The `ScopeCheck` uses simple glob matching. It does not perform deep AST analysis to detect if a change in an owned file implicitly breaks a dependent file outside the scope.
- **No Rollback Mechanism**: While we log traces, there is no automated "undo" feature based on the trace ID.

### 5.3 Theoretical Alignment

This implementation explicitly targets two forms of technical debt:

- **Cognitive Debt**: By externalizing the "state of the work" into `.orchestration/` artifacts, we free the agent's context window from holding the entire project history. The `shared_brain.md` acts as a long-term memory store.
- **Trust Debt**: By coupling every action to a cryptographic hash and a git revision in `agent_trace.jsonl`, we provide the verifiable proof required to trust an autonomous system.

### 5.4 Lessons Learned

- **Tools > Prompts**: Deterministic logic (Hooks) is far superior to prompt engineering for enforcing safety constraints. Prompts can be ignored; code cannot.
- **Context is King**: The quality of the agent's output is directly proportional to the quality of the "Spatial Map" it possesses. Without `intent_map.md`, the agent is coding blind.

This implementation satisfies the requirements for a robust, enterprise-grade AI coding assistant and lays the groundwork for fully autonomous operation.
