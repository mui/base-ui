import type * as React from 'react'
import { Form as FormPrimitive } from '@base-ui/react/form'

export function Form({
  className,
  ...props
}: FormPrimitive.Props): React.ReactElement {
  return <FormPrimitive className={className} data-slot="form" {...props} />
}
