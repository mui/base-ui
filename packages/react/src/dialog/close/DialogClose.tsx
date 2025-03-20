'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogClose } from './useDialogClose';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * A button that closes the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogClose = React.forwardRef(function DialogClose(
  props: DialogClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, disabled = false, ...other } = props;
  const { open, setOpen } = useDialogRootContext();
  const { getRootProps } = useDialogClose({ disabled, open, setOpen, rootRef: forwardedRef });

  const state: DialogClose.State = React.useMemo(() => ({ disabled }), [disabled]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'button',
    className,
    state,
    propGetter: getRootProps,
    extraProps: other,
  });

  return renderElement();
});

namespace DialogClose {
  export interface Props extends BaseUIComponentProps<'button', State> {}

  export interface State {
    /**
     * Whether the button is currently disabled.
     */
    disabled: boolean;
  }
}

DialogClose.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { DialogClose };
