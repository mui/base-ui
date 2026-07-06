import { Menu as DropdownMenuPrimitive } from "@base-ui/react/menu";
import * as React from "react";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";
import { useLinkComponent } from "../../utils/link-provider";
import {
  usePortalContainer,
  type PortalContainer,
} from "../../utils/portal-provider";
import {
  CaretRightIcon as CaretRight,
  CheckIcon,
  CheckIcon as Check,
  type Icon,
} from "@phosphor-icons/react";

/** Dropdown item variant definitions (default and danger styles). */
export const KUMO_DROPDOWN_VARIANTS = {
  variant: {
    default: {
      classes: "",
      description: "Default dropdown item appearance",
    },
    danger: {
      classes:
        "text-kumo-danger data-highlighted:bg-kumo-danger/5 data-highlighted:text-kumo-danger",
      description: "Destructive action item",
    },
  },
} as const;

export const KUMO_DROPDOWN_DEFAULT_VARIANTS = {
  variant: "default",
} as const;

// Derived types from KUMO_DROPDOWN_VARIANTS
export type KumoDropdownVariant = keyof typeof KUMO_DROPDOWN_VARIANTS.variant;

export interface KumoDropdownVariantsProps {
  /**
   * Visual style of the dropdown item.
   * - `"default"` — Standard item appearance
   * - `"danger"` — Destructive action with red text
   * @default "default"
   */
  variant?: KumoDropdownVariant;
}

export function dropdownVariants({
  variant = KUMO_DROPDOWN_DEFAULT_VARIANTS.variant,
}: KumoDropdownVariantsProps = {}) {
  return cn(
    resolveVariant(
      KUMO_DROPDOWN_VARIANTS.variant,
      variant,
      KUMO_DROPDOWN_DEFAULT_VARIANTS.variant,
    ).classes,
  );
}

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubmenuTrigger>,
  React.ComponentPropsWithoutRef<
    typeof DropdownMenuPrimitive.SubmenuTrigger
  > & {
    inset?: boolean;
    icon?: Icon;
  }
>(({ className, inset, children, icon: IconComponent, ...props }, ref) => (
  <DropdownMenuPrimitive.SubmenuTrigger
    ref={ref}
    data-kumo-component="DropdownMenu"
    data-kumo-part="submenu-trigger"
    className={cn(
      "flex cursor-default items-center rounded-sm text-base outline-hidden select-none", // base styles
      "px-2 py-1.5", // spacing
      "focus:bg-kumo-tint focus:ring-kumo-focus/50 focus-visible:ring-2 focus-visible:ring-kumo-brand", // focus state
      "data-[state=open]:bg-kumo-tint", // open state
      inset && "pl-8", // conditional inset
      className,
    )}
    {...props}
  >
    {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
    {children}
    <CaretRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubmenuTrigger>
));

DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubmenuTrigger.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Positioner>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Positioner> & {
    /**
     * Container element for the portal. Use this to render the dropdown inside
     * a Shadow DOM or custom container. Overrides `KumoPortalProvider` context.
     * @default document.body (or KumoPortalProvider container if set)
     */
    container?: PortalContainer;
  }
>(
  (
    { className, sideOffset = 8, children, container: containerProp, ...props },
    ref,
  ) => {
    const contextContainer = usePortalContainer();
    const container = containerProp ?? contextContainer ?? undefined;

    return (
      <DropdownMenuPrimitive.Portal container={container}>
        <DropdownMenuPrimitive.Positioner
          ref={ref}
          sideOffset={sideOffset}
          {...props}
        >
          <DropdownMenuPrimitive.Popup
            className={cn(
              "overflow-hidden bg-kumo-control text-kumo-default", // background
              "max-h-[var(--available-height)] overflow-y-auto", // limit height when list is too long and might go off screen
              "rounded-lg shadow-lg ring ring-kumo-line", // border part
              "min-w-36 p-1.5", // spacing
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95", // open animation
              "data-[side=bottom]:slide-in-from-top-2", // bottom side animation
              "data-[side=left]:slide-in-from-right-2", // left side animation
              "data-[side=right]:slide-in-from-left-2", // right side animation
              "data-[side=top]:slide-in-from-bottom-2", // top side animation
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95", // close animation
              className,
            )}
          >
            {children}
          </DropdownMenuPrimitive.Popup>
        </DropdownMenuPrimitive.Positioner>
      </DropdownMenuPrimitive.Portal>
    );
  },
);

const renderIconNode = (IconComponent?: Icon | React.ReactNode) => {
  if (!IconComponent) return null;
  if (React.isValidElement(IconComponent)) return IconComponent;
  const Comp = IconComponent as React.ComponentType<Record<string, unknown>>;
  return <Comp className="mr-2 h-4 w-4" />;
};

/**
 * DropdownMenuItem — a single actionable item within a dropdown menu.
 *
 * For navigation links, use `DropdownMenu.LinkItem` instead.
 *
 * @example
 * ```tsx
 * <DropdownMenu.Item>Edit</DropdownMenu.Item>
 * <DropdownMenu.Item icon={CopyIcon}>Duplicate</DropdownMenu.Item>
 * <DropdownMenu.Item variant="danger">Delete</DropdownMenu.Item>
 * ```
 */
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    icon?: Icon | React.ReactNode;
    selected?: boolean;
    /**
     * @deprecated Use `DropdownMenu.LinkItem` instead for navigation links.
     * This prop will be removed in a future major version.
     */
    href?: string;
    variant?: "default" | "danger";
  }
>(
  (
    {
      className,
      inset,
      icon: IconComponent,
      children,
      selected,
      render,
      href,
      variant = "default",
      ...props
    },
    ref,
  ) => {
    const LinkComponent = useLinkComponent();

    // Build the inner content with icon, children, and selected indicator
    const innerContent = React.useMemo(
      () => (
        <>
          {IconComponent && renderIconNode(IconComponent)}
          {children}
          {selected && (
            <span className="inline-flex">
              <Check />
            </span>
          )}
        </>
      ),
      [IconComponent, children, selected],
    );

    // Legacy href support (deprecated)
    const linkContent = React.useMemo(() => {
      if (!href) return undefined;

      // Matches http://, https://, or protocol-relative //
      const isExternal = /^(https?:)?\/\//.test(href);
      const styles = cn(
        "flex items-center",
        variant === "danger" &&
          "text-kumo-danger data-highlighted:bg-kumo-danger/5 data-highlighted:text-kumo-danger",
      );
      if (isExternal) {
        return (
          <a
            className={cn(styles, "w-full text-inherit! no-underline!")}
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {innerContent}
          </a>
        );
      }
      return (
        <LinkComponent
          className={cn(styles, "w-full text-inherit! no-underline!")}
          href={href}
          to={href}
          onClick={(e) => e.stopPropagation()}
        >
          {innerContent}
        </LinkComponent>
      );
    }, [href, innerContent, variant, LinkComponent]);

    // When href is provided, use linkContent as render prop
    // When render prop is provided, caller controls children rendering
    const useRenderProp = href || render;

    return (
      <DropdownMenuPrimitive.Item
        ref={ref}
        data-kumo-component="DropdownMenu"
        data-kumo-part="item"
        className={cn(
          "relative flex cursor-default items-center rounded-md px-2 py-1.5 text-base outline-hidden select-none focus:text-kumo-default focus:ring-kumo-focus/50 focus-visible:ring-2 focus-visible:ring-kumo-brand data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-kumo-overlay",
          inset && "pl-8",
          dropdownVariants({ variant }),
          className,
        )}
        render={href ? linkContent : render}
        {...props}
      >
        {useRenderProp ? undefined : innerContent}
      </DropdownMenuPrimitive.Item>
    );
  },
);

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/**
 * DropdownMenuLinkItem — a menu item that navigates to a URL.
 *
 * Use this instead of `DropdownMenu.Item` with `href` for navigation links.
 * Provides full control over link attributes like `target` and `rel`.
 *
 * @example
 * ```tsx
 * // External link
 * <DropdownMenu.LinkItem href="https://example.com" target="_blank">
 *   Documentation
 * </DropdownMenu.LinkItem>
 *
 * // Internal link
 * <DropdownMenu.LinkItem href="/settings">
 *   Settings
 * </DropdownMenu.LinkItem>
 *
 * // With icon
 * <DropdownMenu.LinkItem href="/profile" icon={UserIcon}>
 *   Profile
 * </DropdownMenu.LinkItem>
 * ```
 */
const DropdownMenuLinkItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.LinkItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.LinkItem> & {
    inset?: boolean;
    icon?: Icon | React.ReactNode;
    variant?: "default" | "danger";
  }
>(
  (
    {
      className,
      inset,
      icon: IconComponent,
      children,
      variant = "default",
      ...props
    },
    ref,
  ) => {
    return (
      <DropdownMenuPrimitive.LinkItem
        ref={ref}
        data-kumo-component="DropdownMenu"
        data-kumo-part="link-item"
        className={cn(
          "relative flex cursor-default items-center rounded-md px-2 py-1.5 text-base outline-hidden select-none",
          "focus:text-kumo-default focus:ring-kumo-focus/50 focus-visible:ring-2 focus-visible:ring-kumo-brand data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-kumo-overlay",
          "text-inherit no-underline",
          inset && "pl-8",
          dropdownVariants({ variant }),
          className,
        )}
        {...props}
      >
        {IconComponent && renderIconNode(IconComponent)}
        {children}
      </DropdownMenuPrimitive.LinkItem>
    );
  },
);

DropdownMenuLinkItem.displayName = "DropdownMenuLinkItem";

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    data-kumo-component="DropdownMenu"
    data-kumo-part="checkbox-item"
    className={cn(
      "relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-base outline-hidden transition-colors select-none focus:bg-kumo-tint focus:text-kumo-default focus:ring-kumo-focus/50 focus-visible:ring-2 focus-visible:ring-kumo-brand data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <DropdownMenuPrimitive.CheckboxItemIndicator className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-inherit">
      <CheckIcon weight="bold" size={12} />
    </DropdownMenuPrimitive.CheckboxItemIndicator>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.GroupLabel>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.GroupLabel> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.GroupLabel
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-base font-semibold",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.GroupLabel.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-kumo-hairline", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & {
    inset?: boolean;
    icon?: Icon | React.ReactNode;
  }
>(({ className, children, inset, icon: IconComponent, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    data-kumo-component="DropdownMenu"
    data-kumo-part="radio-item"
    className={cn(
      "relative flex cursor-default items-center rounded-md px-2 py-1.5 text-base outline-hidden select-none",
      "data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-kumo-tint",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {IconComponent && renderIconNode(IconComponent)}
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

const DropdownMenuRadioItemIndicator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItemIndicator>,
  React.ComponentPropsWithoutRef<
    typeof DropdownMenuPrimitive.RadioItemIndicator
  >
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItemIndicator
    ref={ref}
    className={cn("ml-auto", className)}
    {...props}
  >
    {children ?? <Check className="h-4 w-4" />}
  </DropdownMenuPrimitive.RadioItemIndicator>
));
DropdownMenuRadioItemIndicator.displayName = "DropdownMenuRadioItemIndicator";

/**
 * Custom Trigger that converts a single child element to the `render` prop
 * to avoid nested button issues with base-ui's Menu.Trigger.
 *
 * When an explicit `render` prop is provided, children are passed through
 * to the rendered element.
 */
const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(({ children, render, ...props }, ref) => {
  // If render prop is explicitly provided, use it and pass children through
  if (render) {
    return (
      <DropdownMenuPrimitive.Trigger ref={ref} {...props} render={render}>
        {children}
      </DropdownMenuPrimitive.Trigger>
    );
  }

  // Otherwise, auto-promote single child element to render prop
  const childElement = React.isValidElement(children) ? children : null;

  return (
    <DropdownMenuPrimitive.Trigger
      ref={ref}
      {...props}
      {...(childElement && {
        render: childElement as React.ReactElement<Record<string, unknown>>,
      })}
    >
      {childElement ? undefined : children}
    </DropdownMenuPrimitive.Trigger>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

/**
 * DropdownMenu — accessible dropdown menu anchored to a trigger.
 *
 * Compound component: `DropdownMenu` (Root), `.Trigger`, `.Content`, `.Item`,
 * `.LinkItem`, `.CheckboxItem`, `.RadioGroup`, `.RadioItem`, `.RadioItemIndicator`,
 * `.Sub`, `.SubTrigger`, `.SubContent`, `.Label`, `.Separator`, `.Shortcut`, `.Group`.
 *
 * Built on `@base-ui/react/menu`.
 *
 * @example
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenu.Trigger>
 *     <Button>Actions</Button>
 *   </DropdownMenu.Trigger>
 *   <DropdownMenu.Content>
 *     <DropdownMenu.Item>Edit</DropdownMenu.Item>
 *     <DropdownMenu.Item icon={CopyIcon}>Duplicate</DropdownMenu.Item>
 *     <DropdownMenu.LinkItem href="/settings" icon={GearIcon}>Settings</DropdownMenu.LinkItem>
 *     <DropdownMenu.Separator />
 *     <DropdownMenu.Item variant="danger">Delete</DropdownMenu.Item>
 *   </DropdownMenu.Content>
 * </DropdownMenu>
 * ```
 *
 * @see https://base-ui.com/react/components/menu
 */
export const DropdownMenu = Object.assign(DropdownMenuPrimitive.Root, {
  Trigger: DropdownMenuTrigger,
  Portal: DropdownMenuPrimitive.Portal,
  Sub: DropdownMenuPrimitive.SubmenuRoot,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuContent,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  LinkItem: DropdownMenuLinkItem,
  CheckboxItem: DropdownMenuCheckboxItem,
  RadioGroup: DropdownMenuPrimitive.RadioGroup,
  RadioItem: DropdownMenuRadioItem,
  RadioItemIndicator: DropdownMenuRadioItemIndicator,
  Label: DropdownMenuLabel,
  Separator: DropdownMenuSeparator,
  Shortcut: DropdownMenuShortcut,
  Group: DropdownMenuPrimitive.Group,
});
