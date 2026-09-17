# Basic-Memory MCP Tools Reference

This file documents the exact tool names and arguments for the `basic-memory` MCP server.
**Do not guess tool names.** The Code Mode tool catalog display is truncated (~10 of 23 tools shown), but the tools below exist and are callable.

## Calling conventions

- **Direct tool name:** `basic-memory_write_note`
- **Code Mode / `execute`:** `tools["basic-memory"].write_note(...)`

The same pattern applies to all tools below (`basic-memory_<tool>` or `tools["basic-memory"].<tool>`).

## Tool reference

| Operation | Tool name | Required arguments | Notes |
|-----------|-----------|-------------------|-------|
| Create note | `write_note` | `title`, `directory`, `content` | Optional `tags` (array of strings) |
| Read note | `read_content` | `path` | `path` is the note permalink or relative path |
| Update note | `edit_note` | `identifier`, `operation`, `content` | `operation` can be `append`, `prepend`, `find_replace`, `replace_section` |
| Delete note | `delete_note` | `identifier` | `identifier` is title or permalink |
| Search | `search` | `query` | Full-text search across the knowledge base |
| View formatted | `view_note` | `identifier` | Read a note as a formatted artifact |
| List projects | `list_memory_projects` | — | Use when you need to discover a project name |
| List workspaces | `list_workspaces` | — | Cloud workspaces metadata |

## Namespace

The project namespace is `coding/trainwithgouli/`. Always use this in `directory` for project-related notes:

```
directory: "coding/trainwithgouli/orchestrator-workflows/{task-id}"
```

### ⚠️ Project parameter — REQUIRED (learning 2026-09-05)

The tools DO accept a `project` argument, and the MCP session may default to a
different project (e.g. `openclaw-memory`) than where subagents write. Subagents
(research, changes, validator, DBA) consistently write to project **`coding`**.

- Always pass `project: "coding"` on orchestrator `write_note` / `edit_note` /
  `read_note` calls for `coding/trainwithgouli/...` notes. Do NOT rely on the
  session default — notes written without it land in the wrong project and
  later `edit_note` calls fail with "Entity not found".
- If `edit_note` fails with "Entity not found" / "Note Not Found" for a note a
  subagent just wrote, `search_notes` with `project: "coding"` first; the note
  exists there under the short permalink.
- Pass `title` WITHOUT the `.md` extension (write_note appends it; a literal
  `.md` in the title creates `queue.md.md` and ambiguous identifiers).

## Common mistakes to avoid

- ❌ `create_note` — does not exist. Use `write_note`.
- ❌ `write` or `save` — do not exist. Use `write_note`.
- ❌ `folder` argument — use `directory`.
- ❌ `basic_memory_write_note` (underscore between words) — use `basic-memory_write_note`.
- ❌ Omitting `project: "coding"` — notes land in the session-default project
  (e.g. `openclaw-memory`) where later lookups fail. See "Project parameter" above.

## When to re-read this file

Re-read this reference before any basic-memory write/read operation if you are unsure of the exact tool name or argument shape.
