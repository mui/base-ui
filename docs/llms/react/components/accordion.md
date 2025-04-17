---
title: Accordion
subtitle: A set of collapsible panels with headings.
description: A high-quality, unstyled React accordion component that displays a set of collapsible panels with headings.
---

# Accordion

A high-quality, unstyled React accordion component that displays a set of collapsible panels with headings.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Accordion {
  box-sizing: border-box;
  display: flex;
  width: 24rem;
  max-width: calc(100vw - 8rem);
  flex-direction: column;
  justify-content: center;
  color: var(--color-gray-900);
}

.Item {
  border-bottom: 1px solid var(--color-gray-200);
}

.Header {
  margin: 0;
}

.Trigger {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  gap: 1rem;
  align-items: baseline;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: var(--color-gray-900);
  font-family: inherit;
  font-weight: 500;
  font-size: 1rem;
  line-height: 1.5rem;
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  text-align: left;

  &:focus-visible {
    outline: 2px solid var(--color-blue);
  }
}

.TriggerIcon {
  box-sizing: border-box;
  flex-shrink: 0;
  width: 0.75rem;
  height: 0.75rem;
  margin-right: 0.5rem;
  transition: transform 150ms ease-out;

  [data-panel-open] > & {
    transform: rotate(45deg) scale(1.1);
  }
}

.Panel {
  box-sizing: border-box;
  height: var(--accordion-panel-height);
  overflow: hidden;
  color: var(--color-gray-600);
  font-size: 1rem;
  line-height: 1.5rem;
  transition: height 150ms ease-out;

  &[data-starting-style],
  &[data-ending-style] {
    height: 0;
  }
}

.Content {
  padding-bottom: 0.75rem;
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Accordion } from '@base-ui-components/react/accordion';
import styles from './index.module.css';

export default function ExampleAccordion() {
  return (
    <Accordion.Root className={styles.Accordion}>
      <Accordion.Item className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            What is Base UI?
            <PlusIcon className={styles.TriggerIcon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>
            Base UI is a library of high-quality unstyled React components for design
            systems and web apps.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            How do I get started?
            <PlusIcon className={styles.TriggerIcon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>
            Head to the “Quick start” guide in the docs. If you’ve used unstyled
            libraries before, you’ll feel at home.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            Can I use it for my project?
            <PlusIcon className={styles.TriggerIcon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>
            Of course! Base UI is free and open source.
          </div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentcolor" {...props}>
      <path d="M6.75 0H5.25V5.25H0V6.75L5.25 6.75V12H6.75V6.75L12 6.75V5.25H6.75V0Z" />
    </svg>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Accordion } from '@base-ui-components/react/accordion';

export default function ExampleAccordion() {
  return (
    <Accordion.Root className="flex w-96 max-w-[calc(100vw-8rem)] flex-col justify-center text-gray-900">
      <Accordion.Item className="border-b border-gray-200">
        <Accordion.Header>
          <Accordion.Trigger className="group flex w-full cursor-pointer items-baseline justify-between gap-4 py-2 text-left font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800">
            What is Base UI?
            <PlusIcon className="mr-2 size-3 shrink-0 transition-all ease-out group-data-[panel-open]:scale-110 group-data-[panel-open]:rotate-45" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden text-base text-gray-600 transition-[height] ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
          <div className="pb-3">
            Base UI is a library of high-quality unstyled React components for design
            systems and web apps.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className="border-b border-gray-200">
        <Accordion.Header>
          <Accordion.Trigger className="group flex w-full cursor-pointer items-baseline justify-between gap-4 py-2 text-left font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800">
            How do I get started?
            <PlusIcon className="mr-2 size-3 shrink-0 transition-all ease-out group-data-[panel-open]:scale-110 group-data-[panel-open]:rotate-45" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden text-base text-gray-600 transition-[height] ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
          <div className="pb-3">
            Head to the “Quick start” guide in the docs. If you’ve used unstyled
            libraries before, you’ll feel at home.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className="border-b border-gray-200">
        <Accordion.Header>
          <Accordion.Trigger className="group flex w-full cursor-pointer items-baseline justify-between gap-4 py-2 text-left font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800">
            Can I use it for my project?
            <PlusIcon className="mr-2 size-3 shrink-0 transition-all ease-out group-data-[panel-open]:scale-110 group-data-[panel-open]:rotate-45" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden text-base text-gray-600 transition-[height] ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
          <div className="pb-3">Of course! Base UI is free and open source.</div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentcolor" {...props}>
      <path d="M6.75 0H5.25V5.25H0V6.75L5.25 6.75V12H6.75V6.75L12 6.75V5.25H6.75V0Z" />
    </svg>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Accordion } from '@base-ui-components/react/accordion';

<Accordion.Root>
  <Accordion.Item>
    <Accordion.Header>
      <Accordion.Trigger />
    </Accordion.Header>
    <Accordion.Panel />
  </Accordion.Item>
</Accordion.Root>;
```

### Root

Groups all parts of the accordion.
Renders a `<div>` element.

**Root Props:**

| Prop             | Type                                                                        | Default      | Description                                                                                                                                                                                                |
| :--------------- | :-------------------------------------------------------------------------- | :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| defaultValue     | `any[]`                                                                     | -            | The uncontrolled value of the item(s) that should be initially expanded.To render a controlled accordion, use the `value` prop instead.                                                                    |
| value            | `any[]`                                                                     | -            | The controlled value of the item(s) that should be expanded.To render an uncontrolled accordion, use the `defaultValue` prop instead.                                                                      |
| onValueChange    | `((value: any[]) => void)`                                                  | -            | Event handler called when an accordion item is expanded or collapsed.&#xA;Provides the new value as an argument.                                                                                           |
| hiddenUntilFound | `boolean`                                                                   | `false`      | Allows the browser’s built-in page search to find and expand the panel contents.Overrides the `keepMounted` prop and uses `hidden="until-found"`&#xA;to hide the element without removing it from the DOM. |
| openMultiple     | `boolean`                                                                   | `true`       | Whether multiple items can be open at the same time.                                                                                                                                                       |
| disabled         | `boolean`                                                                   | `false`      | Whether the component should ignore user interaction.                                                                                                                                                      |
| loop             | `boolean`                                                                   | `true`       | Whether to loop keyboard focus back to the first item&#xA;when the end of the list is reached while using the arrow keys.                                                                                  |
| orientation      | `AccordionOrientation`                                                      | `'vertical'` | The visual orientation of the accordion.&#xA;Controls whether roving focus uses left/right or up/down arrow keys.                                                                                          |
| className        | `string \| ((state: State) => string)`                                      | -            | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                                   |
| keepMounted      | `boolean`                                                                   | `false`      | Whether to keep the element in the DOM while the panel is closed.&#xA;This prop is ignored when `hiddenUntilFound` is used.                                                                                |
| render           | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -            | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render.               |

**Root Data Attributes:**

| Attribute        | Type | Description                                 |
| :--------------- | :--- | :------------------------------------------ |
| data-orientation | -    | Indicates the orientation of the accordion. |
| data-disabled    | -    | Present when the accordion is disabled.     |

### Item

Groups an accordion header with the corresponding panel.
Renders a `<div>` element.

**Item Props:**

| Prop         | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :----------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value        | `any`                                                                       | -       | -                                                                                                                                                                                            |
| onOpenChange | `((open: boolean) => void)`                                                 | -       | Event handler called when the panel is opened or closed.                                                                                                                                     |
| disabled     | `boolean`                                                                   | `false` | Whether the component should ignore user interaction.                                                                                                                                        |
| className    | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render       | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Item Data Attributes:**

| Attribute     | Type     | Description                                  |
| :------------ | :------- | :------------------------------------------- |
| data-open     | -        | Present when the accordion item is open.     |
| data-disabled | -        | Present when the accordion item is disabled. |
| data-index    | `number` | Indicates the index of the accordion item.   |

### Header

A heading that labels the corresponding panel.
Renders an `<h3>` element.

**Header Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Header Data Attributes:**

| Attribute     | Type     | Description                                  |
| :------------ | :------- | :------------------------------------------- |
| data-open     | -        | Present when the accordion item is open.     |
| data-disabled | -        | Present when the accordion item is disabled. |
| data-index    | `number` | Indicates the index of the accordion item.   |

### Trigger

A button that opens and closes the corresponding panel.
Renders a `<button>` element.

**Trigger Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Trigger Data Attributes:**

| Attribute       | Type | Description                                  |
| :-------------- | :--- | :------------------------------------------- |
| data-panel-open | -    | Present when the accordion panel is open.    |
| data-disabled   | -    | Present when the accordion item is disabled. |

### Panel

A collapsible panel with the accordion item contents.
Renders a `<div>` element.

**Panel Props:**

| Prop             | Type                                                                        | Default | Description                                                                                                                                                                                                |
| :--------------- | :-------------------------------------------------------------------------- | :------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hiddenUntilFound | `boolean`                                                                   | `false` | Allows the browser’s built-in page search to find and expand the panel contents.Overrides the `keepMounted` prop and uses `hidden="until-found"`&#xA;to hide the element without removing it from the DOM. |
| className        | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                                   |
| keepMounted      | `boolean`                                                                   | `false` | Whether to keep the element in the DOM while the panel is closed.&#xA;This prop is ignored when `hiddenUntilFound` is used.                                                                                |
| render           | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render.               |

**Panel Data Attributes:**

| Attribute           | Type     | Description                                  |
| :------------------ | :------- | :------------------------------------------- |
| data-open           | -        | Present when the accordion panel is open.    |
| data-orientation    | -        | Indicates the orientation of the accordion.  |
| data-disabled       | -        | Present when the accordion item is disabled. |
| data-index          | `number` | Indicates the index of the accordion item.   |
| data-starting-style | -        | Present when the panel is animating in.      |
| data-ending-style   | -        | Present when the panel is animating out.     |

**Panel CSS Variables:**

| Variable                 | Type     | Default | Description                   |
| :----------------------- | :------- | :------ | :---------------------------- |
| --accordion-panel-height | `number` | -       | The accordion panel's height. |
| --accordion-panel-width  | `number` | -       | The accordion panel's width.  |
