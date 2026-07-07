'use client';

import * as React from 'react';
import { Button } from 'components/selia/button';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerPopup,
  DrawerSwipeArea,
  DrawerTitle,
} from 'components/selia/drawer';

export default function DrawerSwipeAreaExample() {
  const [portalContainer, setPortalContainer] =
    React.useState<HTMLDivElement | null>(null);

  return (
    <div
      ref={setPortalContainer}
      className="relative min-h-[320px] w-full overflow-hidden border border-border bg-background rounded-xl"
    >
      <Drawer modal={false}>
        <DrawerSwipeArea className="absolute inset-y-0 right-0 w-16 border-l-2 border-dashed border-primary bg-primary/10 flex items-center justify-center">
          <span className="pointer-events-none -rotate-90 origin-center whitespace-nowrap text-xs font-semibold tracking-[0.12em] text-primary uppercase">
            Swipe here
          </span>
        </DrawerSwipeArea>
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-muted pr-12">
            Swipe from the right edge to open the drawer.
          </p>
        </div>
        <DrawerPopup portalContainer={portalContainer} className="max-w-xs">
          <DrawerHeader>
            <DrawerTitle>Library</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <DrawerDescription>
              Swipe from the edge whenever you want to jump back into your
              playlists.
            </DrawerDescription>
            <div className="flex justify-end pt-3">
              <DrawerClose render={<Button variant="secondary">Close</Button>} />
            </div>
          </DrawerBody>
        </DrawerPopup>
      </Drawer>
    </div>
  );
}
