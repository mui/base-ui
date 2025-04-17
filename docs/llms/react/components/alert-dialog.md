---
title: Alert Dialog
subtitle: A dialog that requires user response to proceed.
description: A high-quality, unstyled React alert dialog component that requires user response to proceed.
---

# Alert Dialog

A high-quality, unstyled React alert dialog component that requires user response to proceed.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Button {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  padding: 0 0.875rem;
  margin: 0;
  outline: 0;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  background-color: var(--color-gray-50);
  font-family: inherit;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5rem;
  color: var(--color-gray-900);
  user-select: none;

  &[data-color='red'] {
    color: var(--color-red);
  }

  @media (hover: hover) {
    &:hover {
      background-color: var(--color-gray-100);
    }
  }

  &:active {
    background-color: var(--color-gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}

.Backdrop {
  position: fixed;
  inset: 0;
  background-color: black;
  opacity: 0.2;
  transition: opacity 150ms;

  @media (prefers-color-scheme: dark) {
    opacity: 0.7;
  }

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
  }
}

.Popup {
  box-sizing: border-box;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24rem;
  max-width: calc(100vw - 3rem);
  margin-top: -2rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  outline: 1px solid var(--color-gray-300);
  background-color: var(--color-gray-50);
  color: var(--color-gray-900);
  transition: all 150ms;

  @media (prefers-color-scheme: dark) {
    outline: 1px solid var(--color-gray-300);
  }

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
}

.Title {
  margin-top: -0.375rem;
  margin-bottom: 0.25rem;
  font-size: 1.125rem;
  line-height: 1.75rem;
  letter-spacing: -0.0025em;
  font-weight: 500;
}

.Description {
  margin: 0 0 1.5rem;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--color-gray-600);
}

.Actions {
  display: flex;
  justify-content: end;
  gap: 1rem;
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import styles from './index.module.css';

export default function ExampleAlertDialog() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger data-color="red" className={styles.Button}>
        Discard draft
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={styles.Backdrop} />
        <AlertDialog.Popup className={styles.Popup}>
          <AlertDialog.Title className={styles.Title}>
            Discard draft?
          </AlertDialog.Title>
          <AlertDialog.Description className={styles.Description}>
            You can't undo this action.
          </AlertDialog.Description>
          <div className={styles.Actions}>
            <AlertDialog.Close className={styles.Button}>Cancel</AlertDialog.Close>
            <AlertDialog.Close data-color="red" className={styles.Button}>
              Discard
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';

export default function ExampleAlertDialog() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-red-800 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Discard draft
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 bg-black opacity-20 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-1 outline-gray-200 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:outline-gray-300">
          <AlertDialog.Title className="-mt-1.5 mb-1 text-lg font-medium">
            Discard draft?
          </AlertDialog.Title>
          <AlertDialog.Description className="mb-6 text-base text-gray-600">
            You can’t undo this action.
          </AlertDialog.Description>
          <div className="flex justify-end gap-4">
            <AlertDialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
              Cancel
            </AlertDialog.Close>
            <AlertDialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-red-800 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
              Discard
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { AlertDialog } from '@base-ui-components/react/alert-dialog';

<AlertDialog.Root>
  <AlertDialog.Trigger />
  <AlertDialog.Portal>
    <AlertDialog.Backdrop />
    <AlertDialog.Popup>
      <AlertDialog.Title />
      <AlertDialog.Description />
      <AlertDialog.Close />
    </AlertDialog.Popup>
  </AlertDialog.Portal>
</AlertDialog.Root>;
```

### Root

Groups all parts of the alert dialog.
Doesn’t render its own HTML element.

**Root Props:**

| Prop                 | Type                                                                                          | Default | Description                                                                                                                                                                                                                                                             |
| :------------------- | :-------------------------------------------------------------------------------------------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| defaultOpen          | `boolean`                                                                                     | `false` | Whether the dialog is initially open.To render a controlled dialog, use the `open` prop instead.                                                                                                                                                                        |
| open                 | `boolean`                                                                                     | -       | Whether the dialog is currently open.                                                                                                                                                                                                                                   |
| onOpenChange         | `((open: boolean, event: Event \| undefined, reason: OpenChangeReason \| undefined) => void)` | -       | Event handler called when the dialog is opened or closed.                                                                                                                                                                                                               |
| actionsRef           | `RefObject<{ unmount: () => void; }>`                                                         | -       | A ref to imperative actions.\* `unmount`: When specified, the dialog will not be unmounted when closed.&#xA;Instead, the `unmount` function must be called to unmount the dialog manually.&#xA;Useful when the dialog's animation is controlled by an external library. |
| onOpenChangeComplete | `((open: boolean) => void)`                                                                   | -       | Event handler called after any animations complete when the dialog is opened or closed.                                                                                                                                                                                 |
| children             | `ReactNode`                                                                                   | -       | -                                                                                                                                                                                                                                                                       |

### Trigger

A button that opens the alert dialog.
Renders a `<button>` element.

**Trigger Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Trigger Data Attributes:**

| Attribute       | Type | Description                                    |
| :-------------- | :--- | :--------------------------------------------- |
| data-popup-open | -    | Present when the corresponding dialog is open. |
| data-disabled   | -    | Present when the trigger is disabled.          |

### Portal

A portal element that moves the popup to a different part of the DOM.
By default, the portal element is appended to `<body>`.

**Portal Props:**

| Prop        | Type                                                    | Default | Description                                                              |
| :---------- | :------------------------------------------------------ | :------ | :----------------------------------------------------------------------- |
| container   | `HTMLElement \| RefObject<HTMLElement \| null> \| null` | -       | A parent element to render the portal element into.                      |
| children    | `ReactNode`                                             | -       | -                                                                        |
| keepMounted | `boolean`                                               | `false` | Whether to keep the portal mounted in the DOM while the popup is hidden. |

### Backdrop

An overlay displayed beneath the popup.
Renders a `<div>` element.

**Backdrop Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Backdrop Data Attributes:**

| Attribute           | Type | Description                               |
| :------------------ | :--- | :---------------------------------------- |
| data-open           | -    | Present when the dialog is open.          |
| data-closed         | -    | Present when the dialog is closed.        |
| data-starting-style | -    | Present when the dialog is animating in.  |
| data-ending-style   | -    | Present when the dialog is animating out. |

### Popup

A container for the alert dialog contents.
Renders a `<div>` element.

**Popup Props:**

| Prop         | Type                                                                                                       | Default | Description                                                                                                                                                                                  |
| :----------- | :--------------------------------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| initialFocus | `RefObject<HTMLElement \| null> \| ((interactionType: InteractionType) => RefObject<HTMLElement \| null>)` | -       | Determines the element to focus when the dialog is opened.&#xA;By default, the first focusable element is focused.                                                                           |
| finalFocus   | `RefObject<HTMLElement \| null>`                                                                           | -       | Determines the element to focus when the dialog is closed.&#xA;By default, focus returns to the trigger.                                                                                     |
| className    | `string \| ((state: State) => string)`                                                                     | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render       | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)`                                | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Popup Data Attributes:**

| Attribute               | Type | Description                                                      |
| :---------------------- | :--- | :--------------------------------------------------------------- |
| data-open               | -    | Present when the dialog is open.                                 |
| data-closed             | -    | Present when the dialog is closed.                               |
| data-nested             | -    | Present when the dialog is nested within another dialog.         |
| data-nested-dialog-open | -    | Present when the dialog has other open dialogs nested within it. |
| data-starting-style     | -    | Present when the dialog is animating in.                         |
| data-ending-style       | -    | Present when the dialog is animating out.                        |

### Title

A heading that labels the dialog.
Renders an `<h2>` element.

**Title Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Description

A paragraph with additional information about the alert dialog.
Renders a `<p>` element.

**Description Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Close

A button that closes the alert dialog.
Renders a `<button>` element.

**Close Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Close Data Attributes:**

| Attribute     | Type | Description                          |
| :------------ | :--- | :----------------------------------- |
| data-disabled | -    | Present when the button is disabled. |

## Examples

### Open from a menu

In order to open a dialog using a menu, control the dialog state and open it imperatively using the `onClick` handler on the menu item.

Make sure to also use the dialog's `finalFocus` prop to return focus back to the menu trigger.

```tsx {12-13,17-18,24-25,28-29} title="Connecting a dialog to a menu"
import * as React from 'react';
import { AlertDialog } from '@base-ui/components/alert-dialog';
import { Menu } from '@base-ui/components/menu';

function ExampleMenu() {
  const menuTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <React.Fragment>
      <Menu.Root>
        {/* Set the trigger ref */}
        <Menu.Trigger ref={menuTriggerRef}>Open menu</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              {/* Open the dialog when the menu item is clicked */}
              <Menu.Item onClick={() => setDialogOpen(true)}>Open dialog</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {/* Control the dialog state */}
      <AlertDialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop />
          {/* Return focus to the menu trigger when the dialog is closed */}
          <AlertDialog.Popup finalFocus={menuTriggerRef}>
            {/* prettier-ignore */}
            {/* Rest of the dialog */}
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </React.Fragment>
  );
}
```

### Close confirmation

This example shows a nested confirmation dialog that opens if the text entered in the parent dialog is going to be discarded.

To implement this, both dialogs should be controlled. The confirmation dialog may be opened when `onOpenChange` callback of the parent dialog receives a request to close. This way, the confirmation is automatically shown when the user clicks the backdrop, presses the Esc key, or clicks a close button.

Use the `[data-nested-dialog-open]` selector and the `var(--nested-dialogs)` CSS variable to customize the styling of the parent dialog. Backdrops of the child dialogs won't be rendered so that you can present the parent dialog in a clean way behind the one on top of it.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Button {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  padding: 0 0.875rem;
  margin: 0;
  outline: 0;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  background-color: var(--color-gray-50);
  font-family: inherit;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5rem;
  color: var(--color-gray-900);
  user-select: none;

  @media (hover: hover) {
    &:hover {
      background-color: var(--color-gray-100);
    }
  }

  &:active {
    background-color: var(--color-gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}

.GhostButton {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5rem;
  background-color: transparent;
  color: var(--color-red);
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  margin: -0.125rem -0.375rem;
  border: 0;
  outline: 0;

  @media (hover: hover) {
    &:hover {
      background-color: color-mix(in oklch, var(--color-red), transparent 95%);
    }
  }

  &:active {
    background-color: color-mix(in oklch, var(--color-red), transparent 90%);
  }

  @media (prefers-color-scheme: dark) {
    @media (hover: hover) {
      &:hover {
        background-color: color-mix(in oklch, var(--color-red), transparent 85%);
      }
    }

    &:active {
      background-color: color-mix(in oklch, var(--color-red), transparent 75%);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--color-red);
    outline-offset: -1px;
  }
}

.Backdrop {
  position: fixed;
  inset: 0;
  background-color: black;
  opacity: 0.2;
  transition: opacity 150ms cubic-bezier(0.45, 1.005, 0, 1.005);

  @media (prefers-color-scheme: dark) {
    opacity: 0.7;
  }

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
  }
}

.Popup {
  box-sizing: border-box;
  position: fixed;
  top: 50%;
  left: 50%;
  width: 24rem;
  max-width: calc(100vw - 3rem);
  margin-top: -2rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  outline: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-50);
  color: var(--color-gray-900);
  transition: all 150ms;

  transform: translate(-50%, -50%) scale(calc(1 - 0.1 * var(--nested-dialogs)));
  translate: 0 calc(0px + 1.25rem * var(--nested-dialogs));

  @media (prefers-color-scheme: dark) {
    outline: 1px solid var(--color-gray-300);
  }

  &[data-nested-dialog-open] {
    &::after {
      content: '';
      inset: 0;
      position: absolute;
      border-radius: inherit;
      background-color: rgb(0 0 0 / 0.05);
    }
  }

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
}

.Title {
  margin-top: -0.375rem;
  margin-bottom: 0.25rem;
  font-size: 1.125rem;
  line-height: 1.75rem;
  letter-spacing: -0.0025em;
  font-weight: 500;
}

.Description {
  margin: 0 0 1.5rem;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--color-gray-600);
}

.Actions {
  display: flex;
  justify-content: end;
  gap: 1rem;
}

.TextareaContainer {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
}

.Textarea {
  box-sizing: border-box;
  padding-block: 0.5rem;
  padding-inline: 0.875rem;
  margin: 0;
  border: 1px solid var(--color-gray-200);
  width: 100%;
  min-height: 12rem;
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 1rem;
  background-color: transparent;
  color: var(--color-gray-900);

  &:focus {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { Dialog } from '@base-ui-components/react/dialog';
import styles from './index.module.css';

export default function ExampleDialog() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [textareaValue, setTextareaValue] = React.useState('');

  return (
    <Dialog.Root
      open={dialogOpen}
      onOpenChange={(open) => {
        // Show the close confirmation if there’s text in the textarea
        if (!open && textareaValue) {
          setConfirmationOpen(true);
        } else {
          // Reset the text area value
          setTextareaValue('');
          // Open or close the dialog normally
          setDialogOpen(open);
        }
      }}
    >
      <Dialog.Trigger className={styles.Button}>Tweet</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Popup}>
          <Dialog.Title className={styles.Title}>New tweet</Dialog.Title>
          <form
            className={styles.TextareaContainer}
            onSubmit={(event) => {
              event.preventDefault();
              // Close the dialog when submitting
              setDialogOpen(false);
            }}
          >
            <textarea
              required
              className={styles.Textarea}
              placeholder="What’s on your mind?"
              value={textareaValue}
              onChange={(event) => setTextareaValue(event.target.value)}
            />
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Cancel</Dialog.Close>
              <button type="submit" className={styles.Button}>
                Tweet
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>

      {/* Confirmation dialog */}
      <AlertDialog.Root open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Popup className={styles.Popup}>
            <AlertDialog.Title className={styles.Title}>
              Discard tweet?
            </AlertDialog.Title>
            <AlertDialog.Description className={styles.Description}>
              Your tweet will be lost.
            </AlertDialog.Description>
            <div className={styles.Actions}>
              <AlertDialog.Close className={styles.Button}>
                Go back
              </AlertDialog.Close>
              <button
                type="button"
                className={styles.Button}
                onClick={() => {
                  setConfirmationOpen(false);
                  setDialogOpen(false);
                }}
              >
                Discard
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Dialog.Root>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { Dialog } from '@base-ui-components/react/dialog';

export default function ExampleDialog() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [textareaValue, setTextareaValue] = React.useState('');

  return (
    <Dialog.Root
      open={dialogOpen}
      onOpenChange={(open) => {
        // Show the close confirmation if there’s text in the textarea
        if (!open && textareaValue) {
          setConfirmationOpen(true);
        } else {
          // Reset the text area value
          setTextareaValue('');
          // Open or close the dialog normally
          setDialogOpen(open);
        }
      }}
    >
      <Dialog.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Tweet
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black opacity-20 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70" />
        <Dialog.Popup className="fixed top-[calc(50%+1.25rem*var(--nested-dialogs))] left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 scale-[calc(1-0.1*var(--nested-dialogs))] rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-1 outline-gray-200 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:rounded-[inherit] data-[nested-dialog-open]:after:bg-black/5 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:outline-gray-300">
          <Dialog.Title className="-mt-1.5 mb-1 text-lg font-medium">
            New tweet
          </Dialog.Title>
          <form
            className="mt-4 flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              // Close the dialog when submitting
              setDialogOpen(false);
            }}
          >
            <textarea
              required
              className="min-h-48 w-full rounded-md border border-gray-200 px-3.5 py-2 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
              placeholder="What’s on your mind?"
              value={textareaValue}
              onChange={(event) => setTextareaValue(event.target.value)}
            />
            <div className="flex justify-end gap-4">
              <Dialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100"
              >
                Tweet
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>

      {/* Confirmation dialog */}
      <AlertDialog.Root open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Popup className="fixed top-[calc(50%+1.25rem*var(--nested-dialogs))] left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 scale-[calc(1-0.1*var(--nested-dialogs))] rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-1 outline-gray-200 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:rounded-[inherit] data-[nested-dialog-open]:after:bg-black/5 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:outline-gray-300">
            <AlertDialog.Title className="-mt-1.5 mb-1 text-lg font-medium">
              Discard tweet?
            </AlertDialog.Title>
            <AlertDialog.Description className="mb-6 text-base text-gray-600">
              Your tweet will be lost.
            </AlertDialog.Description>
            <div className="flex items-center justify-end gap-4">
              <AlertDialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                Go back
              </AlertDialog.Close>
              <button
                type="button"
                className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100"
                onClick={() => {
                  setConfirmationOpen(false);
                  setDialogOpen(false);
                }}
              >
                Discard
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Dialog.Root>
  );
}
```
