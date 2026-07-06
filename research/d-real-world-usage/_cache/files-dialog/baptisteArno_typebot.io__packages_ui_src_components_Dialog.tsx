import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import * as React from "react";
import { Cancel01Icon } from "../icons/Cancel01Icon";
import { cn } from "../lib/cn";
import type { VariantProps } from "../lib/cva";
import { buttonVariants } from "./Button";

const Root = ({
  isOpen,
  onClose,
  onCloseComplete,
  ...props
}: DialogPrimitive.Root.Props & {
  isOpen: boolean;
  onClose: () => void;
  onCloseComplete?: () => void;
}) => (
  <DialogPrimitive.Root
    open={isOpen}
    onOpenChange={(open) => !open && onClose()}
    onOpenChangeComplete={(open) => !open && onCloseComplete?.()}
    {...props}
  />
);

const TriggerButton = ({
  children,
  variant,
  size,
  className,
  ...props
}: DialogPrimitive.Trigger.Props & VariantProps<typeof buttonVariants>) => (
  <DialogPrimitive.Trigger
    {...props}
    className={cn(buttonVariants({ variant, size }), className)}
    data-disabled={props.disabled}
  />
);

const Title = ({ className, ...props }: DialogPrimitive.Title.Props) => (
  <DialogPrimitive.Title {...props} className={cn("text-2xl", className)} />
);

const Popup = ({
  render = <div />,
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Backdrop className="fixed inset-0 w-full bg-gray-12/50 dark:bg-gray-1/70 data-open:animate-in data-open:fade-in data-closed:animate-out data-closed:fade-out" />
    <div
      className={cn(
        "flex justify-center items-start fixed top-0 w-full py-12 h-full overflow-y-auto",
      )}
    >
      <DialogPrimitive.Popup
        className={cn(
          "relative bg-gray-1 p-6 rounded-xl w-full max-w-xl data-open:animate-in data-open:slide-in-from-bottom-5 data-open:fade-in data-closed:animate-out data-closed:slide-out-to-bottom-5 data-closed:fade-out flex flex-col gap-4 shadow-md border data-nested-dialog-open:translate-y-4 [&[data-nested-dialog-open]_[data-scope=inside-backdrop]]:block transition-transform outline-none",
          className,
        )}
        render={render}
        {...props}
      >
        {children}
        <div
          className="size-full absolute top-0 left-0 bg-gray-12/20 dark:bg-gray-1/60 rounded-[calc(.75rem-1px)] hidden"
          data-scope="inside-backdrop"
        />
      </DialogPrimitive.Popup>
    </div>
  </DialogPrimitive.Portal>
);

const Footer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    {...props}
    ref={ref}
    className={cn("flex justify-end gap-2", className)}
    data-scope="dialog"
    data-part="footer"
  />
));

const CloseButton = ({
  className,
  variant = "secondary",
  size,
  children,
  ...props
}: DialogPrimitive.Close.Props & VariantProps<typeof buttonVariants>) => (
  <DialogPrimitive.Close
    {...props}
    className={cn(
      buttonVariants({ variant, size: children ? size : "icon" }),
      "absolute top-4 right-4",
      className,
    )}
  >
    {children || <Cancel01Icon />}
  </DialogPrimitive.Close>
);

export const Dialog = {
  Root,
  TriggerButton,
  Title,
  Popup,
  CloseButton,
  Footer,
};
