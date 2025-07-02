'use client';
import * as React from 'react';

const noop = () => {};

export const useModernLayoutEffect = typeof document !== 'undefined' ? React.useLayoutEffect : noop;
