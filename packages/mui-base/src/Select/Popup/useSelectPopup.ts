import * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useSelectPositionerContext } from '../Positioner/SelectPositionerContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';

/**
 *
 * API:
 *
 * - [useSelectPopup API](https://mui.com/base-ui/api/use-select-popup/)
 */
export function useSelectPopup(): useSelectPopup.ReturnValue {
  const {
    getPopupProps: getRootPopupProps,
    alignOptionToTrigger,
    selectedIndex,
    touchModality,
  } = useSelectRootContext();

  const { isPositioned } = useSelectPositionerContext();

  const hasSelectedIndex = selectedIndex !== null;

  const [pointerEvents, setPointerEvents] = React.useState<'auto' | 'none'>('none');

  const getPopupProps: useSelectPopup.ReturnValue['getPopupProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(getRootPopupProps(externalProps), {
        style: {
          ...(pointerEvents === 'none' && { pointerEvents }),
          ...(alignOptionToTrigger &&
            hasSelectedIndex &&
            !touchModality && {
              // Note: not supported in Safari. Needs to be manually specified in CSS.
              scrollbarWidth: 'none',
            }),
        },
      });
    },
    [getRootPopupProps, pointerEvents, alignOptionToTrigger, hasSelectedIndex, touchModality],
  );

  useEnhancedEffect(() => {
    if (!isPositioned) {
      return undefined;
    }

    // `isPositioned` becomes `true` for the _initial_ positioning, excluding fallbacks. We need
    // to wait for any fallbacks to have been potentially applied though. This also appears to fix
    // a bug in Safari where focus gets lost when the item is opened on top of the trigger.
    const frame = requestAnimationFrame(() => {
      setPointerEvents('auto');
    });

    return () => {
      cancelAnimationFrame(frame);
      setPointerEvents('none');
    };
  }, [isPositioned]);

  return React.useMemo(
    () => ({
      getPopupProps,
    }),
    [getPopupProps],
  );
}

namespace useSelectPopup {
  export interface ReturnValue {
    getPopupProps: (props?: GenericHTMLProps) => GenericHTMLProps;
  }
}
