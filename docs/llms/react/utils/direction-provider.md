---
title: Direction Provider
subtitle: Enables RTL behavior for Base UI components.
description: A direction provider component that enables RTL behavior for Base UI components.
---
# Direction Provider

A direction provider component that enables RTL behavior for Base UI components.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Control {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 14rem;
  padding-block: 0.75rem;
}

.Track {
  width: 100%;
  background-color: var(--color-gray-200);
  box-shadow: inset 0 0 0 1px var(--color-gray-200);
  height: 0.25rem;
  border-radius: 0.25rem;
  position: relative;
}

.Indicator {
  border-radius: 0.25rem;
  background-color: var(--color-gray-700);
}

.Thumb {
  width: 1rem;
  height: 1rem;
  border-radius: 100%;
  background-color: white;
  outline: 1px solid var(--color-gray-300);

  &:focus-visible {
    outline: 2px solid var(--color-blue);
  }
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { DirectionProvider } from '@base-ui-components/react/direction-provider';
import { Slider } from '@base-ui-components/react/slider';
import styles from './index.module.css';

export default function ExampleDirectionProvider() {
  return (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <Slider.Root defaultValue={25}>
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </DirectionProvider>
    </div>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';
import { DirectionProvider } from '@base-ui-components/react/direction-provider';

export default function ExampleDirectionProvider() {
  return (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <Slider.Root defaultValue={25}>
          <Slider.Control className="flex w-56 items-center py-3">
            <Slider.Track className="relative h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200">
              <Slider.Indicator className="rounded bg-gray-700" />
              <Slider.Thumb className="size-4 rounded-full bg-white outline outline-1 outline-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </DirectionProvider>
    </div>
  );
}
```

## API reference

Import the component and wrap it around your app:

```jsx title="Anatomy"
import { DirectionProvider } from '@base-ui-components/react/direction-provider';

// prettier-ignore
<DirectionProvider>
  {/* Your app or a group of components */}
</DirectionProvider>
```

Enables RTL behavior for Base UI components.

**DirectionProvider Props:**

| Prop      | Type            | Default | Description                       |
| :-------- | :-------------- | :------ | :-------------------------------- |
| direction | `TextDirection` | `'ltr'` | The reading direction of the text |
| children  | `ReactNode`     | -       | -                                 |
