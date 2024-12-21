import * as React from 'react';
import { Avatar } from '@base-ui-components/react/avatar';

export default function ExampleAvatar() {
  return (
    <Avatar.Root className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-[#f0f0f0]">
      <Avatar.Image src="https://images.unsplash.com/photo-1511485977113-f34c92461ad9?w=128&h=128&dpr=2&q=80" className="size-full object-cover" />
      <Avatar.Fallback className="flex size-full items-center justify-center font-medium text-black">
        LT
      </Avatar.Fallback>
    </Avatar.Root>
  );
}
