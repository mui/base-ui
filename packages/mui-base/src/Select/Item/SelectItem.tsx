'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { UseInteractionsReturn, useListItem } from '@floating-ui/react';
import { useSelectItem } from './useSelectItem';
import { SelectRootContext, useSelectRootContext } from '../Root/SelectRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useId } from '../../utils/useId';
import type { BaseUIComponentProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { useEventCallback } from '../../utils/useEventCallback';

const InnerSelectItem = React.memo(
  React.forwardRef(function InnerSelectItem(
    props: InnerSelectItemProps,
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
      ...otherProps
    } = props;

    const { getItemProps } = useSelectItem({
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

    const ownerState: SelectItem.OwnerState = React.useMemo(
      () => ({ disabled, highlighted, selected }),
      [disabled, highlighted, selected],
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
    });

    return renderElement();
  }),
);

/**
 * An unstyled menu item to be used within a Menu.
 *
 * Demos:
 *
 * - [Menu](https://mui.com/base-ui/react-menu/)
 *
 * API:
 *
 * - [SelectItem API](https://mui.com/base-ui/react-menu/components-api/#menu-item)
 */
const SelectItem = React.forwardRef(function SelectItem(
  props: SelectItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, label, ...otherProps } = props;

  const {
    getItemProps,
    activeIndex,
    selectedIndex,
    setOpen,
    typingRef,
    setSelectedIndex,
    selectionRef,
  } = useSelectRootContext();

  const [item, setItem] = React.useState<Element | null>(null);
  const listItem = useListItem({ label: label ?? item?.textContent });
  const mergedRef = useForkRef(forwardedRef, listItem.ref, setItem);

  const id = useId(idProp);

  const highlighted = listItem.index === activeIndex;
  const selected = listItem.index === selectedIndex;

  const handleSelect = useEventCallback(() => {
    setSelectedIndex(listItem.index);
  });

  // This wrapper component is used as a performance optimization.
  // SelectItem reads the context and re-renders the actual SelectItem
  // only when it needs to.

  return (
    <InnerSelectItem
      {...otherProps}
      id={id}
      ref={mergedRef}
      highlighted={highlighted}
      handleSelect={handleSelect}
      selectionRef={selectionRef}
      setOpen={setOpen}
      selected={selected}
      getItemProps={getItemProps}
      typingRef={typingRef}
    />
  );
});

interface InnerSelectItemProps extends SelectItem.Props {
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
}

namespace SelectItem {
  export interface OwnerState {
    disabled: boolean;
    highlighted: boolean;
    selected: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    children?: React.ReactNode;
    /**
     * The click handler for the menu item.
     */
    onClick?: React.MouseEventHandler<HTMLElement>;
    /**
     * If `true`, the menu item will be disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * A text representation of the menu item's content.
     * Used for keyboard text navigation matching.
     */
    label?: string;
    /**
     * The id of the menu item.
     */
    id?: string;
    /**
     * If `true`, the menu will close when the menu item is clicked.
     *
     * @default true
     */
    closeOnClick?: boolean;
  }
}

SelectItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * If `true`, the menu will close when the menu item is clicked.
   *
   * @default true
   */
  closeOnClick: PropTypes.bool,
  /**
   * If `true`, the menu item will be disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The id of the menu item.
   */
  id: PropTypes.string,
  /**
   * A text representation of the menu item's content.
   * Used for keyboard text navigation matching.
   */
  label: PropTypes.string,
  /**
   * The click handler for the menu item.
   */
  onClick: PropTypes.func,
} as any;

export { SelectItem };
