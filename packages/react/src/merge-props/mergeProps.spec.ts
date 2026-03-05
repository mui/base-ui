import * as React from 'react';
import { expectType } from '#test-utils';
import { mergeProps, type RequiredHandlers } from '@base-ui/react/merge-props';
import type { BaseUIEvent } from '../utils/types';

// =============================================================================
// Test 1: Default (PE = string) — all event handlers get preventBaseUIHandler
// This is the backward-compatible behavior.
// =============================================================================
{
  const result = mergeProps<'button'>(
    { onClick: () => {} },
    { onKeyDown: () => {} },
  );

  // All event handlers should accept BaseUIEvent
  result.onClick = (event: BaseUIEvent<React.MouseEvent<HTMLButtonElement>>) => {
    event.preventBaseUIHandler();
  };

  result.onKeyDown = (event: BaseUIEvent<React.KeyboardEvent<HTMLButtonElement>>) => {
    event.preventBaseUIHandler();
  };
}

// =============================================================================
// Test 2: Specific PE — only listed handlers get preventBaseUIHandler
// =============================================================================
{
  const result = mergeProps<'button', 'onClick'>(
    { onClick: () => {} },
    {},
  );

  // onClick IS preventable — its event parameter has preventBaseUIHandler
  result.onClick = (event) => {
    event.preventBaseUIHandler();
  };

  // onKeyDown is NOT preventable — it receives a plain React event
  result.onKeyDown = (event) => {
    expectType<React.KeyboardEvent<HTMLButtonElement>, typeof event>(event);
  };
}

// =============================================================================
// Test 3: PE = never — no event handlers get preventBaseUIHandler
// =============================================================================
{
  const result = mergeProps<'button', never>(
    { onClick: () => {} },
    {},
  );

  // onClick receives a plain React.MouseEvent, no BaseUIEvent wrapping
  result.onClick = (event) => {
    expectType<React.MouseEvent<HTMLButtonElement>, typeof event>(event);
  };
}

// =============================================================================
// Test 4: Negative test — preventBaseUIHandler is a TS error on non-PE handler
// =============================================================================
{
  const result = mergeProps<'button', 'onClick'>({}, {});

  result.onKeyDown = (event) => {
    // @ts-expect-error preventBaseUIHandler does not exist on non-preventable events
    event.preventBaseUIHandler();
  };
}

// =============================================================================
// Test 5: Negative test — preventBaseUIHandler is a TS error when PE = never
// =============================================================================
{
  const result = mergeProps<'button', never>({}, {});

  result.onClick = (event) => {
    // @ts-expect-error preventBaseUIHandler does not exist when PE = never
    event.preventBaseUIHandler();
  };
}

// =============================================================================
// Test 6: Non-event props are unchanged regardless of PE
// =============================================================================
{
  const result = mergeProps<'button', 'onClick'>({}, {});

  expectType<string | undefined, typeof result.className>(result.className);
  expectType<string | undefined, typeof result.id>(result.id);
}

// =============================================================================
// Test 7: Multiple PE events
// =============================================================================
{
  const result = mergeProps<'button', 'onClick' | 'onKeyDown' | 'onFocus'>({}, {});

  // All listed events should have preventBaseUIHandler
  result.onClick = (event) => {
    event.preventBaseUIHandler();
  };
  result.onKeyDown = (event) => {
    event.preventBaseUIHandler();
  };
  result.onFocus = (event) => {
    event.preventBaseUIHandler();
  };

  // Unlisted event should NOT have preventBaseUIHandler
  result.onBlur = (event) => {
    // @ts-expect-error preventBaseUIHandler does not exist on non-preventable events
    event.preventBaseUIHandler();
  };
}

// =============================================================================
// Test 8: Props getter receives correctly-narrowed types
// =============================================================================
{
  mergeProps<'button', 'onClick'>(
    (props) => {
      // The onClick handler in the props getter should have preventBaseUIHandler
      props.onClick = (event) => {
        event.preventBaseUIHandler();
      };

      // Non-PE handlers should NOT have preventBaseUIHandler
      props.onKeyDown = (event) => {
        // @ts-expect-error preventBaseUIHandler does not exist on non-preventable events
        event.preventBaseUIHandler();
      };

      return props;
    },
    { onClick: () => {} },
  );
}

// =============================================================================
// Test 9: satisfies RequiredHandlers — catches missing handlers
// =============================================================================
{
  mergeProps<'button', 'onClick' | 'onKeyDown'>(
    {
      onClick() {},
      onKeyDown() {},
    } satisfies RequiredHandlers<'onClick' | 'onKeyDown'>,
    {},
  );
}

// =============================================================================
// Test 10: satisfies RequiredHandlers — errors on missing handler
// =============================================================================
{
  mergeProps<'button', 'onClick' | 'onKeyDown'>(
    {
      onClick() {},
      // @ts-expect-error onKeyDown is missing from RequiredHandlers
    } satisfies RequiredHandlers<'onClick' | 'onKeyDown'>,
    {},
  );
}

// =============================================================================
// Test 11: satisfies RequiredHandlers — allows extra non-handler props
// =============================================================================
{
  mergeProps<'button', 'onClick'>(
    {
      id: 'test',
      role: 'button' as const,
      onClick() {},
    } satisfies RequiredHandlers<'onClick'>,
    {},
  );
}
