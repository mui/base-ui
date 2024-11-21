'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { UseInteractionsReturn } from '@floating-ui/react';
import { SelectRootContext, useSelectRootContext } from '../Root/SelectRootContext';
import { SelectIndexContext, useSelectIndexContext } from '../Root/SelectIndexContext';
import { useCompositeListItem } from '../../Composite/List/useCompositeListItem';
import { useForkRef } from '../../utils/useForkRef';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectOption } from './useSelectOption';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useLatestRef } from '../../utils/useLatestRef';
import { SelectOptionContext } from './SelectOptionContext';

interface InnerSelectOptionProps extends Omit<SelectOption.Props, 'value'> {
  highlighted: boolean;
  selected: boolean;
  getRootItemProps: UseInteractionsReturn['getItemProps'];
  setOpen: SelectRootContext['setOpen'];
  typingRef: React.MutableRefObject<boolean>;
  selectionRef: React.MutableRefObject<{
    allowUnselectedMouseUp: boolean;
    allowSelectedMouseUp: boolean;
    allowSelect: boolean;
  }>;
  open: boolean;
  value: any;
  setValue: SelectRootContext['setValue'];
  selectedIndexRef: React.RefObject<number | null>;
  indexRef: React.RefObject<number>;
  setActiveIndex: SelectIndexContext['setActiveIndex'];
  popupRef: React.RefObject<HTMLDivElement | null>;
}

const InnerSelectOption = React.forwardRef(function InnerSelectOption(
  props: InnerSelectOptionProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    disabled = false,
    highlighted,
    selected,
    getRootItemProps,
    render,
    setOpen,
    typingRef,
    selectionRef,
    open,
    value,
    setValue,
    selectedIndexRef,
    indexRef,
    setActiveIndex,
    popupRef,
    ...otherProps
  } = props;

  const ownerState: SelectOption.OwnerState = React.useMemo(
    () => ({
      disabled,
      open,
      highlighted,
      selected,
    }),
    [disabled, open, highlighted, selected],
  );

  const { getItemProps, rootRef } = useSelectOption({
    open,
    setOpen,
    disabled,
    highlighted,
    selected,
    ref: forwardedRef,
    typingRef,
    handleSelect: () => setValue(value),
    selectionRef,
    selectedIndexRef,
    indexRef,
    setActiveIndex,
    popupRef,
  });

  const mergedRef = useForkRef(rootRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter(externalProps = {}) {
      const rootProps = getRootItemProps({
        ...externalProps,
        active: highlighted,
        selected,
      });
      // With our custom `focusItemOnHover` implementation, this interferes with the logic and can
      // cause the index state to be stuck when leaving the select popup.
      delete rootProps.onFocus;
      return getItemProps(rootProps);
    },
    render: render ?? 'div',
    ref: mergedRef,
    className,
    ownerState,
    extraProps: otherProps,
  });

  const contextValue = React.useMemo(
    () => ({
      selected,
      indexRef,
    }),
    [selected, indexRef],
  );

  return (
    <SelectOptionContext.Provider value={contextValue}>
      {renderElement()}
    </SelectOptionContext.Provider>
  );
});

InnerSelectOption.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * If `true`, the select option will be disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  getRootItemProps: PropTypes.func.isRequired,
  /**
   * @ignore
   */
  highlighted: PropTypes.bool.isRequired,
  /**
   * @ignore
   */
  indexRef: PropTypes.shape({
    current: PropTypes.number.isRequired,
  }).isRequired,
  /**
   * A text representation of the select option's content.
   * Used for keyboard text navigation matching.
   */
  label: PropTypes.string,
  /**
   * @ignore
   */
  open: PropTypes.bool.isRequired,
  /**
   * @ignore
   */
  popupRef: PropTypes.shape({
    current: PropTypes.object,
  }).isRequired,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  selected: PropTypes.bool.isRequired,
  /**
   * @ignore
   */
  selectedIndexRef: PropTypes.shape({
    current: PropTypes.number,
  }).isRequired,
  /**
   * @ignore
   */
  selectionRef: PropTypes.shape({
    current: PropTypes.shape({
      allowSelect: PropTypes.bool.isRequired,
      allowSelectedMouseUp: PropTypes.bool.isRequired,
      allowUnselectedMouseUp: PropTypes.bool.isRequired,
    }).isRequired,
  }).isRequired,
  /**
   * @ignore
   */
  setActiveIndex: PropTypes.func.isRequired,
  /**
   * @ignore
   */
  setOpen: PropTypes.func.isRequired,
  /**
   * @ignore
   */
  setValue: PropTypes.func.isRequired,
  /**
   * @ignore
   */
  typingRef: PropTypes.shape({
    current: PropTypes.bool.isRequired,
  }).isRequired,
  /**
   * @ignore
   */
  value: PropTypes.any.isRequired,
} as any;

const MemoizedInnerSelectOption = React.memo(InnerSelectOption);

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.com/components/react-select/)
 *
 * API:
 *
 * - [SelectOption API](https://base-ui.com/components/react-select/#api-reference-SelectOption)
 */
const SelectOption = React.forwardRef(function SelectOption(
  props: SelectOption.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { value: valueProp = null, label, ...otherProps } = props;

  const listItem = useCompositeListItem({ label });

  const { activeIndex, selectedIndex, setActiveIndex } = useSelectIndexContext();
  const { getItemProps, setOpen, setValue, open, selectionRef, typingRef, valuesRef, popupRef } =
    useSelectRootContext();

  const selectedIndexRef = useLatestRef(selectedIndex);
  const indexRef = useLatestRef(listItem.index);

  const mergedRef = useForkRef(listItem.ref, forwardedRef);

  useEnhancedEffect(() => {
    if (listItem.index === -1) {
      return undefined;
    }

    const values = valuesRef.current;
    values[listItem.index] = valueProp;

    return () => {
      delete values[listItem.index];
    };
  }, [listItem.index, valueProp, valuesRef]);

  const highlighted = activeIndex === listItem.index;
  const selected = selectedIndex === listItem.index;

  return (
    <MemoizedInnerSelectOption
      ref={mergedRef}
      highlighted={highlighted}
      selected={selected}
      getRootItemProps={getItemProps}
      setOpen={setOpen}
      open={open}
      selectionRef={selectionRef}
      typingRef={typingRef}
      value={valueProp}
      setValue={setValue}
      selectedIndexRef={selectedIndexRef}
      indexRef={indexRef}
      setActiveIndex={setActiveIndex}
      popupRef={popupRef}
      {...otherProps}
    />
  );
});

namespace SelectOption {
  export interface OwnerState {
    disabled: boolean;
    highlighted: boolean;
    selected: boolean;
    open: boolean;
  }

  export interface Props extends Omit<BaseUIComponentProps<'div', OwnerState>, 'id'> {
    children?: React.ReactNode;
    /**
     * The value of the select option.
     * @default null
     */
    value?: any;
    /**
     * If `true`, the select option will be disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * A text representation of the select option's content.
     * Used for keyboard text navigation matching.
     */
    label?: string;
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
   * If `true`, the select option will be disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * A text representation of the select option's content.
   * Used for keyboard text navigation matching.
   */
  label: PropTypes.string,
  /**
   * The value of the select option.
   * @default null
   */
  value: PropTypes.any,
} as any;

export { SelectOption };
