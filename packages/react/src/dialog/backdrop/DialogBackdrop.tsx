'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { type BaseUIComponentProps } from '../../utils/types';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { HTMLElementType } from '../../utils/proptypes';

const customStyleHookMapping: CustomStyleHookMapping<DialogBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogBackdrop = React.forwardRef(function DialogBackdrop(
  props: DialogBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, keepMounted = false, container, ...other } = props;
  const { open, hasParentDialog, mounted, transitionStatus } = useDialogRootContext();

  const state: DialogBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    ref: forwardedRef,
    extraProps: { role: 'presentation', hidden: !mounted, ...other },
    customStyleHookMapping,
  });

  // no need to render nested backdrops
  const shouldRender = (keepMounted || mounted) && !hasParentDialog;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal root={container}>{renderElement()}</FloatingPortal>;
});

namespace DialogBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * If `true`, the backdrop element is kept in the DOM when closed.
     *
     * @default false
     */
    keepMounted?: boolean;
    /**
     * The container element to which the backdrop is appended to.
     * @default false
     */
    container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
  }

  export interface State {
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}

DialogBackdrop.propTypes /* remove-proptypes */ = {
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
   * The container element to which the backdrop is appended to.
   * @default false
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.func,
  ]),
  /**
   * If `true`, the backdrop element is kept in the DOM when closed.
   *
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { DialogBackdrop };
