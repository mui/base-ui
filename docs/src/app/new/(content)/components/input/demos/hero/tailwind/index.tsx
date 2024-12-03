import * as React from 'react';
import { Input } from '@base-ui-components/react/input';

export default function ExampleTextInput() {
  return (
    <Input
      placeholder="Name"
      className="h-10 w-64 rounded-md border border-gray-200 py-2 pl-3.5 text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
    />
  );
}
