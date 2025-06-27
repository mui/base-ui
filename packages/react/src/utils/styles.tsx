import * as React from 'react';

export const styleDisableScrollbar = {
  className: 'base-ui-disable-scrollbar',
  element: (
    <style href="base-ui-disable-scrollbar" precedence="base-ui:low">
      {`.base-ui-disable-scrollbar{scrollbar-width:none}.base-ui-disable-scrollbar::-webkit-scrollbar{display:none}`}
    </style>
  ),
};
