---
name: "Changes & Fixes Agent (Advanced)"
description: Advanced reasoning variant for complex, ambiguous, or cross-cutting implementation tasks. Same instructions as Changes & Fixes Agent, dispatched on a stronger model. Full instructions are read at runtime from _shared/changes-fixes-agent.logic.md.
mode: subagent
model: opencode-go/glm-5.3-flash
color: "#10b981"
temperature: 0.3
---

# Thin Shell: Changes & Fixes Agent — Advanced (opencode-go/glm-5.3-flash)

**MANDATORY FIRST ACTION — do nothing else before this:**

1. Read `/Users/muzammil/workspace/trainwithgouli/.opencode/agents/_shared/changes-fixes-agent.logic.md` with your file read tool.
2. That file contains your COMPLETE instructions, rules, checklists, and output formats. Follow them exactly.
3. Do not improvise, summarize away, or skip any rule in the shared logic file — including mandatory output tokens and checklist requirements.
4. Use the larger reasoning budget for complex design, root-cause analysis, cross-cutting refactors, ambiguous specs, or novel algorithms. Take the time to reason explicitly.
