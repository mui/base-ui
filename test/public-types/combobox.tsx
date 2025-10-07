import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';

export type ComboboxProps<
  Value = string,
  Multiple extends boolean | undefined = false,
> = Combobox.Root.Props<Value, Multiple>;
export type ComboboxActions = Combobox.Root.Actions;
export type ComboboxChangeEventDetails = Combobox.Root.ChangeEventDetails;
export type ComboboxChangeEventReason = Combobox.Root.ChangeEventReason;
export type ComboboxHighlightEventDetails = Combobox.Root.HighlightEventDetails;
export type ComboboxHighlightEventReason = Combobox.Root.HighlightEventReason;

export interface SimpleComboboxProps extends Omit<Combobox.Root.Props<string, false>, 'children'> {
  items: readonly string[];
}

function useComboboxFilter(
  options?: Parameters<typeof Combobox.useFilter>[0],
): ReturnType<typeof Combobox.useFilter> {
  const filter = Combobox.useFilter(options);

  React.useEffect(() => {
    filter.contains('value', 'val');
    filter.startsWith('value', 'v');
    filter.endsWith('value', 'ue');
  }, [filter]);

  return filter;
}

export const ComboboxHarness = React.forwardRef<HTMLInputElement, SimpleComboboxProps>(
  function ComboboxHarness({ items, ...props }, ref) {
    const actionsRef = React.useRef<ComboboxActions>({ unmount() {} });
    const filter = useComboboxFilter({ value: props.value, multiple: false });

    React.useMemo(() => filter.contains(items[0] ?? '', ''), [filter, items]);

    const {
      onValueChange: onValueChangeProp,
      onItemHighlighted: onItemHighlightedProp,
      actionsRef: actionsRefProp,
      ...otherProps
    } = props;

    const handleValueChange = React.useCallback<
      NonNullable<ComboboxProps<string, false>['onValueChange']>
    >((value, details) => {
      const reason: ComboboxChangeEventReason = details.reason;
      if (reason === 'item-press') {
        details.cancel();
      }
      void value;
    }, []);

    const handleItemHighlighted = React.useCallback<
      NonNullable<ComboboxProps<string, false>['onItemHighlighted']>
    >((_value, details) => {
      const reason: ComboboxHighlightEventReason = details.reason;
      if (reason === 'keyboard') {
        void 0;
      }
    }, []);

    const rootProps = otherProps as ComboboxProps<string, false>;

    return (
      <Combobox.Root
        {...rootProps}
        actionsRef={actionsRef}
        onValueChange={handleValueChange}
        onItemHighlighted={handleItemHighlighted}
      >
        <Combobox.Input ref={ref} />
        <Combobox.Trigger />
        <Combobox.Positioner>
          <Combobox.Popup>
            {items.map((item) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            ))}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Root>
    );
  },
);
