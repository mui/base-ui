# CSP Provider — story plan

**No story.** Per the utils-tier rule ("a story only where rendering one makes sense, otherwise an MDX docs page alone"): CSPProvider renders no DOM and its effects — a `nonce` attribute on injected `<style>`/`<script>` tags, or those tags' absence — are invisible in a Storybook canvas and unenforceable there (Storybook serves no CSP header, so nothing visibly breaks or unbreaks). Its own docs page has zero demos, matching this judgment.

MDX page instead, covering:
- the 3-step nonce recipe (header + `CSPProvider nonce`) as code blocks;
- `disableStyleElements` + the `.base-ui-disable-scrollbar` replacement CSS;
- the scope boundary: style *elements* vs style *attributes* (`style-src-attr` workarounds);
- pitfalls from brief §10 (nonce mismatch, provider placement, script tags have no disable flag).

Optional inspection aid (only if effectively free): an MDX-embedded code snippet showing how to verify in DevTools that `<style>` tags inside a `<ScrollArea>` carry the nonce — still not a CSF story.
