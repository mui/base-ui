'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { HTMLElementType } from '../../utils/proptypes';
import { useForkRef } from '../../utils/useForkRef';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useSelectBackdrop } from './useSelectBackdrop';
import { commonStyleHooks } from '../utils/commonStyleHooks';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

const customStyleHookMapping: CustomStyleHookMapping<SelectBackdrop.OwnerState> = commonStyleHooks;

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.netlify.app/components/react-select/)
 *
 * API:
 *
 * - [SelectBackdrop API](https://base-ui.netlify.app/components/react-select/#api-reference-SelectBackdrop)
 */
const SelectBackdrop = React.forwardRef(function SelectBackdrop(
  props: SelectBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, keepMounted = false, container, ...otherProps } = props;

  const { open, mounted, backdropRef } = useSelectRootContext();

  const { getBackdropProps } = useSelectBackdrop();

  const mergedRef = useForkRef(backdropRef, forwardedRef);

  const ownerState: SelectBackdrop.OwnerState = React.useMemo(() => ({ open }), [open]);

  const { renderElement } = useComponentRenderer({
    propGetter: getBackdropProps,
    render: render ?? 'div',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal root={container}>{renderElement()}</FloatingPortal>;
});

namespace SelectBackdrop {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * If `true`, the Backdrop remains mounted when the Select popup is closed.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * The container element to which the Backdrop is appended to.
     * @default false
     */
    container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
  }
  export interface OwnerState {
    open: boolean;
  }
}

SelectBackdrop.propTypes /* remove-proptypes */ = {
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
   * The container element to which the Backdrop is appended to.
   * @default false
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.func,
  ]),
  /**
   * If `true`, the Backdrop remains mounted when the Select popup is closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectBackdrop };
