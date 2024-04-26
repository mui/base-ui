import * as React from 'react';
import { type OwnerState } from './Switch.types';

export type SwitchContextValue = OwnerState;

export const SwitchContext = React.createContext<OwnerState | null>(null);
