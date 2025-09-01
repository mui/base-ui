import * as React from 'react';

const DISABLE_SCROLLBAR_CLASS_NAME = 'base-ui-disable-scrollbar';

export const styleDisableScrollbar = {
  className: DISABLE_SCROLLBAR_CLASS_NAME,
  element: (
    <style href={DISABLE_SCROLLBAR_CLASS_NAME} precedence="base-ui:low">
      {`.${DISABLE_SCROLLBAR_CLASS_NAME}{scrollbar-width:none}.${DISABLE_SCROLLBAR_CLASS_NAME}::-webkit-scrollbar{display:none}`}
    </style>
  ),
};
