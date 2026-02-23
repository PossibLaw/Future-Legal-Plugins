# Real-World Plugin Examples

Examples from production plugins demonstrating best practices.

---

## 1. CLAUDE.md Examples

### Production Pattern: Payload CMS (40k+ stars)

```markdown
### Coding Patterns and Best Practices

- Prefer single object parameters (improves backwards-compatibility)
- Prefer types over interfaces (except when extending external types)
- Prefer functions over classes (classes only for errors/adapters)
- Prefer pure functions; when mutation unavoidable, return the mutated object
- Prefix booleans with `is`/`has`/`can`/`should` (e.g., `isValid`, `hasData`)
```

**Why it works:** Opinions WITH reasoning. The "why" is as important as the "what".

### Production Pattern: Dragonfly DB (30k+ stars)

```markdown
## Architecture Patterns

**Code Style**: `.clang-format` - snake_case vars, PascalCase functions

**DO**:
- Fiber-aware: `util::fb2::Mutex` → helio/util/fibers/
- Per-shard ops (no global state) → docs/df-share-nothing.md
- Command pattern → src/server/set_family.cc

**DON'T**:
- `std::thread`, `std::mutex` (deadlocks!)
- Global mutable state
- Edit without reading
- Skip tests
```

**Why it works:** Don't just tell what to avoid—show what to do instead with file paths.

### Production Pattern: MCP Python SDK (Anthropic, 21k+ stars)

```markdown
## Core Development Rules

1. Package Management
   - ONLY use uv, NEVER pip
   - Installation: `uv add <package>`
   - Running tools: `uv run <tool>`
   - FORBIDDEN: `uv pip install`, `@latest` syntax

## Exception Handling

- **Always use `logger.exception()` instead of `logger.error()`**
- **Catch specific exceptions:**
  - File ops: `except (OSError, PermissionError):`
  - JSON: `except json.JSONDecodeError:`
  - Network: `except (ConnectionError, TimeoutError):`
- **FORBIDDEN** `except Exception:` - unless in top-level handlers
```

**Why it works:** Tells you WHICH exceptions for WHICH operations. No vagueness.

### Production Pattern: FastMCP (22k+ stars)

```markdown
### Commit Messages and Agent Attribution

- **Agents NOT acting on behalf of @jlowin MUST identify themselves**
  (e.g., "Generated with Claude Code" in commits/PRs)
- Keep commit messages brief - ideally just headlines
- Focus on what changed, not how or why
```

**Why it works:** Tracks which contributions are agent-generated.

---

## 2. Command Examples

### /learn Command (Progressive Disclosure Pattern)

```markdown
---
description: Analyze conversation for learnings and save to docs folder
argument-hint: [optional topic hint]
model: claude-opus-4-5-20251101
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# Learn from Conversation

Analyze this conversation for insights worth preserving.

**If a topic hint was provided via `$ARGUMENTS`, focus on that.**

## Phase 1: Deep Analysis

Think deeply about what was learned:
- What new patterns or approaches were discovered?
- What gotchas or pitfalls were encountered?
- What architecture decisions were made and why?

Only capture insights that are:
1. **Reusable** - Will help in future situations
2. **Non-obvious** - Not already common knowledge
3. **Project-specific** - Relevant to this codebase

If nothing valuable was learned, say so and exit gracefully.

## Phase 2: Categorize & Locate

Read existing docs to find the best home. Look for a `docs/` folder.
If no existing doc fits, propose a new doc file with kebab-case naming.

## Phase 3: Draft the Learning

Format to match existing doc style:
- Clear heading describing the topic
- Concise explanation of the insight
- Code examples if applicable

## Phase 4: User Approval (BLOCKING)

Present your proposed changes and **wait for explicit approval**.

## Phase 5: Save

After approval, save the learning and confirm.
```

**Key patterns:**
- YAML frontmatter with tool restrictions
- Phased workflow with clear purposes
- User approval gate (Phase 4 blocks)
- Graceful exit option

### /code-review Command (Multi-Agent Pattern)

From the official code-review plugin:

```markdown
---
description: Review pull request with multi-agent analysis
allowed-tools: Bash(gh:*), Task, Read, Grep, Glob
---

# Code Review: $ARGUMENTS

## Step 1: Eligibility Check (Haiku)

Spawn Haiku agent to check:
- Is PR closed? → Skip
- Is PR draft? → Skip
- Is PR from bot? → Skip
- Already reviewed? → Skip

## Step 2: Gather Context (Haiku)

Find relevant CLAUDE.md files in changed paths.

## Step 3: Summarize Changes (Haiku)

Create brief summary of what changed.

## Step 4: Parallel Review (5 Sonnet Agents)

Spawn 5 agents **in parallel**:
1. CLAUDE.md compliance checker
2. Shallow bug scanner
3. Historical git context analyzer
4. Previous PR comments reviewer
5. Code comment compliance checker

## Step 5: Confidence Scoring (Haiku)

Score each issue 0-100:
- 0 = False positive
- 25 = Might be real
- 50 = Real but nitpick
- 75 = Very likely real
- 100 = Definitely real

## Step 6: Filter

Remove issues below 80% confidence.

## Step 7: Post Review

Use `gh pr review` to post comment.
```

**Key patterns:**
- Multi-agent orchestration
- Haiku for cheap/fast tasks
- Sonnet for deeper analysis
- Parallel spawning for speed
- Confidence scoring to filter noise

---

## 3. Skill Examples

### Microsoft Azure SDK Skill Pattern

```markdown
---
name: azure-ai-projects-py
description: Build AI applications using the Azure AI Projects Python SDK.
  Use when working with Foundry project clients, creating versioned agents,
  running evaluations. Triggers: "foundry", "project client", "ai projects".
package: azure-ai-projects
---

# Azure AI Projects Python SDK

## Installation

```bash
pip install azure-ai-projects azure-identity
```

## Authentication

```python
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

credential = DefaultAzureCredential()
client = AIProjectClient(
    endpoint=os.environ["AZURE_AI_PROJECT_ENDPOINT"],
    credential=credential,
)
```

## Client Operations Overview

| Operation | Access | Purpose |
|-----------|--------|---------|
| `client.agents` | `.agents.*` | Agent CRUD, threads, runs |
| `client.connections` | `.connections.*` | Project connections |
| `client.evaluations` | `.evaluations.*` | Run evaluations |

## Reference Files

| File | Contents |
|------|----------|
| [references/tools.md](references/tools.md) | Tool integrations |
| [references/streaming.md](references/streaming.md) | Event streaming |
```

**Key patterns:**
- Package field in frontmatter
- Consistent section order: Install → Auth → Operations → References
- Table format for quick scanning
- Explicit trigger phrases in description

### Acceptance Criteria Pattern (Microsoft)

```markdown
# Acceptance Criteria: azure-ai-projects-py

## 1. Correct Import Patterns

### 1.1 Client Imports

#### CORRECT: Main Client
```python
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
```

#### INCORRECT: Wrong Module Path
```python
from azure.ai.projects.models import AIProjectClient  # Wrong - not in models
```

## 2. Authentication Patterns

#### CORRECT: DefaultAzureCredential
```python
credential = DefaultAzureCredential()
client = AIProjectClient(endpoint, credential)
```

#### INCORRECT: Hardcoded Credentials
```python
client = AIProjectClient(endpoint, api_key="hardcoded")  # Security risk
```
```

**Key patterns:**
- Explicit CORRECT / INCORRECT examples
- Shows what TO do, not just what to avoid
- Used in test scenarios for validation

---

## 4. Hook Examples

### claude-reflect Hook Configuration

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/scripts/session_start_reminder.py\""
      }]
    }],
    "UserPromptSubmit": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/scripts/capture_learning.py\""
      }]
    }],
    "PreCompact": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/scripts/check_learnings.py\""
      }]
    }],
    "PostToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/scripts/post_commit_reminder.py\""
      }]
    }]
  }
}
```

**Key patterns:**
- `${CLAUDE_PLUGIN_ROOT}` for portable paths
- Different events for different purposes
- Matcher filters which tools trigger the hook

### guardrails Plugin (PossibLaw)

Production-ready safety hooks plugin using Python scripts with plugin-packaged `hooks.json`.

**Structure:**
```
possiblaw-guardrails/
├── .claude-plugin/plugin.json
├── hooks/hooks.json
├── scripts/
│   ├── blacklist.py         # Shared pattern lists
│   ├── validate-bash.py     # PreToolUse: Bash
│   ├── protect-files.py     # PreToolUse: Write|Edit
│   └── format-check.sh      # PostToolUse: Write|Edit
├── tests/
├── CLAUDE.md
└── README.md
```

**hooks.json (abridged):**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/scripts/validate-bash.py\""
        }]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/scripts/protect-files.py\""
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "bash \"${CLAUDE_PLUGIN_ROOT}/scripts/format-check.sh\""
        }]
      }
    ]
  }
}
```

**Key patterns:**
- Three-tier response: block (exit 2), escalate (`permissionDecision: "ask"`), approve (exit 0)
- Shared `blacklist.py` data module with `BLOCKED_PATTERNS`, `ESCALATE_PATTERNS`, and `PROTECTED_FILE_PATTERNS`
- Stop hook with inline prompt for task-completion validation
- `${CLAUDE_PLUGIN_ROOT}` for portable script paths
- PostToolUse auto-formatting (detects Prettier, Ruff, Black) with `suppressOutput: true`

**Install:** `claude plugin install possiblaw-guardrails --marketplace PossibLaw`

### Hookify Format Examples

**Block Destructive Commands:**
```markdown
---
name: block-destructive-ops
enabled: true
event: bash
pattern: rm\s+-rf|dd\s+if=|mkfs|format
action: block
---

**Destructive operation blocked**

This command can cause data loss. Please verify the exact path.
```

**Protect Sensitive Files:**
```markdown
---
name: protect-env-files
enabled: true
event: file
action: block
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.env$|credentials|secrets
  - field: new_text
    operator: contains
    pattern: KEY
---

**Sensitive file edit blocked**

Use environment variables instead of hardcoding credentials.
```

---

## 5. Sub-Agent Examples

### Research Agent Pattern (llms.txt)

```markdown
---
name: nuxt-content-specialist
description: >
  Use this agent when the task involves @nuxt/content v3 - implementing,
  modifying, querying, reviewing content management code.

  <example>
  user: "How do I query content by multiple tags?"
  assistant: "Let me use the nuxt-content-specialist agent."
  <commentary>
  Query capabilities require fetching current documentation.
  </commentary>
  </example>
model: opus
color: green
---

# Nuxt Content Specialist Agent

## Primary Domain
**@nuxt/content v3**: File-based content with Markdown support.

## Documentation Sources
- **Primary**: `https://content.nuxt.com/llms.txt`

## Operational Approach
1. **Fetch documentation index** from llms.txt
2. **Categorize inquiry** into domain
3. **Fetch targeted pages** (not everything)
4. **Review project context** (local files)
5. **Provide actionable guidance** with code examples

## Guidelines
- Prioritize official docs over training knowledge
- Reference documentation URLs consulted
- Verify API specifics against fetched docs
```

**Key patterns:**
- Example blocks in description help Claude match
- llms.txt fetch strategy
- Returns distilled guidance, not raw docs

---

## 6. Full Plugin Example

### claude-reflect Structure

```
claude-reflect/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── reflect.md            # Main review command
│   ├── reflect-skills.md     # Skill discovery
│   ├── skip-reflect.md       # Discard queue
│   └── view-queue.md         # View pending
├── hooks/
│   └── hooks.json            # Hook definitions
├── scripts/
│   ├── lib/
│   │   ├── reflect_utils.py
│   │   └── semantic_detector.py
│   ├── capture_learning.py
│   ├── check_learnings.py
│   ├── session_start_reminder.py
│   └── post_commit_reminder.py
├── SKILL.md
└── CLAUDE.md
```

### plugin.json

```json
{
  "name": "claude-reflect",
  "description": "Self-learning system that captures corrections and syncs to CLAUDE.md",
  "version": "1.0.0",
  "author": {
    "name": "bayramannakov"
  }
}
```

**Key patterns:**
- Commands for user-facing workflows
- Hooks for automatic capture
- Scripts for hook implementations
- `${CLAUDE_PLUGIN_ROOT}` in hook commands for portability

---

## Key Takeaways

1. **CLAUDE.md:** Keep it short, actionable, with safe alternatives
2. **Commands:** Phased workflows with approval gates
3. **Skills:** Specific triggers, progressive disclosure, reference files
4. **Hooks:** Portable paths, matched events, clear messages
5. **Agents:** llms.txt pattern, example blocks, distilled output
6. **Plugins:** Combine components, use `${CLAUDE_PLUGIN_ROOT}`
