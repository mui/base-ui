'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';

export default function SiblingNestedExperiment() {
  const [parentOpen, setParentOpen] = React.useState(false);
  const [aOpen, setAOpen] = React.useState(false);
  const [bOpen, setBOpen] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);

  const record = (msg: string) => setLog((prev) => [...prev, msg]);

  function reset() {
    setAOpen(false);
    setBOpen(false);
    setParentOpen(false);
    setLog([]);
  }

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        .SN-popup {
          position: fixed;
          padding: 16px;
          border-radius: 8px;
          background: canvas;
          border: 3px solid crimson;
          box-shadow: 0 4px 20px rgb(0 0 0 / 0.2);
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }
        .SN-popup[data-nested-dialog-open] { border-color: seagreen; }
        .SN-parent { top: 10%; left: 50%; transform: translateX(-50%); width: 28rem; }
        .SN-a { top: 46%; left: 16%; }
        .SN-b { top: 46%; right: 16%; }
        .SN-popup button { padding: 4px 10px; }
      `}</style>

      <h2>Sibling nested dialogs</h2>
      <p>
        <strong>Bug run:</strong> Open parent → Open A → Open B → Close B. A is still open but the
        parent border turns RED. Click the page background: the parent closes, taking A with it.
      </p>
      <p>
        <strong>Control run:</strong> Reset, then Open parent → Open A only (border stays GREEN).
        Click the background: nothing closes, because the parent correctly knows it is not topmost.
      </p>
      <p>Reset between runs — once B has been opened and closed, the count stays broken.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={() => setParentOpen(true)}>
          Open parent
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>

      <pre style={{ background: '#0001', padding: 12, minHeight: 100, borderRadius: 6 }}>
        {log.length === 0 ? 'close events will appear here' : log.join('\n')}
      </pre>

      <Dialog.Root
        open={parentOpen}
        onOpenChange={(open, details) => {
          setParentOpen(open);
          if (!open) record(`PARENT closed (reason: ${details?.reason ?? 'unknown'})`);
        }}
        modal={false}
      >
        <Dialog.Portal>
          <Dialog.Popup className="SN-popup SN-parent">
            <strong>Parent</strong>
            <div>Green = a nested dialog is open. Red = parent thinks it is topmost.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setAOpen(true)}>
                Open A
              </button>
              <button type="button" onClick={() => setBOpen(true)}>
                Open B
              </button>
              <button type="button" onClick={() => setBOpen(false)}>
                Close B
              </button>
            </div>

            {/* disablePointerDismissal: without it, clicking the parent's buttons dismisses these. */}
            <Dialog.Root
              open={aOpen}
              onOpenChange={(open, details) => {
                setAOpen(open);
                if (!open) record(`A closed (reason: ${details?.reason ?? 'unknown'})`);
              }}
              modal={false}
              disablePointerDismissal
            >
              <Dialog.Portal>
                <Dialog.Popup className="SN-popup SN-a">
                  <strong>A</strong>
                  <button type="button" onClick={() => setAOpen(false)}>
                    Close A
                  </button>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>

            <Dialog.Root open={bOpen} onOpenChange={setBOpen} modal={false} disablePointerDismissal>
              <Dialog.Portal>
                <Dialog.Popup className="SN-popup SN-b">
                  <strong>B</strong>
                  <button type="button" onClick={() => setBOpen(false)}>
                    Close B
                  </button>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
