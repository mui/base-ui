'use client';
import * as React from 'react';
import { Progress } from '@base-ui/react/progress';

export default function ExampleProgress() {
  const [value, setValue] = React.useState(20);

  // Simulate changes
  React.useEffect(() => {
    const interval = setInterval(() => {
      setValue((current) => Math.min(100, Math.round(current + Math.random() * 25)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Progress.Root className="grid w-48 grid-cols-2 gap-y-2" value={value}>
      <Progress.Label className="text-sm font-medium text-gray-900">Export data</Progress.Label>
      <Progress.Value className="col-start-2 text-right text-sm text-gray-900" />
      <Progress.Track className="col-span-full h-1 overflow-hidden rounded-sm bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200">
        <Progress.Indicator className="block bg-gray-500 transition-all duration-500" />
      </Progress.Track>
    </Progress.Root>
  );
}
