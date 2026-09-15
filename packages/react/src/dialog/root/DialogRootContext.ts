'use client';
import * as React from 'react';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { DialogStore } from '../store/DialogStore';

export const DialogRootContext = React.createContext<DialogStore<unknown> | undefined>(undefined);

export function useDialogRootContext(optional?: false): DialogStore<unknown>;
export function useDialogRootContext(optional: true): DialogStore<unknown> | undefined;
export function useDialogRootContext(optional?: boolean) {
  const store = React.useContext(DialogRootContext);

  if (!optional && store === undefined) {
    throw new Error(
      'Base UI: DialogRootContext is missing. Dialog parts must be placed within <Dialog.Root>.',
    );
  }

  return store;
}

// Separate contexts keep consumers of `mounted` from rerendering when only
// `transitionStatus` changes.
export const DialogOpenContext = React.createContext(false);
export const DialogMountedContext = React.createContext(false);
export const DialogTransitionStatusContext = React.createContext<TransitionStatus>(undefined);
