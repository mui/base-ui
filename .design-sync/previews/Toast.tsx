import * as React from 'react';
import { Toast } from '@base-ui/react';
import './Toast.css';

// Toast is purely imperative (`useToastManager().add()`), so there is no
// static "open" prop to set like other overlay components. To render a
// toast for a static screenshot, seed one via the manager on mount instead
// of behind a button click.
function useSeedToast(options: { title: string; description: string }) {
  const toastManager = Toast.useToastManager();
  const added = React.useRef(false);

  React.useEffect(() => {
    if (added.current) {
      return;
    }
    added.current = true;
    toastManager.add(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function SeedToast(props: { title: string; description: string }) {
  useSeedToast(props);
  return null;
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className="Toast">
      <Toast.Content className="Content">
        <div className="Text">
          <Toast.Title className="Title" />
          <Toast.Description className="Description" />
        </div>
        <Toast.Close className="Close">Dismiss</Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

export const Basic = () => (
  <div className="PreviewRoot">
    <Toast.Provider>
      <SeedToast title="Toast created" description="This is a toast notification." />
      <Toast.Portal>
        <Toast.Viewport className="Viewport">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  </div>
);
