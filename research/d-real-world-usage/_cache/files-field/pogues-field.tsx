import { Field as BaseUIField } from '@base-ui-components/react/field'
import { FieldError } from 'react-hook-form'

import React from 'react'

export type Props = {
  /** Input to be associated with the labelling and form control. */
  children: React.ReactNode
  /** Additional information about the field. */
  description?: string
  /**
   * Whether the field's value has been changed from its initial value. Useful
   * when the field state is controlled by an external library.
   */
  dirty?: BaseUIField.Root.Props['dirty']
  /**
   * Whether the component should ignore user interaction. Takes precedence over
   * the disabled prop on the `<Field.Control>` component.
   */
  disabled?: BaseUIField.Root.Props['disabled']
  /** Display an error from `react-hook-form`. */
  error?: FieldError
  /** Whether the field is forcefully marked as invalid. */
  invalid?: BaseUIField.Root.Props['invalid']
  /**
   * An accessible label that is automatically associated with the field
   * control.
   */
  label?: string | React.ReactNode
  /**
   * Identifies the field when a form is submitted. Takes precedence over the
   * `name` prop on the `<Field.Control>` component.
   */
  name?: BaseUIField.Root.Props['name']
  /** Whether the field is mandatory. */
  required?: boolean
  /**
   * Whether the field has been touched. Useful when the field state is
   * controlled by an external library.
   */
  touched?: BaseUIField.Root.Props['touched']
}

/**
 * A component that provides labeling and validation for form controls.
 *
 * @example
 * ```
 * <Field
 *   name={name}
 *   invalid={invalid}
 *   touched={touched}
 *   dirty={dirty}
 *   label={t('common.name')}
 * >
 *   <MyInput />
 * </Field>
 * ```
 */
export default function Field({
  children,
  description,
  dirty = false,
  disabled = false,
  error,
  invalid = false,
  label,
  name,
  required = false,
  touched = false,
}: Readonly<Props>) {
  return (
    <BaseUIField.Root
      className="flex flex-col w-full items-start gap-1"
      name={name}
      disabled={disabled}
      invalid={invalid}
      touched={touched}
      dirty={dirty}
    >
      <BaseUIField.Label className="w-full space-y-1 text-sm font-semibold text-default">
        {label ? (
          <p>
            {label}
            {required ? '*' : null}
          </p>
        ) : null}
        {children}
      </BaseUIField.Label>
      <BaseUIField.Description
        className={`text-sm text-secondary ${description ? '' : 'hidden'}`}
        aria-hidden={!description}
      >
        {description}
      </BaseUIField.Description>
      <BaseUIField.Error
        className="text-sm text-error"
        match={!!error}
        role="alert"
      >
        {error?.message}
      </BaseUIField.Error>
    </BaseUIField.Root>
  )
}
