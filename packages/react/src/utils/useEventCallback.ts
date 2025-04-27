'use client';
import { useEffectEvent } from '@floating-ui/react/utils';

/**
 * Inspired by https://github.com/facebook/react/issues/14099#issuecomment-440013892
 * See RFC in https://github.com/reactjs/rfcs/pull/220
 */
export const useEventCallback = useEffectEvent;
