import * as React from 'react';
import { type BaseUIComponentProps } from '../../utils/types';
import { TransitionStatus } from '../../utils/useTransitionStatus';

export interface AlertDialogPopupProps
  extends BaseUIComponentProps<'div', AlertDialogPopupOwnerState> {
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

export interface AlertDialogPopupOwnerState {
  open: boolean;
  nestedOpenDialogCount: number;
  transitionStatus: TransitionStatus;
}
