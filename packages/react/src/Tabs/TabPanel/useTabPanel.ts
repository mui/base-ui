'use client';
import * as React from 'react';
import type { TabsRootContext } from '../Root/TabsRootContext';
import { useId } from '../../utils/useId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useCompositeListItem } from '../../Composite/List/useCompositeListItem';

export interface TabPanelMetadata {
  id?: string;
  value: useTabPanel.Parameters['value'];
}

function useTabPanel(parameters: useTabPanel.Parameters): useTabPanel.ReturnValue {
  const {
    getTabIdByPanelValueOrIndex,
    rootRef: externalRef,
    selectedValue,
    value: valueParam,
  } = parameters;

  const id = useId();

  const metadata = React.useMemo(
    () => ({
      id,
      value: valueParam,
    }),
    [id, valueParam],
  );

  const { ref: listItemRef, index } = useCompositeListItem<TabPanelMetadata>({
    metadata,
  });

  const tabPanelValue = valueParam ?? index;

  const panelRef = React.useRef<HTMLElement>(null);
  const handleRef = useForkRef(panelRef, listItemRef, externalRef);

  const hidden = tabPanelValue !== selectedValue;

  const correspondingTabId = React.useMemo(() => {
    return getTabIdByPanelValueOrIndex(valueParam, index);
  }, [getTabIdByPanelValueOrIndex, index, valueParam]);

  const getRootProps = React.useCallback(
    (
      externalProps: React.ComponentPropsWithoutRef<'div'> = {},
    ): React.ComponentPropsWithRef<'div'> => {
      return mergeReactProps(externalProps, {
        'aria-labelledby': correspondingTabId,
        hidden,
        id: id ?? undefined,
        role: 'tabpanel',
        tabIndex: hidden ? -1 : 0,
        ref: handleRef,
        'data-index': index,
      });
    },
    [correspondingTabId, handleRef, hidden, id, index],
  );

  return {
    hidden,
    getRootProps,
    rootRef: handleRef,
  };
}

namespace useTabPanel {
  export interface Parameters extends Pick<TabsRootContext, 'getTabIdByPanelValueOrIndex'> {
    /**
     * The id of the TabPanel.
     */
    id?: string;
    /**
     * The ref of the TabPanel.
     */
    rootRef?: React.Ref<HTMLElement>;
    /**
     * The (context) value of the currently active/selected Tab.
     */
    selectedValue: TabsRootContext['value'];
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
  }
}

export { useTabPanel };
