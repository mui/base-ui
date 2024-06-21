'use client';
import * as React from 'react';
import { UseTabPanelParameters, UseTabPanelReturnValue } from './TabPanel.types';
import { useTabsContext } from '../Root/TabsContext';
import { useCompoundItem } from '../../useCompound';
import { useId } from '../../utils/useId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';

/**
 *
 * Demos:
 *
 * - [Tabs](https://mui.com/base-ui/react-tabs/#hooks)
 *
 * API:
 *
 * - [useTabPanel API](https://mui.com/base-ui/react-tabs/hooks-api/#use-tab-panel)
 */
function useTabPanel(parameters: UseTabPanelParameters): UseTabPanelReturnValue {
  const { value: valueParam, id: idParam, rootRef: externalRef } = parameters;
  const {
    value: selectedTabValue,
    getTabId,
    orientation,
    direction,
    tabActivationDirection,
    compoundParentContext,
  } = useTabsContext();

  const { getRegisteredItemCount: getRegisteredPanelsCount } = compoundParentContext;

  const id = useId(idParam);
  const ref = React.useRef<HTMLElement>(null);
  const handleRef = useForkRef(ref, externalRef);
  const metadata = React.useMemo(() => ({ id, ref }), [id]);

  const value = React.useRef(valueParam ?? getRegisteredPanelsCount()).current;

  useCompoundItem({
    key: value,
    itemMetadata: metadata,
    parentContext: compoundParentContext,
  });

  const hidden = value !== selectedTabValue;

  const correspondingTabId = value !== undefined ? getTabId(value) : undefined;

  const getRootProps = React.useCallback(
    (
      externalProps: React.ComponentPropsWithoutRef<'div'> = {},
    ): React.ComponentPropsWithRef<'div'> => {
      return mergeReactProps(externalProps, {
        'aria-labelledby': correspondingTabId ?? undefined,
        hidden,
        id: id ?? undefined,
        role: 'tabpanel',
        tabIndex: hidden ? -1 : 0,
        ref: handleRef,
      });
    },
    [correspondingTabId, handleRef, hidden, id],
  );

  return {
    hidden,
    getRootProps,
    rootRef: handleRef,
    orientation,
    direction,
    tabActivationDirection,
  };
}

export { useTabPanel };
