'use client';
import * as React from 'react';
import { type SwitchOwnerState } from './SwitchRoot.types';

export const SwitchContext = React.createContext<SwitchOwnerState | null>(null);
