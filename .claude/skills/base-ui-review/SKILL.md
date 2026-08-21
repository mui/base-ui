---
name: base-ui-review
description: 'Review the current diff for regressions, correctness bugs, tests, simplifications, and docs issues, scaling depth to a low/medium/high/xhigh/max effort level. Use ONLY when explicitly requested by name: the user runs /base-ui-review, writes $base-ui-review, or asks for "the Base UI review skill". Do NOT use for general review requests such as "review my changes", "review this diff/branch/PR", or after finishing an implementation — handle those without this skill unless the user names it. Pass --comment to post a top-level PR comment, --comment inline for inline PR comments, or --fix to apply findings.'
---

# Base UI Review

This is the Claude Code entrypoint for the shared repo skill.

Only run when the user explicitly asks for this skill by name
(`/base-ui-review`, `$base-ui-review`, "the Base UI review skill", or a CI job
configured to use it). Do not trigger on a generic "review my changes" request
or after finishing an implementation.

Before reviewing, read `.agents/skills/base-ui-review/SKILL.md` completely and
follow that canonical workflow. Pass through any user arguments such as `low`,
`medium`, `high`, `xhigh`, `max`, `--comment`, `--comment inline`, `--fix`, or a
review target.
