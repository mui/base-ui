---
productId: base-ui
title: React Field component and hook
components: FieldRoot, FieldLabel, FieldDescription, FieldError, FieldControl, FieldValidity
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
- `<Field.Description />` renders an optional description for the control to provide additional information.
- `<Field.Error />` renders error messages for the control.
- `<Field.Validity />` accepts a function as a child that enables reading raw `ValidityState` to render custom JSX.

```jsx
<Field.Root>
  <Field.Control />
  <Field.Label />
  <Field.Description />
  <Field.Error />
  <Field.Validity />
</Field.Root>
```

## Labeling and descriptive help text

All Base UI input components are aware of Base UI's `Field` component. The label and description are automatically wired to these components when placed inside a `Field.Root`:

```jsx
<Field.Root>
  <Checkbox.Root>
    <Checkbox.Indicator />
  </Checkbox.Root>
  <Field.Label>My checkbox</Field.Label>
  <Field.Description>My description</Field.Description>
</Field.Root>
```

When using a native control like `input` or a custom component which is not aware of Base UI's `Field`, use `Field.Control`:

```jsx
<Field.Root>
  <Field.Control />
  <Field.Label>My input</Field.Label>
  <Field.Description>My description</Field.Description>
</Field.Root>
```

The `render` prop allows you to pass a custom component or tag, different from the default of `input`:

```jsx
<Field.Control render={<select />} />
```

## Validation

When adding native HTML validation props like `required` or `pattern`, `Field.Error` renders error messages inside of it automatically:

```jsx
<Field.Root>
  <Field.Label>My input</Field.Label>
  <Field.Control required />
  <Field.Error />
</Field.Root>
```

The `children` by default is the browser's native message, which is automatically internationalized. You may pass custom `children` instead:

```jsx
<Field.Root>
  <Field.Control required />
  <Field.Error>Field is required</Field.Error>
</Field.Root>
```

### Individual constraint validation failures

When there are multiple HTML validation props, you can target individual validity state failures using the `show` prop to render custom messages:

```jsx
<Field.Root>
  <Field.Control required pattern="[a-zA-Z0-9]+" />
  <Field.Error show="valueMissing">Field is required</Field.Error>
  <Field.Error show="patternMismatch">
    Only alphanumeric characters allowed
  </Field.Error>
</Field.Root>
```

For the list of supported `show` strings, visit [`ValidityState` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState#instance_properties).

### Controlled validity

By applying `invalid` to the root, the Field is forcefully placed into an invalid state, and the `<Field.Error>` component will render. This can be useful for server-side error messages, testing, or to force errors to show initially in an SSR-friendly manner to avoid layout shift.

```jsx
<Field.Root invalid>
  <Field.Control required />
  <Field.Error>Server-side error message</Field.Error>
</Field.Root>
```

{{"demo": "UnstyledFieldPassword.js", "defaultCodeOpen": false}}

### Custom validation

In addition to the native HTML constraint validation, you can also add custom validation by specifying a `validate` function on `Field.Root` that receives the control's `value` as a first argument and returns a string or array of error messages if the field is invalid, and `null` otherwise.

```jsx
<Field.Root
  validate={(value) =>
    value === 'password' ? 'Cannot literally use `password` as your password.' : null
  }
>
  <Field.Control type="password" />
  <Field.Label>Password</Field.Label>
  <Field.Error />
</Field.Root>
```

:::info
For Base UI input components, `value` represents the component's value type, while for native elements, it is always the native `element.value` DOM property. Attach a `ref` to the `Control` element and access it to read its state inside the `validate` function for further control as an alternative if necessary.
:::

To customize the rendering of multiple messages, you can use the `Validity` subcomponent:

```jsx
<Field.Root
  validate={(value) => {
    const errors = [];
    if (value.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (value === 'password') {
      errors.push('Cannot literally use `password` as your password.');
    }
    return errors;
  }}
>
  <Field.Control type="password" />
  <Field.Label>Password</Field.Label>
  <Field.Error render={<ul />}>
    <Field.Validity>
      {(state) => state.errors.map((error) => <li key={error}>{error}</li>)}
    </Field.Validity>
  </Field.Error>
</Field.Root>
```

The `Validity` subcomponent enables rendering custom JSX based on the `state` parameter, which contains the following properties:

- `state.validity`, the field's `ValidityState`
- `state.errors`, an array of custom errors returned from the `validate` prop (if present)
- `state.error`, a custom error string returned from the `validate` prop (if present)
- `state.value`, the field's control value
- `state.initialValue`, the field control's initial value

It can be placed anywhere inside `Field.Root`, including other Field subcomponents.

### Realtime and async validation

`validateOnChange` reports the validity of the control on every `change` event, such as a keypress.

```jsx
<Field.Root validateOnChange>
```

The `validate` function can also be async by returning a promise, enabling inline server-side validation through network requests.

In the demo below, the taken names are `admin`, `root`, and `superuser` — every other name is available. For demonstration purposes, a fake network request that takes 500ms is initiated to mimic a trip to the server to check for availability on the back-end.

{{"demo": "UnstyledFieldAsync.js", "defaultCodeOpen": false}}

The `change` validation is debounced by 500ms to avoid firing a network request on every keystroke by specifying the `validateDebounceTime` prop:

```jsx
<Field.Root validateOnChange validateDebounceTime={500}>
```

## Styling

The `[data-field]` style hook determines if the field is invalid or not with values `"valid"` or `"invalid"`:

```jsx
<Field.Root>
  <Field.Control required className="FieldControl" />
</Field.Root>
```

```css
.FieldControl[data-field='invalid'] {
  color: red;
}
```

To guard the validity style, you can use the `[data-touched]` and `[data-dirty]` style hooks, which are applied once the control has been interacted with:

```css
/* Applied once the user has focused then blurred the control */
.FieldControl[data-touched][data-field='invalid'] {
  color: red;
}

/* Applied once the control has been changed from its initial value */
.FieldControl[data-dirty] {
  color: orange;
}
```
