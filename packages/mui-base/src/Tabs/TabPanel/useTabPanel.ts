'use client';
import * as React from 'react';
import { useTabsRootContext } from '../Root/TabsRootContext';
import { useCompoundItem } from '../../useCompound';
import { useId } from '../../utils/useId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { TabActivationDirection, TabsDirection, TabsOrientation } from '../Root/TabsRoot';

function tabPanelValueGenerator(otherTabPanelValues: Set<any>) {
  return otherTabPanelValues.size;
}

function useTabPanel(parameters: useTabPanel.Parameters): useTabPanel.ReturnValue {
  const { value: valueParam, id: idParam, rootRef: externalRef } = parameters;
  const {
    value: selectedTabValue,
    getTabId,
    orientation,
    direction,
    tabActivationDirection,
  } = useTabsRootContext();

  const id = useId(idParam);
  const ref = React.useRef<HTMLElement>(null);
  const handleRef = useForkRef(ref, externalRef);
  const metadata = React.useMemo(() => ({ id, ref }), [id]);

  const { id: value } = useCompoundItem(valueParam ?? tabPanelValueGenerator, metadata);

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

namespace useTabPanel {
  export interface Parameters {
    /**
     * The id of the TabPanel.
     */
    id?: string;
    /**
     * The ref of the TabPanel.
     */
    rootRef?: React.Ref<HTMLElement>;
    /**
     * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
     */
    value?: any;
  }

  export interface ReturnValue {
    /**
     * If `true`, it indicates that the tab panel will be hidden.
     */
    hidden: boolean;
    /**
     * Resolver for the root slot's props.
     * @param externalProps additional props for the root slot
     * @returns props that should be spread on the root slot
     */
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'div'>,
    ) => React.ComponentPropsWithRef<'div'>;
    rootRef: React.RefCallback<HTMLElement> | null;
    orientation: TabsOrientation;
    direction: TabsDirection;
    tabActivationDirection: TabActivationDirection;
  }
}

export { useTabPanel };
