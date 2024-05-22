import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager, FloatingPortal } from '@floating-ui/react';
import { DialogPopupOwnerState, DialogPopupProps } from './DialogPopup.types';
import { useDialogPopup } from './useDialogPopup';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const DialogPopup = React.forwardRef(function DialogPopup(
  props: DialogPopupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, keepMounted = false, id: idProp, animated = false, ...other } = props;
  const rootContext = useDialogRootContext();
  const { open, modal, nestedOpenDialogCount } = rootContext;

  const { getRootProps, floatingContext, mounted } = useDialogPopup({
    id: idProp,
    animated,
    ref: forwardedRef,
    isTopmost: nestedOpenDialogCount === 0,
    ...rootContext,
  });

  const ownerState: DialogPopupOwnerState = {
    open,
    modal,
    nestedOpenDialogCount,
  };

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    propGetter: getRootProps,
    extraProps: {
      ...other,
      style: { '--nested-dialogs': nestedOpenDialogCount },
    },
    customStyleHookMapping: {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
      nestedOpenDialogCount: (value) => ({ 'data-nested-dialogs': value.toString() }),
    },
  });

  if (!keepMounted && !mounted) {
    return null;
  }

  return (
    <FloatingPortal>
      <FloatingFocusManager context={floatingContext} modal={modal} disabled={!mounted}>
        {renderElement()}
      </FloatingFocusManager>
    </FloatingPortal>
  );
});

DialogPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   *
   * @default false
   */
  animated: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * If `true`, the dialog element is kept in the DOM when closed.
   *
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { DialogPopup };
