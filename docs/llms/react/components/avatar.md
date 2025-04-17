---
title: Avatar
subtitle: An easily stylable avatar component.
description: A high-quality, unstyled React avatar component that is easy to customize.
---
# Avatar

A high-quality, unstyled React avatar component that is easy to customize.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Root {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  vertical-align: middle;
  border-radius: 100%;
  user-select: none;
  font-weight: 500;
  color: var(--color-gray-900);
  background-color: var(--color-gray-100);
  font-size: 1rem;
  line-height: 1;
  overflow: hidden;
  height: 3rem;
  width: 3rem;
}

.Image {
  object-fit: cover;
  height: 100%;
  width: 100%;
}

.Fallback {
  align-items: center;
  display: flex;
  justify-content: center;
  height: 100%;
  width: 100%;
  font-size: 1rem;
}
```

```tsx
/* index.tsx */
import * as React from "react";
import { Avatar } from "@base-ui-components/react/avatar";
import styles from "./index.module.css";

export default function ExampleAvatar() {
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <Avatar.Root className={styles.Root}>
        <Avatar.Image
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
          width="48"
          height="48"
          className={styles.Image}
        />
        <Avatar.Fallback className={styles.Fallback}>LT</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root className={styles.Root}>LT</Avatar.Root>
    </div>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from "react";
import { Avatar } from "@base-ui-components/react/avatar";

export default function ExampleAvatar() {
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <Avatar.Root className="inline-flex size-12 items-center justify-center overflow-hidden rounded-full bg-gray-100 align-middle text-base font-medium text-black select-none">
        <Avatar.Image
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
          width="48"
          height="48"
          className="size-full object-cover"
        />
        <Avatar.Fallback className="flex size-full items-center justify-center text-base">
          LT
        </Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root className="inline-flex size-12 items-center justify-center overflow-hidden rounded-full bg-gray-100 align-middle text-base font-medium text-black select-none">
        LT
      </Avatar.Root>
    </div>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Avatar } from "@base-ui-components/react/avatar";

<Avatar.Root>
  <Avatar.Image src="" />
  <Avatar.Fallback>LT</Avatar.Fallback>
</Avatar.Root>;
```

### Root

Displays a user's profile picture, initials, or fallback icon.
Renders a `<span>` element.

**Root Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Image

The image to be displayed in the avatar.
Renders an `<img>` element.

**Image Props:**

| Prop                  | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------------------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onLoadingStatusChange | `(status) => void`                                           | -       | Callback fired when the loading status changes.                                                                                                                                              |
| className             | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render                | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Fallback

Rendered when the image fails to load or when no image is provided.
Renders a `<span>` element.

**Fallback Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| delay     | `number`                                                     | -       | How long to wait before showing the fallback. Specified in milliseconds.                                                                                                                     |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |
