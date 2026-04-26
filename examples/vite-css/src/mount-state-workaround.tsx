import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import StateWorkaround from './state-workaround';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StateWorkaround />
  </React.StrictMode>,
);
