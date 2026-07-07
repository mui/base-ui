import { Field as PrimitiveField } from "@base-ui/react/field";
import { useMemo } from "react";
import { cn } from "../lib/cn";

const Root = ({ className, ...props }: PrimitiveField.Root.Props) => (
  <PrimitiveField.Root
    {...props}
    className={cn("flex flex-col gap-2", className)}
  />
);

export type LabelProps = PrimitiveField.Label.Props;
const Label = ({ className, ...props }: LabelProps) => (
  <PrimitiveField.Label
    {...props}
    className={cn("inline-flex items-center shrink-0 gap-1", className)}
  />
);

const Description = ({ ...props }: PrimitiveField.Description.Props) => (
  <PrimitiveField.Description {...props} />
);

const Container = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn("border px-4 py-3 rounded-md gap-4 flex flex-col", className)}
  >
    {children}
  </div>
);

// biome-ignore lint/suspicious/noShadowRestrictedNames: is exported as Field.Error
const Error = ({
  className,
  children,
  errors,
  ...props
}: PrimitiveField.Error.Props & {
  errors?: Array<{ message?: string } | undefined>;
}) => {
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ];

    if (uniqueErrors?.length === 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error) =>
            error?.message && <li key={error.message}>{error.message}</li>,
        )}
      </ul>
    );
  }, [children, errors]);

  return (
    <PrimitiveField.Error
      className={cn(
        "text-destructive/90 text-sm font-normal border border-destructive/70 rounded-md p-2 bg-destructive/2.5",
        className,
      )}
      match={true}
      {...props}
    >
      {content}
    </PrimitiveField.Error>
  );
};

export type ChangeEventDetails = PrimitiveField.Control.ChangeEventDetails;

export const Field = {
  Root,
  Label,
  Error,
  Description,
  Container,
  Control: PrimitiveField.Control,
};
