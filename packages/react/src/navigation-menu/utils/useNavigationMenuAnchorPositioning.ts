'use client';
import { useBaseUIFloating } from '../../floating-ui-react/hooks/useFloating';
import { useFloatingRootContext } from '../../floating-ui-react/hooks/useFloatingRootContext';
import type { UseFloatingOptions } from '../../floating-ui-react/types';
import {
  useAnchorPositioningWithHook,
  type UseAnchorPositioningParameters,
  type UseAnchorPositioningReturnValue,
} from '../../internals/useAnchorPositioning';

function useFloatingWithFallbackStore(options: UseFloatingOptions) {
  const fallbackStore = useFloatingRootContext(options);
  return useBaseUIFloating({ ...options, rootContext: options.rootContext || fallbackStore });
}

/**
 * Positioning path for the Navigation Menu, whose active trigger supplies its root store after the
 * positioner has already rendered.
 */
export function useNavigationMenuAnchorPositioning(
  params: UseAnchorPositioningParameters,
): UseAnchorPositioningReturnValue {
  return useAnchorPositioningWithHook(params, useFloatingWithFallbackStore);
}
