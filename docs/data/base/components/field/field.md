---
productId: base-ui
title: React Field component and hook
components: FieldRoot, FieldLabel, FieldMessage, FieldControl, FieldValidity
githubLabel: 'component: field'
packageName: '@base_ui/react'
---

# Field

<p class="description">Fields represent an individual section of a form containing an associated control and label, as well as any description or validation messages.</p>

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
import * as Field from '@base_ui/react/Field';
```

## Anatomy

Fields are implemented using a collection of related components:

- `<Field.Root />` is a top-level component that wraps all other components.
- `<Field.Control />` renders the control when not using a native Base UI component.
- `<Field.Label />` renders a label for the control.
- `<Field.Message />` renders an optional message for the control to describe it or show validation errors.
- `<Field.Validity />` is an optional render prop component that enables reading raw `ValidityState` to render custom JSX.

```jsx
<Field.Root>
  <Field.Control />
  <Field.Label />
  <Field.Message />
  <Field.Validity />
</Field.Root>
```

## Accessibility

All Base UI input components are aware of Base UI's `Field` component. The label and description are automatically wired to it when placed inside a `Field.Root`:

```jsx
<Field.Root>
  <Checkbox.Root>
    <Checkbox.Indicator />
  </Checkbox.Root>
  <Field.Label>My checkbox</Field.Label>
  <Field.Message>My description</Field.Message>
</Field.Root>
```

When using a native control like `input` or a custom component which is not aware of Base UI's `Field`, use `Field.Control`:

```jsx
<Field.Root>
  <Field.Control />
  <Field.Label>My input</Field.Label>
  <Field.Message>My description</Field.Message>
</Field.Root>
```

The `render` prop allows you to pass a custom component or tag, different from the default of `input`:

```jsx
<Field.Control render={<select />} />
```

## Validation

When adding native HTML validation props like `required` or `pattern`, the `show` prop on `Field.Message` shows the message only if the constraint validation fails:

```jsx
<Field.Root>
  <Field.Label>My input</Field.Label>
  <Field.Control required />
  <Field.Message show="valueMissing" />
</Field.Root>
```

The `children` by default is the browser's native message, which is automatically internationalized. You may pass custom `children` instead:

```jsx
<Field.Root>
  <Field.Label>My input</Field.Label>
  <Field.Control required />
  <Field.Message show="valueMissing">Input is required</Field.Message>
</Field.Root>
```

For the list of supported `show` strings, visit [`ValidityState` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState#instance_properties).

### Custom validation

In addition to the native HTML constraint validation, you can also add custom validation by passing a function that receives the control's `value` as a first argument on `Field.Root`:

```jsx
<Field.Root
  validate={(value) =>
    value === 'password' ? 'Cannot literally use `password` as your password.' : null
  }
>
  <Field.Control type="password" />
  <Field.Label>Password</Field.Label>
  <Field.Message show="customError" />
</Field.Root>
```

The message shows when `ValidityState`'s `customError` property is `true`.

For Base UI input components, `value` represents the component's value type, while for native elements, it is always the native `element.value` DOM property.

### Async validation

The `validation` function can also be async by returning a promise. In the demo below, the taken names are `admin`, `root`, and `superuser` — every other name is available.

For demonstration purposes, a fake network request that takes 500ms is initiated to mimic a sever request to check the name's availability.

{{"demo": "UnstyledFieldAsync.js", "defaultCodeOpen": false}}

## Styling

After the field's control has been touched (or visited), `[data-invalid]` and `[data-valid]` style hooks are applied to each subcomponent based on the field's `ValidityState`:

```jsx
<Field.Root>
  <Field.Control className="FieldControl" />
</Field.Root>
```

```css
.FieldControl[data-invalid] {
  color: red;
}
```

## Validity component

To access the raw `ValidityState` to render custom JSX, particularly useful for `Field.Message` control flow, use the `Field.Validity` component:

```jsx
<Field.Root>
  <Field.Control />
  <Field.Validity>{(state) => <>{/* ... */}</>}</Field.Validity>
</Field.Root>
```

THe `state` parameter contains the following properties:

- `state.validity` the field's `ValidityState`
- `state.value` the field's control value
