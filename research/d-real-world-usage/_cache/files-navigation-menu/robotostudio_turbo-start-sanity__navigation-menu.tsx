"use client";

import { NavigationMenu as NavMenuPrimitive } from "@base-ui/react/navigation-menu";
import { cn } from "@workspace/tailwind-config/utils";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import type * as React from "react";

function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavMenuPrimitive.Root> & {
  viewport?: boolean;
}) {
  return (
    <NavMenuPrimitive.Root
      className={cn(
        "group/navigation-menu relative flex h-full max-w-max flex-1 items-center justify-center",
        className
      )}
      data-slot="navigation-menu"
      data-viewport={viewport}
      {...props}
    >
      {children}
      {viewport && (
        <NavMenuPrimitive.Portal>
          <NavMenuPrimitive.Positioner
            align="center"
            className="isolate z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] before:absolute before:inset-x-0 before:-top-6 before:h-6 before:content-[''] data-instant:transition-none"
            collisionPadding={16}
            sideOffset={22}
          >
            <NavMenuPrimitive.Popup className="relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-sm outline-none transition-[opacity,transform,width,height,scale,translate] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-150">
              <NavMenuPrimitive.Viewport
                className="relative size-full overflow-hidden"
                data-slot="navigation-menu-viewport"
              />
            </NavMenuPrimitive.Popup>
          </NavMenuPrimitive.Positioner>
        </NavMenuPrimitive.Portal>
      )}
    </NavMenuPrimitive.Root>
  );
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavMenuPrimitive.List>) {
  return (
    <NavMenuPrimitive.List
      className={cn(
        "group flex h-full flex-1 list-none items-center justify-center",
        className
      )}
      data-slot="navigation-menu-list"
      {...props}
    />
  );
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavMenuPrimitive.Item>) {
  return (
    <NavMenuPrimitive.Item
      className={cn("relative flex h-full items-center", className)}
      data-slot="navigation-menu-item"
      {...props}
    />
  );
}

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-full w-max items-center justify-center rounded-md bg-background px-5 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-accent/50"
);

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavMenuPrimitive.Trigger>) {
  return (
    <NavMenuPrimitive.Trigger
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      data-slot="navigation-menu-trigger"
      {...props}
    >
      {children}{" "}
      <ChevronDown
        aria-hidden="true"
        className="relative top-px ml-1 size-3 transition duration-300 group-data-popup-open:rotate-180"
      />
    </NavMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavMenuPrimitive.Content>) {
  return (
    <NavMenuPrimitive.Content
      className={cn(
        "h-full w-auto transition-[opacity,transform,translate,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[activation-direction=left]:data-starting-style:translate-x-6 data-[activation-direction=right]:data-starting-style:-translate-x-6 data-ending-style:opacity-0 data-starting-style:opacity-0",
        className
      )}
      data-slot="navigation-menu-content"
      {...props}
    />
  );
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavMenuPrimitive.Link>) {
  return (
    <NavMenuPrimitive.Link
      className={cn(
        "flex h-full outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      data-slot="navigation-menu-link"
      {...props}
    />
  );
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
};
