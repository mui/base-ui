---
productId: base-ui
title: React Dialog component and hook
components: DialogBackdrop, DialogClose, DialogDescription, DialogPopup, DialogRoot, DialogTitle, DialogTrigger, DialogPortal
hooks: useDialogClose, useDialogPopup, useDialogRoot, useDialogTrigger
githubLabel: 'component: dialog'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
---

# Dialog

<p class="description">Dialogs inform users about a task and can contain critical information, require decisions, or involve multiple tasks.</p>

{{"component": "modules/components/ComponentLinkHeader.js", "design": false}}

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
- `<Dialog.Backdrop />` is the optional background element appearing when a popup is visible. Use it to indicate that the page is inert when using a modal dialog. The Backdrop must be a sibling of the Popup component.
- `<Dialog.Trigger />` hosts a component (preferably a button) that, when clicked, shows the popup. This component does not render anything by itself but add functionality to its child. When it's not provided, the visibility of the Dialog can be controlled with its `open` prop (see [Controlled vs. uncontrolled behavior](#controlled-vs-uncontrolled-behavior)).
- `<Dialog.Close />` renders a button that closes the popup. You can attach your own click handlers to it to perform additional actions.
- `<Dialog.Title />` is an header element displaying the title of the dialog. It is referenced in the Dialog's ARIA attributes to properly announce the dialog.
- `<Dialog.Description />` is an element describing of the dialog. It is referenced in the Dialog's ARIA attributes to properly announce the dialog.

```tsx
<Dialog.Root>
  <Dialog.Trigger>
    <button />
  </Dialog.Trigger>

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
By default the dialogs are modal.

```tsx
<Dialog.Root modal={false}>{/* ... */}</Dialog.Root>
```

## Alert dialog

The Dialog component can be used to implement the Alert Dialog component.
Setting the `type` prop to `"alertdialog"` will cause the component to be announced by screen readers differently.

```tsx
<Dialog.Root type="alertdialog">{/* ... */}</Dialog.Root>
```

:::warning
According to WAI-ARIA specification, alert dialogs must be modal.

Setting both `type="alertdialog"` and `modal={false}` will show a warning in the browser's console.
:::

## Closing the dialog

The default way to close the dialog is clicking on the `<Dialog.Close>` component.
It is also possible to implement a soft-close functionality so the dialog closes when the <kbd className="key">Esc</kbd> key is pressed or when users click outside of it.

Set `softClose` to `true` to support both the <kbd className="key">Esc</kbd> key and clicking outside:

```tsx
<Dialog.Root softClose>{/* ... */}</Dialog.Root>
```

Setting the prop to `"clickOutside"` or `"escapeKey"` enables closing the dialog via one of these methods:

```tsx
<Dialog.Root softClose="clickOutside">{/* ... */}</Dialog.Root>
```

```tsx
<Dialog.Root softClose="escapeKey">{/* ... */}</Dialog.Root>
```

By default dialogs don't enable soft-closing.

## Controlled vs. uncontrolled behavior

The simplest way to control the visibility of the dialog is to use the `<Dialog.Trigger>` and `<Dialog.Close>` components.

You can set the initial state with the `defaultOpen` prop.

```tsx
<Dialog.Root>
  <Dialog.Trigger>
    <button>Open</button>
  </Dialog.Trigger>
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
    <Dialog.Trigger>
      <button>Open</button>
    </Dialog.Trigger>
    <Dialog.Popup>
      <Dialog.Title>Demo dialog</Dialog.Title>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Popup>
  </Dialog.Root>
);
```

## Animation

The `<Dialog.Popup>` and `<Dialog.Backdrop>` components support transitions on entry and exit.

If you wish to use CSS animations or transitions, add the `animated` prop to these components.
This will make them wait for the animation/transition to finish before they are unmounted.

Alternatively, you can use JS-based animations with a library like framer-motion, React Spring, or similar.
With this approach do not set the `animated` prop but set the `keepMounted` to `true` and let the library control mounting and unmounting.

TODO: demos

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
