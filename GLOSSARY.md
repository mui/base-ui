# Base UI

Base UI is a library of unstyled React components. This glossary names the concepts its components share, so code, docs and reviews use one word for each.

## Language

### Popups

**Popup**:
Content that a component shows on top of the page while it is open, such as a popover, menu, tooltip, dialog or select list.
_Avoid_: floating element, floating, overlay
_In code_: `positionerElement` is the popup in components without a positioner, such as Dialog.

**Root**:
The part that holds a popup's open state and groups its other parts. It renders no element of its own.
_Avoid_: provider, container

**Trigger**:
An element the user interacts with to open or close a popup. A popup can have several triggers; the one that opened it is the **active trigger**.
_Avoid_: reference, reference element, DOM reference
_In code_: the active trigger is `activeTriggerElement` in the popup store and `anchorElement` in `FloatingRootStore`.

**Anchor**:
The element or rectangle a popup is positioned against. When none is set, the component picks a default, usually the active trigger: Combobox uses its input, and Context Menu uses the point where it was opened. One that the interactions set, such as the cursor position, is the **anchor override**. The **anchor element** is the active trigger's element. Popup stores keep it after the popup unmounts; `FloatingRootStore` clears it while the popup isn't mounted.
_Avoid_: reference, position reference, DOM reference
_In code_: `anchorOverride` and `anchorElement`; the `anchor` selector returns the anchor override, falling back to the owner's anchor (usually the active trigger). A Positioner's `anchor` prop is applied by positioning and isn't in the store.

**Positioner**:
The part that places a popup next to its anchor and keeps it there as the page scrolls or resizes.
_Avoid_: floating element, floating wrapper
_In code_: `positionerElement` is the positioner in components that have one.

**Dismissal**:
Closing a popup because the user moved away from it rather than through one of its parts: pressing Escape, pressing outside it, or moving focus out of it. Each popup has one dismissal, shared by its Root, which listens for the presses and keys, and its Popup, which manages focus. It also holds the focus guards around the popup's trigger, which close it when focus tabs out past the trigger.
_Avoid_: dismiss, light dismiss

**Return focus**:
Moving focus back when a popup closes, usually to the trigger it last belonged to, or to the element focused before a programmatic open. It is skipped when focus has already moved somewhere else on purpose, and after a close that moves focus itself, such as tabbing out through a focus guard.
_Avoid_: final focus (that is the prop that customizes it), restore focus

**Outside-press timing**:
When a press outside a popup dismisses it. **Intentional** waits for the `click`, so a press that started before the popup opened, or a drag that starts inside and ends outside, doesn't close it. **Sloppy** closes as soon as a mouse press starts (`pointerdown`), so a popup that hides the rest of the page from assistive technology stops doing so before focus lands outside. For touch, sloppy closes on a tap's compatibility `mousedown`; a finger that moves a few pixels closes it on `touchend`, and one that moves further closes it while still moving.
_Avoid_: outside press event

**Hover intent**:
The logic that decides when hovering a trigger opens its popup and when leaving closes it. It covers the open and close delays, waiting for the pointer to rest, and the safe polygon that keeps the popup open while the pointer travels from the trigger to it. Each popup has one, shared by all its triggers.
_Avoid_: hover state, useHover

**Interaction store**:
The store a popup's interactions read and write: whether it is open, its anchor, its positioner element (the Positioner part, or the Popup itself for popups without one, such as Dialog), and the values the interactions share, such as the event that opened it. Popup stores implement it. Select, Combobox, Navigation Menu and Toast use a `FloatingRootStore` fed from their own state.
_Avoid_: floating context

**Floating UI modules**:
Modules ported from Floating UI keep its names, so they stay recognizable next to the library they came from: `FloatingTree`, `FloatingNode`, `FloatingTreeStore`, `FloatingFocusManager`, `FloatingPortal`, `FloatingPortalLite`, `FloatingDelayGroup` and `FloatingRootStore`, and positioning keeps Floating UI's terms because it wraps `@floating-ui/react-dom`'s `useFloating` (in `useBaseUIFloating`). The hook that creates a `FloatingRootStore`, which Floating UI calls `useFloatingRootContext`, is `useFloatingRootStore`, since it returns a store. The _Avoid_ lists above apply to the popup concepts and the state they share, not to these module names.
