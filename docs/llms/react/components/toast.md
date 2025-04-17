---
title: Toast
subtitle: Generates toast notifications.
description: A high-quality, unstyled React toast component to generate notifications.
---

# Toast

A high-quality, unstyled React toast component to generate notifications.

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

.Viewport {
  position: fixed;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  bottom: 2rem;
  right: 2rem;
  left: auto;
  top: auto;
}

.Toast {
  --gap: 0.75rem;
  --offset-y: calc(
    var(--toast-offset-y) * -1 + (var(--toast-index) * var(--gap) * -1) +
      var(--toast-swipe-movement-y)
  );
  position: absolute;
  left: 0;
  right: 0;
  margin: 0 auto;
  box-sizing: border-box;
  background: var(--color-gray-50);
  color: var(--color-gray-900);
  border: 1px solid var(--color-gray-200);
  padding: 1rem;
  width: 300px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-clip: padding-box;
  border-radius: 0.5rem;
  bottom: 0;
  left: auto;
  margin-right: 0;
  -webkit-user-select: none;
  user-select: none;
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.5s;
  cursor: default;
  z-index: calc(1000 - var(--toast-index));
  transform: translateX(var(--toast-swipe-movement-x))
    translateY(calc(var(--toast-swipe-movement-y) + (var(--toast-index) * -20%)))
    scale(calc(1 - (var(--toast-index) * 0.1)));

  &::after {
    top: 100%;
  }

  &[data-expanded] {
    transform: translateX(var(--toast-swipe-movement-x)) translateY(var(--offset-y));
  }

  &[data-starting-style],
  &[data-ending-style]:not([data-limited]) {
    transform: translateY(150%);
  }

  &[data-ending-style] {
    opacity: 0;

    &[data-swipe-direction='up'] {
      transform: translateY(calc(var(--toast-swipe-movement-y) - 150%));
    }
    &[data-swipe-direction='left'] {
      transform: translateX(calc(var(--toast-swipe-movement-x) - 150%))
        translateY(var(--offset-y));
    }
    &[data-swipe-direction='right'] {
      transform: translateX(calc(var(--toast-swipe-movement-x) + 150%))
        translateY(var(--offset-y));
    }
    &[data-swipe-direction='down'] {
      transform: translateY(calc(var(--toast-swipe-movement-y) + 150%));
    }
  }

  &::after {
    content: '';
    position: absolute;
    width: 100%;
    left: 0;
    height: calc(var(--gap) + 1px);
  }
}

.Title {
  font-weight: 500;
  font-size: 0.975rem;
  line-height: 1.25rem;
  margin: 0;
}

.Description {
  font-size: 0.925rem;
  line-height: 1.25rem;
  margin: 0;
}

.Close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  background: transparent;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;

  &:hover {
    background-color: var(--color-gray-100);
  }
}

.Icon {
  width: 1rem;
  height: 1rem;
}
```

```tsx
/* index.tsx */
'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import styles from './index.module.css';

export default function ExampleToast() {
  return (
    <Toast.Provider>
      <ToastButton />
      <Toast.Viewport className={styles.Viewport}>
        <ToastList />
      </Toast.Viewport>
    </Toast.Provider>
  );
}

function ToastButton() {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  function createToast() {
    setCount((prev) => prev + 1);
    toastManager.add({
      title: `Toast ${count + 1} created`,
      description: 'This is a toast notification.',
    });
  }

  return (
    <button type="button" className={styles.Button} onClick={createToast}>
      Create toast
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={styles.Toast}>
      <Toast.Title className={styles.Title} />
      <Toast.Description className={styles.Description} />
      <Toast.Close className={styles.Close} aria-label="Close">
        <XIcon className={styles.Icon} />
      </Toast.Close>
    </Toast.Root>
  ));
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';

export default function ExampleToast() {
  return (
    <Toast.Provider>
      <ToastButton />
      <Toast.Viewport className="fixed top-auto right-[2rem] bottom-[2rem] mx-auto flex w-full max-w-[300px]">
        <ToastList />
      </Toast.Viewport>
    </Toast.Provider>
  );
}

function ToastButton() {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  function createToast() {
    setCount((prev) => prev + 1);
    toastManager.add({
      title: `Toast ${count + 1} created`,
      description: 'This is a toast notification.',
    });
  }

  return (
    <button
      type="button"
      className="box-border flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 py-0 font-medium text-gray-900 outline-0 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue active:bg-gray-100"
      onClick={createToast}
    >
      Create toast
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className="absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] mr-0 w-[300px] [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+calc(var(--toast-index)*-15px)))_scale(calc(1-(var(--toast-index)*0.1)))] rounded-lg border border-gray-200 bg-gray-50 bg-clip-padding p-4 shadow-lg transition-all [transition-property:opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] select-none after:absolute after:bottom-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-[''] data-[ending-style]:opacity-0 data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y)))] data-[starting-style]:[transform:translateY(150%)] data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-[ending-style]:[&:not([data-limited])]:[transform:translateY(150%)]"
      style={{
        ['--gap' as string]: '1rem',
        ['--offset-y' as string]:
          'calc(var(--toast-offset-y) * -1 + (var(--toast-index) * var(--gap) * -1) + var(--toast-swipe-movement-y))',
      }}
    >
      <Toast.Title className="text-[0.975rem] leading-5 font-medium" />
      <Toast.Description className="text-[0.925rem] leading-5 text-gray-700" />
      <Toast.Close
        className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded border-none bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Close"
      >
        <XIcon className="h-4 w-4" />
      </Toast.Close>
    </Toast.Root>
  ));
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
```

## Usage

- `<Toast.Provider>` can be wrapped around your entire app, ensuring all toasts are rendered in the same viewport.
- &#x20;lets users jump into the toast viewport landmark region to navigate toasts with
  keyboard focus.

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Toast } from '@base-ui-components/react/toast';

<Toast.Provider>
  <Toast.Viewport>
    <Toast.Root>
      <Toast.Title />
      <Toast.Description />
      <Toast.Action />
      <Toast.Close />
    </Toast.Root>
  </Toast.Viewport>
</Toast.Provider>;
```

### Provider

Provides a context for creating and managing toasts.

**Provider Props:**

| Prop         | Type           | Default | Description                                                                                                                                               |
| :----------- | :------------- | :------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| limit        | `number`       | `3`     | The maximum number of toasts that can be displayed at once.&#xA;When the limit is reached, the oldest toast will be removed to make room for the new one. |
| toastManager | `ToastManager` | -       | A global manager for toasts to use outside of a React component.                                                                                          |
| timeout      | `number`       | `5000`  | The default amount of time (in ms) before a toast is auto dismissed.&#xA;A value of `0` will prevent the toast from being dismissed automatically.        |
| children     | `ReactNode`    | -       | -                                                                                                                                                         |

### Viewport

A container viewport for toasts.
Renders a `<div>` element.

**Viewport Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Viewport Data Attributes:**

| Attribute     | Type      | Description                                    |
| :------------ | :-------- | :--------------------------------------------- |
| data-expanded | `boolean` | Indicates toasts are expanded in the viewport. |

### Root

Groups all parts of an individual toast.
Renders a `<div>` element.

**Root Props:**

| Prop           | Type                                                                           | Default | Description                                                                                                                                                                                  |
| :------------- | :----------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| swipeDirection | `'left' \| 'right' \| 'up' \| 'down' \| 'left' \| 'right' \| 'up' \| 'down'[]` | -       | Direction(s) in which the toast can be swiped to dismiss.&#xA;Defaults to `['down', 'right']`.                                                                                               |
| toast          | `ToastObject`                                                                  | -       | The toast to render.                                                                                                                                                                         |
| className      | `string \| ((state: State) => string)`                                         | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render         | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)`    | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Root Data Attributes:**

| Attribute            | Type                                  | Description                                                    |
| :------------------- | :------------------------------------ | :------------------------------------------------------------- |
| data-expanded        | `boolean`                             | Present when the toast is expanded in the viewport.            |
| data-limited         | `boolean`                             | Present when the toast was removed due to exceeding the limit. |
| data-swipe-direction | `'up' \| 'down' \| 'left' \| 'right'` | The direction the toast was swiped.                            |
| data-swiping         | `boolean`                             | Present when the toast is being swiped.                        |
| data-type            | `string`                              | The type of the toast.                                         |
| data-starting-style  | -                                     | Present when the toast is animating in.                        |
| data-ending-style    | -                                     | Present when the toast is animating out.                       |

**Root CSS Variables:**

| Variable                 | Type     | Default | Description                                                                  |
| :----------------------- | :------- | :------ | :--------------------------------------------------------------------------- |
| --toast-index            | `number` | -       | Indicates the index of the toast in the list.                                |
| --toast-offset-y         | `number` | -       | Indicates the vertical pixels offset of the toast in the list when expanded. |
| --toast-swipe-movement-x | `number` | -       | Indicates the horizontal swipe movement of the toast.                        |
| --toast-swipe-movement-y | `number` | -       | Indicates the vertical swipe movement of the toast.                          |

### Title

A title that labels the toast.
Renders an `<h2>` element.

**Title Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Title Data Attributes:**

| Attribute | Type     | Description            |
| :-------- | :------- | :--------------------- |
| data-type | `string` | The type of the toast. |

### Description

A description that describes the toast.
Can be used as the default message for the toast when no title is provided.
Renders a `<p>` element.

**Description Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Description Data Attributes:**

| Attribute | Type     | Description            |
| :-------- | :------- | :--------------------- |
| data-type | `string` | The type of the toast. |

### Action

Performs an action when clicked.
Renders a `<button>` element.

**Action Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Action Data Attributes:**

| Attribute | Type     | Description            |
| :-------- | :------- | :--------------------- |
| data-type | `string` | The type of the toast. |

### Close

Closes the toast when clicked.
Renders a `<button>` element.

**Close Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Close Data Attributes:**

| Attribute | Type     | Description            |
| :-------- | :------- | :--------------------- |
| data-type | `string` | The type of the toast. |

## useToastManager

Manages toasts, called inside of a `Toast.Provider`.

```tsx title="Usage"
const toastManager = Toast.useToastManager();
```

### Return value

\--- PropsReferenceTable ---

### Method options

\--- PropsReferenceTable ---

### `add` method

Creates a toast by adding it to the toast list.

Returns a `toastId` that can be used to update or close the toast later.

```jsx title="Usage"
const toastId = toastManager.add({
  description: 'Hello, world!',
});
```

```jsx title="Example" {2,7-9}
function App() {
  const toastManager = Toast.useToastManager();
  return (
    <button
      type="button"
      onClick={() => {
        toastManager.add({
          description: 'Hello, world!',
        });
      }}
    >
      Add toast
    </button>
  );
}
```

The `title` and `description` strings are what are used to announce the toast to screen readers. Screen readers do not announce any extra content rendered inside `Toast.Root`, including the `Toast.Title` or `Toast.Description` components.

### `update` method

Updates the toast with new options.

```jsx title="Usage"
toastManager.update(toastId, {
  description: 'New description',
});
```

### `close` method

Closes the toast, removing it from the toast list after any animations complete.

```jsx title="Usage"
toastManager.close(toastId);
```

### `promise` method

Creates an asynchronous toast with three possible states: `loading`, `success`, and `error`.

```tsx title="Description configuration"
const toastId = toastManager.promise(
  new Promise((resolve) => {
    setTimeout(() => resolve('world!'), 1000);
  }),
  {
    // Each are a shortcut for the `description` option
    loading: 'Loading...',
    success: (data) => `Hello ${data}`,
    error: (err) => `Error: ${err}`,
  },
);
```

Each state also accepts the [method options](/react/components/toast#method-options) object to granularly control the toast for each state:

```tsx title="Method options configuration"
const toastId = toastManager.promise(
  new Promise((resolve) => {
    setTimeout(() => resolve('world!'), 1000);
  }),
  {
    loading: {
      title: 'Loading...',
      description: 'The promise is loading.',
    },
    success: {
      title: 'Success',
      description: 'The promise resolved successfully.',
    },
    error: {
      title: 'Error',
      description: 'The promise rejected.',
      actionProps: {
        children: 'Contact support',
        onClick() {
          // Redirect to support page
        },
      },
    },
  },
);
```

## Global manager

A global toast manager can be created by passing the `toastManager` prop to the `Toast.Provider`. This enables you to queue a toast from anywhere in the app (such as in functions outside the React tree) while still using the same toast renderer.

The created `toastManager` object has the same properties and methods as the `Toast.useToastManager()` hook.

```tsx title="Creating a manager instance"
const toastManager = Toast.createToastManager();
```

```jsx title="Using the instance"
<Toast.Provider toastManager={toastManager}>
```

## Stacking and animations

The `--toast-index` CSS variable can be used to determine the stacking order of the toasts. The 0th index toast appears at the front.

```css
.Toast {
  z-index: calc(1000 - var(--toast-index));
  transform: scale(1 - calc(0.1 * var(--toast-index)));
}
```

The `--toast-offset-y` CSS variable can be used to determine the vertical offset of the toasts when positioned absolutely with a translation offset — this is usually used with the `data-expanded` attribute, present when the toast viewport is being hovered or has focus.

```css
.Toast[data-expanded] {
  transform: translateY(var(--toast-offset-y));
}
```

The `--toast-swipe-movement-x` and `--toast-swipe-movement-y` CSS variables are used to determine the swipe movement of the toasts in order to add a translation offset.

```css "--toast-swipe-movement-x" "--toast-swipe-movement-y"
.Toast {
  transform: scale(1 - calc(0.1 * var(--toast-index))) +
    translateX(var(--toast-swipe-movement-x)) +
    translateY(calc(var(--toast-swipe-movement-y) + (var(--toast-index) * -20%)));
}
```

The `data-swipe-direction` attribute can be used to determine the swipe direction of the toasts to add a translation offset upon dismissal.

```css "data-swipe-direction"
&[data-ending-style] {
  opacity: 0;

  &[data-swipe-direction='up'] {
    transform: translateY(calc(var(--toast-swipe-movement-y) - 150%));
  }
  &[data-swipe-direction='down'] {
    transform: translateY(calc(var(--toast-swipe-movement-y) + 150%));
  }
  &[data-swipe-direction='left'] {
    transform: translateX(calc(var(--toast-swipe-movement-x) - 150%))
      translateY(var(--offset-y));
  }
  &[data-swipe-direction='right'] {
    transform: translateX(calc(var(--toast-swipe-movement-x) + 150%))
      translateY(var(--offset-y));
  }
}
```

The `data-limited` attribute indicates that the toast was removed from the list due to exceeding the `limit` option. This is useful for animating the toast differently when it is removed from the list.

## Examples

### Custom position

The position of the toasts is controlled by your own CSS. To change the toasts' position, you can modify the `Viewport` and `Root` styles. A more general component could accept a `data-position` attribute, which the CSS handles for each variation. The following shows a top-center position:

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

.Viewport {
  position: fixed;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  top: 1rem;
  right: 0;
  left: 0;
  bottom: auto;
}

.Toast {
  --gap: 0.75rem;
  --offset-y: calc(
    var(--toast-offset-y) + (var(--toast-index) * var(--gap)) +
      var(--toast-swipe-movement-y)
  );
  position: absolute;
  left: 0;
  right: 0;
  margin: 0 auto;
  box-sizing: border-box;
  background: var(--color-gray-50);
  color: var(--color-gray-900);
  border: 1px solid var(--color-gray-200);
  padding: 1rem;
  width: 300px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-clip: padding-box;
  border-radius: 0.5rem;
  top: 0;
  left: 0;
  right: 0;
  margin-right: auto;
  margin-left: auto;
  -webkit-user-select: none;
  user-select: none;
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.5s;
  cursor: default;
  z-index: calc(1000 - var(--toast-index));
  transform: translateX(var(--toast-swipe-movement-x))
    translateY(calc(var(--toast-swipe-movement-y) + (var(--toast-index) * 20%)))
    scale(calc(1 - (var(--toast-index) * 0.1)));

  &::after {
    bottom: 100%;
  }

  &[data-expanded] {
    transform: translateX(var(--toast-swipe-movement-x))
      translateY(calc(var(--offset-y)));
  }

  &[data-starting-style],
  &[data-ending-style]:not([data-limited]) {
    transform: translateY(-150%);
  }

  &[data-ending-style] {
    opacity: 0;

    &[data-swipe-direction='up'] {
      transform: translateY(calc(var(--toast-swipe-movement-y) - 150%));
    }
    &[data-swipe-direction='left'] {
      transform: translateX(calc(var(--toast-swipe-movement-x) - 150%))
        translateY(var(--offset-y));
    }
    &[data-swipe-direction='right'] {
      transform: translateX(calc(var(--toast-swipe-movement-x) + 150%))
        translateY(var(--offset-y));
    }
    &[data-swipe-direction='down'] {
      transform: translateY(calc(var(--toast-swipe-movement-y) + 150%));
    }
  }

  &::after {
    content: '';
    position: absolute;
    width: 100%;
    left: 0;
    height: calc(var(--gap) + 1px);
  }
}

.Title {
  font-weight: 500;
  font-size: 0.975rem;
  line-height: 1.25rem;
  margin: 0;
}

.Description {
  font-size: 0.925rem;
  line-height: 1.25rem;
  margin: 0;
}

.Close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  background: transparent;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;

  &:hover {
    background-color: var(--color-gray-100);
  }
}

.Icon {
  width: 1rem;
  height: 1rem;
}
```

```tsx
/* index.tsx */
'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import styles from './index.module.css';

export default function ExampleToast() {
  return (
    <Toast.Provider>
      <ToastButton />
      <Toast.Viewport className={styles.Viewport}>
        <ToastList />
      </Toast.Viewport>
    </Toast.Provider>
  );
}

function ToastButton() {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  function createToast() {
    setCount((prev) => prev + 1);
    toastManager.add({
      title: `Toast ${count + 1} created`,
      description: 'This is a toast notification.',
    });
  }

  return (
    <button type="button" className={styles.Button} onClick={createToast}>
      Create toast
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      swipeDirection="up"
      className={styles.Toast}
    >
      <Toast.Title className={styles.Title} />
      <Toast.Description className={styles.Description} />
      <Toast.Close className={styles.Close} aria-label="Close">
        <XIcon className={styles.Icon} />
      </Toast.Close>
    </Toast.Root>
  ));
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';

export default function ExampleToast() {
  return (
    <Toast.Provider>
      <ToastButton />
      <Toast.Viewport className="fixed top-[1rem] right-0 bottom-auto left-0 mx-auto flex w-full max-w-[300px]">
        <ToastList />
      </Toast.Viewport>
    </Toast.Provider>
  );
}

function ToastButton() {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  function createToast() {
    setCount((prev) => prev + 1);
    toastManager.add({
      title: `Toast ${count + 1} created`,
      description: 'This is a toast notification.',
    });
  }

  return (
    <button
      type="button"
      className="box-border flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 py-0 font-medium text-gray-900 outline-0 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue active:bg-gray-100"
      onClick={createToast}
    >
      Create toast
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      swipeDirection="up"
      className="absolute top-0 right-0 left-0 z-[calc(1000-var(--toast-index))] mx-auto w-[300px] [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+calc(var(--toast-index)*15px)))_scale(calc(1-(var(--toast-index)*0.1)))] rounded-lg border border-gray-200 bg-gray-50 bg-clip-padding p-4 shadow-lg transition-all [transition-property:opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] select-none after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-[''] data-[ending-style]:opacity-0 data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-offset-y)+calc(var(--toast-index)*var(--gap))+var(--toast-swipe-movement-y)))] data-[starting-style]:[transform:translateY(-150%)] data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-[ending-style]:[&:not([data-limited])]:[transform:translateY(-150%)]"
      style={{
        ['--gap' as string]: '0.75rem',
        ['--offset-y' as string]:
          'calc(var(--toast-offset-y) + (var(--toast-index) * var(--gap)) + var(--toast-swipe-movement-y))',
      }}
    >
      <Toast.Title className="text-[0.975rem] leading-5 font-medium" />
      <Toast.Description className="text-[0.925rem] leading-5 text-gray-700" />
      <Toast.Close
        className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded border-none bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Close"
      >
        <XIcon className="h-4 w-4" />
      </Toast.Close>
    </Toast.Root>
  ));
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
```

### Undo action

When adding a toast, the `actionProps` option can be used to define props for an action button inside of it—this enables the ability to undo an action associated with the toast.

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

.Viewport {
  position: fixed;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  bottom: 2rem;
  right: 2rem;
  left: auto;
  top: auto;
}

.Toast {
  --gap: 0.75rem;
  --offset-y: calc(
    var(--toast-offset-y) * -1 + (var(--toast-index) * var(--gap) * -1) +
      var(--toast-swipe-movement-y)
  );
  position: absolute;
  left: 0;
  right: 0;
  margin: 0 auto;
  box-sizing: border-box;
  background: var(--color-gray-50);
  color: var(--color-gray-900);
  border: 1px solid var(--color-gray-200);
  padding: 1rem;
  width: 300px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-clip: padding-box;
  border-radius: 0.5rem;
  bottom: 0;
  left: auto;
  margin-right: 0;
  -webkit-user-select: none;
  user-select: none;
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.5s;
  cursor: default;
  z-index: calc(1000 - var(--toast-index));
  transform: translateX(var(--toast-swipe-movement-x))
    translateY(calc(var(--toast-swipe-movement-y) + (var(--toast-index) * -20%)))
    scale(calc(1 - (var(--toast-index) * 0.1)));

  &::after {
    top: 100%;
  }

  &[data-expanded] {
    transform: translateX(var(--toast-swipe-movement-x)) translateY(var(--offset-y));
  }

  &[data-starting-style],
  &[data-ending-style]:not([data-limited]) {
    transform: translateY(150%);
  }

  &[data-ending-style] {
    opacity: 0;

    &[data-swipe-direction='up'] {
      transform: translateY(calc(var(--toast-swipe-movement-y) - 150%));
    }
    &[data-swipe-direction='left'] {
      transform: translateX(calc(var(--toast-swipe-movement-x) - 150%))
        translateY(var(--offset-y));
    }
    &[data-swipe-direction='right'] {
      transform: translateX(calc(var(--toast-swipe-movement-x) + 150%))
        translateY(var(--offset-y));
    }
    &[data-swipe-direction='down'] {
      transform: translateY(calc(var(--toast-swipe-movement-y) + 150%));
    }
  }

  &::after {
    content: '';
    position: absolute;
    width: 100%;
    left: 0;
    height: calc(var(--gap) + 1px);
  }
}

.Title {
  font-weight: 500;
  font-size: 0.975rem;
  line-height: 1.25rem;
  margin: 0;
}

.Description {
  font-size: 0.925rem;
  line-height: 1.25rem;
  margin: 0;
}

.Actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.UndoButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  background-color: var(--color-gray-900);
  color: var(--color-gray-50);
  border: none;

  &:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}

.Close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  background: transparent;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;

  &:hover {
    background-color: var(--color-gray-100);
  }
}

.Icon {
  width: 1rem;
  height: 1rem;
}
```

```tsx
/* index.tsx */
'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import styles from './index.module.css';

export default function UndoToastExample() {
  return (
    <Toast.Provider>
      <Form />
      <Toast.Viewport className={styles.Viewport}>
        <ToastList />
      </Toast.Viewport>
    </Toast.Provider>
  );
}

function Form() {
  const toastManager = Toast.useToastManager();

  function action() {
    const id = toastManager.add({
      title: 'Action performed',
      description: 'You can undo this action.',
      type: 'success',
      actionProps: {
        children: 'Undo',
        onClick() {
          toastManager.close(id);
          toastManager.add({
            title: 'Action undone',
          });
        },
      },
    });
  }

  return (
    <button type="button" onClick={action} className={styles.Button}>
      Perform action
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={styles.Toast}>
      <Toast.Title className={styles.Title} />
      <Toast.Description className={styles.Description} />
      <Toast.Action className={styles.UndoButton} />
      <Toast.Close className={styles.Close} aria-label="Close">
        <XIcon className={styles.Icon} />
      </Toast.Close>
    </Toast.Root>
  ));
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
```

### Promise

An asynchronous toast can be created with three possible states: `loading`, `success`, and `error`. The `type` string matches these states to change the styling. Each of the states also accepts the [method options](/react/components/toast#method-options) object for more granular control.

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

.Viewport {
  position: fixed;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  bottom: 2rem;
  right: 2rem;
  left: auto;
  top: auto;
}

.Toast {
  --gap: 0.75rem;
  --offset-y: calc(
    var(--toast-offset-y) * -1 + (var(--toast-index) * var(--gap) * -1) +
      var(--toast-swipe-movement-y)
  );
  position: absolute;
  left: 0;
  right: 0;
  margin: 0 auto;
  box-sizing: border-box;
  background: var(--color-gray-50);
  color: var(--color-gray-900);
  border: 1px solid var(--color-gray-200);
  padding: 1rem;
  width: 300px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-clip: padding-box;
  border-radius: 0.5rem;
  bottom: 0;
  left: auto;
  margin-right: 0;
  -webkit-user-select: none;
  user-select: none;
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.5s;
  cursor: default;
  z-index: calc(1000 - var(--toast-index));
  transform: translateX(var(--toast-swipe-movement-x))
    translateY(calc(var(--toast-swipe-movement-y) + (var(--toast-index) * -20%)))
    scale(calc(1 - (var(--toast-index) * 0.1)));

  &::after {
    top: 100%;
  }

  &[data-expanded] {
    transform: translateX(var(--toast-swipe-movement-x)) translateY(var(--offset-y));
  }

  &[data-starting-style],
  &[data-ending-style]:not([data-limited]) {
    transform: translateY(150%);
  }

  &[data-ending-style] {
    opacity: 0;

    &[data-swipe-direction='up'] {
      transform: translateY(calc(var(--toast-swipe-movement-y) - 150%));
    }
    &[data-swipe-direction='left'] {
      transform: translateX(calc(var(--toast-swipe-movement-x) - 150%))
        translateY(var(--offset-y));
    }
    &[data-swipe-direction='right'] {
      transform: translateX(calc(var(--toast-swipe-movement-x) + 150%))
        translateY(var(--offset-y));
    }
    &[data-swipe-direction='down'] {
      transform: translateY(calc(var(--toast-swipe-movement-y) + 150%));
    }
  }

  &::after {
    content: '';
    position: absolute;
    width: 100%;
    left: 0;
    height: calc(var(--gap) + 1px);
  }

  &[data-type='success'] {
    background-color: lightgreen;
    color: black;
  }

  &[data-type='error'] {
    background-color: lightpink;
    color: black;
  }
}

.Title {
  font-weight: 500;
  font-size: 0.975rem;
  line-height: 1.25rem;
  margin: 0;
}

.Description {
  font-size: 0.925rem;
  line-height: 1.25rem;
  margin: 0;
}

.Close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  background: transparent;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;

  &:hover {
    background-color: var(--color-gray-100);
  }
}

.Icon {
  width: 1rem;
  height: 1rem;
}
```

```tsx
/* index.tsx */
'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import styles from './index.module.css';

export default function PromiseToastExample() {
  return (
    <Toast.Provider>
      <PromiseDemo />
      <Toast.Viewport className={styles.Viewport} data-position="top">
        <ToastList />
      </Toast.Viewport>
    </Toast.Provider>
  );
}

function PromiseDemo() {
  const toastManager = Toast.useToastManager();

  function runPromise() {
    toastManager.promise(
      // Simulate an API request with a promise that resolves after 2 seconds
      new Promise<string>((resolve, reject) => {
        const shouldSucceed = Math.random() > 0.3; // 70% success rate
        setTimeout(() => {
          if (shouldSucceed) {
            resolve('operation completed');
          } else {
            reject(new Error('operation failed'));
          }
        }, 2000);
      }),
      {
        loading: 'Loading data...',
        success: (data: string) => `Success: ${data}`,
        error: (err: Error) => `Error: ${err.message}`,
      },
    );
  }

  return (
    <button type="button" onClick={runPromise} className={styles.Button}>
      Run promise
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={styles.Toast}>
      <Toast.Title className={styles.Title} />
      <Toast.Description className={styles.Description} />
      <Toast.Close className={styles.Close} aria-label="Close">
        <XIcon className={styles.Icon} />
      </Toast.Close>
    </Toast.Root>
  ));
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
```

### Custom

A toast with custom data can be created by passing any typed object interface to the `data` option. This enables you to pass any data (including functions) you need to the toast and access it in the toast's rendering logic.

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

.Viewport {
  position: fixed;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  bottom: 2rem;
  right: 2rem;
  left: auto;
  top: auto;
}

.Toast {
  --gap: 0.75rem;
  --offset-y: calc(
    var(--toast-offset-y) * -1 + (var(--toast-index) * var(--gap) * -1) +
      var(--toast-swipe-movement-y)
  );
  position: absolute;
  left: 0;
  right: 0;
  margin: 0 auto;
  box-sizing: border-box;
  background: var(--color-gray-50);
  color: var(--color-gray-900);
  border: 1px solid var(--color-gray-200);
  padding: 1rem;
  width: 300px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-clip: padding-box;
  border-radius: 0.5rem;
  bottom: 0;
  left: auto;
  margin-right: 0;
  -webkit-user-select: none;
  user-select: none;
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.5s;
  cursor: default;
  z-index: calc(1000 - var(--toast-index));
  transform: translateX(var(--toast-swipe-movement-x))
    translateY(calc(var(--toast-swipe-movement-y) + (var(--toast-index) * -20%)))
    scale(calc(1 - (var(--toast-index) * 0.1)));

  &::after {
    top: 100%;
  }

  &[data-expanded] {
    transform: translateX(var(--toast-swipe-movement-x)) translateY(var(--offset-y));
  }

  &[data-starting-style],
  &[data-ending-style]:not([data-limited]) {
    transform: translateY(150%);
  }

  &[data-ending-style] {
    opacity: 0;

    &[data-swipe-direction='up'] {
      transform: translateY(calc(var(--toast-swipe-movement-y) - 150%));
    }
    &[data-swipe-direction='left'] {
      transform: translateX(calc(var(--toast-swipe-movement-x) - 150%))
        translateY(var(--offset-y));
    }
    &[data-swipe-direction='right'] {
      transform: translateX(calc(var(--toast-swipe-movement-x) + 150%))
        translateY(var(--offset-y));
    }
    &[data-swipe-direction='down'] {
      transform: translateY(calc(var(--toast-swipe-movement-y) + 150%));
    }
  }

  &::after {
    content: '';
    position: absolute;
    width: 100%;
    left: 0;
    height: calc(var(--gap) + 1px);
  }
}

.Title {
  font-weight: 500;
  font-size: 0.975rem;
  line-height: 1.25rem;
  margin: 0;
}

.Description {
  font-size: 0.925rem;
  line-height: 1.25rem;
  margin: 0;
}

.Close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  background: transparent;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;

  &:hover {
    background-color: var(--color-gray-100);
  }
}

.Icon {
  width: 1rem;
  height: 1rem;
}
```

```tsx
/* index.tsx */
'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import styles from './index.module.css';

interface CustomToastData {
  userId: string;
}

function isCustomToast(
  toast: Toast.Root.ToastObject,
): toast is Toast.Root.ToastObject<CustomToastData> {
  return toast.data?.userId !== undefined;
}

export default function CustomToastExample() {
  return (
    <Toast.Provider>
      <CustomToast />
      <Toast.Viewport className={styles.Viewport} data-position="top">
        <ToastList />
      </Toast.Viewport>
    </Toast.Provider>
  );
}

function CustomToast() {
  const toastManager = Toast.useToastManager();

  function action() {
    const data: CustomToastData = {
      userId: '123',
    };

    toastManager.add({
      title: 'Toast with custom data',
      data,
    });
  }

  return (
    <button type="button" onClick={action} className={styles.Button}>
      Create custom toast
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={styles.Toast}
      data-position="top"
    >
      <Toast.Title className={styles.Title}>{toast.title}</Toast.Title>
      {isCustomToast(toast) && toast.data ? (
        <Toast.Description>`data.userId` is {toast.data.userId}</Toast.Description>
      ) : (
        <Toast.Description />
      )}
      <Toast.Close className={styles.Close} aria-label="Close">
        <XIcon className={styles.Icon} />
      </Toast.Close>
    </Toast.Root>
  ));
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
```
