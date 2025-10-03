import * as React from 'react';
import { Textarea } from '@base-ui-components/react/textarea';

export default function ExampleTextarea() {
  return (
    <Textarea
      placeholder="Type something…"
      minRows={4}
      maxRows={8}
      className="field-sizing-content min-h-16 w-full max-w-64 resize-y rounded-md border border-gray-200 px-3 py-2 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
    />
  );
}
