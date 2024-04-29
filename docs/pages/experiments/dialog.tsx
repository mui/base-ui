import * as Dialog from '@base_ui/react/Dialog';
import React from 'react';

export default function DialogExperiment() {
  const [state, setState] = React.useState<any>({ open: false });

  return (
    <div>
      <button onClick={() => setState({ open: true, modal: false })}>Open</button>
      <button onClick={() => setState({ open: true, modal: true })}>Open Modal</button>
      <Dialog.Root {...state} onClosed={() => {}}>
        <p>Dialog content</p>
        <button onClick={() => setState({ open: false })}>Close</button>
        <form method="dialog">
          <button type="submit">Submit</button>
        </form>
      </Dialog.Root>
    </div>
  );
}
