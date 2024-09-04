'use client';

import * as React from 'react';
import type { CheckboxContextValue } from './CheckboxRoot.types';

export const CheckboxContext = React.createContext<CheckboxContextValue | null>(null);
