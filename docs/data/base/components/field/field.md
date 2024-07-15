---
productId: base-ui
title: React Field component and hook
components: FieldRoot, FieldLabel, FieldDescription, FieldControl
githubLabel: 'component: field'
packageName: '@base_ui/react'
---

# Field

<p class="description">Fields represent an individual section of a form containing an associated control, label, an optional description.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "UnstyledFieldIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Installation

Base UI components are all available as a single package.

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
import * as Field from '@base_ui/react/Field';
```

## Anatomy

Fields are composed of a root, label, and description:

```jsx
<Field.Root>
  <Field.Label />
  <Field.Description />
</Field.Root>
```

## Accessibility

When a Base UI form control is nested inside a `Field.Root`, the label and description will automatically be wired to it:

```jsx
<Field.Root>
  <Checkbox.Root>
    <Checkbox.Indicator />
  </Checkbox.Root>
  <Field.Label>My Checkbox</Field.Label>
  <Field.Description>My description</Field.Description>
</Field.Root>
```

When using a native control like `input` or `select`, use `Field.Control` and the `render` prop to ensure the label and descriptions are wired:

```jsx
<Field.Root>
  <Field.Control render={<input />} />
  <Field.Label>My Checkbox</Field.Label>
  <Field.Description>My description</Field.Description>
</Field.Root>
```

### Error Messages

`Field.Description` can be conditionally rendered to appear when the field's control has an error:

```jsx
function App() {
  const [error, setError] = React.useState('');

  function handleBlur(event) {
    if (event.currentTarget.value === '') {
      setError('Field must be filled in.');
    } else {
      setError('');
    }
  }

  const input = <input aria-invalid={Boolean(error)} onBlur={handleBlur} />;

  return (
    <Field.Root>
      <Field.Control render={input} />
      <Field.Label>My Checkbox</Field.Label>
      {error && <Field.Description>{error}</Field.Description>}
    </Field.Root>
  );
}
```
