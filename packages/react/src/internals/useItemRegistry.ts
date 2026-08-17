'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';

type RegisterItem<Key, Item> = (key: Key, item: Item) => () => void;

/**
 * Collects item registrations into one immutable snapshot per React commit.
 */
export function useItemRegistry<Key, Item>(): readonly [
  ReadonlyMap<Key, Item>,
  RegisterItem<Key, Item>,
] {
  const itemRegistry = useRefWithInit(() => new Map<Key, Item>()).current;
  const [registryVersion, setRegistryVersion] = React.useState(0);
  const isUpdateScheduledRef = React.useRef(false);

  // Item effects can run without their parent rendering. Schedule one synchronous parent
  // update for the whole commit so every registration is included in the next snapshot.
  const scheduleRegistryUpdate = useStableCallback(() => {
    if (isUpdateScheduledRef.current) {
      return;
    }

    isUpdateScheduledRef.current = true;
    setRegistryVersion((version) => version + 1);
  });

  const registerItem = useStableCallback((key: Key, item: Item) => {
    itemRegistry.set(key, item);
    scheduleRegistryUpdate();

    return () => {
      itemRegistry.delete(key);
      scheduleRegistryUpdate();
    };
  });

  const registeredItems = React.useMemo(
    () => new Map(itemRegistry),
    // The mutable registry is stable. Its version explicitly controls when to publish a copy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registryVersion],
  );

  useIsoLayoutEffect(() => {
    isUpdateScheduledRef.current = false;
  }, [registryVersion]);

  return [registeredItems, registerItem];
}
