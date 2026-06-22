# Workspace AGENTS.md

**⚠️ CRITICAL: Read workflow rules from basic-memory MCP BEFORE doing anything else**

---

## 📖 First Step (REQUIRED)

**Query basic-memory (coding project) for workflow rules:**

1. Search for `workflow-rules-*` to get all rule categories
2. Read relevant rules based on task type:
   - Critical rules: `workflow-rules-critical`
   - Git workflow: `workflow-rules-git`
   - Planning: `workflow-rules-planning`
   - Task management: `workflow-rules-tasks`
   - Principles: `workflow-rules-principles`
   - Sessions: `workflow-rules-sessions`
   - Approval rules: `workflow-rules-approval`

---

## 🧠 Basic-Memory

- Agent state files, research output, audit reports, rival debates, and learnings are persisted via the basic-memory MCP server.
- The project namespace in basic-memory is `coding/trainwithgouli/`.
- References to `coding/trainwithgouli/...` in agent instructions refer to this remote namespace, not the local `~/coding/` directory.

---

## 🚫 Absolute Critical Rules (Memorize These)

1. **NEVER access `.env` or environment files**
2. **ONLY do what is explicitly requested** - Ask first
3. **Always use feature branches (via worktrees)**
4. **STAY in current directory** - Do not access files outside `/Users/muzammil/workspace/trainwithgouli` and `/Users/muzammil/workspace/worktrees/trainwithgouli` except:
   - `/Users/muzammil/workspace/.opencode/agents/nginx-gateway-agent.md` (the only allowed shared agent file)
   - Request explicit permission before accessing any other directory.
   - **NEVER read or list `~/workspace/.opencode/agents/` for any other file.**
5. **ALWAYS use todowrite** — Track all multi-step tasks with the todowrite tool, regardless of agent mode.
6. **Persist todos to file** — Mirror `todowrite` updates to `./tasks/{task-id}/todo.md` for persistence.

---

## 🔄 Quick Git Cheat Sheet

```bash
git worktree add -b feature/name ../worktrees/trainwithgouli/feature-name main
cd ../worktrees/trainwithgouli/feature-name
git add . && git commit -m "msg"
git checkout main && git merge feature/name && git push
```

---

## 🔄 Context Management Rule (CRITICAL)

**BEFORE any task:**
1. **Load workflow rules** from basic-memory (coding project)
2. **Check context load** - if conversation is long (>15-20 messages), run `/compact`
3. **Always load relevant rules:** critical rules + task-specific rules
4. **Follow the workflow** - plan → verify → track → explain → document

**Rule Priority:**
1. workflow-rules-critical (always)
2. workflow-rules-[task-type] (detected)
3. workflow-rules-approval (if uncertain)

---

**Last Updated**: 2026-06-20
