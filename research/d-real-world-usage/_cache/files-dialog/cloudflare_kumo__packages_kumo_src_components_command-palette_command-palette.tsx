import {
  useRef,
  useCallback,
  createContext,
  useContext,
  forwardRef,
  type CSSProperties,
} from "react";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog as DialogBase } from "@base-ui/react/dialog";
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  ArrowSquareOutIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";

import { LayerCard } from "../layer-card";
import { Loader } from "../loader";
import { cn } from "../../utils";
import {
  usePortalContainer,
  type PortalContainer,
} from "../../utils/portal-provider";
import type {
  HighlightRange,
  CommandPaletteRootProps,
  CommandPaletteInputProps,
  CommandPaletteListProps,
  CommandPaletteGroupProps,
  CommandPaletteGroupLabelProps,
  CommandPaletteItemProps,
  CommandPaletteEmptyProps,
  CommandPaletteLoadingProps,
  CommandPaletteFooterProps,
  CommandPaletteResultItemProps,
} from "./types";

/**
 * CommandPalette - A composable command palette component for Kumo
 *
 * Uses @base-ui/react/autocomplete primitives for accessible command palette functionality.
 *
 * Keyboard navigation is built-in:
 * - Arrow keys (up/down) move highlight between items
 * - Enter selects the highlighted item (calls onSelect with newTab: false)
 * - Cmd+Enter (Mac) / Ctrl+Enter (Windows/Linux) selects with newTab: true
 * - First item is auto-highlighted when results change
 * - Escape closes the dialog
 *
 * Usage:
 * ```tsx
 * <CommandPalette.Root
 *   open={open}
 *   onOpenChange={setOpen}
 *   items={results}
 *   value={searchTerm}
 *   onValueChange={setSearchTerm}
 *   itemToStringValue={(group) => group.label}
 *   onSelect={(item, { newTab }) => handleSelect(item, newTab)}
 *   getSelectableItems={(groups) => groups.flatMap(g => g.items)}
 * >
 *   <CommandPalette.Input placeholder="Search..." />
 *   <CommandPalette.List>
 *     <Autocomplete.List>
 *       {(group) => (
 *         <CommandPalette.Group items={group.items}>
 *           <CommandPalette.GroupLabel>{group.label}</CommandPalette.GroupLabel>
 *           <Autocomplete.Collection>
 *             {(item) => (
 *               <CommandPalette.Item value={item} onClick={(e) => handleSelect(item, e.metaKey || e.ctrlKey)}>
 *                 {item.title}
 *               </CommandPalette.Item>
 *             )}
 *           </Autocomplete.Collection>
 *         </CommandPalette.Group>
 *       )}
 *     </Autocomplete.List>
 *     <CommandPalette.Empty>No results found</CommandPalette.Empty>
 *   </CommandPalette.List>
 *   <CommandPalette.Footer />
 * </CommandPalette.Root>
 * ```
 */

/**
 * Dialog context for passing close handler to children
 */
interface DialogContextValue {
  onClose?: () => void;
}

const DialogContext = createContext<DialogContextValue>({});

/**
 * Props for the Dialog component
 */
interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the open state changes */
  onOpenChange: (open: boolean) => void;
  /**
   * Optional callback when backdrop is clicked.
   * Receives the mouse event for position tracking (e.g., for ripple effects).
   * If not provided, backdrop click calls onOpenChange(false).
   */
  onBackdropClick?: (e: React.MouseEvent) => void;
  /** Child content - typically one or more Panel components */
  children: React.ReactNode;
  /**
   * Container element for the portal. Use this to render the command palette inside
   * a Shadow DOM or custom container. Overrides `KumoPortalProvider` context.
   * @default document.body (or KumoPortalProvider container if set)
   */
  container?: PortalContainer;
}

/**
 * Dialog component - Modal wrapper for command palette content.
 *
 * Use this when you need a dialog that can swap between different Panel contents
 * without re-mounting (e.g., drill-down navigation).
 *
 * @example
 * ```tsx
 * <CommandPalette.Dialog open={open} onOpenChange={setOpen}>
 *   {showDrillDown ? (
 *     <ZonePicker />
 *   ) : (
 *     <CommandPalette.Panel items={results} ...>
 *       ...
 *     </CommandPalette.Panel>
 *   )}
 * </CommandPalette.Dialog>
 * ```
 */
function Dialog({
  open,
  onOpenChange,
  onBackdropClick,
  children,
  container: containerProp,
}: DialogProps) {
  const contextContainer = usePortalContainer();
  const container = containerProp ?? contextContainer ?? undefined;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (onBackdropClick) {
      onBackdropClick(e);
    } else {
      onOpenChange(false);
    }
  };

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <DialogBase.Root open={open} onOpenChange={onOpenChange} modal>
      <DialogBase.Portal container={container}>
        <DialogBase.Backdrop
          className="fixed inset-0 bg-kumo-overlay opacity-80 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
          onClick={handleBackdropClick}
        />
        <LayerCard
          render={<DialogBase.Popup />}
          className={cn(
            "fixed top-[10vh] left-1/2 w-full max-w-2xl -translate-x-1/2",
            "overflow-hidden rounded-lg",
            "duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
          )}
          style={
            {
              transitionProperty: "scale, opacity",
              transitionTimingFunction:
                "var(--default-transition-timing-function)",
            } as CSSProperties
          }
        >
          <DialogContext.Provider value={{ onClose: handleClose }}>
            {children}
          </DialogContext.Provider>
        </LayerCard>
      </DialogBase.Portal>
    </DialogBase.Root>
  );
}

/**
 * Root component - Dialog + Panel combined for simple use cases.
 *
 * For cases where you need to swap content inside the dialog without
 * re-mounting (e.g., drill-down navigation), use Dialog + Panel separately.
 *
 * Keyboard navigation is always enabled:
 * - Arrow keys (up/down) move highlight
 * - Enter selects highlighted item
 * - Cmd/Ctrl+Enter selects with newTab: true
 * - First item is auto-highlighted when results change
 */
function Root<TGroup, TItem = TGroup>({
  open,
  onOpenChange,
  onBackdropClick,
  children,
  items,
  value,
  onValueChange,
  onItemHighlighted,
  itemToStringValue,
  filter,
  onSelect,
  getSelectableItems,
  container,
}: CommandPaletteRootProps<TGroup, TItem>) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onBackdropClick={onBackdropClick}
      container={container}
    >
      <Panel
        items={items}
        value={value}
        onValueChange={onValueChange}
        onItemHighlighted={onItemHighlighted}
        itemToStringValue={itemToStringValue}
        filter={filter}
        open={open}
        onSelect={onSelect}
        getSelectableItems={getSelectableItems}
      >
        {children}
      </Panel>
    </Dialog>
  );
}

/**
 * InputHeader component - Internal styled container for search input.
 */
function InputHeader({
  children,
  leading,
  trailing,
}: {
  children: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 bg-kumo-base px-4 py-3 focus-within:ring-2 focus-within:ring-kumo-brand">
      {leading ?? (
        <MagnifyingGlassIcon
          className="h-4 w-4 text-kumo-subtle"
          weight="bold"
        />
      )}
      {children}
      {trailing}
    </div>
  );
}

/**
 * List component - Scrollable results container
 *
 * Wrapper div with proper styling, contains Autocomplete.List internally.
 * Supports ref forwarding for scroll control.
 */
const List = forwardRef<
  HTMLDivElement,
  CommandPaletteListProps & { className?: string }
>(function List({ children, className }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative min-h-0 flex-1 overflow-y-auto rounded-b-lg bg-kumo-base px-2 py-2 scroll-py-2 ring-1 ring-kumo-hairline",
        className,
      )}
    >
      {children}
    </div>
  );
});

List.displayName = "CommandPalette.List";

/**
 * Group component - Category grouping
 *
 * Re-export of Autocomplete.Group with default styling.
 */
function Group({
  children,
  className,
  ...props
}: CommandPaletteGroupProps & {
  className?: string;
  items?: unknown[];
}) {
  return (
    <Autocomplete.Group className={cn("space-y-0.5", className)} {...props}>
      {children}
    </Autocomplete.Group>
  );
}

/**
 * GroupLabel component - Section header text
 *
 * Re-export of Autocomplete.GroupLabel with styling matching SectionHeader.
 */
function GroupLabel({
  children,
  className,
}: CommandPaletteGroupLabelProps & { className?: string }) {
  return (
    <Autocomplete.GroupLabel
      className={cn(
        "mb-2 px-2 pt-1 text-xs font-semibold text-kumo-subtle",
        className,
      )}
    >
      {children}
    </Autocomplete.GroupLabel>
  );
}

/**
 * Item component - Individual result item
 *
 * Re-export of Autocomplete.Item with styling matching SearchResultItem.
 * Note: Use onClick for selection handling, matching the existing CommandPalette pattern.
 */
function Item<T>({
  value,
  disabled,
  children,
  className,
  onClick,
}: CommandPaletteItemProps<T> & {
  className?: string;
}) {
  return (
    <Autocomplete.Item
      value={value}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 px-2 py-1.5 text-left text-base transition-colors",
        "cursor-pointer data-[highlighted]:bg-kumo-overlay",
        "rounded-lg",
        disabled && "cursor-default opacity-50",
        className,
      )}
    >
      {children}
    </Autocomplete.Item>
  );
}

/**
 * Empty component - Empty state when no results
 *
 * Re-export of Autocomplete.Empty with default styling.
 */
function Empty({ children }: CommandPaletteEmptyProps) {
  return (
    <Autocomplete.Empty>
      <div className="p-8 text-center">
        <p className="text-kumo-subtle">{children ?? "No results found"}</p>
      </div>
    </Autocomplete.Empty>
  );
}

/**
 * Loading component - Loading spinner state
 *
 * Centered loading spinner using Kumo Loader.
 */
function Loading({ children }: CommandPaletteLoadingProps) {
  return (
    <div className="flex items-center justify-center p-8">
      {children ?? <Loader size={24} />}
    </div>
  );
}

/**
 * Footer component - Styled container for keyboard hints or other footer content.
 *
 * Children are required - this is just a styled container.
 * Consumers should provide their own keyboard hints with proper i18n.
 */
function Footer({ children }: CommandPaletteFooterProps) {
  return (
    <div className="flex items-center justify-between rounded-b-lg bg-kumo-elevated px-4 py-3 text-xs text-kumo-subtle">
      {children}
    </div>
  );
}

/**
 * HighlightedText - Renders text with highlighted portions based on match indices.
 * Highlighted text is shown with a background color to indicate matches.
 */
function HighlightedText({
  text,
  highlights,
  className,
}: {
  text: string;
  highlights?: HighlightRange[];
  className?: string;
}) {
  if (!highlights || highlights.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Sort highlights by start index and merge overlapping ranges
  const sortedHighlights = [...highlights].sort((a, b) => a[0] - b[0]);
  const mergedHighlights: HighlightRange[] = [];

  for (const range of sortedHighlights) {
    const last = mergedHighlights[mergedHighlights.length - 1];
    if (last && range[0] <= last[1] + 1) {
      // Merge overlapping or adjacent ranges
      last[1] = Math.max(last[1], range[1]);
    } else {
      mergedHighlights.push([...range]);
    }
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  mergedHighlights.forEach((range, i) => {
    const [start, end] = range;

    // Add non-highlighted text before this match
    if (start > lastIndex) {
      parts.push(<span key={`text-${i}`}>{text.slice(lastIndex, start)}</span>);
    }

    // Add highlighted text (end index is inclusive)
    parts.push(
      <mark
        key={`highlight-${i}`}
        className="rounded-sm bg-kumo-warning/50 text-kumo-default"
      >
        {text.slice(start, end + 1)}
      </mark>,
    );

    lastIndex = end + 1;
  });

  // Add remaining non-highlighted text
  if (lastIndex < text.length) {
    parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
  }

  return <span className={className}>{parts}</span>;
}

/**
 * ResultItem - Rich item component with breadcrumbs, highlights, icons, and external indicators.
 *
 * Use this for search result items that need breadcrumb navigation, text highlighting,
 * or external link indicators. For simple items, use Item instead.
 */
function ResultItem<T>({
  title,
  breadcrumbs,
  titleHighlights,
  breadcrumbHighlights,
  description,
  icon,
  value,
  onClick,
  showArrow = true,
  external = false,
  nonInteractive = false,
}: CommandPaletteResultItemProps<T>) {
  return (
    <Autocomplete.Item
      value={value}
      onClick={nonInteractive ? undefined : (e: React.MouseEvent) => onClick(e)}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
        nonInteractive
          ? "cursor-default"
          : "cursor-pointer data-[highlighted]:bg-kumo-overlay",
      )}
    >
      {icon && (
        <div className="flex flex-shrink-0 items-center text-kumo-subtle">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 truncate">
          {breadcrumbs?.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              <HighlightedText
                text={crumb}
                highlights={breadcrumbHighlights?.[index]}
                className="text-base text-kumo-default"
              />
              <CaretRightIcon
                className="h-3 w-3 flex-shrink-0 text-kumo-subtle"
                weight="bold"
              />
            </span>
          ))}
          <HighlightedText
            text={title}
            highlights={titleHighlights}
            className="text-base text-kumo-default"
          />
          {external && (
            <ArrowSquareOutIcon className="h-3.5 w-3.5 flex-shrink-0 text-kumo-subtle" />
          )}
          {description && (
            <>
              <span className="text-kumo-subtle">—</span>
              <span className="truncate text-sm text-kumo-subtle">
                {description}
              </span>
            </>
          )}
        </div>
      </div>
      {showArrow && !external && !nonInteractive && (
        <ArrowRightIcon className="h-4 w-4 flex-shrink-0 text-kumo-subtle opacity-0 transition-opacity group-data-[highlighted]:opacity-100" />
      )}
    </Autocomplete.Item>
  );
}

/**
 * Container component - Internal styled wrapper.
 */
function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex max-h-[60vh] flex-col overflow-hidden rounded-lg bg-kumo-elevated",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Panel context for passing handlers from Panel to children
 */
interface PanelContextValue {
  onInputKeyDown?: (e: React.KeyboardEvent) => void;
}

const PanelContext = createContext<PanelContextValue>({});

/**
 * Props for the Panel component
 */
interface PanelProps<TGroup, TItem = TGroup> {
  /** Child components (Input, List, Footer, etc.) */
  children: React.ReactNode;
  /** Items for the autocomplete */
  items: TGroup[];
  /** Controlled input value */
  value?: string;
  /** Callback when input value changes */
  onValueChange?: (value: string) => void;
  /** Callback when an item is highlighted */
  onItemHighlighted?: (
    item: TGroup | undefined,
    details: { reason: string; event: Event; index: number },
  ) => void;
  /** Convert item to string for accessibility */
  itemToStringValue?: (item: TGroup) => string;
  /** Custom filter function */
  filter?: (item: TGroup, query: string) => boolean;
  /** Whether the panel is active/open (for autocomplete state) */
  open?: boolean;
  /** Optional className for the container */
  className?: string;
  /**
   * Callback when an item is selected via Cmd/Ctrl+Enter.
   * Requires getSelectableItems to be provided.
   */
  onSelect?: (item: TItem, options: { newTab: boolean }) => void;
  /**
   * Function to get flat list of selectable items from groups.
   * Required when items are grouped and onSelect is used.
   */
  getSelectableItems?: (items: TGroup[]) => TItem[];
}

/**
 * Panel component - Command palette without dialog wrapper.
 *
 * Use this when you need to render command palette content inside an existing dialog
 * (e.g., for drill-down navigation where the dialog stays open but content changes).
 *
 * Combines Container + Autocomplete functionality with a clean API.
 *
 * @example
 * ```tsx
 * <DialogRoot open={open} onOpenChange={setOpen}>
 *   <Dialog>
 *     <CommandPalette.Panel
 *       items={results}
 *       value={searchTerm}
 *       onValueChange={setSearchTerm}
 *       itemToStringValue={(group) => group.label}
 *     >
 *       <CommandPalette.Input placeholder="Search..." />
 *       <CommandPalette.List>
 *         <CommandPalette.Results>
 *           {(group) => (
 *             <CommandPalette.Group items={group.items}>
 *               <CommandPalette.GroupLabel>{group.label}</CommandPalette.GroupLabel>
 *               <CommandPalette.Items>
 *                 {(item) => <CommandPalette.ResultItem ... />}
 *               </CommandPalette.Items>
 *             </CommandPalette.Group>
 *           )}
 *         </CommandPalette.Results>
 *         <CommandPalette.Empty>No results</CommandPalette.Empty>
 *       </CommandPalette.List>
 *       <CommandPalette.Footer>...</CommandPalette.Footer>
 *     </CommandPalette.Panel>
 *   </Dialog>
 * </DialogRoot>
 * ```
 */
const defaultFilter = () => true;

function Panel<TGroup, TItem = TGroup>({
  children,
  items,
  value,
  onValueChange,
  onItemHighlighted,
  itemToStringValue,
  filter = defaultFilter,
  open = true,
  className,
  onSelect,
  getSelectableItems,
}: PanelProps<TGroup, TItem>) {
  const highlightedIndexRef = useRef<number>(-1);

  const handleItemHighlighted = useCallback(
    (
      item: TGroup | undefined,
      details: { reason: string; event: Event; index: number },
    ) => {
      highlightedIndexRef.current = details.index;
      onItemHighlighted?.(item, details);
    },
    [onItemHighlighted],
  );

  // Handle Cmd/Ctrl+Enter for new tab selection
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isEnter = e.key === "Enter";
      const withModifier = e.metaKey || e.ctrlKey;

      if (isEnter && withModifier && onSelect && getSelectableItems) {
        const selectableItems = getSelectableItems(items);
        const highlightedItem = selectableItems[highlightedIndexRef.current];

        if (highlightedItem !== undefined) {
          e.preventDefault();
          onSelect(highlightedItem, { newTab: true });
        }
      }
    },
    [items, onSelect, getSelectableItems],
  );

  return (
    <Container className={className}>
      <Autocomplete.Root
        items={items}
        value={value}
        onValueChange={onValueChange}
        onItemHighlighted={handleItemHighlighted}
        itemToStringValue={itemToStringValue}
        filter={filter}
        autoHighlight="always"
        keepHighlight
        open={open}
      >
        <PanelContext.Provider value={{ onInputKeyDown: handleInputKeyDown }}>
          {children}
        </PanelContext.Provider>
      </Autocomplete.Root>
    </Container>
  );
}

/**
 * PanelInput component - Input that works inside Panel.
 *
 * Similar to Input but designed for use with Panel instead of Root.
 * Automatically wires up Cmd/Ctrl+Enter handling from Panel.
 */
function PanelInput({
  autoFocus = true,
  placeholder,
  className,
  onKeyDown: onKeyDownProp,
  leading,
  trailing,
  ...props
}: CommandPaletteInputProps) {
  const { onInputKeyDown } = useContext(PanelContext);
  const { onClose } = useContext(DialogContext);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Let consumer handle first (e.g., for custom Escape/Backspace behavior)
      onKeyDownProp?.(e);
      if (e.defaultPrevented) return;

      // Handle Escape to close the dialog
      if (e.key === "Escape" && onClose) {
        e.preventDefault();
        onClose();
        return;
      }
      onInputKeyDown?.(e);
    },
    [onInputKeyDown, onKeyDownProp, onClose],
  );

  return (
    <InputHeader leading={leading} trailing={trailing}>
      <Autocomplete.Input
        placeholder={placeholder}
        className={cn(
          "flex-1 border-none bg-transparent text-base kumo-input-placeholder",
          "outline-none",
          className,
        )}
        onKeyDown={handleKeyDown}
        // oxlint-disable-next-line no-autofocus -- Command palette input should autofocus for keyboard-driven UX
        autoFocus={autoFocus}
        {...props}
      />
    </InputHeader>
  );
}

/**
 * Render prop iterators - wrap base-ui primitives with cleaner names.
 */

/**
 * Results component - Render prop iterator for groups.
 *
 * Wraps Autocomplete.List with default spacing between groups.
 */
function Results({
  children,
  className,
}: React.ComponentProps<typeof Autocomplete.List> & { className?: string }) {
  return (
    <Autocomplete.List className={cn("space-y-3", className)}>
      {children}
    </Autocomplete.List>
  );
}

const Items = Autocomplete.Collection;

/** CommandPalette variant definitions (no user-facing variants; structure reserved for future use). */
export const KUMO_COMMAND_PALETTE_VARIANTS = {} as const;

export const KUMO_COMMAND_PALETTE_DEFAULT_VARIANTS = {} as const;

/**
 * CommandPalette — accessible command palette / spotlight search overlay.
 *
 * Compound component: `CommandPalette.Root` (or `.Dialog` + `.Panel`),
 * `.Input`, `.List`, `.Results`, `.Items`, `.Group`, `.GroupLabel`,
 * `.Item`, `.ResultItem`, `.HighlightedText`, `.Empty`, `.Loading`, `.Footer`.
 *
 * Built on `@base-ui/react/autocomplete` + `@base-ui/react/dialog`.
 *
 * @example
 * ```tsx
 * <CommandPalette.Root
 *   open={open}
 *   onOpenChange={setOpen}
 *   items={results}
 *   value={query}
 *   onValueChange={setQuery}
 *   itemToStringValue={(g) => g.label}
 *   onSelect={(item, { newTab }) => navigate(item, newTab)}
 *   getSelectableItems={(groups) => groups.flatMap((g) => g.items)}
 * >
 *   <CommandPalette.Input placeholder="Search…" />
 *   <CommandPalette.List>
 *     <CommandPalette.Results>
 *       {(group) => (
 *         <CommandPalette.Group items={group.items}>
 *           <CommandPalette.GroupLabel>{group.label}</CommandPalette.GroupLabel>
 *           <CommandPalette.Items>
 *             {(item) => (
 *               <CommandPalette.ResultItem title={item.title} value={item} onClick={…} />
 *             )}
 *           </CommandPalette.Items>
 *         </CommandPalette.Group>
 *       )}
 *     </CommandPalette.Results>
 *     <CommandPalette.Empty>No results found</CommandPalette.Empty>
 *   </CommandPalette.List>
 *   <CommandPalette.Footer>…keyboard hints…</CommandPalette.Footer>
 * </CommandPalette.Root>
 * ```
 */
export const CommandPalette = {
  /** Modal dialog wrapper - use with Panel for content that can swap */
  Dialog,
  /** Dialog + Panel combined - for simple single-view command palettes */
  Root,
  /** Autocomplete panel without dialog - use inside Dialog for swappable content */
  Panel,
  /** Input for use inside Panel */
  Input: PanelInput,
  /** Scrollable results container */
  List,
  /** Category grouping */
  Group,
  /** Section header text */
  GroupLabel,
  /** Basic item */
  Item,
  /** Rich item with breadcrumbs, highlights, icons */
  ResultItem,
  /** Text with highlighted portions */
  HighlightedText,
  /** Empty state */
  Empty,
  /** Loading state */
  Loading,
  /** Footer for keyboard hints */
  Footer,
  /** Render prop iterator for groups */
  Results,
  /** Render prop iterator for items within a group */
  Items,
};
