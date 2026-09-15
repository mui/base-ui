import * as React from 'react';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';

<DragAutoScroll.Provider />;
<DragAutoScroll.Provider disabled />;
<DragAutoScroll.Provider>content</DragAutoScroll.Provider>;

// @ts-expect-error unknown prop
<DragAutoScroll.Provider maxSpeed={300} />;

const props: DragAutoScroll.Provider.Props = {
  children: <div />,
  disabled: false,
};
<DragAutoScroll.Provider {...props} />;
