# Avatar — component research brief

Tier 3 (lean). Mined 2026-07-07 from source, docs, main test files, and a targeted issue/PR search (read-only). Evidence tags: [E] direct evidence, [I] inference, [G] gap.

## 1. Identity

- **Name / slug**: Avatar — `@base-ui/react/avatar`. Multi-part compound component, namespace export `Avatar.*`.
- **Status**: no `[New]`/`[Preview]` tag found on the docs page or types file — treated as stable. [E] Introduced 2025-02-04, commit `37590c512`, PR #1210 (`research/b-library-principles/_mining/history.md`), independently confirmed live in `CHANGELOG.md`: "Add Avatar component (#1210) @acomanescu."
- **Community authorship — a distinctive fact worth flagging.** [E] Avatar was contributed by **@acomanescu**, a non-maintainer, per both the git-history mining and the live CHANGELOG entry — one of relatively few community-originated (rather than maintainer-authored) components in the library. Follow-up community PRs continued the pattern: cross-origin support (@ISnackable, "Support cross origin in useImageLoadingStatus") and a missing-export fix (@Gomah, "Add missing Avatar export").
- **Purpose / IA statement**: "Displays a user's profile picture, initials, or fallback icon" [E] (Root JSDoc). Taxonomy: **status & display** cluster — "image with fallback states" [E] (`research/a-documentation-standard/taxonomy.md`), grouped alongside progress/meter but semantically distinct — it displays identity/image state, not a numeric measurement. No cluster note applies to Avatar; §4 below is derived directly rather than linked.
- **3 parts** (from `index.parts.ts`; one-liners from JSDoc):
  | Part | Renders | One-liner |
  |---|---|---|
  | Root | `<span>` | Displays a user's profile picture, initials, or fallback icon |
  | Image | `<img>` | The image to be displayed in the avatar (only mounts once loaded) |
  | Fallback | `<span>` | Rendered when the image fails to load or when no image is provided |

## 2. Intention

- [E] **Founding issue states the goal plainly, citing precedent.** Issue #1347 ("[avatar] Implement Avatar," opened 2025-01-20, closed 2025-02-04 on PR #1210 merge): "Avatar component for handling the `initials` API and image fallback," citing Radix UI's Avatar primitive as the reference example.
- [I] **Design goal — a real, off-DOM `Image()` probe decouples "attempt to load" from "what's rendered."** `useImageLoadingStatus` creates a detached `new window.Image()` object purely to detect load status, separate from the actual rendered `<img>` — this means the DOM `<img>` never needs to exist in a "broken" state; Image simply doesn't mount until status is `loaded`. [I] Derived directly from the hook's implementation, not stated as a design goal in any PR body found.
- [E] **Explicit non-goal — lazy loading is architecturally foreclosed by that same design.** Still-open issue #2597 ("[avatar] Support lazy-loading") states: "these images are not attached to the DOM as `<img>` elements, the `loading=\"lazy\"` attribute cannot be applied" — a direct, acknowledged consequence of the probe-based design, raised as a real gap for "user lists, chats" at scale.
- [G] PR #1210's own body/diff was not fetched in this pass (only the founding issue and CHANGELOG entry) — deeper PR-body mining would be a Tier-1/2-depth task.

## 3. When to use

- [E] User profile pictures with a graceful fallback (initials or icon) when no image is set or the image fails to load — the literal Root JSDoc purpose.
- [I] Identity display in lists/headers/chat UIs — inferred from the "user lists, chats" performance concern raised in issue #2597 (implying these are real, anticipated usage contexts) and the docs subtitle "An easily stylable avatar component."
- [E] Showing initials-as-placeholder when a photo isn't available — both hero demo variants (CSS Modules and Tailwind) default to a two-letter initials fallback.
- [E] Responsive/high-DPI image scenarios — `Image` forwards native `srcSet`/`sizes`/`crossOrigin`/`referrerPolicy`, and the loading-status probe itself respects them (confirmed by test).

## 4. When not to use + alternatives

No cluster note applies to Avatar (it's the only non-numeric member of the status & display taxonomy category) — derived directly:

- [I] **Purely decorative images with no need for load-state fallback**: if "show initials on failure" behavior isn't needed, a plain `<img>` is simpler — Avatar's entire value-add is the loading-status state machine.
- [I] **Numeric or measurement display** (e.g. a completion ring around a profile picture, a presence/status dot): that's Progress/Meter's job, not Avatar's — per the taxonomy's own distinction, Avatar carries no numeric-measurement API. A presence indicator would need to be composed alongside Avatar (e.g. an absolutely-positioned sibling); Avatar has no built-in prop/part for it.
- [I] **Base UI has no generic "Image" primitive** — Avatar is, in effect, the library's only image-loading-state component. `useImageLoadingStatus` is not exported from `index.ts` (only `Root`/`Image`/`Fallback` and types are), so it isn't a reusable public hook outside this package. [I] marked clearly: inferred from the absence of any other matching component/hook in `packages/react/src/`, not an explicit "this is the only one" statement anywhere.
- [E] **Lazy-loaded image grids at scale** — a known, currently-open gap (#2597, §2): plan around this or track the issue if virtualizing hundreds of avatars.

## 5. Anatomy & composition

- [E] Flat part tree (not deeply nested), from docs anatomy:
  ```jsx
  <Avatar.Root>
    <Avatar.Image src="" />
    <Avatar.Fallback>LT</Avatar.Fallback>
  </Avatar.Root>
  ```
- [E] **Image is optional.** `Avatar.Root` alone with plain text children is a valid, docs-sanctioned "no photo available at all" pattern — demonstrated in both hero demos: `<Avatar.Root>LT</Avatar.Root>` with no `Image`/`Fallback` child.
- [I] **Fallback is optional too** — nothing requires it structurally; if omitted and the image errors, nothing renders in its place (no default fallback UI is baked in anywhere in the source).
- [E] **Image does not always render a DOM `<img>`.** `AvatarImage` returns `null` until `mounted` becomes true via `useTransitionStatus(isVisible)`, where `isVisible = imageLoadingStatus === 'loaded'`. Visually, Image and Fallback behave like a mutually-exclusive pair gated by loading status — but implemented as two independent sibling parts each reading shared Root context, not one component branching between two render paths.
- [E] **Composition**: Image and Root communicate via `AvatarRootContext` (`imageLoadingStatus` + `setImageLoadingStatus`); Fallback only reads (never writes) that same context. All three parts support standard `render`/`className`/`style` polymorphism.
- Text spec for a future anatomy diagram: a circular/rounded container (Root) with two mutually-exclusive interior states — State A: `<img>` filling the container (`object-fit: cover`); State B: a centered text/icon fallback (`<span>`, flex-centered). Label the transition: idle → loading → (loaded | error), with error and idle both routing to "show Fallback."

## 6. Behavior ("How it works")

- [E] **State machine** — `ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'`, owned by `useImageLoadingStatus(src, opts)` inside Image:
  - Neither `src` nor `srcSet` given → immediately `error`.
  - Otherwise → `loading`, then a detached `new window.Image()` probe with `onload`/`onerror` resolving to `loaded`/`error`.
  - **Cached-image fast path**: after wiring the probe, the hook synchronously checks `image.complete` — if true, it resolves `loaded` (when `naturalWidth > 0`) or `error` (`naturalWidth === 0`) without waiting for the async `onload` event. This exists specifically to avoid a fallback flash for already-cached images (see §10; PR #4469 addressing #4468).
  - Status change propagates via `useIsoLayoutEffect` to both the user's `onLoadingStatusChange` callback and Root's shared context; on Image unmount, status resets to `idle` in Root.
- [E] **Fallback visibility gate**: Fallback renders only when `imageLoadingStatus !== 'loaded'` AND (`delay === 0` OR the delay timer has elapsed) — visible during `idle`/`loading`/`error` (respecting `delay`), hidden once `loaded`.
- [E] **Delay/anti-flash logic (`delay` prop, default `0`)**, implemented via the `useTimeout` utility per AGENTS.md convention. A one-way ratchet is explicit in source comment: "Once the fallback is shown without a delay, keep it visible. Otherwise a later change from no delay to a number would re-hide an already-visible fallback" — confirmed by tests covering `undefined → number` and `number → undefined → number` transitions. This is Base UI's direct answer to the classic "avatar flash-of-fallback" problem. PR #5147 (merged 2026-07-02) most recently clarified that `delay={0}` unambiguously means "immediate, no wait" (previously only `undefined` skipped the timer), aligning with other Base UI delay APIs.
- [E] **SSR — a real, partially-open gotcha.** Because layout effects don't run during SSR, server-rendered HTML always contains Fallback content, never `<img>` (confirmed by test comment: "Server render: layout effects don't run, so fallback is in the HTML"). Post-hydration, for a browser-cached image the fast path above resolves `loaded` on the first post-hydration render with no visible flash (a dedicated regression test pins this down). **However, still-open issue #4468** ("Fallback flashes for cached images on SSR hydration") documents measured real flash durations even with cached images across frameworks (TanStack Start ~304ms/14 frames, Next.js ~52ms/3 frames, Vite SPA ~16ms/1 frame) — maintainer discussion notes even Radix's comparable fix "only covers 1 frame client-side (Vite) flash" and that "current handlers initially render fallback even if cached image is present. Both for radix and base-ui." Treat this as a known, materially-reduced-but-unresolved limitation, not a closed non-issue.

## 7. Accessibility contract

- [I] **Not interactive by itself** — Root/Image/Fallback are all plain non-interactive elements (`<span>`, `<img>`, `<span>`) with no built-in role, `tabIndex`, or keyboard handling anywhere in source. If used as a trigger (e.g. inside a button/menu), the wrapping interactive element owns focus/keyboard semantics; Avatar contributes none.
- [E] **No dedicated W3C ARIA APG pattern for "Avatar."** There is no image/avatar-specific composite pattern in the APG pattern list; this maps to the generic `img`-role semantics of a plain `<img>` element, not a distinct APG pattern. [G] Checked `page.mdx` and source for any APG link — found none.
- [G] **`alt` text guidance is not documented, and both hero demos omit `alt` entirely.** Neither the CSS Modules nor Tailwind hero demo passes an `alt` prop to `Avatar.Image` at all. The docs give no rule for decorative (`alt=""`, name shown as adjacent text) vs. informative (real alt text, avatar is the sole identifier) usage. [G] Looked in `page.mdx` (no "alt"/accessibility section at all), `types.md` (no alt-specific guidance beyond native passthrough), and both hero demo files — none address this. This is a genuine, mandatory-to-flag gap per this brief's a11y remit.
  - [I] The test suite uses realistic informative values (`alt="Jane Doe"`) in several places, suggesting the intended pattern is naming the person — but this is a test convention, not documented guidance.
  - [E] `Avatar.spec.tsx` (a compile-time type-check file) confirms `alt` is forwarded and typed as `string | undefined` — a first-class passthrough prop, not required by the type system, so omitting it is not a type error (a foot-gun for a11y absent project-level `jsx-a11y` linting).
- [E] **`AvatarFallback` is not auto-hidden from assistive tech, and a proposal to change that was rejected.** A community PR (#3095, closed, not merged) proposed adding `aria-hidden="true"` to `AvatarFallback` by default, reasoning it's "purely presentational," while also raising the open question "Are there cases where the avatar fallback is the *only* identifier for an entity?" — the PR was closed, not merged, so Fallback text (e.g. initials) remains in the accessibility tree by default today. Consumers who intend Fallback purely decoratively must add `aria-hidden` themselves.
- **Known accessibility-adjacent issues**: [E] the `alt`-guidance gap above; [E] the closed #3095 proposal. [G] No dedicated a11y bug reports found beyond these two.

## 8. Prop-level guidance (decision-relevant props)

- [E] **`src` (Image)** — the image URL; required in practice for a photo attempt. If omitted (and no `srcSet`), status is immediately `error` and Fallback shows.
- [E] **`srcSet`/`sizes` (Image)** — native responsive-image props, forwarded to both the rendered `<img>` and the internal loading probe so status reflects the actual resource that will load. An image can load via `srcSet` alone with no `src` (tested).
- [E] **`crossOrigin`/`referrerPolicy` (Image)** — forwarded to the probe object so CORS/referrer behavior matches the real `<img>`, keeping status detection accurate for cross-origin sources (tested).
- [E] **`alt` (Image)** — native passthrough, typed but not required. See §7: decide decorative (`alt=""`) vs. informative per context; the docs give no explicit rule.
- [E] **`onLoadingStatusChange` (Image)** — `(status: ImageLoadingStatus) => void`, fires on every non-idle transition. Use for custom side effects (analytics, a distinct loading spinner); does not control rendering itself.
- [E] **`delay` (Fallback, default `0`)** — "How long to wait before showing the fallback." Use a nonzero value (the hero demo uses `600`ms) to avoid a flash-of-fallback when images typically load fast; once shown, the fallback stays shown even if `delay` later changes (§6).
- [E] **Data attributes** (`AvatarImageDataAttributes.ts`): `data-starting-style`/`data-ending-style` on Image, present during transition-in/-out.
- [E] **No `data-loading-status`/`data-loaded`/`data-error` attribute exists anywhere.** `avatarStateAttributesMapping` explicitly maps `imageLoadingStatus: () => null` — the `imageLoadingStatus` state is tracked in React (all three parts' `State` interfaces include it per `types.md`) but deliberately not exposed as a data attribute on any part. Practical implication: `[data-loading-status="loaded"] { ... }` CSS selector styling is not possible directly; styling must be driven by which part is mounted (Image vs. Fallback) or via the `className`/`style` state-function form using `state.imageLoadingStatus` in the callback (B-P20). [I] The "why" behind this null-mapping (mount/unmount of Image vs. Fallback presumably considered sufficient signal) is inference, not stated anywhere explicitly.

## 9. Decision log

- **2025-01-20 → 2025-02-04 — Avatar ships** (issue #1347 → PR #1210, commit `37590c512`): "Avatar component for handling the `initials` API and image fallback," referencing Radix UI Avatar. Author: @acomanescu (community). [E]
- **~2025 — community cross-origin support** (PR #1433, @ISnackable): "Support cross origin in useImageLoadingStatus." [E]
- **~2025 — missing export fixed** (PR #1428, @Gomah): "Add missing Avatar export." [E]
- **2026-02-11 — transition attributes added** (PR #3939, closing #3921): introduced `data-starting-style`/`data-ending-style` on Image. [E]
- **2026-02-16 — premature-mount bug fixed** (PR #4110, closing #4109): "Remove fallback transition logic and prevent premature image display" — fixed Image mounting before fully loaded, causing layout shift. [E]
- **2026-03 — community `aria-hidden` proposal closed, not merged** (PR #3095). [E]
- **2026-04-09 — cached-image flash fix** (PR #4469, addressing still-open #4468): added the `image.complete` fast path in `useImageLoadingStatus`. [E]
- **2026-06-17 — image status edge cases fixed** (PR #4835). [E]
- **2026-07-02 — fallback delay default clarified** (PR #5147): "Make zero fallback delay default and immediate." [E]
- [G] PR #1210's own body/diff not fetched in this pass — deeper mining of the original PR discussion would be a Tier-1/2-depth task.

## 10. Pitfalls & FAQ

- **Flash-of-fallback on every load, even fast ones** → mitigated by the `delay` prop on Fallback (§6/§8; hero demos use `delay={600}`). [E]
- **Flash-of-fallback specifically for cached images** → partially fixed (PR #4469's `image.complete` fast path) but not fully resolved for true SSR per still-open issue #4468 — the single most well-documented pitfall for this component, with real cross-framework flash-duration measurements in the issue thread. [E]
- **Image briefly mounting mid-load, causing layout shift** → this exact bug was reported (#4109: Image mounted while still loading, Fallback still in place, causing layout shifts) and fixed by PR #4110, which gates Image's mount on `imageLoadingStatus === 'loaded'` (current source behavior). [E]
- **No lazy-loading** → the off-DOM probe design forecloses `loading="lazy"`; a known, currently-open limitation for large avatar lists/grids (#2597, §2/§4). [E]
- **Missing `alt` text** → not flagged as a "pitfall" in any issue, but both hero demos omit `alt`, which could model the wrong pattern for consumers copying the demo verbatim (§7). [I] inferred risk, not a reported issue.
- **`Avatar.Fallback` is not automatically hidden from assistive tech** → a proposal to `aria-hidden` it by default was rejected (#3095, closed) — if Fallback is meant purely decoratively, add `aria-hidden` yourself; otherwise screen readers announce its text content by default. [E]

## 11. Real-world patterns observed

[G] pending Phase D. Checked `research/d-real-world-usage/` — no avatar-specific data exists (only menu- and dialog-focused cache directories present). Phase D data for this component would live at `research/d-real-world-usage/avatar/` (directory does not yet exist).

## 12. Story plan pointer

See [`story-plan.md`](./story-plan.md) — 8 planned stories, including the mandatory image-load-fallback play-function story (broken src → fallback renders).
