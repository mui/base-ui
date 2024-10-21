'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { UseInteractionsReturn } from '@floating-ui/react';
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
import { useCompositeListItem } from '../../Composite/List/useCompositeListItem';

const InnerSelectOption = React.memo(
  React.forwardRef(function InnerSelectOption(
    props: InnerSelectOptionProps,
    forwardedRef: React.ForwardedRef<Element>,
  ) {
    const {
      className,
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
  getItemProps: PropTypes.func.isRequired,
  /**
   * @ignore
   */
  handleSelect: PropTypes.func.isRequired,
  /**
   * @ignore
   */
  highlighted: PropTypes.bool.isRequired,
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
  selectionRef: PropTypes.shape({
    current: PropTypes.shape({
      allowMouseUp: PropTypes.bool.isRequired,
      allowSelect: PropTypes.bool.isRequired,
    }).isRequired,
  }).isRequired,
  /**
   * @ignore
   */
  setOpen: PropTypes.func.isRequired,
  /**
   * @ignore
   */
  typingRef: PropTypes.shape({
    current: PropTypes.bool.isRequired,
  }).isRequired,
} as any;

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
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, value: valueProp = null, label, ...otherProps } = props;

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

  const listItem = useCompositeListItem({ label });
  const mergedRef = useForkRef(forwardedRef, listItem.ref);

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
    allowMouseUp: boolean;
    allowSelect: boolean;
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
