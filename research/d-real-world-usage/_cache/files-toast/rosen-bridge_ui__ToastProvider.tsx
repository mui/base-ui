import { ReactNode } from 'react';

import { Toast } from '@base-ui/react/toast';

import { Alert, AlertProps, CopyButton } from '@/components';

import './ToastProvider.css';

export type ToastProviderProps = {
  children?: ReactNode;
};

export const ToastProvider = ({ children }: ToastProviderProps) => {
  return (
    <Toast.Provider limit={1}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="RosenToast-viewport">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
};

const ToastList = () => {
  const { toasts, close } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className="RosenToast">
      <Toast.Content className="RosenToast-content">
        <Alert
          dismissible={toast.data?.dismissible}
          variant="standard"
          severity={toast.type as AlertProps['severity']}
          action={
            toast.data?.more && (
              <CopyButton
                value={() => toast.data?.more?.()}
                color="inherit"
                size="small"
                style={{ paddingTop: '5px', paddingBottom: '5px' }}
              />
            )
          }
          onClose={() => close(toast.id)}
        >
          {toast.description}
        </Alert>
      </Toast.Content>
    </Toast.Root>
  ));
};
