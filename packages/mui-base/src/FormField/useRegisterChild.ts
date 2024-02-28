import * as React from 'react';
import { unstable_isMuiElement as isMuiElement } from '@mui/utils';

export function useRegisterChild(children: React.ReactNode, name: string) {
  return React.useState(() => {
    let initialHasChild = false;
    if (children) {
      React.Children.forEach(children, (child) => {
        if (!isMuiElement(child, [name])) {
          return;
        }

        if (React.isValidElement(child) && isMuiElement(child, [name])) {
          initialHasChild = true;
        }
      });
    }
    return initialHasChild;
  });
}
