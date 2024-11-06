'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { UseInteractionsReturn } from '@floating-ui/react';
import { SelectRootContext, useSelectRootContext } from '../Root/SelectRootContext';
import { useSelectIndexContext } from '../Root/SelectIndexContext';
import { useCompositeListItem } from '../../Composite/List/useCompositeListItem';
import { useForkRef } from '../../utils/useForkRef';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectOption } from './useSelectOption';
import { useId } from '../../utils/useId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useLatestRef } from '../../utils/useLatestRef';
import { SelectOptionContext } from './SelectOptionContext';
import { useSelectPositionerContext } from '../Positioner/SelectPositioner';

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
  side: ReturnType<typeof useSelectPositionerContext>['side'];
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
    id,
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
    side,
    ...otherProps
  } = props;

  const ownerState = React.useMemo(
    () => ({
      disabled,
      open,
      highlighted,
      selected,
      side,
    }),
    [disabled, open, highlighted, selected, side],
  );

  const { getItemProps } = useSelectOption({
    setOpen,
    disabled,
    highlighted,
    selected,
    id,
    ref: forwardedRef,
    typingRef,
    handleSelect: () => setValue(value),
    selectionRef,
    selectedIndexRef,
    indexRef,
  });

  const { renderElement } = useComponentRenderer({
    propGetter(externalProps = {}) {
      return getItemProps(
        getRootItemProps({
          ...externalProps,
          active: highlighted,
          selected,
        }),
      );
    },
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
  });

  return renderElement();
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
  id: PropTypes.string,
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
   * The click handler for the select option.
   */
  onClick: PropTypes.func,
  /**
   * @ignore
   */
  open: PropTypes.bool.isRequired,
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
 * - [Select](https://base-ui.netlify.app/components/react-select/)
 *
 * API:
 *
 * - [SelectOption API](https://base-ui.netlify.app/components/react-select/#api-reference-SelectOption)
 */
const SelectOption = React.forwardRef(function SelectOption(
  props: SelectOption.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { value: valueProp = null, id: idProp, label, ...otherProps } = props;

  const listItem = useCompositeListItem({ label });
  const { activeIndex, selectedIndex } = useSelectIndexContext();
  const { getItemProps, setOpen, setValue, open, selectionRef, typingRef, valuesRef } =
    useSelectRootContext();
  const { side } = useSelectPositionerContext();

  const id = useId(idProp);
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

  const isHighlighted = activeIndex === listItem.index;
  const isSelected = selectedIndex === listItem.index;

  const contextValue = React.useMemo(
    () => ({
      selected: isSelected,
      indexRef,
    }),
    [isSelected, indexRef],
  );

  return (
    <SelectOptionContext.Provider value={contextValue}>
      <MemoizedInnerSelectOption
        ref={mergedRef}
        highlighted={isHighlighted}
        selected={isSelected}
        getRootItemProps={getItemProps}
        setOpen={setOpen}
        id={id}
        open={open}
        selectionRef={selectionRef}
        typingRef={typingRef}
        value={valueProp}
        setValue={setValue}
        selectedIndexRef={selectedIndexRef}
        indexRef={indexRef}
        side={side}
        {...otherProps}
      />
    </SelectOptionContext.Provider>
  );
});

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
   * @ignore
   */
  id: PropTypes.string,
  /**
   * A text representation of the select option's content.
   * Used for keyboard text navigation matching.
   */
  label: PropTypes.string,
  /**
   * The click handler for the select option.
   */
  onClick: PropTypes.func,
  /**
   * The value of the select option.
   * @default null
   */
  value: PropTypes.any,
} as any;

export { SelectOption };

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
     * The value of the select option.
     * @default null
     */
    value?: any;
    /**
     * The click handler for the select option.
     */
    onClick?: React.MouseEventHandler<HTMLElement>;
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
