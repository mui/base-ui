---
productId: base-ui
title: React Fieldset component and hook
components: FieldsetRoot, FieldsetLegend
githubLabel: 'component: fieldset'
packageName: '@base_ui/react'
---

# Fieldset

<p class="description">Fieldsets group multiple fields together with a label.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "UnstyledFieldsetIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

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
- `<Fieldset.Legend />` renders a label for the fieldset.

```jsx
<Fieldset.Root>
  <Fieldset.Legend />
</Fieldset.Root>
```

## Usage with Fields

`Field` components are placed inside the `Fieldset` component.

```jsx
<Fieldset.Root>
  <Fieldset.Legend>Account details</Fieldset.Legend>
  <Field.Root>
    <Field.Label>Name</Field.Label>
    <Field.Control />
  </Field.Root>
  <Field.Root>
    <Field.Label>Address</Field.Label>
    <Field.Control />
  </Field.Root>
  <Field.Root>
    <Field.Label>Notes</Field.Label>
    <Field.Control render={<textarea />} />
  </Field.Root>
</Fieldset.Root>
```
