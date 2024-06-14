---
productId: base-ui
title: React Dialog component and hook
components: DialogBackdrop, DialogClose, DialogDescription, DialogPopup, DialogRoot, DialogTitle, DialogTrigger
hooks: useDialogClose, useDialogPopup, useDialogRoot, useDialogTrigger
githubLabel: 'component: dialog'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
---

# Dialog

<p class="description">Dialogs inform users about a task and can contain critical information, require decisions, or involve multiple tasks.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "UnstyledDialogIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Installation

Base UI components are all available as a single package.

<codeblock storageKey="package-manager">

```bash npm
npm install @base_ui/react
```

```bash yarn
yarn add @base_ui/react
```

```bash pnpm
pnpm add @base_ui/react
```

</codeblock>

Once you have the package installed, import the component.

```ts
import * as Dialog from '@base_ui/react/Dialog';
```

## Anatomy

Dialogs are implemented using a collection of related components:

- `<Dialog.Root />` is a top-level component that facilitates communication between other components. It does not render to the DOM.
- `<Dialog.Popup />` is the dialog panel itself.
- `<Dialog.Backdrop />` is the background element appearing when a popup is visible. Use it to indicate that the page is inert when using a modal dialog. The Backdrop must be a sibling of the Popup component. It is mandatory for modal dialogs.
- `<Dialog.Trigger />` is the component (a button by default) that, when clicked, shows the popup. When it's not provided, the visibility of the Dialog can be controlled with its `open` prop (see [Controlled vs. uncontrolled behavior](#controlled-vs-uncontrolled-behavior)).
- `<Dialog.Close />` renders a button that closes the popup. You can attach your own click handlers to it to perform additional actions.
- `<Dialog.Title />` is an header element displaying the title of the dialog. It is referenced in the Dialog's ARIA attributes to properly announce the dialog.
- `<Dialog.Description />` is an element describing of the dialog. It is referenced in the Dialog's ARIA attributes to properly announce the dialog.

```tsx
<Dialog.Root>
  <Dialog.Trigger />

  <Dialog.Backdrop />

  <Dialog.Popup>
    <Dialog.Title />
    <Dialog.Description />
    <Dialog.Close />
  </Dialog.Popup>
</Dialog.Root>
```

## Modal and non-modal dialogs

Dialogs can be either modal (rendering the rest of the page inert) or non-modal.
A non-modal dialog can be used to implement tool windows.

The `modal` prop of the `<Dialog.Root>` controls this.
By default Dialogs are modal.

```tsx
<Dialog.Root modal={false}>{/* ... */}</Dialog.Root>
```

:::warning
To make the Dialog fully modal, you must have a Backdrop component and style it so it covers the entire viewport, blocking pointer interaction with other elements on the page.
:::

## Closing the dialog

The default way to close the dialog is clicking on the `<Dialog.Close>` component.
Dialogs also close when the user clicks outside of them or presses the <kbd className="key">Esc</kbd> key.

Closing on outside click can be disabled with a `dismissible` prop on the `Dialog.Root`:

```tsx
<Dialog.Root dismissible={false}>{/* ... */}</Dialog.Root>
```

## Controlled vs. uncontrolled behavior

The simplest way to control the visibility of the dialog is to use the `<Dialog.Trigger>` and `<Dialog.Close>` components.

You can set the initial state with the `defaultOpen` prop.

```tsx
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Popup>
    <Dialog.Title>Demo dialog</Dialog.Title>
    <Dialog.Close>Close</Dialog.Close>
  </Dialog.Popup>
</Dialog.Root>
```

Doing so ensures that the accessibity attributes are set correctly so that the trigger button is approriately announced by assistive technologies.

If you need to control the visibility programmatically from the outside, use the `value` prop.
You can still use the `<Dialog.Trigger>` and `<Dialog.Close>` components (though it's not necessary), but you need to make sure to create a handler for the `onOpenChange` event and update the state manually.

```tsx
const [open, setOpen] = React.useState(false);

return (
  <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger>Open</Dialog.Trigger>
    <Dialog.Popup>
      <Dialog.Title>Demo dialog</Dialog.Title>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Popup>
  </Dialog.Root>
);
```

## Nested dialogs

A dialog can open another dialog.
At times, it may be useful to know how may open sub-dialogs a given dialog has.
One example of this could be styling the bottom dialog in a way they appear below the top-most one.

The number of open child dialogs is present in the `data-nested-dialogs` attribute and in the `--nested-dialogs` CSS variable on the `<Dialog.Popup>` component.

{{"demo": "NestedDialogs.js"}}

Note that when dialogs are nested, only the bottom-most backdrop is rendered.

## Animation

The `<Dialog.Popup>` and `<Dialog.Backdrop>` components support transitions on entry and exit.

CSS animations and transitions are supported out of the box.
If a component has a transition or animation applied to it when it closes, it will be unmounted only after the animation finishes.

As this detection of exit animations requires an extra render, you may opt out of it by setting the `animated` prop on Root to `false`.
We also recommend doing so in automated tests, to avoid asynchronous behavior and make testing easier.

Alternatively, you can use JS-based animations with a library like framer-motion, React Spring, or similar.
With this approach set the `keepMounted` to `true` and let the animation library control mounting and unmounting.

### CSS transitions

Here is an example of how to apply a symmetric scale and fade transition with the default conditionally-rendered behavior:

```jsx
<Dialog.Popup className="DialogPopup">Dialog</Dialog.Popup>
```

```css
.DialogPopup {
  transition-property: opacity, transform;
  transition-duration: 0.2s;
  /* Represents the final styles once exited */
  opacity: 0;
  transform: translate(-50%, -35%) scale(0.8);
}

/* Represents the final styles once entered */
.DialogPopup[data-state='open'] {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

/* Represents the initial styles when entering */
.DialogPopup[data-entering] {
  opacity: 0;
  transform: translate(-50%, -35%) scale(0.8);
}
```

Styles need to be applied in three states:

- The exiting styles, placed on the base element class
- The open styles, placed on the base element class with `[data-state="open"]`
- The entering styles, placed on the base element class with `[data-entering]`

{{"demo": "DialogWithTransitions.js"}}

In newer browsers, there is a feature called `@starting-style` which allows transitions to occur on open for conditionally-mounted components:

```css
/* Base UI API - Polyfill */
.DialogPopup[data-entering] {
  opacity: 0;
  transform: translate(-50%, -35%) scale(0.8);
}

/* Official Browser API - no Firefox support as of May 2024 */
@starting-style {
  .DialogPopup[data-state='open'] {
    opacity: 0;
    transform: translate(-50%, -35%) scale(0.8);
  }
}
```

### CSS animations

CSS animations can also be used, requiring only two separate declarations:

```css
@keyframes scale-in {
  from {
    opacity: 0;
    transform: translate(-50%, -35%) scale(0.8);
  }
}

@keyframes scale-out {
  to {
    opacity: 0;
    transform: translate(-50%, -35%) scale(0.8);
  }
}

.DialogPopup {
  animation: scale-in 0.2s forwards;
}

.DialogPopup[data-exiting] {
  animation: scale-out 0.2s forwards;
}
```

### JavaScript animations

The `keepMounted` prop lets an external library control the mounting, for example `framer-motion`'s `AnimatePresence` component.

```js
function App() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>Trigger</Dialog.Trigger>
      <AnimatePresence>
        {open && (
          <Dialog.Popup
            keepMounted
            render={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            }
          >
            Dialog
          </Dialog.Popup>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
```

### Animation states

Four states are available as data attributes to animate the dialog, which enables full control depending on whether the popup is being animated with CSS transitions or animations, JavaScript, or is using the `keepMounted` prop.

- `[data-state="open"]` - `open` state is `true`.
- `[data-state="closed"]` - `open` state is `false`. Can still be mounted to the DOM if closing.
- `[data-entering]` - the popup was just inserted to the DOM. The attribute is removed 1 animation frame later. Enables "starting styles" upon insertion for conditional rendering.
- `[data-exiting]` - the popup is in the process of being removed from the DOM, but is still mounted.

## Composing a custom React component

Use the `render` prop to override the rendered element:

```jsx
<Dialog.Popup render={<MyCustomDialog />} />
// or
<Dialog.Popup render={(props) => <MyCustomDialog {...props} />} />
```

## Accessibility

Using the `<Dialog.Trigger>` sets the required accessibility attributes on the trigger button.
If you prefer controlling the open state differently, you need to apply these attributes on your own:

```tsx
const [open, setOpen] = React.useState(false);

return (
  <div>
    <button
      aria-haspopup="dialog"
      aria-controls="my-popup"
      type="button"
      onClick={() => setOpen(true)}
    >
      Open
    </button>

    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Popup id="my-popup">
        <Dialog.Title>Demo dialog</Dialog.Title>
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Popup>
    </Dialog.Root>
  </div>
);
```
