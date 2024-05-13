import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager } from '@floating-ui/react';
import { DialogPopupProps } from './DialogPopup.types';
import { useDialogPopup } from './useDialogPopup';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useBaseUIComponentRenderer } from '../../utils/useBaseUIComponentRenderer';

const DialogPopup = React.forwardRef(function DialogPopup(
  props: DialogPopupProps & React.ComponentPropsWithoutRef<'div'>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, keepMounted = false, id: idProp, animated = false, ...other } = props;

  const { getRootProps, open, floatingUIContext, modal, mounted, openState } = useDialogPopup({
    id: idProp,
    animated,
    ref: forwardedRef,
  });

  const ownerState = {
    open,
    modal,
    openState,
  };

  const { renderElement } = useBaseUIComponentRenderer({
    render: render ?? defaultRenderFunctions.div,
    className,
    ownerState,
    propGetter: getRootProps,
    extraProps: other,
    customStyleHookMapping: {
      open: () => null,
      openState: (value) => ({ 'data-state': value }),
    },
  });

  if (!keepMounted && !mounted) {
    return null;
  }

  return (
    <FloatingFocusManager
      context={floatingUIContext}
      modal={modal}
      guards={false}
      disabled={!mounted}
    >
      {renderElement()}
    </FloatingFocusManager>
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
