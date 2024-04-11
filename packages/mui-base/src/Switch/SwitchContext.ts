import * as React from 'react';
import { type SwitchOwnerState } from './Switch.types';

export type SwitchContextValue = SwitchOwnerState;

export const SwitchContext = React.createContext<SwitchOwnerState | null>(null);
