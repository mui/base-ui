'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { UseInteractionsReturn, useListItem } from '@floating-ui/react';
import { useSelectOption } from './useSelectOption';
import { SelectRootContext, useSelectRootContext } from '../Root/SelectRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useId } from '../../utils/useId';
import { useForkRef } from '../../utils/useForkRef';
import { useEventCallback } from '../../utils/useEventCallback';
import { SelectOptionContext } from './SelectOptionContext';
import { commonStyleHooks } from '../utils/commonStyleHooks';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';

const InnerSelectOption = React.memo(
  React.forwardRef(function InnerSelectOption(
    props: InnerSelectOptionProps,
    forwardedRef: React.ForwardedRef<Element>,
  ) {
    const {
      className,
      closeOnClick = true,
      disabled = false,
      highlighted,
      selected,
      id,
      getItemProps: getRootItemProps,
      render,
      setOpen,
      typingRef,
      handleSelect,
      selectionRef,
      open,
      ...otherProps
    } = props;

    const { getItemProps } = useSelectOption({
      setOpen,
      closeOnClick,
      disabled,
      highlighted,
      selected,
      id,
      ref: forwardedRef,
      typingRef,
      handleSelect,
      selectionRef,
    });

    const ownerState: SelectOption.OwnerState = React.useMemo(
      () => ({ open, disabled, highlighted, selected }),
      [open, disabled, highlighted, selected],
    );

    const { renderElement } = useComponentRenderer({
      render: render ?? 'div',
      className,
      ownerState,
      propGetter: (externalProps) => {
        // Preserve the component prop `id` if it's provided.
        const { id: idProp, ...rootItemProps } = getRootItemProps({
          ...externalProps,
          selected,
          active: highlighted,
        });
        return getItemProps(rootItemProps);
      },
      extraProps: otherProps,
      customStyleHookMapping: commonStyleHooks,
    });

    return renderElement();
  }),
);

/**
 * An unstyled select item to be used within a Select.
 *
 * Demos:
 *
 * - [Select](https://mui.com/base-ui/react-select/)
 *
 * API:
 *
 * - [SelectOption API](https://mui.com/base-ui/react-select/components-api/#select-item)
 */
const SelectOption = React.forwardRef(function SelectOption(
  props: SelectOption.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, value: valueProp, label, ...otherProps } = props;

  const {
    setValue,
    open,
    getItemProps,
    activeIndex,
    selectedIndex,
    setOpen,
    typingRef,
    selectionRef,
    valuesRef,
  } = useSelectRootContext();

  const [item, setItem] = React.useState<Element | null>(null);
  const itemLabel = label ?? item?.textContent ?? null;
  const listItem = useListItem({ label: itemLabel });
  const mergedRef = useForkRef(forwardedRef, listItem.ref, setItem);

  useEnhancedEffect(() => {
    if (listItem.index === -1) {
      return undefined;
    }

    const values = valuesRef.current;
    values[listItem.index] = valueProp;

    return () => {
      values[listItem.index] = null;
    };
  }, [listItem.index, valueProp, valuesRef]);

  const id = useId(idProp);

  const highlighted = listItem.index === activeIndex;
  const selected = listItem.index === selectedIndex;

  const handleSelect = useEventCallback(() => {
    setValue(valueProp);
  });

  const contextValue = React.useMemo(() => ({ open, selected }), [open, selected]);

  // This wrapper component is used as a performance optimization.
  // SelectOption reads the context and re-renders the actual SelectOption
  // only when it needs to.

  return (
    <SelectOptionContext.Provider value={contextValue}>
      <InnerSelectOption
        {...otherProps}
        id={id}
        ref={mergedRef}
        open={open}
        highlighted={highlighted}
        handleSelect={handleSelect}
        selectionRef={selectionRef}
        setOpen={setOpen}
        selected={selected}
        getItemProps={getItemProps}
        typingRef={typingRef}
      />
    </SelectOptionContext.Provider>
  );
});

interface InnerSelectOptionProps extends Omit<SelectOption.Props, 'value'> {
  highlighted: boolean;
  selected: boolean;
  getItemProps: UseInteractionsReturn['getItemProps'];
  setOpen: SelectRootContext['setOpen'];
  typingRef: React.MutableRefObject<boolean>;
  handleSelect: () => void;
  selectionRef: React.MutableRefObject<{
    mouseUp: boolean;
    select: boolean;
  }>;
  open: boolean;
}

namespace SelectOption {
  export interface OwnerState {
    disabled: boolean;
    highlighted: boolean;
    selected: boolean;
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    children?: React.ReactNode;
    /**
     * The value of the select item.
     */
    value: string;
    /**
     * The click handler for the select item.
     */
    onClick?: React.MouseEventHandler<HTMLElement>;
    /**
     * If `true`, the select item will be disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * A text representation of the select item's content.
     * Used for keyboard text navigation matching.
     */
    label?: string;
    /**
     * The id of the select item.
     */
    id?: string;
    /**
     * If `true`, the select will close when the select item is clicked.
     *
     * @default true
     */
    closeOnClick?: boolean;
  }
}

SelectOption.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * If `true`, the select will close when the select item is clicked.
   *
   * @default true
   */
  closeOnClick: PropTypes.bool,
  /**
   * If `true`, the select item will be disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The id of the select item.
   */
  id: PropTypes.string,
  /**
   * A text representation of the select item's content.
   * Used for keyboard text navigation matching.
   */
  label: PropTypes.string,
  /**
   * The click handler for the select item.
   */
  onClick: PropTypes.func,
  /**
   * The value of the select item.
   */
  value: PropTypes.string.isRequired,
} as any;

export { SelectOption };
