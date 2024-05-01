import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useForkRef } from '../../utils/useForkRef';
import { ownerDocument } from '../../utils/owner';
import { useId } from '../../utils/useId';

export interface DialogPopupProps {
  keepMounted?: boolean;
  children?: React.ReactNode;
}

const DialogPopup = React.forwardRef(function DialogPopup(
  props: DialogPopupProps & React.ComponentPropsWithRef<'dialog'>,
  forwardedRef: React.ForwardedRef<HTMLDialogElement>,
) {
  const { keepMounted, id: idProp, ...other } = props;

  const {
    open,
    onOpenChange,
    modal,
    titleElementId,
    descriptionElementId,
    registerPopup,
    type,
    closeOnClickOutside,
  } = useDialogRootContext();

  const id = useId(idProp);

  const previousOpen = React.useRef<boolean>(open);
  const ref = React.useRef<HTMLDialogElement>(null);
  const handleRef = useForkRef(ref, forwardedRef);

  React.useEffect(() => {
    if (!open) {
      ref.current?.close();
    } else if (modal) {
      if (previousOpen.current === true) {
        ref.current?.close();
      }
      ref.current?.showModal();
    } else {
      if (previousOpen.current === true) {
        ref.current?.close();
      }
      ref.current?.show();
    }

    previousOpen.current = open;
  }, [open, modal]);

  React.useEffect(() => {
    registerPopup(id ?? null);
    return () => {
      registerPopup(null);
    };
  }, [id, registerPopup]);

  const handleClickOutside = React.useCallback(
    (event: PointerEvent) => {
      const popupElement = ref.current;
      if (!popupElement) {
        return;
      }

      if (modal) {
        // When the dialog is modal, clicking on the backdrop is recognized as clicking on the dialog itself.
        // We need to check whether the click was outside the dialog's bounding box.
        // We also don't want to close the dialog when clicking on any descendant of it (such as an open select).
        if (
          (event.target === popupElement && hasClickedOutsideBoundingBox(event, popupElement)) ||
          !popupElement.contains(event.target as Node)
        ) {
          onOpenChange?.(false);
        }
      } else if (!popupElement.contains(event.target as Node)) {
        onOpenChange?.(false);
      }
    },
    [onOpenChange, modal],
  );

  React.useEffect(() => {
    if (!closeOnClickOutside) {
      return undefined;
    }

    const doc = ownerDocument(ref.current);
    if (open) {
      doc.addEventListener('pointerdown', handleClickOutside);
    }

    return () => doc.removeEventListener('pointerdown', handleClickOutside);
  }, [open, handleClickOutside, closeOnClickOutside]);

  const handleCancel = (event: React.SyntheticEvent) => {
    event.preventDefault();
    onOpenChange?.(false);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    if ((event.target as HTMLFormElement).method === 'dialog') {
      event.preventDefault();
      onOpenChange?.(false);
    }
  };

  const outputProps: React.ComponentPropsWithRef<'dialog'> = {
    'aria-labelledby': titleElementId ?? undefined,
    'aria-describedby': descriptionElementId ?? undefined,
    role: type === 'alertdialog' ? 'alertdialog' : undefined,
    ...other,
    id,
    onCancel: handleCancel,
    onSubmit: handleFormSubmit,
    ref: handleRef,
  };

  return <dialog {...outputProps} />;
});

function hasClickedOutsideBoundingBox(event: PointerEvent, element: HTMLElement) {
  const boundingRect = element.getBoundingClientRect();
  return (
    event.clientX < boundingRect.left ||
    event.clientX >= boundingRect.right ||
    event.clientY < boundingRect.top ||
    event.clientY >= boundingRect.bottom
  );
}

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
