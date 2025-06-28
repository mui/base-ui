import * as React from 'react';
import { AspectRatio } from '@base-ui-components/react/aspect-ratio';

export default function ExampleAspectRatio() {
  return (
    <div className="w-32 overflow-hidden rounded">
      <AspectRatio ratio={5 / 8}>
        <img
          className="size-full object-cover"
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&amp;h=128&amp;dpr=2&amp;q=80"
          alt="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&amp;h=128&amp;dpr=2&amp;q=80"
        />
      </AspectRatio>
    </div>
  );
}
