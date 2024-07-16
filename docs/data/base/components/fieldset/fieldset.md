---
productId: base-ui
title: React Fieldset component and hook
components: FieldsetRoot, FieldsetLabel
githubLabel: 'component: fieldset'
packageName: '@base_ui/react'
---

# Field

<p class="description">Fieldsets group multiple fields together with a label.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "UnstyledFieldIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Installation

Base UI components are all available as a single package.

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

Once you have the package installed, import the component.

```ts
import * as Fieldset from '@base_ui/react/Fieldset';
```

## Anatomy

Fieldsets are composed of two components:

- `<Fieldset.Root />` renders the `fieldset` element.
- `<Fieldset.Label />` renders a label for the fieldset.

```jsx
<Fieldset.Root>
  <Fieldset.Label />
</Fieldset.Root>
```

## Usage with Fields

`Field` components are placed inside the `Fieldset` component.

```jsx
<Fieldset.Root>
  <Fieldset.Label>Account details</Fieldset.Label>
  <Field.Root>
    <Field.Label>Name</Field.Label>
    <Field.Control />
  </Field.Root>
  <Field.Root>
    <Field.Label>Password</Field.Label>
    <Field.Control type="password" />
  </Field.Root>
  <Field.Root>
    <Field.Label>Address</Field.Label>
    <Field.Control />
  </Field.Root>
</Fieldset.Root>
```
