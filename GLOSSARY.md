# Base UI

Base UI is a library of unstyled React components. This glossary names the concepts its components share, so code, docs and reviews use one word for each.

## Language

### Popups

**Popup**:
Content that a component shows on top of the page while it is open, such as a popover, menu, tooltip, dialog or select list.
_Avoid_: floating element, floating, overlay
_In code_: `outerPopupElement` is the popup in components without a positioner, such as Dialog.

**Root**:
The part that holds a popup's open state and groups its other parts. It renders no element of its own.
_Avoid_: provider, container

**Trigger**:
An element the user interacts with to open or close a popup. A popup can have several triggers; the one that opened it is the **active trigger**.
_Avoid_: reference, reference element, DOM reference
_In code_: the active trigger is `activeTriggerElement` in the popup store and `anchorElement` in `StandaloneInteractionStore`.

**Anchor**:
The element or rectangle a popup is positioned against. When none is set, the component picks a default, usually the active trigger: Combobox uses its input, and Context Menu uses the point where it was opened. One set explicitly is the **anchor override**. The **anchor element** is the DOM element the popup is anchored to, kept after the popup unmounts.
_Avoid_: reference, position reference, DOM reference
_In code_: `anchorOverride` and `anchorElement`; the `anchor` selector returns the anchor, falling back to the active trigger.

**Positioner**:
The part that places a popup next to its anchor and keeps it there as the page scrolls or resizes.
_Avoid_: floating element, floating wrapper
_In code_: `outerPopupElement` is the positioner in components that have one.

**Hover intent**:
The logic that decides when hovering a trigger opens its popup and when leaving closes it. It covers the open and close delays, waiting for the pointer to rest, and the safe polygon that keeps the popup open while the pointer travels from the trigger to it. Each popup has one, shared by all its triggers.
_Avoid_: hover interaction, hover state, useHover

**Interaction store**:
The store a popup's interactions read and write: whether it is open, its anchor, its outer popup element (the positioner, or the popup itself when it has none), and the values the interactions share, such as the event that opened it. Popup stores implement it. Select, Combobox, Navigation Menu and Toast use a standalone one fed from their own state.
_Avoid_: floating root context, floating context
