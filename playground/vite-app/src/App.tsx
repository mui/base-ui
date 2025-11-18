'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Link } from 'react-router';

export default function App() {
  return <RouterProblem />;
}

function Repro() {
  const [showTooltip, setShowTooltip] = React.useState(false);
  return (
    <div>
      <button onClick={() => setShowTooltip(true)}>Show</button>
      {showTooltip && (
        <Tooltip.Root>
          <Tooltip.Trigger render={<Link to="/" />}>Home</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Boo!</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}
    </div>
  );
}

function RouterProblem() {
  const [link, setLink] = React.useState<HTMLAnchorElement | null>(null);

  console.log('Link:', link);

  return (
    <Link to={'/'} ref={setLink}>
      Home
    </Link>
  );
}
