"use client";

import { Popover } from "@base-ui-components/react/popover";
import { PopoverHelp } from "@gracefullight/krds-icons";
import { type ComponentProps, type ReactNode, forwardRef } from "react";
import { cn } from "#/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContextualHelpRootProps = ComponentProps<typeof Popover.Root>;

type ContextualHelpTriggerProps = Omit<
  ComponentProps<typeof Popover.Trigger>,
  "children"
> & {
  /** Accessible label for the help icon button. Defaults to "도움말 열기". */
  "aria-label"?: string;
  children?: ReactNode;
};

type ContextualHelpContentProps = ComponentProps<typeof Popover.Popup> & {
  positionerProps?: ComponentProps<typeof Popover.Positioner>;
};

// ---------------------------------------------------------------------------
// Composable primitives
// ---------------------------------------------------------------------------

/**
 * Root — wraps Base UI Popover.Root.
 * Use this when you need full composable control.
 *
 * @example
 * <ContextualHelp>
 *   <ContextualHelpTrigger />
 *   <ContextualHelpContent>설명 내용</ContextualHelpContent>
 * </ContextualHelp>
 */
function ContextualHelp({ children, ...props }: ContextualHelpRootProps) {
  return <Popover.Root {...props}>{children}</Popover.Root>;
}
ContextualHelp.displayName = "ContextualHelp";

// ---------------------------------------------------------------------------

/**
 * Trigger — renders the (?) help icon button.
 * When `children` is omitted the default KRDS help icon is rendered.
 */
const ContextualHelpTrigger = forwardRef<
  HTMLButtonElement,
  ContextualHelpTriggerProps
>(
  (
    { className, "aria-label": ariaLabel = "도움말 열기", children, ...props },
    ref,
  ) => (
    <Popover.Trigger
      ref={ref}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-full",
        "text-icon-gray-light transition-colors",
        "hover:text-icon-gray",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        "disabled:pointer-events-none disabled:text-fg-disabled",
        className,
      )}
      {...props}
    >
      {children ?? <PopoverHelp size={20} color="currentColor" title="" />}
    </Popover.Trigger>
  ),
);
ContextualHelpTrigger.displayName = "ContextualHelpTrigger";

// ---------------------------------------------------------------------------

/**
 * Content — popover card rendered inside a portal.
 */
const ContextualHelpContent = forwardRef<
  HTMLDivElement,
  ContextualHelpContentProps
>(({ className, children, positionerProps, ...props }, ref) => (
  <Popover.Portal>
    <Popover.Positioner
      sideOffset={8}
      {...positionerProps}
      className={cn("z-50", positionerProps?.className)}
    >
      <Popover.Popup
        ref={ref}
        className={cn(
          "w-72 rounded-xl bg-surface-white p-4 shadow-3",
          "border border-divider-gray-light",
          "text-body-sm text-fg-basic",
          "outline-none",
          "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
          "transition-[opacity,transform] duration-150 ease-out",
          className,
        )}
        {...props}
      >
        {children}
      </Popover.Popup>
    </Popover.Positioner>
  </Popover.Portal>
));
ContextualHelpContent.displayName = "ContextualHelpContent";

// ---------------------------------------------------------------------------
// SimpleContextualHelp — single-prop convenience wrapper (krds-mui parity)
// ---------------------------------------------------------------------------

interface SimpleContextualHelpProps {
  /** Popover body content. */
  content: ReactNode;
  /** Custom trigger element. Defaults to the (?) icon button. */
  children?: ReactNode;
  /** Accessible label for the trigger button. */
  "aria-label"?: string;
  /** Extra class names forwarded to the trigger. */
  triggerClassName?: string;
  /** Extra class names forwarded to the popup. */
  contentClassName?: string;
  /** Whether the popover is initially open. */
  defaultOpen?: boolean;
}

/**
 * SimpleContextualHelp — single-prop API.
 *
 * @example
 * <SimpleContextualHelp content={<>이 항목은 …</>} />
 */
function SimpleContextualHelp({
  content,
  children,
  "aria-label": ariaLabel,
  triggerClassName,
  contentClassName,
  defaultOpen,
}: SimpleContextualHelpProps) {
  return (
    <ContextualHelp defaultOpen={defaultOpen}>
      <ContextualHelpTrigger
        aria-label={ariaLabel}
        className={triggerClassName}
      >
        {children}
      </ContextualHelpTrigger>
      <ContextualHelpContent className={contentClassName}>
        {content}
      </ContextualHelpContent>
    </ContextualHelp>
  );
}
SimpleContextualHelp.displayName = "SimpleContextualHelp";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  ContextualHelp,
  ContextualHelpTrigger,
  ContextualHelpContent,
  SimpleContextualHelp,
};

export type {
  ContextualHelpRootProps,
  ContextualHelpTriggerProps,
  ContextualHelpContentProps,
  SimpleContextualHelpProps,
};
