'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useListItem } from '@floating-ui/react';
import { useSelectItem } from './useSelectItem';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useId } from '../../utils/useId';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';

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
      id,
      propGetter,
      render,
      treatMouseupAsClick,
      ...otherProps
    } = props;

    const { getRootProps } = useSelectItem({
      closeOnClick,
      disabled,
      highlighted,
      id,
      ref: forwardedRef,
      treatMouseupAsClick,
    });

    const ownerState: SelectItem.OwnerState = React.useMemo(
      () => ({ disabled, highlighted }),
      [disabled, highlighted],
    );

    const { renderElement } = useComponentRenderer({
      render: render ?? 'div',
      className,
      ownerState,
      propGetter: (externalProps) => propGetter(getRootProps(externalProps)),
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
  const { id: idProp, label, ...other } = props;

  const { getItemProps, activeIndex, clickAndDragEnabled } = useSelectRootContext();

  const itemRef = React.useRef<HTMLElement>(null);
  const listItem = useListItem({ label: label ?? itemRef.current?.innerText });
  const mergedRef = useForkRef(forwardedRef, listItem.ref, itemRef);

  const id = useId(idProp);

  const highlighted = listItem.index === activeIndex;

  // This wrapper component is used as a performance optimization.
  // SelectItem reads the context and re-renders the actual SelectItem
  // only when it needs to.

  return (
    <InnerSelectItem
      {...other}
      id={id}
      ref={mergedRef}
      highlighted={highlighted}
      propGetter={getItemProps}
      treatMouseupAsClick={clickAndDragEnabled}
    />
  );
});

interface InnerSelectItemProps extends SelectItem.Props {
  highlighted: boolean;
  propGetter: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  treatMouseupAsClick: boolean;
}

namespace SelectItem {
  export type OwnerState = {
    disabled: boolean;
    highlighted: boolean;
  };

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
