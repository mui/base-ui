# Cluster: menus — menu vs context-menu vs menubar vs navigation-menu

Decision guidance shared by the four "menu-shaped" components. Per-component briefs link here instead of repeating it. Evidence: the four docs pages, Root/Trigger JSDoc, `index.parts.ts` files, and boundary statements in issues (#3365, #51, #1407, #2526/#4349, #4186, #2254).

## Purpose per component

- **Menu** (`@base-ui/react/menu`) — "A list of actions in a dropdown, enhanced with keyboard navigation" [E docs]. A button-anchored popup of commands; the reference implementation of the ARIA menu-button pattern, and the *engine* the next two reuse.
- **Context Menu** (`@base-ui/react/context-menu`) — "A menu that appears at the pointer on right click or long press" [E docs]. Same popup, different provocation: `ContextMenu.Root`/`Trigger` replace Menu's, and **every other part is a direct re-export of the Menu part** [E context-menu/index.parts.ts; atomiks in #3365: "all the context menu parts are direct reexports of regular menu parts so they are interchangeable"]. Positioned at the pointer coordinates (virtual anchor), not a trigger box [E ContextMenuRoot source].
- **Menubar** (`@base-ui/react/menubar`) — "A menu bar providing commands and options for your application" [E docs]. A single `role="menubar"` container part; you place ordinary `Menu.Root`s inside it [E docs anatomy; Menubar.tsx `role: 'menubar'`]. Triggers become `role="menuitem"` composite items with left/right roving focus and hover-switching between open siblings [E MenuTrigger.tsx isInMenubar branch; Menubar tests]. Tracked as a Menu deliverable from the start ("[menu] Implement Menubar" #1407, shipped #1684) [E].
- **Navigation Menu** (`@base-ui/react/navigation-menu`) — "A collection of links and menus for website navigation" [E docs]. **Not an ARIA menu at all**: Root renders `<nav>`, the list is semantic `<ul>/<li>` (reworked in PR #2526), content holds plain `Link`s; no `role="menu"`/`menuitem` anywhere [E source grep — zero menu roles]. Optimized for hover-revealed panels of links with viewport-morphing animation.

## Decision dimensions

1. **Trigger gesture** — visible button click (Menu) · right-click/long-press on an area (Context Menu) · persistent horizontal bar, hover-slides between siblings (Menubar) · hover/focus over nav items (Navigation Menu).
2. **Content kind** — *actions/commands* (Menu, Context Menu, Menubar: `menuitem`, `menuitemcheckbox`, `menuitemradio`, `LinkItem` allowed) vs *links/navigation destinations* (Navigation Menu: anchors, arbitrary rich panels).
3. **ARIA pattern** — APG *Menu Button* (Menu), *Menu/Menubar* (Menubar, Context Menu popup) with roving focus, typeahead, `aria-haspopup`; Navigation Menu deliberately avoids menu roles — screen readers should announce a site nav, not an application menu; it had its own ARIA cleanup (#4349 invalid `aria-orientation`) [E].
4. **Discoverability duty** — context menus are an *enhancement only*: "Don't make a context menu the only way to perform actions… Always provide visible controls" [E context-menu docs Usage guidelines — the only usage-guidelines block among the four].

## Decision table

| You need | Use | Why |
|---|---|---|
| Actions behind a "⋯"/button | Menu | menu-button pattern, modal by default, typeahead |
| Right-click / long-press actions on a surface | Context Menu | pointer-anchored; same parts/styles as Menu [E #3365] |
| App-chrome File/Edit/View bar | Menubar | `role="menubar"` container of Menu.Roots; arrow-key bar navigation |
| Site header with link panels/mega-menu | Navigation Menu | semantic nav/ul/li + links; no menu semantics [E #2526] |
| Same actions from button *and* right-click | Menu + Context Menu sharing one styled item module | parts interchangeable; bottleneck is only Root/Trigger [E #3365 StackBlitz] |
| Choose a form value | none of these → Select/Combobox | see boundary below |

## Per-pair boundaries

- **Menu ↔ Context Menu** [E]: identical popup capabilities (submenus via shared `SubmenuRoot` since #2042, checkbox/radio items, groups). Differences: gesture (`contextmenu`/long-press vs click/hover/keyboard), anchoring (pointer coordinates vs trigger element), no `openOnHover`, and context menus don't support detached triggers/handles ("It doesn't support detached triggers yet" [E MenuRoot.tsx comment]). Context menu must never be the only path to an action [E docs].
- **Menu ↔ Menubar** [E]: Menubar is not a different menu — it's a *composite container* that changes Menu.Trigger into a roving `menuitem` and coordinates sibling menus (hover-move opens the neighbor, `sibling-open` close reason, shared "instant" animation group). Use Menubar when several menus form one persistent bar; a lone Menubar with one menu is just a Menu [I from anatomy].
- **Menu ↔ Navigation Menu** [E/I]: if activating an entry *navigates*, prefer Navigation Menu (or `Menu.LinkItem` for the odd link *inside* an action menu). Nav menus support link-plus-panel triggers, a real-world pattern with its own keyboard pitfalls (#4186 recommends the Apple.com split-chevron pattern) and click-only configuration asks (#2254) — none of which apply to action menus. Using role="menu" for site nav misleads AT users [I from #2526 semantics].
- **Menubar ↔ Navigation Menu** [I]: menubar = application commands (desktop-app mental model, APG menubar keyboard contract); navigation menu = website destinations. If the entries are links, it's a navigation menu regardless of looking like a bar.

## Menu vs Select (one paragraph)

Menu triggers *do things*; Select triggers *hold a value*. Select is "a common form component for choosing a predefined value in a dropdown menu" [E select docs subtitle] with `value`/`onValueChange`, a `Select.Value` display in the trigger, hidden-input form participation, and `listbox`/`option` roles; Menu has none of these — `Menu.RadioGroup` exists for exclusive *settings* inside an action menu (view density, sort order), not for form data [I from API affordances; no maintainer statement found — [G] searched "menu vs select" in issues]. If the choice must be filterable or typed, the pickers cluster applies (Select vs Combobox vs Autocomplete — see `_clusters/pickers.md`); the maintainer-drawn line for *filterable menus* specifically: "Autocomplete can be used as a filterable menu, but it has no support for nested submenus" [E atomiks, #4157].
