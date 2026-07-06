"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { AnimatePresence, m } from "motion/react";
import * as React from "react";

import { cn } from "../lib/utils";
import {
  PopoverMotionContext,
  type PopoverMotionContextValue,
  usePopoverMotion,
} from "./hooks/use-popover-motion";
import { useInitialState } from "./use-initial-state";

type PopoverRootProps = PopoverPrimitive.Root.Props;

function Popover({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: PopoverRootProps) {
  const actionsRef = React.useRef<PopoverPrimitive.Root.Actions | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useInitialState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? Boolean(controlledOpen) : uncontrolledOpen;

  const handleOpenChange: NonNullable<PopoverRootProps["onOpenChange"]> = (next, details) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next, details);
  };

  const value = React.useMemo<PopoverMotionContextValue>(() => ({ actionsRef, open }), [open]);

  return (
    <PopoverPrimitive.Root
      data-slot="popover"
      actionsRef={actionsRef}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      {...props}
    >
      <PopoverMotionContext.Provider value={value}>
        {children as React.ReactNode}
      </PopoverMotionContext.Provider>
    </PopoverPrimitive.Root>
  );
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">;

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  children,
  ...props
}: PopoverContentProps) {
  const { actionsRef, open } = usePopoverMotion();

  const handleExitComplete = React.useCallback(() => {
    actionsRef.current?.unmount();
  }, [actionsRef]);

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {open ? (
        <PopoverPrimitive.Portal key="popover-portal" keepMounted>
          <PopoverPrimitive.Positioner
            align={align}
            alignOffset={alignOffset}
            side={side}
            sideOffset={sideOffset}
            className="isolate z-50"
          >
            <PopoverPrimitive.Popup
              data-slot="popover-content"
              render={
                <m.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.14, ease: [0.2, 0, 0, 1] }}
                />
              }
              className={cn(
                "z-50 flex w-72 origin-(--transform-origin) flex-col gap-2.5 rounded-lg bg-canvas-soft p-2.5 text-small-body text-fg shadow-focus-ring-soft outline-hidden",
                className
              )}
              {...props}
            >
              {children}
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      ) : null}
    </AnimatePresence>
  );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 text-small-body", className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-medium tracking-eyebrow text-fg-strong", className)}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-muted", className)}
      {...props}
    />
  );
}

export { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger };
