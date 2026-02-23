# Decision Tree: Choosing the Right Mechanism

Full questionnaire flow for determining which Claude Code extensibility mechanism to use.

---

## The Hierarchy (Always Consider First)

```
CLAUDE.md          ← Foundation (create first)
    ↓
Skills/Commands    ← Capabilities (build on foundation)
    ↓
Hooks              ← Enforcement (implement guardrails)
    ↓
References/Agents  ← Deep context (specialist knowledge)
```

**Rule:** If no CLAUDE.md exists, recommend creating it first before other components.

---

## Quick Decision Flow

```
Q1: Always-on rule OR task-specific capability?
    │
    ├─► Always-on ──────────────────────────► CLAUDE.md
    │
    └─► Task-specific
            │
            ▼
Q2: User triggers manually OR Claude auto-discovers?
    │
    ├─► Manual trigger ─────────────────────► Slash Command
    │
    └─► Auto-discover (warn: 56% miss rate)
            │
            ▼
Q3: Research-heavy OR quick action?
    │
    ├─► Research-heavy ─────────────────────► Sub-agent
    │
    └─► Quick action
            │
            ▼
Q4: Needs real-time enforcement?
    │
    ├─► Yes ────────────────────────────────► Hook
    │
    └─► No
            │
            ▼
Q5: Integrates with external systems?
    │
    ├─► Yes ────────────────────────────────► MCP Server or Research Agent
    │
    └─► No ─────────────────────────────────► Skill or Command
            │
            ▼
Q6: Reusable across projects?
    │
    ├─► Yes ────────────────────────────────► Official Plugin Package
    │
    └─► No ─────────────────────────────────► Project-level files
```

---

## Type-Specific Questions

### CLAUDE.md Questions

Ask these to generate a CLAUDE.md:

1. **Project name and one-line description**
   - "What is your project called and what does it do in one sentence?"

2. **Key commands**
   - "What commands do you run regularly? (build, test, lint, dev server, etc.)"
   - Get exact commands with flags, not just tool names

3. **Tech stack**
   - "What's your tech stack? Include versions if important."
   - Language, framework, database, key libraries

4. **Directory structure**
   - "What are your main directories and what do they contain?"
   - Focus on where code lives, where to write, where not to touch

5. **Boundaries**
   - "What should Claude always do automatically?"
   - "What should Claude ask before doing?"
   - "What should Claude never do? And what's the safe alternative?"

6. **Further reading** (optional)
   - "Are there docs or files Claude should read for specific topics?"

### Slash Command Questions

Ask these to generate a command:

1. **Command name**
   - "What should the command be called? (kebab-case, e.g., `deploy-staging`)"

2. **Purpose**
   - "What does this command do in one sentence?"

3. **Arguments**
   - "Does it take any arguments? What do they mean?"
   - If yes, provide argument-hint

4. **Tools needed**
   - "What tools does this command need?"
   - Options: Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, Task, AskUserQuestion

5. **Steps**
   - "What steps should Claude follow when this command runs?"
   - Get ordered list of actions

6. **Boundaries**
   - "What should this command always do?"
   - "What should it never do?"

### Skill Questions

Ask these to generate a skill:

1. **Skill name**
   - "What should this skill be called? (kebab-case)"

2. **Trigger conditions**
   - "When should Claude automatically use this skill?"
   - "What phrases or scenarios should trigger it?"
   - Note: Be very specific - vague triggers cause the 56% miss rate

3. **Purpose**
   - "What does this skill do? (50-100 words for the description)"

4. **Tools needed**
   - "What tools does this skill need?"

5. **Reference files**
   - "Does this skill need supporting documents or templates?"
   - If yes, plan the references/ folder structure

6. **Boundaries**
   - "What are the safe defaults, risky operations, and forbidden actions?"

### Hook Questions

Ask these to generate a hook:

1. **Event type**
   - "What event should trigger this hook?"
   - Options:
     - `bash` - Before shell commands run
     - `file` - Before file edits/writes
     - `prompt` - On user prompt submission
     - `stop` - When Claude tries to end session

2. **Pattern to match**
   - "What pattern should trigger the hook? (regex)"
   - Examples: `rm\s+-rf`, `\.env$`, `console\.log\(`

3. **Action**
   - "Should this block the operation or just warn?"
   - `block` = prevents operation
   - `warn` = shows message but allows

4. **Message**
   - "What message should appear when triggered?"

5. **Conditions** (advanced)
   - "Any additional conditions? (field, operator, pattern)"
   - Fields: `command`, `file_path`, `new_text`, `old_text`, `user_prompt`
   - Operators: `regex_match`, `contains`, `equals`, `not_contains`, `starts_with`, `ends_with`

**Tip:** For comprehensive safety hooks, consider installing the `guardrails` plugin instead of building from scratch. It includes pre-built patterns for destructive commands (12 blocked patterns), sensitive file protection (13 file patterns), escalation prompts (5 risky-but-not-fatal patterns), and auto-formatting. See `references/examples.md` for the full guardrails example.

### Sub-Agent Questions

Ask these to generate an agent:

1. **Agent name**
   - "What should this agent be called? (kebab-case)"

2. **Domain/specialty**
   - "What is this agent's area of expertise?"

3. **Documentation sources**
   - "What documentation should this agent consult?"
   - "Does the library have an llms.txt file?"
   - Check: `https://[domain]/llms.txt`

4. **Model**
   - "Which model should run this agent?"
   - `opus` - Most capable, highest cost
   - `sonnet` - Balanced
   - `haiku` - Fast, cheap, good for simple tasks

5. **Output format**
   - "What should this agent return? (summary, code, analysis, etc.)"

6. **Example scenarios**
   - "Give 1-2 examples of when to use this agent"
   - These go in the description for Claude to match

### Full Plugin Questions

Ask these to generate a plugin package:

1. **Plugin name**
   - "What should the plugin be called? (kebab-case)"

2. **Description**
   - "What does this plugin do? (one paragraph)"

3. **Components**
   - "Which components does this plugin include?"
   - [ ] Commands
   - [ ] Skills
   - [ ] Agents
   - [ ] Hooks

4. **Author info**
   - "Your name and email for attribution"

5. **Per-component questions**
   - For each selected component, ask the type-specific questions above

---

## Decision Helpers

### When to Use CLAUDE.md vs Skill

| Situation | Use |
|-----------|-----|
| Rule applies to ALL tasks in project | CLAUDE.md |
| Rule applies only to specific capability | Skill |
| Need to document project structure | CLAUDE.md |
| Need multi-step workflow | Skill or Command |
| Need to link to docs for deep dives | CLAUDE.md (Further Reading) |

### When to Use Command vs Skill

| Situation | Use |
|-----------|-----|
| User will remember to invoke it | Command |
| Should happen automatically when context matches | Skill |
| Critical workflow that must not be missed | Command (skills have 56% miss rate) |
| Takes explicit arguments | Command |
| Complex multi-phase workflow | Either (commands more reliable) |

### When to Use Hook vs CLAUDE.md Rule

| Situation | Use |
|-----------|-----|
| Must be enforced every time (no exceptions) | Hook |
| Guideline that can be overridden | CLAUDE.md |
| Need to block operation before it happens | Hook |
| Need visible warning mid-task | Hook |
| Just documenting preference | CLAUDE.md |

### When to Use Sub-Agent vs Direct Research

| Situation | Use |
|-----------|-----|
| Lots of reading/searching needed | Sub-agent (keeps main context clean) |
| Quick lookup | Direct (Grep, Read, WebFetch) |
| Need to synthesize multiple sources | Sub-agent |
| External documentation with llms.txt | Sub-agent (research pattern) |
| Want raw results in main context | Direct |

---

## Common Patterns

### The Research Agent Pattern

For libraries with documentation:

1. Check for `llms.txt` at documentation root
2. Create agent that fetches index first
3. Agent fetches specific pages based on query
4. Returns distilled, actionable guidance

### The Guardrail Pattern

For safety-critical rules:

1. Document in CLAUDE.md (human readable)
2. Implement as Hook (machine enforced)
3. Both work together - CLAUDE.md explains why, hook enforces

**Reference implementation:** The `guardrails` plugin (`claude plugin install possiblaw-guardrails --marketplace PossibLaw`) demonstrates this pattern with production-ready hooks for destructive command blocking, sensitive file protection, and auto-formatting. Use it as a starting point or install it directly.

### The Progressive Disclosure Pattern

For complex capabilities:

1. Brief description (50-100 words) - always loaded
2. Full SKILL.md (300-500 lines) - loaded when skill invoked
3. Reference files (unlimited) - loaded on demand

### The Command + Agent Pattern

For research-heavy workflows:

1. Command defines the workflow
2. Command spawns agents for research phases
3. Agents return summaries
4. Command synthesizes into final output
