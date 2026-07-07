import { Form as BaseForm } from "@base-ui/react/form";

import { cn } from "../../lib/utils";

function Form({ className, ...props }: BaseForm.Props) {
  return (
    <BaseForm
      className={cn("flex flex-col gap-6", className)}
      data-slot="form"
      {...props}
    />
  );
}

type FormProps = BaseForm.Props;
type FormErrors = NonNullable<FormProps["errors"]>;
type FormValues = Record<string, unknown>;

export { Form };
export type { FormErrors, FormProps, FormValues };
