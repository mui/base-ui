'use client';
import * as React from 'react';
import { Button } from '@base-ui/react/button';

export default function ExampleButton() {
  const [loading, setLoading] = React.useState(false);

  return (
    <Button
      className="flex items-center justify-center h-8 px-3.5 border-none rounded-none bg-gray-200 dark:bg-gray-800 font-inherit text-sm font-normal leading-6 text-gray-900 dark:text-gray-50 select-none hover:not-data-disabled:bg-gray-300 dark:hover:not-data-disabled:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 data-disabled:text-gray-500 dark:data-disabled:text-gray-400"
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
