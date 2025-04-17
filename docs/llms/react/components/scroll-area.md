---
title: Scroll Area
subtitle: A native scroll container with custom scrollbars.
description: A high-quality, unstyled React scroll area that provides a native scroll container with custom scrollbars.
---
# Scroll Area

A high-quality, unstyled React scroll area that provides a native scroll container with custom scrollbars.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.ScrollArea {
  box-sizing: border-box;
  width: 24rem;
  height: 8.5rem;
  max-width: calc(100vw - 8rem);
}

.Viewport {
  height: 100%;
  border-radius: 0.375rem;
  outline: 1px solid var(--color-gray-200);
  outline-offset: -1px;
  overscroll-behavior: contain;

  &:focus-visible {
    outline: 2px solid var(--color-blue);
  }
}

.Content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-block: 0.75rem;
  padding-left: 1rem;
  padding-right: 1.5rem;
}

.Paragraph {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.375rem;
  color: var(--color-gray-900);
}

.Scrollbar {
  display: flex;
  justify-content: center;
  background-color: var(--color-gray-200);
  width: 0.25rem;
  border-radius: 0.375rem;
  margin: 0.5rem;
  opacity: 0;
  transition: opacity 150ms 300ms;

  &[data-hovering],
  &[data-scrolling] {
    opacity: 1;
    transition-duration: 75ms;
    transition-delay: 0ms;
  }

  &::before {
    content: "";
    position: absolute;
    width: 1.25rem;
    height: 100%;
  }
}

.Thumb {
  width: 100%;
  border-radius: inherit;
  background-color: var(--color-gray-500);
}
```

```tsx
/* index.tsx */
import * as React from "react";
import { ScrollArea } from "@base-ui-components/react/scroll-area";
import styles from "./index.module.css";

export default function ExampleScrollArea() {
  return (
    <ScrollArea.Root className={styles.ScrollArea}>
      <ScrollArea.Viewport className={styles.Viewport}>
        <div className={styles.Content}>
          <p className={styles.Paragraph}>
            Vernacular architecture is building done outside any academic
            tradition, and without professional guidance. It is not a particular
            architectural movement or style, but rather a broad category,
            encompassing a wide range and variety of building types, with
            differing methods of construction, from around the world, both
            historical and extant and classical and modern. Vernacular
            architecture constitutes 95% of the world's built environment, as
            estimated in 1995 by Amos Rapoport, as measured against the small
            percentage of new buildings every year designed by architects and
            built by engineers.
          </p>
          <p className={styles.Paragraph}>
            This type of architecture usually serves immediate, local needs, is
            constrained by the materials available in its particular region and
            reflects local traditions and cultural practices. The study of
            vernacular architecture does not examine formally schooled
            architects, but instead that of the design skills and tradition of
            local builders, who were rarely given any attribution for the work.
            More recently, vernacular architecture has been examined by
            designers and the building industry in an effort to be more energy
            conscious with contemporary design and construction—part of a
            broader interest in sustainable design.
          </p>
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className={styles.Scrollbar}>
        <ScrollArea.Thumb className={styles.Thumb} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from "react";
import { ScrollArea } from "@base-ui-components/react/scroll-area";

export default function ExampleScrollArea() {
  return (
    <ScrollArea.Root className="h-[8.5rem] w-96 max-w-[calc(100vw-8rem)]">
      <ScrollArea.Viewport className="h-full overscroll-contain rounded-md outline outline-1 -outline-offset-1 outline-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800">
        <div className="flex flex-col gap-4 py-3 pr-6 pl-4 text-sm leading-[1.375rem] text-gray-900">
          <p>
            Vernacular architecture is building done outside any academic
            tradition, and without professional guidance. It is not a particular
            architectural movement or style, but rather a broad category,
            encompassing a wide range and variety of building types, with
            differing methods of construction, from around the world, both
            historical and extant and classical and modern. Vernacular
            architecture constitutes 95% of the world's built environment, as
            estimated in 1995 by Amos Rapoport, as measured against the small
            percentage of new buildings every year designed by architects and
            built by engineers.
          </p>
          <p>
            This type of architecture usually serves immediate, local needs, is
            constrained by the materials available in its particular region and
            reflects local traditions and cultural practices. The study of
            vernacular architecture does not examine formally schooled
            architects, but instead that of the design skills and tradition of
            local builders, who were rarely given any attribution for the work.
            More recently, vernacular architecture has been examined by
            designers and the building industry in an effort to be more energy
            conscious with contemporary design and construction—part of a
            broader interest in sustainable design.
          </p>
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="m-2 flex w-1 justify-center rounded bg-gray-200 opacity-0 transition-opacity delay-300 data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[hovering]:duration-75 data-[scrolling]:opacity-100 data-[scrolling]:delay-0 data-[scrolling]:duration-75">
        <ScrollArea.Thumb className="w-full rounded bg-gray-500" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { ScrollArea } from "@base-ui-components/react/scroll-area";

<ScrollArea.Root>
  <ScrollArea.Viewport />
  <ScrollArea.Scrollbar>
    <ScrollArea.Thumb />
  </ScrollArea.Scrollbar>
  <ScrollArea.Corner />
</ScrollArea.Root>;
```

### Root

Groups all parts of the scroll area.
Renders a `<div>` element.

**Root Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Root CSS Variables:**

| Variable                    | Type     | Default | Description                      |
| :-------------------------- | :------- | :------ | :------------------------------- |
| --scroll-area-corner-height | `number` | -       | The scroll area's corner height. |
| --scroll-area-corner-width  | `number` | -       | The scroll area's corner width.  |

### Viewport

The actual scrollable container of the scroll area.
Renders a `<div>` element.

**Viewport Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Scrollbar

A vertical or horizontal scrollbar for the scroll area.
Renders a `<div>` element.

**Scrollbar Props:**

| Prop        | Type                                                         | Default      | Description                                                                                                                                                                                  |
| :---------- | :----------------------------------------------------------- | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| orientation | `'horizontal' \| 'vertical'`                                 | `'vertical'` | Whether the scrollbar controls vertical or horizontal scroll.                                                                                                                                |
| className   | `string \| (state) => string`                                | -            | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| keepMounted | `boolean`                                                    | `false`      | Whether to keep the HTML element in the DOM when the viewport isn’t scrollable.                                                                                                              |
| render      | `React.ReactElement \| (props, state) => React.ReactElement` | -            | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Scrollbar Data Attributes:**

| Attribute        | Type                         | Description                                            |
| :--------------- | :--------------------------- | :----------------------------------------------------- |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the scrollbar.            |
| data-hovering    | -                            | Present when the pointer is over the scroll area.      |
| data-scrolling   | -                            | Present when the users scrolls inside the scroll area. |

**Scrollbar CSS Variables:**

| Variable                   | Type     | Default | Description                     |
| :------------------------- | :------- | :------ | :------------------------------ |
| --scroll-area-thumb-height | `number` | -       | The scroll area thumb's height. |
| --scroll-area-thumb-width  | `number` | -       | The scroll area thumb's width.  |

### Thumb

The draggable part of the the scrollbar that indicates the current scroll position.
Renders a `<div>` element.

**Thumb Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Thumb Data Attributes:**

| Attribute        | Type                         | Description                                 |
| :--------------- | :--------------------------- | :------------------------------------------ |
| data-orientation | `'horizontal' \| 'vertical'` | Indicates the orientation of the scrollbar. |

### Corner

A small rectangular area that appears at the intersection of horizontal and vertical scrollbars.
Renders a `<div>` element.

**Corner Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |
