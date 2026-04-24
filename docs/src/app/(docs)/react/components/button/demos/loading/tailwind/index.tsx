'use client';
import * as React from 'react';
import { Button } from '@base-ui/react/button';

export default function ExampleButton() {
  const [loading, setLoading] = React.useState(false);

  return (
    <Button
      className="flex items-center justify-center h-8 px-3 border border-gray-950 dark:border-white rounded-none bg-white dark:bg-gray-950 text-sm font-normal leading-5 text-gray-950 dark:text-white select-none hover:not-data-disabled:bg-gray-50 dark:hover:not-data-disabled:bg-gray-900 active:not-data-disabled:bg-gray-100 dark:active:not-data-disabled:bg-gray-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 data-disabled:text-gray-500 dark:data-disabled:text-gray-400"
      disabled={loading}
      focusableWhenDisabled
      onClick={() => {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 4000);
      }}
    >
      {loading ? 'Submitting' : 'Submit'}
    </Button>
  );
}
