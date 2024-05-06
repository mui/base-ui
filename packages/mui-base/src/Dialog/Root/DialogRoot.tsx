import * as React from 'react';
import PropTypes from 'prop-types';
import { DialogRootOwnerState, DialogRootProps } from './DialogRoot.types';
import { DialogRootContext } from './DialogRootContext';
import { useDialogRootStyleHooks } from './useDialogRootStyleHooks';
import { resolveClassName } from '../../utils/resolveClassName';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useDialogRoot } from './useDialogRoot';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';

const DialogRoot = React.forwardRef(function DialogRoot(
  props: DialogRootProps,
  forwardedRef: React.Ref<HTMLElement>,
) {
  const {
    render: renderProp,
    className: classNameProp,
    modal = true,
    onOpenChange,
    open: openProp,
    defaultOpen,
    type = 'dialog',
    closeOnClickOutside,
    ...other
  } = props;

  const render = renderProp ?? defaultRenderFunctions.Fragment;

  const { open, contextValue } = useDialogRoot({
    open: openProp,
    defaultOpen,
    onOpenChange,
    type,
    modal,
    closeOnClickOutside,
  });

  const ownerState: DialogRootOwnerState = {
    open,
    modal,
    type,
  };

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = useDialogRootStyleHooks(ownerState);

  const rootProps = {
    ...styleHooks,
    ...other,
    className,
    ref: forwardedRef,
  };

  return (
    <DialogRootContext.Provider value={contextValue}>
      {evaluateRenderProp(render, rootProps, ownerState)}
    </DialogRootContext.Provider>
  );
});

DialogRoot.propTypes /* remove-proptypes */ = {
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
  defaultOpen: PropTypes.bool,
  /**
   * @ignore
   */
  modal: PropTypes.bool,
  /**
   * @ignore
   */
  onOpenChange: PropTypes.func,
  /**
   * @ignore
   */
  open: PropTypes.bool,
  /**
   * @ignore
   */
  type: PropTypes.oneOf(['alertdialog', 'dialog']),
} as any;

export { DialogRoot };
