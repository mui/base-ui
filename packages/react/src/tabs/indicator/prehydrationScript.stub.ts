// Browser-bundle replacement for `prehydrationScript.min.ts`, selected via the `browser`
// condition of the `#prehydration/*` entry in package.json `imports`. The real script
// only ever executes from server-rendered HTML, so client bundles don't need its contents —
// during hydration the indicator renders the same `<script>` element with empty content,
// which React adopts without patching.
export const script = '';
