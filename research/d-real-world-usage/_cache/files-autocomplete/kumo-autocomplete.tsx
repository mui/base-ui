import { Autocomplete as AutocompleteBase } from "@base-ui/react/autocomplete";
import { CheckIcon } from "@phosphor-icons/react";
import { createContext, useContext, type ReactNode } from "react";
import { inputVariants, KUMO_INPUT_VARIANTS } from "../input/input";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";
import { Field, type FieldErrorMatch } from "../field/field";

const AutocompleteContext = createContext<{ hasError: boolean }>({
  hasError: false,
});

/** Autocomplete variant definitions. */
export const KUMO_AUTOCOMPLETE_VARIANTS = {
  size: KUMO_INPUT_VARIANTS.size,
} as const;

export const KUMO_AUTOCOMPLETE_DEFAULT_VARIANTS = {
  size: "base",
} as const;

// Derived types from KUMO_AUTOCOMPLETE_VARIANTS
export type KumoAutocompleteSize = keyof typeof KUMO_AUTOCOMPLETE_VARIANTS.size;

export interface KumoAutocompleteVariantsProps {
  /**
   * Size of the autocomplete input. Matches Input component sizes.
   * - `"xs"` — Extra small for compact UIs (h-5 / 20px)
   * - `"sm"` — Small for secondary fields (h-6.5 / 26px)
   * - `"base"` — Default size (h-9 / 36px)
   * - `"lg"` — Large for prominent fields (h-10 / 40px)
   * @default "base"
   */
  size?: KumoAutocompleteSize;
}

export function autocompleteVariants({
  size = KUMO_AUTOCOMPLETE_DEFAULT_VARIANTS.size,
}: KumoAutocompleteVariantsProps = {}) {
  return cn(
    resolveVariant(
      KUMO_INPUT_VARIANTS.size,
      size,
      KUMO_AUTOCOMPLETE_DEFAULT_VARIANTS.size,
    ).classes,
  );
}

/**
 * Autocomplete component props.
 *
 * Autocomplete provides a free-form text input with optional suggestions in a
 * filterable dropdown. Unlike Combobox, the input value is not constrained to
 * the suggestion list items.
 *
 * @example
 * ```tsx
 * <Autocomplete label="Country" items={countries}>
 *   <Autocomplete.InputGroup />
 *   <Autocomplete.Content>
 *     <Autocomplete.List>
 *       {(item) => <Autocomplete.Item value={item}>{item}</Autocomplete.Item>}
 *     </Autocomplete.List>
 *   </Autocomplete.Content>
 * </Autocomplete>
 * ```
 */
export interface AutocompleteProps {
  /** Array of items to display in the dropdown */
  items: unknown[];
  /** The controlled input value */
  value?: string | number | string[];
  /** The uncontrolled default input value */
  defaultValue?: string | number | string[];
  /** Callback when the input value changes */
  onValueChange?: AutocompleteBase.Root.Props<unknown>["onValueChange"];
  /** Whether the popup is open (controlled) */
  open?: boolean;
  /** Callback when the popup opens or closes */
  onOpenChange?: AutocompleteBase.Root.Props<unknown>["onOpenChange"];
  /** Autocomplete content (input group, popup content) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Label content (enables Field wrapper) */
  label?: ReactNode;
  /** Whether the field is required */
  required?: boolean;
  /** Tooltip content to display next to the label */
  labelTooltip?: ReactNode;
  /** Helper text displayed below the field */
  description?: ReactNode;
  /** Error message or validation error object */
  error?: string | { message: ReactNode; match: FieldErrorMatch };
}

function Root<ItemValue>({
  label,
  required,
  labelTooltip,
  description,
  error,
  children,
  ...props
}: AutocompleteBase.Root.Props<ItemValue> & {
  label?: ReactNode;
  required?: boolean;
  labelTooltip?: ReactNode;
  description?: ReactNode;
  error?: string | { message: ReactNode; match: FieldErrorMatch };
}) {
  const rootProps = props as Omit<
    AutocompleteBase.Root.Props<ItemValue>,
    "items"
  > & {
    items?: readonly ItemValue[];
  };
  const control = (
    <AutocompleteContext.Provider value={{ hasError: Boolean(error) }}>
      <AutocompleteBase.Root {...rootProps}>{children}</AutocompleteBase.Root>
    </AutocompleteContext.Provider>
  );

  if (label) {
    return (
      <Field
        label={label}
        required={required}
        labelTooltip={labelTooltip}
        description={description}
        error={
          error
            ? typeof error === "string"
              ? { message: error, match: true }
              : error
            : undefined
        }
      >
        {control}
      </Field>
    );
  }

  return control;
}

function InputGroup({
  className,
  size = KUMO_AUTOCOMPLETE_DEFAULT_VARIANTS.size,
  placeholder,
}: {
  className?: string;
  size?: KumoAutocompleteSize;
  placeholder?: string;
}) {
  const { hasError } = useContext(AutocompleteContext);
  return (
    <AutocompleteBase.Input
      className={cn(
        inputVariants({
          size,
          variant: hasError ? "error" : "default",
          focusIndicator: true,
        }),
        "w-full",
        className,
      )}
      placeholder={placeholder}
    />
  );
}

function Content({
  children,
  className,
  align = "start",
  sideOffset = 4,
  alignOffset,
  side,
}: {
  children?: ReactNode;
  className?: string;
  align?: AutocompleteBase.Positioner.Props["align"];
  alignOffset?: AutocompleteBase.Positioner.Props["alignOffset"];
  side?: AutocompleteBase.Positioner.Props["side"];
  sideOffset?: AutocompleteBase.Positioner.Props["sideOffset"];
}) {
  return (
    <AutocompleteBase.Portal>
      <AutocompleteBase.Positioner
        className="outline-none"
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        side={side}
      >
        <AutocompleteBase.Popup
          className={(state: AutocompleteBase.Popup.State) =>
            cn(
              "flex flex-col",
              "max-h-[min(var(--available-height),24rem)] max-w-(--available-width) min-w-(--anchor-width) py-1.5",
              "bg-kumo-control text-kumo-default",
              "rounded-lg shadow-lg ring ring-kumo-line",
              state.empty && "hidden",
              className,
            )
          }
        >
          {children}
        </AutocompleteBase.Popup>
      </AutocompleteBase.Positioner>
    </AutocompleteBase.Portal>
  );
}

function List({
  className,
  ...props
}: AutocompleteBase.List.Props & { className?: string }) {
  return (
    <AutocompleteBase.List
      {...props}
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-pt-2 scroll-pb-2",
        className,
      )}
    />
  );
}

function Item({ children, ...props }: AutocompleteBase.Item.Props) {
  return (
    <AutocompleteBase.Item
      data-kumo-component="Autocomplete"
      data-kumo-part="item"
      {...props}
      className="group mx-1.5 grid cursor-pointer grid-cols-[1fr_16px] gap-2 rounded px-2 py-1.5 text-base data-highlighted:bg-kumo-overlay data-selected:font-medium"
    >
      <div className="col-start-1">{children}</div>
      <span className="col-start-2 hidden items-center group-data-selected:flex">
        <CheckIcon size={14} />
      </span>
    </AutocompleteBase.Item>
  );
}

function GroupLabel(props: AutocompleteBase.GroupLabel.Props) {
  return (
    <AutocompleteBase.GroupLabel
      {...props}
      className={cn(
        "mx-1.5 px-2 py-1.5 text-sm text-kumo-strong",
        props.className,
      )}
    />
  );
}

function Group(props: AutocompleteBase.Group.Props) {
  return (
    <AutocompleteBase.Group
      {...props}
      className="border-t border-kumo-line mt-2 pt-2 first:border-t-0 first:mt-0 first:pt-0"
    />
  );
}

function Separator(props: AutocompleteBase.Separator.Props) {
  return (
    <AutocompleteBase.Separator
      {...props}
      className={cn("mx-0 my-1 h-px bg-kumo-line", props.className)}
    />
  );
}

Root.displayName = "Autocomplete.Root";
InputGroup.displayName = "Autocomplete.InputGroup";
Content.displayName = "Autocomplete.Content";
Item.displayName = "Autocomplete.Item";
GroupLabel.displayName = "Autocomplete.GroupLabel";
Group.displayName = "Autocomplete.Group";
Separator.displayName = "Autocomplete.Separator";

/**
 * Autocomplete — free-form text input with an optional filtered suggestion list.
 *
 * Unlike Combobox, the input value is not restricted to items in the list.
 * Use Combobox when the selected value must come from the list.
 *
 * Compound component: `Autocomplete` (Root), `.InputGroup`, `.Content`, `.Item`,
 * `.GroupLabel`, `.Group`, `.Separator`, `.List`, `.Collection`.
 *
 * `InputGroup` renders the text input with Input component styling.
 * Pass a `size` prop to `InputGroup` to match the Input component sizes.
 *
 * @example
 * ```tsx
 * <Autocomplete items={fruits} label="Fruit">
 *   <Autocomplete.InputGroup size="base" />
 *   <Autocomplete.Content>
 *     <Autocomplete.List>
 *       {(item) => <Autocomplete.Item value={item}>{item}</Autocomplete.Item>}
 *     </Autocomplete.List>
 *   </Autocomplete.Content>
 * </Autocomplete>
 * ```
 *
 * @see https://base-ui.com/react/components/autocomplete
 */
export const Autocomplete = Object.assign(Root, {
  // Styled compound sub-components
  InputGroup,
  Content,
  Item,
  GroupLabel,
  Group,
  Separator,
  List,

  // Pass-through Base UI sub-components
  Empty: AutocompleteBase.Empty,
  Collection: AutocompleteBase.Collection,

  // Filtering
  useFilter: AutocompleteBase.useFilter,
});
