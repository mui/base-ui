import * as React from 'react';
import { type FloatingContext } from '@floating-ui/react';
import { type BaseUIComponentProps } from '../../utils/BaseUI.types';
import { DialogType, SoftCloseOptions } from '../Root/DialogRoot.types';

export interface DialogPopupProps extends BaseUIComponentProps<'div', DialogPopupOwnerState> {
  /**
   * If `true`, the dialog element is kept in the DOM when closed.
   *
   * @default false
   */
  keepMounted?: boolean;
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   *
   * @default false
   */
  animated?: boolean;
}

export interface DialogPopupOwnerState {
  open: boolean;
  modal: boolean;
}

export interface UseDialogPopupParameters {
  /**
   * The id of the dialog element.
   */
  id?: string;
  /**
   * The ref to the dialog element.
   */
  ref: React.Ref<HTMLElement>;
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   */
  animated: boolean;
  modal: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleElementId: string | undefined;
  descriptionElementId: string | undefined;
  setPopupElementId: (id: string | undefined) => void;
  type: DialogType;
  softClose: SoftCloseOptions;
}

export interface UseDialogPopupReturnValue {
  mounted: boolean;
  getRootProps: (
    otherProps: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  floatingUIContext: FloatingContext;
}
