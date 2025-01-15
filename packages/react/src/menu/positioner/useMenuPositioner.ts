'use client';
import * as React from 'react';
import { useFloatingTree, type FloatingRootContext } from '@floating-ui/react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { GenericHTMLProps } from '../../utils/types';
import { useMenuRootContext } from '../root/MenuRootContext';

export function useMenuPositioner(
  params: useMenuPositioner.Parameters,
): useMenuPositioner.ReturnValue {
  const { nodeId, parentNodeId } = params;

  const { open, setOpen, mounted, setHoverEnabled } = useMenuRootContext();

  const positioning = useAnchorPositioning(params);

  const { events: menuEvents } = useFloatingTree()!;

  const getPositionerProps: useMenuPositioner.ReturnValue['getPositionerProps'] = React.useCallback(
    (externalProps = {}) => {
      const hiddenStyles: React.CSSProperties = {};

      if (!open) {
        hiddenStyles.pointerEvents = 'none';
      }

      return mergeReactProps<'div'>(externalProps, {
        role: 'presentation',
        hidden: !mounted,
        style: {
          ...positioning.positionerStyles,
          ...hiddenStyles,
        },
      });
    },
    [open, mounted, positioning.positionerStyles],
  );

  React.useEffect(() => {
    function onMenuOpenChange(event: { open: boolean; nodeId: string; parentNodeId: string }) {
      if (event.open) {
        if (event.parentNodeId === nodeId) {
          setHoverEnabled(false);
        }
        if (event.nodeId !== nodeId && event.parentNodeId === parentNodeId) {
          setOpen(false, undefined);
        }
      } else if (event.parentNodeId === nodeId) {
        setHoverEnabled(true);
      }
    }

    menuEvents.on('openchange', onMenuOpenChange);

    return () => {
      menuEvents.off('openchange', onMenuOpenChange);
    };
  }, [menuEvents, nodeId, parentNodeId, setOpen]);

  React.useEffect(() => {
    menuEvents.emit('openchange', { open, nodeId, parentNodeId });
  }, [menuEvents, open, nodeId, parentNodeId]);

  return React.useMemo(
    () => ({
      ...positioning,
      getPositionerProps,
    }),
    [positioning, getPositionerProps],
  );
}

export namespace useMenuPositioner {
  export interface Parameters extends useAnchorPositioning.Parameters {
    /**
     * The menu root context.
     */
    floatingRootContext: FloatingRootContext;
    /**
     * Floating node id.
     */
    nodeId?: string;
    /**
     * The parent floating node id.
     */
    parentNodeId: string | null;
  }

  export interface SharedParameters extends useAnchorPositioning.SharedParameters {}

  export interface ReturnValue extends useAnchorPositioning.ReturnValue {
    getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
