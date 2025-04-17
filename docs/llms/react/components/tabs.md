---
title: Tabs
subtitle: A component for toggling between related panels on the same page.
description: A high-quality, unstyled React scroll area that provides a native scroll container with custom scrollbars.
---
# Tabs

A high-quality, unstyled React scroll area that provides a native scroll container with custom scrollbars.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Tabs {
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
}

.List {
  display: flex;
  position: relative;
  z-index: 0;
  padding-inline: 0.25rem;
  gap: 0.25rem;
  box-shadow: inset 0 -1px var(--color-gray-200);
}

.Tab {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  margin: 0;
  outline: 0;
  background: none;
  appearance: none;
  color: var(--color-gray-600);
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  user-select: none;
  padding-inline: 0.5rem;
  padding-block: 0;
  height: 2rem;

  &[data-selected] {
    color: var(--color-gray-900);
  }

  @media (hover: hover) {
    &:hover {
      color: var(--color-gray-900);
    }
  }

  &:focus-visible {
    position: relative;

    &::before {
      content: "";
      position: absolute;
      inset: 0.25rem 0;
      border-radius: 0.25rem;
      outline: 2px solid var(--color-blue);
      outline-offset: -1px;
    }
  }
}

.Indicator {
  position: absolute;
  z-index: -1;
  left: 0;
  top: 50%;
  translate: var(--active-tab-left) -50%;
  width: var(--active-tab-width);
  height: 1.5rem;
  border-radius: 0.25rem;
  background-color: var(--color-gray-100);
  transition-property: translate, width;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}

.Panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 8rem;
  outline: 0;

  &:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
    border-radius: 0.375rem;
  }
}

.Icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-gray-300);
}
```

```tsx
/* index.tsx */
import * as React from "react";
import { Tabs } from "@base-ui-components/react/tabs";
import styles from "./index.module.css";

export default function ExampleTabs() {
  return (
    <Tabs.Root className={styles.Tabs} defaultValue="overview">
      <Tabs.List className={styles.List}>
        <Tabs.Tab className={styles.Tab} value="overview">
          Overview
        </Tabs.Tab>
        <Tabs.Tab className={styles.Tab} value="projects">
          Projects
        </Tabs.Tab>
        <Tabs.Tab className={styles.Tab} value="account">
          Account
        </Tabs.Tab>
        <Tabs.Indicator className={styles.Indicator} />
      </Tabs.List>
      <Tabs.Panel className={styles.Panel} value="overview">
        <OverviewIcon className={styles.Icon} />
      </Tabs.Panel>
      <Tabs.Panel className={styles.Panel} value="projects">
        <ProjectIcon className={styles.Icon} />
      </Tabs.Panel>
      <Tabs.Panel className={styles.Panel} value="account">
        <PersonIcon className={styles.Icon} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}

function OverviewIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 30 30"
      fill="currentcolor"
      {...props}
    >
      <path d="M 6 4 C 4.895 4 4 4.895 4 6 L 4 12 C 4 13.105 4.895 14 6 14 L 12 14 C 13.105 14 14 13.105 14 12 L 14 6 C 14 4.895 13.105 4 12 4 L 6 4 z M 18 4 C 16.895 4 16 4.895 16 6 L 16 12 C 16 13.105 16.895 14 18 14 L 24 14 C 25.105 14 26 13.105 26 12 L 26 6 C 26 4.895 25.105 4 24 4 L 18 4 z M 9 6 C 10.657 6 12 7.343 12 9 C 12 10.657 10.657 12 9 12 C 7.343 12 6 10.657 6 9 C 6 7.343 7.343 6 9 6 z M 18 6 L 24 6 L 24 12 L 18 12 L 18 6 z M 6 16 C 4.895 16 4 16.895 4 18 L 4 24 C 4 25.105 4.895 26 6 26 L 12 26 C 13.105 26 14 25.105 14 24 L 14 18 C 14 16.895 13.105 16 12 16 L 6 16 z M 18 16 C 16.895 16 16 16.895 16 18 L 16 24 C 16 25.105 16.895 26 18 26 L 24 26 C 25.105 26 26 25.105 26 24 L 26 18 C 26 16.895 25.105 16 24 16 L 18 16 z M 21 17.5 L 24.5 21 L 21 24.5 L 17.5 21 L 21 17.5 z M 9 18 L 11.886719 23 L 6.1132812 23 L 9 18 z" />
    </svg>
  );
}

function ProjectIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 30 30"
      fill="currentcolor"
      {...props}
    >
      <path d="M 14.984375 1.9863281 A 1.0001 1.0001 0 0 0 14 3 L 14 4 L 5 4 L 4 4 A 1.0001 1.0001 0 1 0 3.9804688 6 C 3.9348612 9.0608831 3.6893807 11.887023 3.1523438 14.142578 C 2.5565033 16.645108 1.6039585 18.395538 0.4453125 19.167969 A 1.0001 1.0001 0 0 0 1 21 L 4 21 C 4 22.105 4.895 23 6 23 L 11.787109 23 L 10.148438 26.042969 A 1.5 1.5 0 0 0 9 27.5 A 1.5 1.5 0 0 0 10.5 29 A 1.5 1.5 0 0 0 12 27.5 A 1.5 1.5 0 0 0 11.910156 26.992188 L 14.060547 23 L 15.939453 23 L 18.089844 26.992188 A 1.5 1.5 0 0 0 18 27.5 A 1.5 1.5 0 0 0 19.5 29 A 1.5 1.5 0 0 0 21 27.5 A 1.5 1.5 0 0 0 19.851562 26.042969 L 18.212891 23 L 24 23 C 25.105 23 26 22.105 26 21 L 26 6 A 1.0001 1.0001 0 1 0 26 4 L 25 4 L 16 4 L 16 3 A 1.0001 1.0001 0 0 0 14.984375 1.9863281 z M 5.9589844 6 L 14.832031 6 A 1.0001 1.0001 0 0 0 15.158203 6 L 23.958984 6 C 23.912194 9.0500505 23.687726 11.893974 23.152344 14.142578 C 22.583328 16.532444 21.674397 18.178754 20.585938 19 L 3.1523438 19 C 3.9976592 17.786874 4.6791735 16.365049 5.0976562 14.607422 C 5.6877248 12.129135 5.9137751 9.1554725 5.9589844 6 z" />
    </svg>
  );
}

function PersonIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 30 30"
      fill="currentcolor"
      {...props}
    >
      <path d="M15,3C8.373,3,3,8.373,3,15c0,6.627,5.373,12,12,12s12-5.373,12-12C27,8.373,21.627,3,15,3z M8,22.141 c1.167-3.5,4.667-2.134,5.25-4.03v-1.264c-0.262-0.141-1.013-1.109-1.092-1.865c-0.207-0.018-0.531-0.223-0.627-1.034 c-0.051-0.435,0.153-0.68,0.276-0.757c0,0-0.308-0.702-0.308-1.399C11.5,9.72,12.526,8,15,8c1.336,0,1.75,0.947,1.75,0.947 c1.194,0,1.75,1.309,1.75,2.844c0,0.765-0.308,1.399-0.308,1.399c0.124,0.077,0.328,0.322,0.277,0.757 c-0.096,0.811-0.42,1.016-0.627,1.034c-0.079,0.756-0.829,1.724-1.092,1.865v1.264c0.583,1.897,4.083,0.531,5.25,4.031 c0,0-2.618,2.859-7,2.859C10.593,25,8,22.141,8,22.141z" />
    </svg>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from "react";
import { Tabs } from "@base-ui-components/react/tabs";

export default function ExampleTabs() {
  return (
    <Tabs.Root
      className="rounded-md border border-gray-200"
      defaultValue="overview"
    >
      <Tabs.List className="relative z-0 flex gap-1 px-1 shadow-[inset_0_-1px] shadow-gray-200">
        <Tabs.Tab
          className="flex h-8 items-center justify-center border-0 px-2 text-sm font-medium text-gray-600 outline-none select-none before:inset-x-0 before:inset-y-1 before:rounded-sm before:-outline-offset-1 before:outline-blue-800 hover:text-gray-900 focus-visible:relative focus-visible:before:absolute focus-visible:before:outline focus-visible:before:outline-2 data-[selected]:text-gray-900"
          value="overview"
        >
          Overview
        </Tabs.Tab>
        <Tabs.Tab
          className="flex h-8 items-center justify-center border-0 px-2 text-sm font-medium text-gray-600 outline-none select-none before:inset-x-0 before:inset-y-1 before:rounded-sm before:-outline-offset-1 before:outline-blue-800 hover:text-gray-900 focus-visible:relative focus-visible:before:absolute focus-visible:before:outline focus-visible:before:outline-2 data-[selected]:text-gray-900"
          value="projects"
        >
          Projects
        </Tabs.Tab>
        <Tabs.Tab
          className="flex h-8 items-center justify-center border-0 px-2 text-sm font-medium text-gray-600 outline-none select-none before:inset-x-0 before:inset-y-1 before:rounded-sm before:-outline-offset-1 before:outline-blue-800 hover:text-gray-900 focus-visible:relative focus-visible:before:absolute focus-visible:before:outline focus-visible:before:outline-2 data-[selected]:text-gray-900"
          value="account"
        >
          Account
        </Tabs.Tab>
        <Tabs.Indicator className="absolute top-1/2 left-0 z-[-1] h-6 w-[var(--active-tab-width)] -translate-y-1/2 translate-x-[var(--active-tab-left)] rounded-sm bg-gray-100 transition-all duration-200 ease-in-out" />
      </Tabs.List>
      <Tabs.Panel
        className="relative flex h-32 items-center justify-center -outline-offset-1 outline-blue-800 focus-visible:rounded-md focus-visible:outline focus-visible:outline-2"
        value="overview"
      >
        <OverviewIcon className="size-10 text-gray-300" />
      </Tabs.Panel>
      <Tabs.Panel
        className="relative flex h-32 items-center justify-center -outline-offset-1 outline-blue-800 focus-visible:rounded-md focus-visible:outline focus-visible:outline-2"
        value="projects"
      >
        <ProjectIcon className="size-10 text-gray-300" />
      </Tabs.Panel>
      <Tabs.Panel
        className="relative flex h-32 items-center justify-center -outline-offset-1 outline-blue-800 focus-visible:rounded-md focus-visible:outline focus-visible:outline-2"
        value="account"
      >
        <PersonIcon className="size-10 text-gray-300" />
      </Tabs.Panel>
    </Tabs.Root>
  );
}

function OverviewIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 30 30"
      fill="currentcolor"
      {...props}
    >
      <path d="M 6 4 C 4.895 4 4 4.895 4 6 L 4 12 C 4 13.105 4.895 14 6 14 L 12 14 C 13.105 14 14 13.105 14 12 L 14 6 C 14 4.895 13.105 4 12 4 L 6 4 z M 18 4 C 16.895 4 16 4.895 16 6 L 16 12 C 16 13.105 16.895 14 18 14 L 24 14 C 25.105 14 26 13.105 26 12 L 26 6 C 26 4.895 25.105 4 24 4 L 18 4 z M 9 6 C 10.657 6 12 7.343 12 9 C 12 10.657 10.657 12 9 12 C 7.343 12 6 10.657 6 9 C 6 7.343 7.343 6 9 6 z M 18 6 L 24 6 L 24 12 L 18 12 L 18 6 z M 6 16 C 4.895 16 4 16.895 4 18 L 4 24 C 4 25.105 4.895 26 6 26 L 12 26 C 13.105 26 14 25.105 14 24 L 14 18 C 14 16.895 13.105 16 12 16 L 6 16 z M 18 16 C 16.895 16 16 16.895 16 18 L 16 24 C 16 25.105 16.895 26 18 26 L 24 26 C 25.105 26 26 25.105 26 24 L 26 18 C 26 16.895 25.105 16 24 16 L 18 16 z M 21 17.5 L 24.5 21 L 21 24.5 L 17.5 21 L 21 17.5 z M 9 18 L 11.886719 23 L 6.1132812 23 L 9 18 z" />
    </svg>
  );
}

function ProjectIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 30 30"
      fill="currentcolor"
      {...props}
    >
      <path d="M 14.984375 1.9863281 A 1.0001 1.0001 0 0 0 14 3 L 14 4 L 5 4 L 4 4 A 1.0001 1.0001 0 1 0 3.9804688 6 C 3.9348612 9.0608831 3.6893807 11.887023 3.1523438 14.142578 C 2.5565033 16.645108 1.6039585 18.395538 0.4453125 19.167969 A 1.0001 1.0001 0 0 0 1 21 L 4 21 C 4 22.105 4.895 23 6 23 L 11.787109 23 L 10.148438 26.042969 A 1.5 1.5 0 0 0 9 27.5 A 1.5 1.5 0 0 0 10.5 29 A 1.5 1.5 0 0 0 12 27.5 A 1.5 1.5 0 0 0 11.910156 26.992188 L 14.060547 23 L 15.939453 23 L 18.089844 26.992188 A 1.5 1.5 0 0 0 18 27.5 A 1.5 1.5 0 0 0 19.5 29 A 1.5 1.5 0 0 0 21 27.5 A 1.5 1.5 0 0 0 19.851562 26.042969 L 18.212891 23 L 24 23 C 25.105 23 26 22.105 26 21 L 26 6 A 1.0001 1.0001 0 1 0 26 4 L 25 4 L 16 4 L 16 3 A 1.0001 1.0001 0 0 0 14.984375 1.9863281 z M 5.9589844 6 L 14.832031 6 A 1.0001 1.0001 0 0 0 15.158203 6 L 23.958984 6 C 23.912194 9.0500505 23.687726 11.893974 23.152344 14.142578 C 22.583328 16.532444 21.674397 18.178754 20.585938 19 L 3.1523438 19 C 3.9976592 17.786874 4.6791735 16.365049 5.0976562 14.607422 C 5.6877248 12.129135 5.9137751 9.1554725 5.9589844 6 z" />
    </svg>
  );
}

function PersonIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 30 30"
      fill="currentcolor"
      {...props}
    >
      <path d="M15,3C8.373,3,3,8.373,3,15c0,6.627,5.373,12,12,12s12-5.373,12-12C27,8.373,21.627,3,15,3z M8,22.141 c1.167-3.5,4.667-2.134,5.25-4.03v-1.264c-0.262-0.141-1.013-1.109-1.092-1.865c-0.207-0.018-0.531-0.223-0.627-1.034 c-0.051-0.435,0.153-0.68,0.276-0.757c0,0-0.308-0.702-0.308-1.399C11.5,9.72,12.526,8,15,8c1.336,0,1.75,0.947,1.75,0.947 c1.194,0,1.75,1.309,1.75,2.844c0,0.765-0.308,1.399-0.308,1.399c0.124,0.077,0.328,0.322,0.277,0.757 c-0.096,0.811-0.42,1.016-0.627,1.034c-0.079,0.756-0.829,1.724-1.092,1.865v1.264c0.583,1.897,4.083,0.531,5.25,4.031 c0,0-2.618,2.859-7,2.859C10.593,25,8,22.141,8,22.141z" />
    </svg>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Tabs } from "@base-ui-components/react/tabs";

<Tabs.Root>
  <Tabs.List>
    <Tabs.Tab />
    <Tabs.Indicator />
  </Tabs.List>
  <Tabs.Panel />
</Tabs.Root>;
```

### Root

Groups the tabs and the corresponding panels.
Renders a `<div>` element.

**Root Props:**

| Prop          | Type                                                         | Default        | Description                                                                                                                                                                                  |
| :------------ | :----------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| defaultValue  | `any`                                                        | `0`            | The default value. Use when the component is not controlled.&#xA;When the value is `null`, no Tab will be selected.                                                                          |
| value         | `any`                                                        | -              | The value of the currently selected `Tab`. Use when the component is controlled.&#xA;When the value is `null`, no Tab will be selected.                                                      |
| onValueChange | `(value, event) => void`                                     | -              | Callback invoked when new value is being set.                                                                                                                                                |
| orientation   | `'horizontal' \| 'vertical'`                                 | `'horizontal'` | The component orientation (layout flow direction).                                                                                                                                           |
| className     | `string \| (state) => string`                                | -              | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render        | `React.ReactElement \| (props, state) => React.ReactElement` | -              | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Root Data Attributes:**

| Attribute                 | Type                                            | Description                                                                     |
| :------------------------ | :---------------------------------------------- | :------------------------------------------------------------------------------ |
| data-orientation          | `'horizontal' \| 'vertical'`                    | Indicates the orientation of the tabs.                                          |
| data-activation-direction | `'left' \| 'right' \| 'up' \| 'down' \| 'none'` | Indicates the direction of the activation (based on the previous selected tab). |

### List

Groups the individual tab buttons.
Renders a `<div>` element.

**List Props:**

| Prop            | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| activateOnFocus | `boolean`                                                    | `true`  | Whether to automatically change the active tab on arrow key focus.&#xA;Otherwise, tabs will be activated using Enter or Spacebar key press.                                                  |
| loop            | `boolean`                                                    | `true`  | Whether to loop keyboard focus back to the first item&#xA;when the end of the list is reached while using the arrow keys.                                                                    |
| className       | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render          | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**List Data Attributes:**

| Attribute                 | Type                                            | Description                                                                     |
| :------------------------ | :---------------------------------------------- | :------------------------------------------------------------------------------ |
| data-orientation          | `'horizontal' \| 'vertical'`                    | Indicates the orientation of the tabs.                                          |
| data-activation-direction | `'left' \| 'right' \| 'up' \| 'down' \| 'none'` | Indicates the direction of the activation (based on the previous selected tab). |

### Tab

An individual interactive tab button that toggles the corresponding panel.
Renders a `<button>` element.

**Tab Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value     | `any`                                                        | -       | The value of the Tab.&#xA;When not specified, the value is the child position index.                                                                                                         |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Tab Data Attributes:**

| Attribute                 | Type                                            | Description                                                                     |
| :------------------------ | :---------------------------------------------- | :------------------------------------------------------------------------------ |
| data-selected             | -                                               | Present when the tab is selected.                                               |
| data-highlighted          | -                                               | Present when the tab is highlighted.                                            |
| data-orientation          | `'horizontal' \| 'vertical'`                    | Indicates the orientation of the tabs.                                          |
| data-disabled             | -                                               | Present when the tab is disabled.                                               |
| data-activation-direction | `'left' \| 'right' \| 'up' \| 'down' \| 'none'` | Indicates the direction of the activation (based on the previous selected tab). |

### Indicator

A visual indicator that can be styled to match the position of the currently active tab.
Renders a `<span>` element.

**Indicator Props:**

| Prop                  | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------------------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| renderBeforeHydration | `boolean`                                                    | `false` | Whether to render itself before React hydrates.&#xA;This minimizes the time that the indicator isn’t visible after server-side rendering.                                                    |
| className             | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render                | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Indicator Data Attributes:**

| Attribute                 | Type                                            | Description                                                                     |
| :------------------------ | :---------------------------------------------- | :------------------------------------------------------------------------------ |
| data-orientation          | `'horizontal' \| 'vertical'`                    | Indicates the orientation of the tabs.                                          |
| data-activation-direction | `'left' \| 'right' \| 'up' \| 'down' \| 'none'` | Indicates the direction of the activation (based on the previous selected tab). |

**Indicator CSS Variables:**

| Variable            | Type     | Default | Description                                                                                 |
| :------------------ | :------- | :------ | :------------------------------------------------------------------------------------------ |
| --active-tab-bottom | `number` | -       | Indicates the distance on the bottom side from the parent's container if the tab is active. |
| --active-tab-height | `number` | -       | Indicates the width of the tab if it is active.                                             |
| --active-tab-left   | `number` | -       | Indicates the distance on the left side from the parent's container if the tab is active.   |
| --active-tab-right  | `number` | -       | Indicates the distance on the right side from the parent's container if the tab is active.  |
| --active-tab-top    | `number` | -       | Indicates the distance on the top side from the parent's container if the tab is active.    |
| --active-tab-width  | `number` | -       | Indicates the width of the tab if it is active.                                             |

### Panel

A panel displayed when the corresponding tab is active.
Renders a `<div>` element.

**Panel Props:**

| Prop        | Type                                                         | Default | Description                                                                                                                                                                                                                                                                           |
| :---------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| value       | `any`                                                        | -       | The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.&#xA;If not provided, it will fall back to the index of the panel.&#xA;It is recommended to explicitly provide it, as it's required for the tab panel to be rendered on the server. |
| className   | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                                                                                                              |
| keepMounted | `boolean`                                                    | `false` | Whether to keep the HTML element in the DOM while the panel is hidden.                                                                                                                                                                                                                |
| render      | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render.                                                                                          |

**Panel Data Attributes:**

| Attribute                 | Type                                            | Description                                                                     |
| :------------------------ | :---------------------------------------------- | :------------------------------------------------------------------------------ |
| data-orientation          | `'horizontal' \| 'vertical'`                    | Indicates the orientation of the tabs.                                          |
| data-activation-direction | `'left' \| 'right' \| 'up' \| 'down' \| 'none'` | Indicates the direction of the activation (based on the previous selected tab). |
| data-hidden               | -                                               | Present when the panel is hidden.                                               |
