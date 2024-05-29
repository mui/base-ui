import * as React from 'react';
import { type FloatingContext } from '@floating-ui/react';
import { type BaseUIComponentProps } from '../../utils/BaseUI.types';
import { DialogType, SoftCloseOptions } from '../Root/DialogRoot.types';

export interface DialogPopupProps extends BaseUIComponentProps<'div', DialogPopupOwnerState> {
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   *
   * @default true
   */
  animated?: boolean;
  /**
   * The container element to which the popup is appended to.
   */
  container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
  /**
   * If `true`, the dialog element is kept in the DOM when closed.
   *
   * @default false
   */
  keepMounted?: boolean;
}

export interface DialogPopupOwnerState {
  open: boolean;
  modal: boolean;
  nestedOpenDialogCount: number;
}

export interface UseDialogPopupParameters {
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   */
  animated: boolean;
  /**
   * The id of the dialog element.
   */
  id?: string;
  /**
   * The ref to the dialog element.
   */
  ref: React.Ref<HTMLElement>;
  /**
   * Determines if the dialog is modal.
   */
  modal: boolean;
  /**
   * Determines if the dialog is open.
   */
  open: boolean;
  /**
   * Callback fired when the dialog is requested to be opened or closed.
   */
  onOpenChange: (open: boolean) => void;
  /**
   * The id of the title element associated with the dialog.
   */
  titleElementId: string | undefined;
  /**
   * The id of the description element associated with the dialog.
   */
  descriptionElementId: string | undefined;
  /**
   * Callback to set the id of the popup element.
   */
  setPopupElementId: (id: string | undefined) => void;
  /**
   * Type of the dialog (ordinary dialog or alert dialog).
   */
  type: DialogType;
  /**
   * Determines whether the dialog should close when clicking outside of it or pressing the escape key.
   */
  softClose: SoftCloseOptions;
  /**
   * Determines if the dialog is the top-most one.
   */
  isTopmost: boolean;
}

export interface UseDialogPopupReturnValue {
  /**
   * Floating UI context for the dialog's FloatingFocusManager.
   */
  floatingContext: FloatingContext;
  /**
   * Resolver for the root element props.
   */
  getRootProps: (
    externalProps: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  /**
   * Determines if the dialog should be mounted even if closed (as the exit animation is still in progress).
   */
  mounted: boolean;
}
