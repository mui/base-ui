'use client';
import { createUseEffect } from './fastHooks';

const noop = () => {};

export const useIsoLayoutEffect =
  typeof document !== 'undefined' ? createUseEffect('useLayoutEffect') : noop;
