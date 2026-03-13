import * as React from 'react';
import { expectType } from '#test-utils';
import { AlertDialog } from '@base-ui/react/alert-dialog';

const numberPayloadHandle = AlertDialog.createHandle<number>();

const rootWithDirectChildren = (
  <AlertDialog.Root handle={numberPayloadHandle}>
    <AlertDialog.Portal />
  </AlertDialog.Root>
);

const rootWithFunctionChildren = (
  <AlertDialog.Root handle={numberPayloadHandle}>
    {({ payload }) => {
      expectType<number | undefined, typeof payload>(payload);
      return null;
    }}
  </AlertDialog.Root>
);

const triggerWithPayload = <AlertDialog.Trigger handle={numberPayloadHandle} payload={42} />;
const triggerWithoutPayload = <AlertDialog.Trigger handle={numberPayloadHandle} />;

const triggerWithInvalidPayload = (
  // @ts-expect-error
  <AlertDialog.Trigger handle={numberPayloadHandle} payload={'invalid'} />
);
