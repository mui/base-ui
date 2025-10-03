import * as React from 'react';
import { Textarea } from '@base-ui-components/react/textarea';

export default function ExampleTextarea() {
  return (
    <Textarea
      placeholder="Type something…"
      className="w-full max-w-64 min-h-16 rounded-md border border-gray-200 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 px-3 py-2 field-sizing-content resize-y"
    />
  );
}
