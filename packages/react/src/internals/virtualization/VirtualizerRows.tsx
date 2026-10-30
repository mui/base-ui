'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import { VirtualizerGroupHeaderContext, VirtualizerItemContext } from '../../virtualizer/host';
import type {
  VirtualizerGroup,
  VirtualizerGroupHeaderMetadata,
  VirtualizerGroupHeaderProps,
  VirtualizerItemProps,
  VirtualizerRenderGroupHeader,
  VirtualizerRowProps,
} from '../../virtualizer/types';
import type { VirtualizerItemRowModel } from './types';

type ComponentName = string;

export interface VirtualizerGroupHeaderRowProps<Item> {
  group: VirtualizerGroup<Item>;
  groupIndex: number;
  id: string | undefined;
  renderGroupHeader: VirtualizerRenderGroupHeader<Item>;
  /**
   * Attributes the header element itself carries when the virtualizer renders no wrapper around
   * it, or `undefined` when a wrapper carries them.
   */
  rowProps: VirtualizerRowProps | undefined;
  /**
   * Whether the header is rendered for a host, whose group-label part reads the id through
   * `useVirtualizerGroupHeader`. Standalone headers have no such part.
   */
  hosted: boolean;
}

function VirtualizerGroupHeaderRowImpl<Item>(props: VirtualizerGroupHeaderRowProps<Item>) {
  const { group, groupIndex, hosted, id, renderGroupHeader, rowProps } = props;

  const headerProps = React.useMemo<VirtualizerGroupHeaderProps>(
    () => ({ ...rowProps, id, 'aria-hidden': true }),
    [id, rowProps],
  );
  const metadata = React.useMemo<VirtualizerGroupHeaderMetadata>(
    () => ({ id, groupIndex }),
    [groupIndex, id],
  );

  // The name reaches a list's `<GroupLabel>` through the list's own context, and everything else
  // through the renderer's third argument. Both describe the same header.
  const content = renderGroupHeader(group, groupIndex, headerProps);

  if (!hosted) {
    return content;
  }

  return (
    <VirtualizerGroupHeaderContext.Provider value={metadata}>
      {content}
    </VirtualizerGroupHeaderContext.Provider>
  );
}

export const VirtualizerGroupHeaderRow = React.memo(
  VirtualizerGroupHeaderRowImpl,
) as typeof VirtualizerGroupHeaderRowImpl;

export interface VirtualizerItemRowProps<Item> {
  children: (item: Item, index: number, itemProps: VirtualizerItemProps) => React.ReactElement;
  componentName: ComponentName | undefined;
  /** Whether the item states its position in the flat collection. */
  collectionAria: boolean;
  itemCount: number;
  model: VirtualizerItemRowModel<Item>;
  /**
   * Attributes the item element itself carries when the virtualizer renders no wrapper around
   * it, or `undefined` when a wrapper carries them.
   */
  rowProps: VirtualizerRowProps | undefined;
  /**
   * Whether the row is rendered for a host, whose item part reads the metadata through
   * `useVirtualizerItem`. Standalone rows have no such part.
   */
  hosted: boolean;
  /** Whether the host's item part is expected once in every row, which is checked. */
  rendersItemPart: boolean;
}

function VirtualizerItemRowImpl<Item>(props: VirtualizerItemRowProps<Item>) {
  const {
    children,
    collectionAria,
    componentName,
    hosted,
    itemCount,
    model,
    rendersItemPart,
    rowProps,
  } = props;
  const registeredItemCountRef = React.useRef(0);

  const registerItem = useStableCallback(() => {
    registeredItemCountRef.current += 1;
    return () => {
      registeredItemCountRef.current -= 1;
    };
  });

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      // Only a host's own item part registers itself, so other rows have nothing to count.
      if (rendersItemPart && registeredItemCountRef.current !== 1) {
        warn(
          'Each <Virtualizer> item renderer must render exactly one ' +
            `<${componentName}.Item>. Rendered ${registeredItemCountRef.current} items for the ` +
            `value at index ${model.itemIndex}.`,
        );
      }
    });
  }

  const contextValue = React.useMemo(
    () => ({
      index: model.itemIndex,
      props: {
        ...rowProps,
        // Position in the flat collection, which is the set only for a collection that is one.
        // A hierarchical or two-dimensional one states position relative to something else and
        // declines these, keeping the rest of the metadata.
        ...(collectionAria
          ? {
              'aria-posinset': model.itemIndex + 1,
              // `-1` is the ARIA convention for a collection whose size is not known, which is
              // what a list still loading pages of results has. Anything else is the size of the
              // whole collection, not of the part currently loaded.
              'aria-setsize': itemCount,
            }
          : null),
        'data-index': model.itemIndex,
      },
      registerItem: process.env.NODE_ENV === 'production' ? undefined : registerItem,
    }),
    [collectionAria, itemCount, model.itemIndex, registerItem, rowProps],
  );

  // The metadata reaches a list's `<Item>` through the list's own context, and everything else
  // through the renderer's third argument. Both describe the same row, so a row rendered inside a
  // list can mix them: a `<Combobox.Item>` keeps working next to a plain element that spreads them.
  const content = children(model.item, model.itemIndex, contextValue.props);

  if (!hosted) {
    return content;
  }

  return (
    <VirtualizerItemContext.Provider value={contextValue}>
      {content}
    </VirtualizerItemContext.Provider>
  );
}

function areVirtualizerItemRowPropsEqual<Item>(
  previous: VirtualizerItemRowProps<Item>,
  next: VirtualizerItemRowProps<Item>,
) {
  return (
    previous.children === next.children &&
    previous.collectionAria === next.collectionAria &&
    previous.componentName === next.componentName &&
    previous.itemCount === next.itemCount &&
    previous.model.item === next.model.item &&
    previous.model.itemIndex === next.model.itemIndex &&
    previous.rendersItemPart === next.rendersItemPart &&
    previous.rowProps === next.rowProps &&
    previous.hosted === next.hosted
  );
}

export const VirtualizerItemRow = React.memo(
  VirtualizerItemRowImpl,
  areVirtualizerItemRowPropsEqual,
) as typeof VirtualizerItemRowImpl;
