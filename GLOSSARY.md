# Base UI

Base UI is a library of unstyled React components. This glossary names the concepts its components share, so code, docs and reviews use one word for each.

## Language

### Popups

**Popup**:
Content that a component shows on top of the page while it is open, such as a popover, menu, tooltip, dialog or select list.
_Avoid_: floating element, floating, overlay
_In code_: `floatingElement` is the popup in components without a positioner, such as Dialog.

**Root**:
The part that holds a popup's open state and groups its other parts. It renders no element of its own.
_Avoid_: provider, container

**Trigger**:
An element the user interacts with to open or close a popup. A popup can have several triggers; the one that opened it is the **active trigger**.
_Avoid_: reference, reference element, DOM reference
_In code_: the active trigger is `activeTriggerElement` in the popup store and `domReferenceElement` in `FloatingRootStore`.

**Anchor**:
The element or rectangle a popup is positioned against. When none is set, the component picks a default, usually the active trigger: Combobox uses its input, and Context Menu uses the point where it was opened.
_Avoid_: reference, position reference
_In code_: `positionReference` in `FloatingRootStore`; its `referenceElement` selector returns the anchor, falling back to the active trigger.

**Positioner**:
The part that places a popup next to its anchor and keeps it there as the page scrolls or resizes.
_Avoid_: floating element, floating wrapper
_In code_: `floatingElement` is the positioner in components that have one.
