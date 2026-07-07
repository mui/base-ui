"use client";

import { NavigationMenu as BaseNavigationMenu } from "@base-ui/react/navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { ArrowSvg } from "./arrow-svg";

function NavigationMenuRoot({
  className,
  ...props
}: BaseNavigationMenu.Root.Props) {
  return (
    <BaseNavigationMenu.Root
      className={cn("relative", className)}
      data-slot="navigation-menu"
      {...props}
    />
  );
}

function NavigationMenuList({
  className,
  ...props
}: BaseNavigationMenu.List.Props) {
  return (
    <BaseNavigationMenu.List
      className={cn(
        "group flex flex-1 list-none items-center justify-center gap-1",
        className,
      )}
      data-slot="navigation-menu-list"
      {...props}
    />
  );
}

function NavigationMenuItem({
  className,
  ...props
}: BaseNavigationMenu.Item.Props) {
  return (
    <BaseNavigationMenu.Item
      className={cn("relative", className)}
      data-slot="navigation-menu-item"
      {...props}
    />
  );
}

const navigationMenuTriggerStyle = cva([
  "group inline-flex h-9 w-max items-center justify-center gap-1",
  "rounded-md bg-background px-4 py-2",
  "text-sm font-medium",
  "outline-none transition-[color,box-shadow]",
  "hover:bg-accent hover:text-accent-foreground",
  "focus:bg-accent focus:text-accent-foreground",
  "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-1",
  "disabled:pointer-events-none disabled:opacity-50",
  "data-[popup-open]:bg-accent/50 data-[popup-open]:text-accent-foreground",
  "data-[popup-open]:hover:bg-accent data-[popup-open]:focus:bg-accent",
]);

function NavigationMenuTrigger({
  className,
  children,
  showIcon = true,
  ...props
}: BaseNavigationMenu.Trigger.Props & {
  showIcon?: boolean;
}) {
  return (
    <BaseNavigationMenu.Trigger
      className={cn(navigationMenuTriggerStyle(), className)}
      data-slot="navigation-menu-trigger"
      {...props}
    >
      {children}
      {showIcon && (
        <NavigationMenuIcon>
          <ChevronDownIcon className="text-muted-foreground size-4 transition-transform duration-300 ease-in-out top-[1px] ml-1 group-data-[popup-open]:rotate-180" />
        </NavigationMenuIcon>
      )}
    </BaseNavigationMenu.Trigger>
  );
}

function NavigationMenuIcon({
  className,
  ...props
}: BaseNavigationMenu.Icon.Props) {
  return (
    <BaseNavigationMenu.Icon
      className={cn("transition-transform duration-200 ease-out", className)}
      data-slot="navigation-menu-icon"
      {...props}
    />
  );
}

function NavigationMenuContent({
  className,
  ...props
}: BaseNavigationMenu.Content.Props) {
  return (
    <BaseNavigationMenu.Content
      className={cn(
        "w-full p-2 md:w-auto",
        "animate-fade",
        "data-[starting-style]:data-[activation-direction=left]:translate-x-[-20%]",
        "data-[starting-style]:data-[activation-direction=right]:translate-x-[20%]",
        "data-[ending-style]:data-[activation-direction=left]:translate-x-[20%]",
        "data-[ending-style]:data-[activation-direction=right]:translate-x-[-20%]",
        className,
      )}
      data-slot="navigation-menu-content"
      {...props}
    />
  );
}

function NavigationMenuLink({
  className,
  ...props
}: BaseNavigationMenu.Link.Props) {
  return (
    <BaseNavigationMenu.Link
      className={cn(
        "flex flex-col gap-1 rounded-md p-2 text-sm",
        "outline-none transition-all",
        "[&_svg:not([class*='text-'])]:text-muted-foreground",
        "[&_svg:not([class*='size-'])]:size-4",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-1",
        "data-[active]:bg-accent/50 data-[active]:text-accent-foreground",
        "data-[active]:hover:bg-accent data-[active]:focus:bg-accent",
        className,
      )}
      data-slot="navigation-menu-link"
      {...props}
    />
  );
}

function NavigationMenuPortal(props: BaseNavigationMenu.Portal.Props) {
  return (
    <BaseNavigationMenu.Portal data-slot="navigation-menu-portal" {...props} />
  );
}

function NavigationMenuBackdrop({
  className,
  ...props
}: BaseNavigationMenu.Backdrop.Props) {
  return (
    <BaseNavigationMenu.Backdrop
      className={cn("fixed inset-0 bg-black/50 animate-fade", className)}
      data-slot="navigation-menu-backdrop"
      {...props}
    />
  );
}

function NavigationMenuPositioner({
  className,
  children,
  ...props
}: BaseNavigationMenu.Positioner.Props) {
  return (
    <BaseNavigationMenu.Positioner
      className={cn(
        "h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)]",
        "transition-[top,left,right,bottom]",
        "data-[instant]:transition-none",
        "before:absolute before:content-['']",
        "data-[side=bottom]:before:top-[-10px] data-[side=bottom]:before:right-0 data-[side=bottom]:before:left-0 data-[side=bottom]:before:h-2.5 data-[side=left]:before:top-0 data-[side=left]:before:right-[-10px] data-[side=left]:before:bottom-0 data-[side=left]:before:w-2.5 data-[side=right]:before:top-0 data-[side=right]:before:bottom-0 data-[side=right]:before:left-[-10px] data-[side=right]:before:w-2.5 data-[side=top]:before:right-0 data-[side=top]:before:bottom-[-10px] data-[side=top]:before:left-0 data-[side=top]:before:h-2.5",
        className,
      )}
      data-slot="navigation-menu-positioner"
      {...props}
    >
      {children}
    </BaseNavigationMenu.Positioner>
  );
}

function NavigationMenuPopup(props: BaseNavigationMenu.Popup.Props) {
  return (
    <BaseNavigationMenu.Popup
      className={cn(
        "h-[var(--popup-height)] w-[var(--popup-width)] xs:w-[var(--popup-width)]",
        "animate-fade",
      )}
      data-slot="navigation-menu-popup"
      {...props}
    />
  );
}

function NavigationMenuArrow({ className }: BaseNavigationMenu.Arrow.Props) {
  return (
    <BaseNavigationMenu.Arrow
      className={cn(
        "duration-[var(--duration)] ease-[var(--easing)]",
        "data-[side=bottom]:top-[-9px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180",
        className,
      )}
      data-slot="navigation-menu-arrow"
    >
      <ArrowSvg />
    </BaseNavigationMenu.Arrow>
  );
}

function NavigationMenuViewport({
  className,
  ...props
}: BaseNavigationMenu.Viewport.Props) {
  return (
    <BaseNavigationMenu.Viewport
      className={cn("relative h-full w-full overflow-hidden", className)}
      data-slot="navigation-menu-viewport"
      {...props}
    />
  );
}

function NavigationMenu({
  className,
  children,
  orientation = "horizontal",
  showArrow = false,
  ...props
}: BaseNavigationMenu.Root.Props & {
  showArrow?: boolean;
}) {
  return (
    <NavigationMenuRoot
      className="flex flex-1 items-center justify-center"
      orientation={orientation}
      {...props}
    >
      {children}
      <BaseNavigationMenu.Portal>
        <NavigationMenuPositioner
          collisionAvoidance={{ side: "none" }}
          collisionPadding={{ bottom: 5, left: 20, right: 20, top: 5 }}
          sideOffset={10}
        >
          <NavigationMenuPopup
            className={cn(
              "relative rounded-md bg-popover text-popover-foreground",
              "outline outline-border dark:-outline-offset-1",
              className,
            )}
          >
            {showArrow && (
              <NavigationMenuArrow className="flex transition-[left]" />
            )}
            <NavigationMenuViewport />
          </NavigationMenuPopup>
        </NavigationMenuPositioner>
      </BaseNavigationMenu.Portal>
    </NavigationMenuRoot>
  );
}

export {
  NavigationMenuRoot,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavigationMenuArrow,
  NavigationMenuBackdrop,
  NavigationMenuIcon,
  NavigationMenuPositioner,
  NavigationMenuPortal,
  NavigationMenuPopup,
  navigationMenuTriggerStyle,
  // Composite component
  NavigationMenu,
};
