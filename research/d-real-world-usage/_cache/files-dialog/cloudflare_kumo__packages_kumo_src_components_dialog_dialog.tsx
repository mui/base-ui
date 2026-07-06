import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Dialog as DialogBase } from "@base-ui/react/dialog";
import { AlertDialog as AlertDialogBase } from "@base-ui/react/alert-dialog";
import { LayerCard } from "../layer-card";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";
import {
  usePortalContainer,
  type PortalContainer,
} from "../../utils/portal-provider";

/** Dialog size variant definitions mapping sizes to their minimum widths. */
export const KUMO_DIALOG_VARIANTS = {
  size: {
    base: {
      classes: "sm:w-96",
      description: "Default dialog width (384px)",
    },
    sm: {
      classes: "sm:w-72",
      description: "Small dialog for simple confirmations (288px)",
    },
    lg: {
      classes: "sm:w-[32rem]",
      description: "Large dialog for complex content (512px)",
    },
    xl: {
      classes: "sm:w-[48rem]",
      description: "Extra large dialog for detailed views (768px)",
    },
  },
  role: {
    dialog: {
      classes: "",
      description: "Standard dialog for general-purpose modals",
    },
    alertdialog: {
      classes: "",
      description:
        "Alert dialog for confirmation flows requiring explicit user acknowledgment",
    },
  },
} as const;

export const KUMO_DIALOG_DEFAULT_VARIANTS = {
  size: "base",
  role: "dialog",
} as const;

export const KUMO_DIALOG_STYLING = {
  dimensions: {
    sm: {
      width: 350,
      titleSize: 20,
      descSize: 16,
      padding: 16,
      gap: 8,
      buttonSize: "sm",
    },
    base: {
      width: 384,
      titleSize: 20,
      descSize: 16,
      padding: 24,
      gap: 16,
      buttonSize: "base",
    },
    lg: {
      width: 512,
      titleSize: 20,
      descSize: 16,
      padding: 24,
      gap: 16,
      buttonSize: "base",
    },
    xl: {
      width: 768,
      titleSize: 20,
      descSize: 16,
      padding: 24,
      gap: 16,
      buttonSize: "base",
    },
  },
  baseTokens: {
    background: "color-surface",
    text: "text-color-surface",
    borderRadius: 12,
    shadow: "shadow-m",
  },
  backdrop: {
    background: "color-surface-secondary",
    opacity: 0.8,
  },
  header: {
    title: { fontWeight: 600, color: "text-color-surface" },
    closeIcon: { name: "ph-x", size: 20, color: "text-color-muted" },
  },
  description: {
    fontWeight: 400,
    color: "text-color-muted",
  },
  buttons: {
    primary: { background: "color-primary", text: "white" },
    secondary: { ring: "color-border", text: "text-color-surface" },
  },
} as const;

// Derived types from KUMO_DIALOG_VARIANTS
export type KumoDialogSize = keyof typeof KUMO_DIALOG_VARIANTS.size;
export type KumoDialogRole = keyof typeof KUMO_DIALOG_VARIANTS.role;

export interface KumoDialogVariantsProps {
  /**
   * Dialog width.
   * - `"sm"` — Small (288px) for simple confirmations
   * - `"base"` — Default (384px)
   * - `"lg"` — Large (512px) for complex content
   * - `"xl"` — Extra large (768px) for detailed views
   * @default "base"
   */
  size?: KumoDialogSize;
}

// ============================================================================
// Dialog Role Context
// ============================================================================

const DialogRoleContext = createContext<KumoDialogRole>("dialog");

function useDialogRole() {
  return useContext(DialogRoleContext);
}

export function dialogVariants({
  size = KUMO_DIALOG_DEFAULT_VARIANTS.size,
}: KumoDialogVariantsProps = {}) {
  return cn(
    // Base styles
    "shadow-m ring ring-kumo-line fixed top-1/2 left-1/2 w-full max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-kumo-base text-kumo-default duration-150 data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0",
    // Apply size from KUMO_DIALOG_VARIANTS
    resolveVariant(KUMO_DIALOG_VARIANTS.size, size, KUMO_DIALOG_DEFAULT_VARIANTS.size).classes,
  );
}

/**
 * Dialog component props — the modal content panel.
 *
 * @example
 * ```tsx
 * <Dialog.Root>
 *   <Dialog.Trigger render={(p) => <Button {...p}>Open</Button>} />
 *   <Dialog className="p-8">
 *     <Dialog.Title>Confirm Action</Dialog.Title>
 *     <Dialog.Description>Are you sure?</Dialog.Description>
 *     <Dialog.Close render={(p) => <Button {...p}>Cancel</Button>} />
 *   </Dialog>
 * </Dialog.Root>
 * ```
 */
export type DialogProps = KumoDialogVariantsProps & {
  /** Additional CSS classes merged via `cn()`. */
  className?: string;
  /** Dialog content (typically Title, Description, Close, and action buttons). */
  children: ReactNode;
  /** Inline styles. */
  style?: CSSProperties;
  /**
   * Container element for the portal. Use this to render the dialog inside
   * a Shadow DOM or custom container. Overrides `KumoPortalProvider` context.
   * @default document.body (or KumoPortalProvider container if set)
   */
  container?: PortalContainer;
};

/**
 * Modal dialog overlay with backdrop. Compound component with `Dialog.Root`,
 * `Dialog.Trigger`, `Dialog.Title`, `Dialog.Description`, and `Dialog.Close`.
 *
 * @example
 * ```tsx
 * <Dialog.Root>
 *   <Dialog.Trigger render={(p) => <Button {...p}>Delete</Button>} />
 *   <Dialog className="p-8">
 *     <Dialog.Title>Delete Item</Dialog.Title>
 *     <Dialog.Description>This action cannot be undone.</Dialog.Description>
 *     <Dialog.Close render={(p) => <Button variant="destructive" {...p}>Delete</Button>} />
 *   </Dialog>
 * </Dialog.Root>
 * ```
 *
 * @example Alert Dialog for destructive actions
 * ```tsx
 * <Dialog.Root role="alertdialog">
 *   <Dialog.Trigger render={(p) => <Button variant="destructive" {...p}>Delete Project</Button>} />
 *   <Dialog className="p-8">
 *     <Dialog.Title>Delete Project?</Dialog.Title>
 *     <Dialog.Description>This action cannot be undone.</Dialog.Description>
 *     <Dialog.Close render={(p) => <Button variant="secondary" {...p}>Cancel</Button>} />
 *     <Dialog.Close render={(p) => <Button variant="destructive" {...p}>Delete</Button>} />
 *   </Dialog>
 * </Dialog.Root>
 * ```
 */
function DialogContent({
  className,
  children,
  style,
  size = KUMO_DIALOG_DEFAULT_VARIANTS.size,
  container: containerProp,
}: DialogProps) {
  const role = useDialogRole();
  const contextContainer = usePortalContainer();
  const container = containerProp ?? contextContainer ?? undefined;

  const BasePortal =
    role === "alertdialog" ? AlertDialogBase.Portal : DialogBase.Portal;
  const BaseBackdrop =
    role === "alertdialog" ? AlertDialogBase.Backdrop : DialogBase.Backdrop;
  const BasePopup =
    role === "alertdialog" ? AlertDialogBase.Popup : DialogBase.Popup;

  return (
    <BasePortal container={container}>
      <BaseBackdrop className="fixed inset-0 bg-kumo-recessed opacity-80 transition-all duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <LayerCard
        render={<BasePopup />}
        className={cn(dialogVariants({ size }), className)}
        style={
          {
            transitionProperty: "scale, opacity",
            transitionTimingFunction:
              "var(--default-transition-timing-function)",
            "--tw-shadow":
              "0 20px 25px -5px rgb(0 0 0 / 0.03), 0 8px 10px -6px rgb(0 0 0 / 0.03)",
            ...style,
          } as CSSProperties
        }
      >
        {children}
      </LayerCard>
    </BasePortal>
  );
}

// ============================================================================
// Dialog Root
// ============================================================================

type BaseDialogRootProps = ComponentPropsWithoutRef<typeof DialogBase.Root>;
type BaseAlertDialogRootProps = ComponentPropsWithoutRef<
  typeof AlertDialogBase.Root
>;

type StandardDialogRootProps = BaseDialogRootProps & {
  /**
   * The ARIA role for the dialog.
   * - `"dialog"` — Standard dialog for general-purpose modals. Dismissible via outside click by default.
   * - `"alertdialog"` — Alert dialog for destructive or confirmation flows. Not dismissible via outside click.
   *
   * Use `role="alertdialog"` for:
   * - Destructive actions (delete, discard, remove)
   * - Confirmation dialogs requiring explicit user acknowledgment
   * - Actions that cannot be undone
   *
   * @default "dialog"
   */
  role?: "dialog";
};

type AlertDialogRootProps = BaseAlertDialogRootProps & {
  role: "alertdialog";
};

export type DialogRootProps = StandardDialogRootProps | AlertDialogRootProps;

function DialogRoot(props: DialogRootProps) {
  if (props.role === "alertdialog") {
    const { children, role, ...rootProps } = props;

    return (
      <DialogRoleContext.Provider value={role}>
        <AlertDialogBase.Root {...rootProps}>{children}</AlertDialogBase.Root>
      </DialogRoleContext.Provider>
    );
  }

  const {
    children,
    role = KUMO_DIALOG_DEFAULT_VARIANTS.role,
    ...rootProps
  } = props;

  return (
    <DialogRoleContext.Provider value={role}>
      <DialogBase.Root {...rootProps}>{children}</DialogBase.Root>
    </DialogRoleContext.Provider>
  );
}

DialogRoot.displayName = "Dialog.Root";

// ============================================================================
// Dialog Trigger
// ============================================================================

type BaseDialogTriggerProps = ComponentPropsWithoutRef<
  typeof DialogBase.Trigger
>;
type BaseAlertDialogTriggerProps = ComponentPropsWithoutRef<
  typeof AlertDialogBase.Trigger
>;

export type DialogTriggerProps =
  | BaseDialogTriggerProps
  | BaseAlertDialogTriggerProps;

function DialogTrigger({ children, ...props }: DialogTriggerProps) {
  const role = useDialogRole();

  if (role === "alertdialog") {
    return (
      <AlertDialogBase.Trigger
        data-kumo-component="Dialog"
        data-kumo-part="trigger"
        {...(props as BaseAlertDialogTriggerProps)}
      >
        {children}
      </AlertDialogBase.Trigger>
    );
  }

  return (
    <DialogBase.Trigger
      data-kumo-component="Dialog"
      data-kumo-part="trigger"
      {...props}
    >
      {children}
    </DialogBase.Trigger>
  );
}

DialogTrigger.displayName = "Dialog.Trigger";

// ============================================================================
// Dialog Title
// ============================================================================

type BaseDialogTitleProps = ComponentPropsWithoutRef<typeof DialogBase.Title>;

export type DialogTitleProps = BaseDialogTitleProps;

function DialogTitle({ className, ...props }: DialogTitleProps) {
  const role = useDialogRole();
  const BaseTitle =
    role === "alertdialog" ? AlertDialogBase.Title : DialogBase.Title;
  return <BaseTitle className={className} {...props} />;
}

DialogTitle.displayName = "Dialog.Title";

// ============================================================================
// Dialog Description
// ============================================================================

type BaseDialogDescriptionProps = ComponentPropsWithoutRef<
  typeof DialogBase.Description
>;

export type DialogDescriptionProps = BaseDialogDescriptionProps;

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  const role = useDialogRole();
  const BaseDescription =
    role === "alertdialog"
      ? AlertDialogBase.Description
      : DialogBase.Description;
  return <BaseDescription className={className} {...props} />;
}

DialogDescription.displayName = "Dialog.Description";

// ============================================================================
// Dialog Close
// ============================================================================

type BaseDialogCloseProps = ComponentPropsWithoutRef<typeof DialogBase.Close>;

export type DialogCloseProps = BaseDialogCloseProps;

function DialogClose({ children, ...props }: DialogCloseProps) {
  const role = useDialogRole();
  const BaseClose =
    role === "alertdialog" ? AlertDialogBase.Close : DialogBase.Close;
  return (
    <BaseClose data-kumo-component="Dialog" data-kumo-part="close" {...props}>
      {children}
    </BaseClose>
  );
}

DialogClose.displayName = "Dialog.Close";

// ============================================================================
// Compound Component Export
// ============================================================================

const Dialog = Object.assign(DialogContent, {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
});

export {
  Dialog,
  DialogRoot,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
