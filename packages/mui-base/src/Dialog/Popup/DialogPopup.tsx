import * as React from 'react';
import PropTypes from 'prop-types';
import { useFloating, FloatingFocusManager, useInteractions, useDismiss } from '@floating-ui/react';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useForkRef } from '../../utils/useForkRef';
import { useId } from '../../utils/useId';

export interface DialogPopupProps {
  keepMounted?: boolean;
  children?: React.ReactNode;
}

const DialogPopup = React.forwardRef(function DialogPopup(
  props: DialogPopupProps & React.ComponentPropsWithRef<'div'>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { keepMounted, id: idProp, ...other } = props;

  const {
    open,
    modal,
    titleElementId,
    descriptionElementId,
    registerPopup,
    type,
    onOpenChange,
    closeOnClickOutside,
  } = useDialogRootContext();

  const { refs, context } = useFloating({
    open,
    onOpenChange,
  });

  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
    enabled: closeOnClickOutside,
  });
  const { getFloatingProps } = useInteractions([dismiss]);

  const id = useId(idProp);

  const ref = React.useRef<HTMLDivElement>(null);
  const handleRef = useForkRef(ref, forwardedRef, refs.setFloating);

  React.useEffect(() => {
    registerPopup(id ?? null);
    return () => {
      registerPopup(null);
    };
  }, [id, registerPopup]);

  const outputProps: React.ComponentPropsWithRef<'div'> = {
    'aria-labelledby': titleElementId ?? undefined,
    'aria-describedby': descriptionElementId ?? undefined,
    'aria-modal': open && modal ? true : undefined,
    role: type,
    ...other,
    id,
    hidden: !open,
    ref: handleRef,
    tabIndex: -1,
    ...getFloatingProps(),
  };

  if (!keepMounted && !open) {
    return null;
  }

  return open ? (
    <FloatingFocusManager context={context} modal={modal} guards={false}>
      <div {...outputProps} />
    </FloatingFocusManager>
  ) : (
    <div {...outputProps} />
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
