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

**Hover intent**:
The logic that decides when hovering a trigger opens its popup and when leaving closes it. It covers the open and close delays, waiting for the pointer to rest, and the safe polygon that keeps the popup open while the pointer travels from the trigger to it. Each popup has one, shared by all its triggers.
_Avoid_: hover interaction, hover state, useHover
