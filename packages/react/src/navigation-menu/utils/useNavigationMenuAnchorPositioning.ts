'use client';
import { useBaseUIFloating } from '../../utils/popups/positioning/useFloating';
import { useFloatingRootContext } from '../../utils/popups/floating-root/useFloatingRootContext';
import type { UseFloatingOptions } from '../../utils/popups/floating-root/types';
import { useAnchorPositioningWithHook } from '../../internals/useAnchorPositioning';
import type {
  UseAnchorPositioningParameters,
  UseAnchorPositioningReturnValue,
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
