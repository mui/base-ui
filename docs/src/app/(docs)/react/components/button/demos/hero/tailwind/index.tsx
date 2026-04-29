import * as React from 'react';
import { Button } from '@base-ui/react/button';

export default function ExampleButton() {
  return (
    <Button className="flex h-8 items-center justify-center rounded-none border border-gray-950 bg-white px-3 text-sm leading-5 font-normal text-gray-950 select-none hover:not-data-disabled:bg-gray-100 active:not-data-disabled:bg-gray-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 data-disabled:border-gray-500 data-disabled:text-gray-500 disabled:border-gray-500 disabled:text-gray-500 dark:border-white dark:bg-gray-950 dark:text-white dark:hover:not-data-disabled:bg-gray-800 dark:active:not-data-disabled:bg-gray-700 dark:data-disabled:border-gray-400 dark:data-disabled:text-gray-400">
      Submit
    </Button>
  );
}
