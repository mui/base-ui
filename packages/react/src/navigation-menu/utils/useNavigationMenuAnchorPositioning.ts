'use client';
import { useFloating } from '../../floating-ui-react/hooks/useFloating';
import {
  useAnchorPositioningWithHook,
  type UseAnchorPositioningParameters,
  type UseAnchorPositioningReturnValue,
} from '../../internals/useAnchorPositioning';

/**
 * Positioning path for the Navigation Menu, whose active trigger supplies its root store after the
 * positioner has already rendered.
 */
export function useNavigationMenuAnchorPositioning(
  params: UseAnchorPositioningParameters,
): UseAnchorPositioningReturnValue {
  return useAnchorPositioningWithHook(params, useFloating);
}
