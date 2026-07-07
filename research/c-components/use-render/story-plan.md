# useRender — story plan

Utils tier: stories only where rendering one makes sense. useRender is the one util whose whole point is rendering — 2 stories.

1. **`CustomComponent`** (hero) — build a `Button`-like primitive with `useRender` exactly as the docs' TypeScript example does: `useRender.ComponentProps<'button'>` public props, `useRender.ElementProps<'button'>` defaults, `mergeProps(defaultProps, props)`, `defaultTagName: 'button'`. Render it three ways: default tag, `render={<a href/>}` (element form), and composed with a Base UI part (`render={<Tooltip.Trigger />}`-style nesting) to prove the protocol interops. Serves Definition-of-Done sections: hero/usage, composition, TypeScript.
2. **`StateToDataAttributes`** — recreate the docs Counter demo: internal `{ odd }` state typed via `useRender.ComponentProps<'button', CounterState>`, function-form `render={(props, state) => …}` reading `state`, and assert (play function) that `data-odd` appears/disappears on the DOM node — pinning the state→data-attribute conversion and the "you own the spread" contract. Serves: behavior, prop guidance (`state`, function form), pitfalls (spread discipline).

Anti-story note: do NOT write a story passing `render={Component}` — that's the #4039 footgun; it belongs in MDX pitfalls prose (optionally showing the dev warning), not as an example pattern.
