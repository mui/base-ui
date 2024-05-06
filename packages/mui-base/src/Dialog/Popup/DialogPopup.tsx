import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager } from '@floating-ui/react';
import { DialogPopupProps } from './DialogPopup.types';
import { useDialogPopup } from './useDialogPopup';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { resolveClassName } from '../../utils/resolveClassName';
import { useDialogPopupStyleHooks } from './useDialogPopupStyleHooks';

const DialogPopup = React.forwardRef(function DialogPopup(
  props: DialogPopupProps & React.ComponentPropsWithoutRef<'div'>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render: renderProp, className: classNameProp, keepMounted, id: idProp, ...other } = props;

  const render = renderProp ?? defaultRenderFunctions.div;

  const { getRootProps, open, floatingContext, modal, type } = useDialogPopup({
    id: idProp,
    keepMounted,
    ref: forwardedRef,
  });

  const ownerState = {
    open,
    modal,
    type,
  };

  const styleHooks = useDialogPopupStyleHooks(ownerState);
  const className = resolveClassName(classNameProp, ownerState);
  const rootProps = getRootProps({ ...styleHooks, ...other, className });

  if (!keepMounted && !open) {
    return null;
  }

  return open ? (
    <FloatingFocusManager context={floatingContext} modal={modal} guards={false}>
      {evaluateRenderProp(render, rootProps, ownerState)}
    </FloatingFocusManager>
  ) : (
    <div {...rootProps} />
  );
});

DialogPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * @ignore
   */
  keepMounted: PropTypes.bool,
} as any;

export { DialogPopup };
