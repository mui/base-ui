---
title: Separator
subtitle: A separator element accessible to screen readers.
description: A high-quality, unstyled React separator component that is accessible to screen readers.
---
# Separator

A high-quality, unstyled React separator component that is accessible to screen readers.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Container {
  display: flex;
  gap: 1rem;
  text-wrap: nowrap;
}

.Separator {
  width: 1px;
  background-color: var(--color-gray-300);
}

.Link {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--color-gray-900);
  text-decoration-color: var(--color-gray-400);
  text-decoration-thickness: 1px;
  text-decoration-line: none;
  text-underline-offset: 2px;

  @media (hover: hover) {
    &:hover {
      text-decoration-line: underline;
    }
  }

  &:focus-visible {
    border-radius: 0.125rem;
    outline: 2px solid var(--color-blue);
    text-decoration-line: none;
  }
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Separator } from '@base-ui-components/react/separator';
import styles from './index.module.css';

export default function ExampleSeparator() {
  return (
    <div className={styles.Container}>
      <a href="#" className={styles.Link}>
        Home
      </a>
      <a href="#" className={styles.Link}>
        Pricing
      </a>
      <a href="#" className={styles.Link}>
        Blog
      </a>
      <a href="#" className={styles.Link}>
        Support
      </a>

      <Separator orientation="vertical" className={styles.Separator} />

      <a href="#" className={styles.Link}>
        Log in
      </a>
      <a href="#" className={styles.Link}>
        Sign up
      </a>
    </div>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Separator } from '@base-ui-components/react/separator';

export default function ExampleSeparator() {
  return (
    <div className="flex gap-4 text-nowrap">
      <a
        href="#"
        className="text-sm text-gray-900 decoration-gray-400 decoration-1 underline-offset-2 outline-none hover:underline focus-visible:rounded-sm focus-visible:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800"
      >
        Home
      </a>
      <a
        href="#"
        className="text-sm text-gray-900 decoration-gray-400 decoration-1 underline-offset-2 outline-none hover:underline focus-visible:rounded-sm focus-visible:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800"
      >
        Pricing
      </a>
      <a
        href="#"
        className="text-sm text-gray-900 decoration-gray-400 decoration-1 underline-offset-2 outline-none hover:underline focus-visible:rounded-sm focus-visible:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800"
      >
        Blog
      </a>
      <a
        href="#"
        className="text-sm text-gray-900 decoration-gray-400 decoration-1 underline-offset-2 outline-none hover:underline focus-visible:rounded-sm focus-visible:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800"
      >
        Support
      </a>

      <Separator orientation="vertical" className="w-px bg-gray-300" />

      <a
        href="#"
        className="text-sm text-gray-900 decoration-gray-400 decoration-1 underline-offset-2 outline-none hover:underline focus-visible:rounded-sm focus-visible:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800"
      >
        Log in
      </a>
      <a
        href="#"
        className="text-sm text-gray-900 decoration-gray-400 decoration-1 underline-offset-2 outline-none hover:underline focus-visible:rounded-sm focus-visible:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800"
      >
        Sign up
      </a>
    </div>
  );
}
```

## API reference

Import the component and use it as a single part:

```jsx title="Anatomy"
import { Separator } from '@base-ui-components/react/separator';

<Separator />;
```

A separator element accessible to screen readers.
Renders a `<div>` element.

**Separator Props:**

| Prop        | Type                                                                        | Default        | Description                                                                                                                                                                                  |
| :---------- | :-------------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| orientation | `Orientation`                                                               | `'horizontal'` | The orientation of the separator.                                                                                                                                                            |
| className   | `string \| ((state: State) => string)`                                      | -              | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render      | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -              | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |
