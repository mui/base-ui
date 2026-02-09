'use client';
import * as React from 'react';
import { createContext } from '../../utils/createContext';

export interface ToastViewportContext {
  viewportRef: React.RefObject<HTMLElement | null>;
}

export const [ToastViewportContext, useToastViewportContext] = createContext<ToastViewportContext>(
  'Base UI: ToastViewportContext is missing. Toast parts must be placed within <Toast.Viewport>.',
);
