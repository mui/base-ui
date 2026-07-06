# Dialog — top real-world examples

Mined 2026-07-06 from GitHub code search (`@base-ui/react/dialog`, `@base-ui-components/react/dialog`, `Dialog.createHandle`) plus the shared corpus. Full pool: `candidates.json` (100 entries); ranked set: `ranked.json` (top 15). `partsUsed` is populated only for the ~35 candidates whose source files were fetched and verified; empty arrays mean "not inspected", not "no parts". Screenshots are a later pass (`screenshot.status: "not-attempted"` everywhere). Reuse: `code-ok` = permissive license (MIT/Apache-2.0/BSD/ISC/MPL-2.0); `link-only` = cite, don't copy.

---

## 1. shadcn/ui — the canonical copy-paste Dialog + Sheet (oss-design-system, MIT, code-ok)

- Source: [apps/v4/registry/bases/base/ui/dialog.tsx](https://github.com/shadcn-ui/ui/blob/d8ace420baa5c8a1abccd75e52570f2a232f193d/apps/v4/registry/bases/base/ui/dialog.tsx), [sheet.tsx](https://github.com/shadcn-ui/ui/blob/d8ace420baa5c8a1abccd75e52570f2a232f193d/apps/v4/registry/bases/base/ui/sheet.tsx)
- Live: https://ui.shadcn.com
- Parts: Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close
- Why ranked #1: shadcn/ui's v4 "base" registry is the single most-copied Base UI dialog wrapper in existence — one canonical recipe fanned out into eight style variants (base-vega, base-lyra, base-mira, …) plus an RTL variant, distributed into thousands of apps via the shadcn CLI. It is the de-facto reference for how the ecosystem composes `Portal > Backdrop > Popup` and renames Base UI vocabulary (Popup→Content, Backdrop→Overlay) for Radix compatibility.
- Story recomposition: the "standard modal" story. Click a `DialogTrigger` button → backdrop fades in, popup scales in (data-starting-style/ending-style transitions) → press Escape or click the X (`Dialog.Close`) → dialog animates out. A second story recreates Sheet: same primitives, popup pinned to a viewport edge with slide-in animation — evidence that "drawer/sheet" is a styling decision over Dialog. Feeds: anatomy/composition, real-world examples, "Base UI under shadcn" narrative.

## 2. raystack/frontier — createHandle at production scale (production-app, Apache-2.0, code-ok)

- Source: [members-view.tsx](https://github.com/raystack/frontier/blob/7384a11d417fe16f6dc52c19d3b5905b4d7cfd41/web/sdk/client/views/members/members-view.tsx) (module-level `Dialog.createHandle()`, `AlertDialog.createHandle<RemoveMemberPayload>()`, `Menu.createHandle<MemberMenuPayload>()` side by side), [invite-member-dialog.tsx](https://github.com/raystack/frontier/blob/7384a11d417fe16f6dc52c19d3b5905b4d7cfd41/web/sdk/client/views/members/components/invite-member-dialog.tsx)
- Live: https://raystack-frontier.vercel.app/
- Parts: Root + createHandle (rendered through Apsara DS wrappers: Content/Header/Title/Body/Footer)
- Why ranked #2: the richest detached-triggers deployment found anywhere — ~25 admin dialogs (invite member, verify domain, regenerate PAT, confirm plan change) opened imperatively from module-level handles, several with typed payloads, consumed via `@raystack/apsara`'s re-export of the Base UI API. Shows why `createHandle` exists: table-row actions that open dialogs living elsewhere in the tree, with data.
- Story recomposition: the definitive detached-trigger flow. Render a members table → click "Invite member" (a plain button, not `Dialog.Trigger`) → `inviteDialogHandle.open()` → react-hook-form inside the dialog → submit → mutation fires, toast confirms, dialog closes. Variant story: row menu → "Remove member" → `AlertDialog` handle opened *with payload* (`{member}`), confirm → destructive action. Feeds: `createHandle`/`handle` prop guidance, forms-in-dialog, dialog-vs-alert-dialog boundary.

## 3. WordPress/gutenberg — per-part wrappers with embedded usage rules (production-app, dual-licensed → link-only)

- Source: [packages/ui/src/dialog/root.tsx](https://github.com/WordPress/gutenberg/blob/73d48b46f8caa925fbaffb4e97246f02a1b3ce80/packages/ui/src/dialog/root.tsx), [title.tsx](https://github.com/WordPress/gutenberg/blob/73d48b46f8caa925fbaffb4e97246f02a1b3ce80/packages/ui/src/dialog/title.tsx), plus popup/backdrop/trigger/portal/close-icon/description/action files
- Live: https://wordpress.org/gutenberg/
- Parts: Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close
- Why ranked #3: WordPress's next-gen `packages/ui` builds Dialog as one file per Base UI part and writes its house rules straight into the Root JSDoc: every dialog must include a `Dialog.Title` ("both the visible heading and the accessible label"); always include a visible close affordance; for destructive-choice dialogs omit the X icon so "what does X mean vs Cancel" is never ambiguous. This is GOV.UK-grade content/a11y guidance living in a top-tier OSS codebase — ready-made evidence for do/don't documentation.
- Story recomposition: a "confirm destructive action" story — dialog with Cancel + Delete footer buttons and deliberately no X close icon — next to an "informational dialog" story with `CloseIcon`. The contrast dramatizes Gutenberg's rule. Feeds: content guidance, when-to-use Close, a11y contract (Title requirement).

## 4. oxidecomputer/console — controlled Modal + SideModal drawer (production-app, MPL-2.0, code-ok)

- Source: [app/ui/lib/Modal.tsx](https://github.com/oxidecomputer/console/blob/975bba9f3f2ce5fc0fa0d03ea4d71e04d9e4d6c5/app/ui/lib/Modal.tsx), [app/ui/lib/SideModal.tsx](https://github.com/oxidecomputer/console/blob/975bba9f3f2ce5fc0fa0d03ea4d71e04d9e4d6c5/app/ui/lib/SideModal.tsx)
- Live: https://console-preview.oxide.computer
- Parts: Root, Portal, Popup, Title, Close (no Trigger — fully controlled)
- Why ranked #4: Oxide's cloud console (a famously high-craft codebase) uses Dialog two contrasting ways: a centered Modal that is 100% controlled (`isOpen`/`onDismiss` — routes and app state open it, no Trigger anywhere) and a SideModal that turns the same primitive into an edge-docked drawer, with `motion` animations and an explicit z-index policy so a Modal correctly covers a SideModal when both are open.
- Story recomposition: "dialog without a Trigger" — navigate a table, choose a row action dispatched through app state → modal opens; and "form drawer" — click Edit → SideModal slides from the right with a form → submit → slides out. A third beat: open SideModal, then open Modal on top (nested-overlay z-index story). Feeds: controlled vs uncontrolled behavior docs, dialog-vs-drawer decision boundary, JS-animation integration.

## 5. pingdotgg/t3code — command palette hosted in a Dialog (production-app, MIT, code-ok)

- Source: [apps/web/src/components/ui/command.tsx](https://github.com/pingdotgg/t3code/blob/32e7844837b35ca0a0ff038997a45ea75cb7103f/apps/web/src/components/ui/command.tsx) (also [dialog.tsx](https://github.com/pingdotgg/t3code/blob/32e7844837b35ca0a0ff038997a45ea75cb7103f/apps/web/src/components/ui/dialog.tsx), [sheet.tsx](https://github.com/pingdotgg/t3code/blob/32e7844837b35ca0a0ff038997a45ea75cb7103f/apps/web/src/components/ui/sheet.tsx))
- Live: https://t3.codes
- Parts: Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close, Viewport, createHandle
- Why ranked #5: the command-palette-host archetype end to end: `CommandDialog = Dialog.Root`, a dedicated Backdrop + **Viewport** + Popup stack, and `createHandle` re-exported as `CommandCreateHandle` so ⌘K can open the palette from anywhere. Also carries a full shadcn-style dialog/sheet pair, all on the current package, MIT, on a live product by a high-visibility team.
- Story recomposition: press ⌘K → palette pops over a dimmed backdrop → type to filter → Enter picks a result → dialog closes and acts. Feeds: Viewport prop guidance, createHandle, "Dialog as a host for other widgets" composition section.

## 6. leboncoin/spark-web — a corporate DS re-shaping the Dialog API (oss-design-system, MIT, code-ok)

- Source: [packages/components/src/dialog/Dialog.tsx](https://github.com/leboncoin/spark-web/blob/a24acf4d43369e439ff6dc8d4cab11c390400ab0/packages/components/src/dialog/Dialog.tsx) (`Dialog.createHandle = BaseDialog.createHandle`), per-part files for Content/Trigger/Overlay/Portal/Title/Description/Close, and [drawer/Drawer.tsx](https://github.com/leboncoin/spark-web/blob/a24acf4d43369e439ff6dc8d4cab11c390400ab0/packages/components/src/drawer/Drawer.tsx) built on the same primitive
- Live: Storybook at https://main--69d967830091f4360fd30d22.chromatic.com
- Parts: Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close, createHandle
- Why ranked #6: Spark is leboncoin's (top French marketplace) design system, and its Dialog is a case study in API adaptation: it narrows `onOpenChange` to a simpler `(open: boolean)` signature, adds DS concerns (`withFade` scroll fade) via its own context provider, stamps `data-spark-component="dialog"`, and still passes `createHandle` through as public API. Drawer is a second component on the same primitive.
- Story recomposition: a "design-system wrapper" story that recreates the wrapper layer itself — showing which Base UI props a DS hides, renames, or forwards — plus a drawer story on Dialog. Feeds: composition/customization handbook evidence, the wrapper-authoring guidance, drawer-vs-dialog cluster.

## 7. Codennnn/Green-Wall — product dialogs on a live consumer site (production-app, MIT, code-ok)

- Source: [src/components/AiConfig/AiConfigDialog.tsx](https://github.com/Codennnn/Green-Wall/blob/dbb5cdc8e1de3b7abcd3078759400e9b4f7fc036/src/components/AiConfig/AiConfigDialog.tsx) (settings form) over [src/components/ui/dialog.tsx](https://github.com/Codennnn/Green-Wall/blob/dbb5cdc8e1de3b7abcd3078759400e9b4f7fc036/src/components/ui/dialog.tsx) (full wrapper incl. Viewport)
- Live: https://green-wall.leoku.dev
- Parts: Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close, Viewport
- Why ranked #13 overall but a top example: dialogs here are product features, not library plumbing — AiConfigDialog is a bring-your-own-API-key settings form for the AI feature of a GitHub-contributions poster generator, publicly demoable. The cleanest small-scale "form in a dialog on a real site" specimen with a permissive license.
- Story recomposition: click "AI settings" → dialog opens with provider/key fields → fill and save → dialog closes, feature unlocked. Feeds: forms-in-dialog, settings-modal archetype, real-world examples with live URL.

## 8. hasparus/bear-fit — URL-driven dialog state (production-app, no license → link-only)

- Source: [app/ui/Dialog.tsx](https://github.com/hasparus/bear-fit/blob/a43a36795770676e98a6943f1597c2c7ac05a195/app/ui/Dialog.tsx)
- Live: https://bear-fit.hasparus.partykit.dev/
- Parts: Root (namespace-spread re-export of all other parts)
- Why ranked #12: the most instructive controlled-Root pattern found: `Dialog = { ...BaseDialog, Root(props: { id: DialogId }) }` where open state derives from a `?dialog=` URL search param and dialog ids are collected via TypeScript declaration merging. Dialogs become shareable, deep-linkable, back-button-friendly in ~60 lines — a perfect demonstration that `open`/`onOpenChange` can bind to *any* external store, including the URL.
- Story recomposition: click "New event" → URL gains `?dialog=edit-event` and the dialog opens → copy URL into a new tab → dialog is already open → browser Back closes it. Feeds: controlled-open prop guidance, state-management patterns, router integration FAQ.
- License caveat: the repo declares no license (verified via the GitHub API on 2026-07-06), so despite the tiny size the pattern must be re-derived, not copied — link-only.

---

### Diversity coverage of the ranked 15

confirm-destructive (gutenberg, frontier) · settings-modal / form-in-dialog (green-wall, frontier, cmux) · command-palette-host (t3code; plus kumo/electric/apsara/spell-ui in candidates) · handle-detached-trigger + typed payloads (frontier, spark-web, frosted-ui, t3code; selfmail/pure-ui/mary-ext in candidates) · drawer/sheet-on-dialog (oxide SideModal, spark-web Drawer, frosted-ui Drawer, shadcn Sheet) · controlled-no-trigger (oxide, tax-ui) · url-driven-state (bear-fit) · animation: CSS data-attributes (dify) and Motion integration (cambio, oxide) · focus management (playroom, gitbutler) · a11y/content guidance (gutenberg) · picker/search dialog (gitbutler) · wallet-modal/web3 + old package name (gear-js) · thin-wrapper-with-context-note (cmux) · mega-scale production (dify 148k★, gutenberg, posthog in candidates).

### Notes

- One candidate slot (dialog-100) was manually retained for mary-ext/social-app-fork (0★ deployed Bluesky fork) over an uninspected 8★ sheet.tsx clone, for its handle-passed-as-prop pattern.
- No instructive-misuse entry was ranked: nothing inspected qualified (wevote/WebApp was excluded entirely — its only "usage" is a TODO comment aspiring to migrate from @mui/material to Base UI Dialog).
- License hygiene: gutenberg (GPL/MPL dual), dify (custom), gitbutler (FSL-family), whop frosted-ui (NOASSERTION), cmux, posthog → all marked link-only in the JSON; MIT/Apache/MPL-2.0 entries are code-ok.
