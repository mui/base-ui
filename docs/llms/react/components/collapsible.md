---
title: Collapsible
subtitle: A collapsible panel controlled by a button.
description: A high-quality, unstyled React collapsible component that displays a panel controlled by a button.
---
# Collapsible

A high-quality, unstyled React collapsible component that displays a panel controlled by a button.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Collapsible {
  display: flex;
  width: 14rem;
  min-height: 9rem;
  flex-direction: column;
  justify-content: center;
  color: var(--color-gray-900);
}

.Icon {
  width: 0.75rem;
  height: 0.75rem;
  transition: transform 150ms ease-out;
}

.Trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  border: 0;
  outline: 0;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background-color: var(--color-gray-100);
  color: var(--color-gray-900);
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;

  @media (hover: hover) {
    &:hover {
      background-color: var(--color-gray-200);
    }
  }

  &:active {
    background-color: var(--color-gray-200);
  }

  &:focus-visible {
    outline: 2px solid var(--color-blue);
  }

  &[data-panel-open] .Icon {
    transform: rotate(90deg);
  }
}

.Panel {
  display: flex;
  height: var(--collapsible-panel-height);
  flex-direction: column;
  justify-content: end;
  overflow: hidden;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: all 150ms ease-out;

  &[data-starting-style],
  &[data-ending-style] {
    height: 0;
  }
}

.Content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
  padding: 0.5rem 0 0.5rem 1.75rem;
  border-radius: 0.25rem;
  background-color: var(--color-gray-100);
  cursor: text;
}
```

```tsx
/* index.tsx */
import * as React from "react";
import { Collapsible } from "@base-ui-components/react/collapsible";
import styles from "./index.module.css";

export default function ExampleCollapsible() {
  return (
    <Collapsible.Root className={styles.Collapsible}>
      <Collapsible.Trigger className={styles.Trigger}>
        <ChevronIcon className={styles.Icon} />
        Recovery keys
      </Collapsible.Trigger>
      <Collapsible.Panel className={styles.Panel}>
        <div className={styles.Content}>
          <div>alien-bean-pasta</div>
          <div>wild-irish-burrito</div>
          <div>horse-battery-staple</div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

export function ChevronIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentcolor" />
    </svg>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from "react";
import { Collapsible } from "@base-ui-components/react/collapsible";

export default function ExampleCollapsible() {
  return (
    <Collapsible.Root className="flex min-h-36 w-56 flex-col justify-center text-gray-900">
      <Collapsible.Trigger className="group flex items-center gap-2 rounded-sm bg-gray-100 px-2 py-1 text-sm font-medium hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 active:bg-gray-200">
        <ChevronIcon className="size-3 transition-all ease-out group-data-[panel-open]:rotate-90" />
        Recovery keys
      </Collapsible.Trigger>
      <Collapsible.Panel className="flex h-[var(--collapsible-panel-height)] flex-col justify-end overflow-hidden text-sm transition-all ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
        <div className="mt-1 flex cursor-text flex-col gap-2 rounded-sm bg-gray-100 py-2 pl-7">
          <div>alien-bean-pasta</div>
          <div>wild-irish-burrito</div>
          <div>horse-battery-staple</div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

export function ChevronIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentcolor" />
    </svg>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Collapsible } from "@base-ui-components/react/collapsible";

<Collapsible.Root>
  <Collapsible.Trigger />
  <Collapsible.Panel />
</Collapsible.Root>;
```

### Root

Groups all parts of the collapsible.
Renders a `<div>` element.

**Root Props:**

| Prop         | Type                          | Default | Description                                                                                                                |
| :----------- | :---------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------- |
| defaultOpen  | `boolean`                     | `false` | Whether the collapsible panel is initially open.To render a controlled collapsible, use the `open` prop instead.           |
| open         | `boolean`                     | -       | Whether the collapsible panel is currently open.To render an uncontrolled collapsible, use the `defaultOpen` prop instead. |
| onOpenChange | `(open) => void`              | -       | Event handler called when the panel is opened or closed.                                                                   |
| disabled     | `boolean`                     | `false` | Whether the component should ignore user interaction.                                                                      |
| className    | `string \| (state) => string` | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                   |

### Trigger

A button that opens and closes the collapsible panel.
Renders a `<button>` element.

**Trigger Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Trigger Data Attributes:**

| Attribute       | Type | Description                                 |
| :-------------- | :--- | :------------------------------------------ |
| data-panel-open | -    | Present when the collapsible panel is open. |

### Panel

A panel with the collapsible contents.
Renders a `<div>` element.

**Panel Props:**

| Prop             | Type                                                         | Default | Description                                                                                                                                                                                                |
| :--------------- | :----------------------------------------------------------- | :------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hiddenUntilFound | `boolean`                                                    | `false` | Allows the browser’s built-in page search to find and expand the panel contents.Overrides the `keepMounted` prop and uses `hidden="until-found"`&#xA;to hide the element without removing it from the DOM. |
| className        | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                                   |
| keepMounted      | `boolean`                                                    | `false` | Whether to keep the element in the DOM while the panel is hidden.&#xA;This prop is ignored when `hiddenUntilFound` is used.                                                                                |
| render           | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render.               |

**Panel Data Attributes:**

| Attribute           | Type | Description                                   |
| :------------------ | :--- | :-------------------------------------------- |
| data-open           | -    | Present when the collapsible panel is open.   |
| data-closed         | -    | Present when the collapsible panel is closed. |
| data-starting-style | -    | Present when the panel is animating in.       |
| data-ending-style   | -    | Present when the panel is animating out.      |

**Panel CSS Variables:**

| Variable                   | Type     | Default | Description                     |
| :------------------------- | :------- | :------ | :------------------------------ |
| --collapsible-panel-height | `number` | -       | The collapsible panel's height. |
| --collapsible-panel-width  | `number` | -       | The collapsible panel's width.  |
