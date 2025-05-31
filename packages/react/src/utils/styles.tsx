import * as React from 'react';

export const STYLE_DISABLE_SCROLLBAR = {
  className: 'base-ui-disable-scrollbar',
  element: (
    <style href="base-ui-disable-scrollbar" precedence="low">
      {`.base-ui-disable-scrollbar{scrollbar-width:none}.base-ui-disable-scrollbar::-webkit-scrollbar{display:none}`}
    </style>
  ),
};
