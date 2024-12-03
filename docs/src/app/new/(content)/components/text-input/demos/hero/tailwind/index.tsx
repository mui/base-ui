import * as React from 'react';
import { TextInput } from '@base-ui-components/react/text-input';

export default function ExampleTextInput() {
  return (
    <TextInput
      placeholder="Name"
      className="h-10 w-64 rounded-md border border-gray-200 pl-3.5 text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
    />
  );
}
