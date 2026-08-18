import * as React from 'react';
import { FilterMenu } from '@base-ui/react/filter-menu';

const handle = FilterMenu.createHandle<{ id: number }>();

export function TypedFilterMenuTrigger() {
  return (
    <React.Fragment>
      <FilterMenu.Trigger handle={handle} payload={{ id: 1 }}>
        Open
      </FilterMenu.Trigger>
      {/* @ts-expect-error the payload must match the handle */}
      <FilterMenu.Trigger handle={handle} payload="wrong">
        Invalid
      </FilterMenu.Trigger>
    </React.Fragment>
  );
}
