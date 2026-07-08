---
name: base-ui-review
description: 'Review the current diff for regressions, correctness bugs, tests, simplifications, and docs issues, scaling depth to a low/medium/high/xhigh/max effort level. Use when the user asks to review changes, review a diff/branch/PR, or runs /base-ui-review. Pass --comment to post a top-level PR comment, --comment inline for inline PR comments, or --fix to apply findings.'
---

# Base UI Review

This is the Claude Code entrypoint for the shared repo skill.

Before reviewing, read `.agents/skills/base-ui-review/SKILL.md` completely and
follow that canonical workflow. Pass through any user arguments such as `low`,
`medium`, `high`, `xhigh`, `max`, `--comment`, `--comment inline`, `--fix`, or a
review target.
