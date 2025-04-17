---
title: Field
subtitle: A component that provides labelling and validation for form controls.
description: A high-quality, unstyled React field component that provides labelling and validation for form controls.
---
# Field

A high-quality, unstyled React field component that provides labelling and validation for form controls.

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Field {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 0.25rem;
  width: 100%;
  max-width: 16rem;
}

.Label {
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: var(--color-gray-900);
}

.Input {
  box-sizing: border-box;
  padding-left: 0.875rem;
  margin: 0;
  border: 1px solid var(--color-gray-200);
  width: 100%;
  height: 2.5rem;
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 1rem;
  background-color: transparent;
  color: var(--color-gray-900);

  &:focus {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}

.Error {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--color-red-800);
}

.Description {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--color-gray-600);
}
```

```tsx
/* index.tsx */
import * as React from "react";
import { Field } from "@base-ui-components/react/field";
import styles from "./index.module.css";

export default function ExampleField() {
  return (
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label}>Name</Field.Label>
      <Field.Control required placeholder="Required" className={styles.Input} />

      <Field.Error className={styles.Error} match="valueMissing">
        Please enter your name
      </Field.Error>

      <Field.Description className={styles.Description}>
        Visible on your profile
      </Field.Description>
    </Field.Root>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from "react";
import { Field } from "@base-ui-components/react/field";

export default function ExampleField() {
  return (
    <Field.Root className="flex w-full max-w-64 flex-col items-start gap-1">
      <Field.Label className="text-sm font-medium text-gray-900">
        Name
      </Field.Label>
      <Field.Control
        required
        placeholder="Required"
        className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
      />
      <Field.Error className="text-sm text-red-800" match="valueMissing">
        Please enter your name
      </Field.Error>

      <Field.Description className="text-sm text-gray-600">
        Visible on your profile
      </Field.Description>
    </Field.Root>
  );
}
```

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Field } from "@base-ui-components/react/field";

<Field.Root>
  <Field.Label />
  <Field.Control />
  <Field.Description />
  <Field.Error />
  <Field.Validity />
</Field.Root>;
```

### Root

Groups all parts of the field.
Renders a `<div>` element.

**Root Props:**

| Prop                                                                     | Type                                                         | Default    | Description                                                                                                                                                                                  |
| :----------------------------------------------------------------------- | :----------------------------------------------------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name                                                                     | `string`                                                     | -          | Identifies the field when a form is submitted.&#xA;Takes precedence over the `name` prop on the `<Field.Control>` component.                                                                 |
| disabled                                                                 | `boolean`                                                    | `false`    | Whether the component should ignore user interaction.&#xA;Takes precedence over the `disabled` prop on the `<Field.Control>` component.                                                      |
| invalid                                                                  | `boolean`                                                    | -          | Whether the field is forcefully marked as invalid.                                                                                                                                           |
| validate                                                                 | `(value) => string \| string[] \| null \| Promise`           | -          | A function for custom validation. Return a string or an array of strings with&#xA;the error message(s) if the value is invalid, or `null` if the value is valid.                             |
| validationMode                                                           | `'onBlur' \| 'onChange'`                                     | `'onBlur'` | Determines when the field should be validated.\* **onBlur** triggers validation when the control loses focus                                                                                 |
| \* **onChange** triggers validation on every change to the control value |
| validationDebounceTime                                                   | `number`                                                     | `0`        | How long to wait between `validate` callbacks if&#xA;`validationMode="onChange"` is used. Specified in milliseconds.                                                                         |
| className                                                                | `string \| (state) => string`                                | -          | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render                                                                   | `React.ReactElement \| (props, state) => React.ReactElement` | -          | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Root Data Attributes:**

| Attribute     | Type | Description                                 |
| :------------ | :--- | :------------------------------------------ |
| data-disabled | -    | Present when the field is disabled.         |
| data-valid    | -    | Present when the field is valid.            |
| data-invalid  | -    | Present when the field is invalid.          |
| data-dirty    | -    | Present when the field's value has changed. |
| data-touched  | -    | Present when the field has been touched.    |
| data-filled   | -    | Present when the field is filled.           |
| data-focused  | -    | Present when the field control is focused.  |

### Label

An accessible label that is automatically associated with the field control.
Renders a `<label>` element.

**Label Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Label Data Attributes:**

| Attribute     | Type | Description                                 |
| :------------ | :--- | :------------------------------------------ |
| data-disabled | -    | Present when the field is disabled.         |
| data-valid    | -    | Present when the field is in valid state.   |
| data-invalid  | -    | Present when the field is in invalid state. |
| data-dirty    | -    | Present when the field's value has changed. |
| data-touched  | -    | Present when the field has been touched.    |
| data-filled   | -    | Present when the field is filled.           |
| data-focused  | -    | Present when the field control is focused.  |

### Control

The form control to label and validate.
Renders an `<input>` element.You can omit this part and use any Base UI input component instead. For example,
[Input](https://base-ui.com/react/components/input), [Checkbox](https://base-ui.com/react/components/checkbox),
or [Select](https://base-ui.com/react/components/select), among others, will work with Field out of the box.

**Control Props:**

| Prop          | Type                                                         | Default | Description                                                                                                                                                                                  |
| :------------ | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onValueChange | `(value, event) => void`                                     | -       | Callback fired when the `value` changes. Use when controlled.                                                                                                                                |
| className     | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render        | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Control Data Attributes:**

| Attribute     | Type | Description                                 |
| :------------ | :--- | :------------------------------------------ |
| data-disabled | -    | Present when the field is disabled.         |
| data-valid    | -    | Present when the field is in valid state.   |
| data-invalid  | -    | Present when the field is in invalid state. |
| data-dirty    | -    | Present when the field's value has changed. |
| data-touched  | -    | Present when the field has been touched.    |
| data-filled   | -    | Present when the field is filled.           |
| data-focused  | -    | Present when the field control is focused.  |

### Description

A paragraph with additional information about the field.
Renders a `<p>` element.

**Description Props:**

| Prop      | Type                                                         | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| (state) => string`                                | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Description Data Attributes:**

| Attribute     | Type | Description                                 |
| :------------ | :--- | :------------------------------------------ |
| data-disabled | -    | Present when the field is disabled.         |
| data-valid    | -    | Present when the field is in valid state.   |
| data-invalid  | -    | Present when the field is in invalid state. |
| data-dirty    | -    | Present when the field's value has changed. |
| data-touched  | -    | Present when the field has been touched.    |
| data-filled   | -    | Present when the field is filled.           |
| data-focused  | -    | Present when the field control is focused.  |

### Error

An error message displayed if the field control fails validation.
Renders a `<div>` element.

**Error Props:**

| Prop      | Type                                                                                                                                                                                  | Default | Description                                                                                                                                                                                  |
| :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| match     | `'badInput' \| 'customError' \| 'patternMismatch' \| 'rangeOverflow' \| 'rangeUnderflow' \| 'stepMismatch' \| 'tooLong' \| 'tooShort' \| 'typeMismatch' \| 'valid' \| 'valueMissing'` | -       | Determines whether to show the error message according to the field’s&#xA;[ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState).                                   |
| forceShow | `boolean`                                                                                                                                                                             | -       | Whether the error message should be shown regardless of the field’s validity.                                                                                                                |
| className | `string \| (state) => string`                                                                                                                                                         | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `React.ReactElement \| (props, state) => React.ReactElement`                                                                                                                          | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Error Data Attributes:**

| Attribute     | Type | Description                                 |
| :------------ | :--- | :------------------------------------------ |
| data-disabled | -    | Present when the field is disabled.         |
| data-valid    | -    | Present when the field is in valid state.   |
| data-invalid  | -    | Present when the field is in invalid state. |
| data-dirty    | -    | Present when the field's value has changed. |
| data-touched  | -    | Present when the field has been touched.    |
| data-filled   | -    | Present when the field is filled.           |
| data-focused  | -    | Present when the field control is focused.  |

### Validity

Used to display a custom message based on the field’s validity.
Requires `children` to be a function that accepts field validity state as an argument.

**Validity Props:**

| Prop     | Type                            | Default | Description                                                            |
| :------- | :------------------------------ | :------ | :--------------------------------------------------------------------- |
| children | `(validity) => React.ReactNode` | -       | A function that accepts the field validity state as an argument.```jsx |

<Field.Validity>
{(validity) => {
return <div>...</div>
}}
</Field.Validity>

```|

```
