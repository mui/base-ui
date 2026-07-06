import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type * as React from "react";
import { cn } from "../lib/cn";
import type { VariantProps } from "../lib/cva";
import { buttonVariants } from "./Button";

const Root = MenuPrimitive.Root;

const Trigger = (props: MenuPrimitive.Trigger.Props) => {
  const { children, className, ...rest } = props;
  return (
    <MenuPrimitive.Trigger className={className} nativeButton={false} {...rest}>
      {children}
    </MenuPrimitive.Trigger>
  );
};

const TriggerButton = (
  props: MenuPrimitive.Trigger.Props & VariantProps<typeof buttonVariants>,
) => {
  const { children, className, variant, size, disabled, ...rest } = props;
  return (
    <MenuPrimitive.Trigger
      className={cn(buttonVariants({ variant, size }), className)}
      data-disabled={disabled}
      {...rest}
    >
      {children}
    </MenuPrimitive.Trigger>
  );
};

const Popup = ({
  children,
  className,
  offset = 8,
  side = "bottom",
  align = "center",
  ...props
}: MenuPrimitive.Popup.Props & {
  offset?: number;
  side?: MenuPrimitive.Positioner.Props["side"];
  align?: MenuPrimitive.Positioner.Props["align"];
}) => {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner sideOffset={offset} side={side} align={align}>
        <MenuPrimitive.Popup
          {...props}
          className={cn(
            "bg-gray-1 p-1 rounded-lg border overflow-auto border-gray-4 shadow-md max-h-(--available-height) max-w-(--available-width) flex flex-col",
            "data-open:animate-in data-open:fade-in-0",
            "data-closed:animate-out data-closed:fade-out-0",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-1",
            "data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-1",
            "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-1",
            "data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-1",
            className,
          )}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
};

const Item = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item>) => (
  <MenuPrimitive.Item
    {...props}
    className={cn(
      "min-w-(--anchor-width) data-highlighted:bg-gray-2 dark:data-highlighted:bg-gray-3 p-2 rounded-md cursor-default flex items-center gap-2",
      className,
    )}
  >
    {children}
  </MenuPrimitive.Item>
);

const SubmenuRoot = MenuPrimitive.SubmenuRoot;

const SubmenuTrigger = (props: MenuPrimitive.SubmenuTrigger.Props) => {
  const { children, className, ...rest } = props;
  return (
    <MenuPrimitive.SubmenuTrigger
      className={cn(
        "outline-hidden min-w-(--anchor-width) data-highlighted:bg-gray-2 dark:data-highlighted:bg-gray-3 p-2 rounded-md cursor-default flex items-center gap-2",
        className,
      )}
      {...rest}
    >
      {children}
    </MenuPrimitive.SubmenuTrigger>
  );
};

export const Menu = {
  Root,
  Trigger,
  TriggerButton,
  Popup,
  SubmenuRoot,
  SubmenuTrigger,
  Item,
};
