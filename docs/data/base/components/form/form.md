---
productId: base-ui
title: React Form component and hook
components: FormRoot, FormSubmit
githubLabel: 'component: form'
packageName: '@base_ui/react'
---

# Form

<p class="description">Forms contain fields of controls to enter information for submission.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "UnstyledFormIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

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
import * as Form from '@base_ui/react/Form';
```

## Anatomy

Forms are implemented using a collection of related components:

- `<Form.Root />` renders the `<form>` element.
- `<Form.Submit />` renders the `<button>` that submits the form.

```jsx
<Form.Root>
  <Form.Submit />
</Form.Root>
```

## Usage

Forms are intended to be used with the `Field` component, which provides labeling and validation for individual form controls. These are nested inside `Form.Root`:

```ts
import * as Form from '@base_ui/react/Form';
import * as Field from '@base_ui/react/Field';
```

```jsx
<Form.Root>
  <Field.Root>
    <Field.Control />
  </Field.Root>
  <Form.Submit />
</Form.Root>
```

If any of the Fields within the Form are invalid upon submit, focus will be moved to the first invalid Field's control and the submit event will be prevented.

## Validation

The `Field.Error` subcomponent of a Field renders error messages inside of it, with its content automatically populated with any client-side validation messages that occur.

```jsx
<Field.Root>
  <Field.Control />
  <Field.Error />
</Field.Root>
```

### Server-side validation

For server-side validation messages, the `Form.Root` component accepts an `errors` prop — an object whose keys map to the Field `name` prop, with each value being a string or array of strings representing error messages. The `onClearErrors` prop is called to clear these external server errors when the field's control has been changed:

```jsx
const [errors, setErrors] = React.useState({});

async function handleSubmit(event) {
  event.preventDefault();

  const formData = Object.fromEntries(new FormData(event.currentTarget));

  try {
    await submitForm(formData);
  } catch (errors) {
    // Map errors from the server response
    setErrors({
      username: errors.username,
    });
  }
}

return (
  <Form.Root onSubmit={handleSubmit} errors={errors} onClearErrors={setErrors}>
    <Field.Root name="username">
      <Field.Control />
      <Field.Error /> {/* Populated with `errors.username` string */}
    </Field.Root>
  </Form.Root>
);
```

For more flexibility if required, each `Field.Root` component accepts an `invalid` boolean prop, and each `Field.Error` subcomponent accepts a `forceShow` boolean prop. These can be used as an alternative to `Form.Root`'s `errors` prop by manually targeting specific Fields and showing specific error messages.

### Native validation

By default, browser-native validation popups are disabled, as `Field.Error` replaces this by rendering the validation messages to allow for flexible styling. If necessary, to enable these native validation popups, re-apply the default prop:

```jsx
<Form.Root noValidate={false}>
```

## Loading state

The `Form.Submit` subcomponent's `disabled` prop replaces the native prop to ensure focus accessiblity while the form submission network request is pending.

```jsx
<Form.Submit disabled={loading} />
```
