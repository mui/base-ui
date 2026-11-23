'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import type { VirtualizerItemMetadata } from '../../virtualizer/types';

export interface UseVirtualItemDiagnosticsParameters {
  componentName: string;
  disabledProp: boolean;
  /**
   * Whether the root's items declare their disabled state independently of rendered items, or
   * the list has no way to declare it.
   */
  hasDisabledAccessor: boolean;
  virtualItem: VirtualizerItemMetadata | undefined;
}

/**
 * Development-only diagnostics for an item rendered through a built-in list virtualizer.
 */
export function useVirtualItemDiagnostics(parameters: UseVirtualItemDiagnosticsParameters) {
  const { componentName, disabledProp, hasDisabledAccessor, virtualItem } = parameters;

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      if (virtualItem != null && disabledProp && !hasDisabledAccessor) {
        warn(
          `A virtualized <${componentName}.Item> is disabled, but the \`items\` of ` +
            `<${componentName}.Root> do not declare disabled items. The disabled state will be ` +
            'unavailable while the item is unmounted. Create the items with ' +
            `\`${componentName}.createItems()\` and its \`getDisabled\` option so keyboard ` +
            'navigation can skip it.',
        );
      }
    }, [componentName, disabledProp, hasDisabledAccessor, virtualItem]);
  }
}
