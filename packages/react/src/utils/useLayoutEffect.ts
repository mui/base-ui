'use client';
import * as React from 'react';
import { useModernLayoutEffect } from '@floating-ui/react/utils';

/** A `React.useLayoutEffect` that doesn't warn in non-browser environments */
export const useLayoutEffect = useModernLayoutEffect as typeof React.useLayoutEffect;
