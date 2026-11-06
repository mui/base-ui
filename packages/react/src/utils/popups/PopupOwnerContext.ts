'use client';
import * as React from 'react';
import type { PopupInteractionStore } from './types';

// Roots own their parts even when a child Root is declared beside the parent's Popup.
export const PopupOwnerContext = React.createContext<PopupInteractionStore | null>(null);
