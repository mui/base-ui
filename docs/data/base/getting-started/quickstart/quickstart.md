# Quickstart

<p class="description">A quick guide to getting started with Base UI.</p>

:::info
If you're using Next.js 13.4 or later, check out the [Next.js App Router guide](/base-ui/guides/next-js-app-router/).
:::

## Installation

Run one of the following commands to add Base UI to your React project.

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

<!-- #react-peer-version -->

Please note that [react](https://www.npmjs.com/package/react) and [react-dom](https://www.npmjs.com/package/react-dom) are peer dependencies, meaning you should ensure they are installed before installing Base UI.

```json
"peerDependencies": {
  "react": "^17.0.0 || ^18.0.0",
  "react-dom": "^17.0.0 || ^18.0.0"
},
```

## Import a component

```jsx
import * as React from 'react';
import * as NumberField from '@base_ui/react/NumberField';

const NumberFieldDemo = () => (
  <NumberField.Root>
    <NumberField.Group>
      <NumberField.Decrement />
      <NumberField.Input />
      <NumberField.Increment />
    </NumberField.Group>
  </NumberField.Root>
);

export default NumberFieldDemo;
```

## Style your component

Base UI makes no assumptions about style at all. You're free to style your components
using any styling solution you like, whether that's plain CSS, Tailwind, CSS-in-JS, or something else.
