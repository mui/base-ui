# Base UI

Base UI is a library of unstyled React components. This glossary names the concepts its components share, so code, docs and reviews use one word for each.

## Language

### Popups

**Popup**:
Content that a component shows on top of the page while it is open, such as a popover, menu, tooltip, dialog or select list.
_Avoid_: floating element, floating, overlay

**Root**:
The part that holds a popup's open state and groups its other parts. It renders no element of its own.
_Avoid_: provider, container

**Trigger**:
An element the user interacts with to open or close a popup. A popup can have several triggers; the one that opened it is the **active trigger**.
_Avoid_: reference, reference element, DOM reference

**Owner**:
The trigger a popup currently belongs to: usually the one that opened it, or one that claimed it later. The popup's ARIA relationships, focus return and trigger payload follow it. In code it is the **active trigger** (`activeTriggerId` and `activeTriggerElement`), and only the trigger ownership module changes it.
_Avoid_: current trigger, selected trigger

**Last trigger**:
The trigger the mounted popup was last anchored to. Unlike the owner, it is kept after the popup unmounts, so the interactions still recognize the trigger the popup last belonged to, until a `keepMounted` positioner clears it along with the anchor. In code it is `lastTriggerElement`.
_Avoid_: last owner, DOM reference, previous trigger

**Registry version**:
A counter that moves on whenever a trigger registers or unregisters while the popup is open. The Root settles ownership after each change, including when one trigger replaces another and the number of triggers stays the same.
_Avoid_: trigger count

**Lone-trigger claim**:
When a popup is open without an owner and exactly one trigger is registered, that trigger becomes the owner, whether the popup has just opened or the other triggers have unmounted. It doesn't apply when the popup was opened deliberately without a trigger, such as with a handle's `open(null)`.
_Avoid_: implicit trigger, implicit active trigger

**Anchor**:
The element or rectangle a popup is positioned against. It is the active trigger unless one is set explicitly.
_Avoid_: reference, position reference

**Positioner**:
The part that places a popup next to its anchor and keeps it there as the page scrolls or resizes.
_Avoid_: floating element, floating wrapper

**Dismissal**:
Closing a popup because the user moved away from it rather than through one of its parts: pressing Escape, pressing outside it, or moving focus out of it. Each popup has one dismissal, shared by its Root, which listens for the presses and keys, and its Popup, which manages focus. It also holds the focus guards around the popup's trigger, which close it when focus tabs out past the trigger.
_Avoid_: dismiss, light dismiss

**Return focus**:
Moving focus back when a popup closes, usually to the trigger it last belonged to, or to the element focused before a programmatic open. It is skipped when focus has already moved somewhere else on purpose, and after a close that moves focus itself, such as tabbing out through a focus guard.
_Avoid_: final focus (that is the prop that customizes it), restore focus

**Outside-press timing**:
When a press outside a popup dismisses it. **Intentional** waits for the `click`, so a press that started before the popup opened, or a drag that starts inside and ends outside, doesn't close it. **Sloppy** closes as soon as a mouse press starts (`pointerdown`), so a popup that hides the rest of the page from assistive technology stops doing so before focus lands outside. For touch, sloppy closes on a tap's compatibility `mousedown`; a finger that moves a few pixels closes it on `touchend`, and one that moves further closes it while still moving.
_Avoid_: outside press event

**Popup tree**:
The popups of one family that are nested inside each other, such as a menu and its submenus, plus anything from another family that registers in it, such as detached Menu triggers rendered inside a Popover. Tree members find their open descendants and ancestors through it, so a parent popup can tell that a child keeps an Escape press or an outside press from reaching it, or that the pointer is moving into a child. It also carries events the members share, such as a menu item being hovered.
_Avoid_: floating tree

**Tree member**:
A popup that registers a node in a popup tree: Popover, Preview Card, the Menu family, Menubar and Navigation Menu. Other popups, such as Tooltip, Select and Combobox, may read the tree but don't register a node, so a member doesn't count them as its descendants.
_Avoid_: floating node

**Family tree**:
Each popup family keeps its own popup tree. A member nested in a popup of another family records that popup's node as its parent, but it registers in its own family's tree, so the other family's tree doesn't see it. Detached Menu triggers rendered inside a Popover are the exception: outside their Menu Root, they register in the Popover's tree, and the Menu's tree events go out on it.
_Avoid_: shared tree

**Snapshot**:
What a tree member publishes on its node for the other members: whether it is open, its floating and trigger elements, and its interaction data. It is written in a layout effect after the member renders, not read live from its store, so a node the member stops updating keeps its last snapshot. That snapshot can go stale: when a Menu switches triggers, the previous trigger's node keeps reporting the Menu as open, so a parent may still treat it as an open child (a known issue).
_Avoid_: node context, floating context

**Hover intent**:
The logic that decides when hovering a trigger opens its popup and when leaving closes it. It covers the open and close delays, waiting for the pointer to rest, and the safe polygon that keeps the popup open while the pointer travels from the trigger to it. Each popup has one, shared by all its triggers.
_Avoid_: hover interaction, hover state, useHover
