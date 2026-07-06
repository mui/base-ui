import * as React from "react";
import { Popover as BasePopover } from "@base-ui-components/react/popover";
import { cn } from "tailwind-variants";

const Popover = BasePopover.Root;

const PopoverTrigger = BasePopover.Trigger;

const PopoverAnchor = BasePopover.Positioner;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof BasePopover.Popup>,
  React.ComponentPropsWithoutRef<typeof BasePopover.Popup> & {
    dark?: boolean;
    align?: "center" | "end" | "start";
    alignOffset?: number;
    side?: "left" | "right" | "bottom" | "top" | "inline-end" | "inline-start";
    sideOffset?: number;
  }
>(({ className, align = "center", sideOffset = 4, dark, ...props }, ref) => (
  <BasePopover.Portal>
    <BasePopover.Positioner
      className="h-(--positioner-height) w-(--positioner-width) max-w-(--available-width)"
      align={align}
      sideOffset={sideOffset}
    >
      <BasePopover.Popup
        ref={ref}
        className={cn(
          dark && "dark",
          "h-(--popup-height,auto) w-(--popup-width,auto) max-w-[500px] origin-[var(--transform-origin)] z-50 min-w-12",
          "bg-gray-1 text-primary rounded-lg shadow-raised focus",
          "transition-[transform,scale,opacity] duration-150 ease-out data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
          className
        )}
        {...props}
      />
    </BasePopover.Positioner>
  </BasePopover.Portal>
));
PopoverContent.displayName = BasePopover.Popup.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
