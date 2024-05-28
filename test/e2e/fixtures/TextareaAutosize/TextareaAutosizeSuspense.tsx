import * as React from 'react';
import { TextareaAutosize } from '@base_ui/react/TextareaAutosize';

function LazyRoute() {
  const [isDone, setIsDone] = React.useState(false);

  if (!isDone) {
    // Force React to show fallback suspense
    throw new Promise((resolve) => {
      setTimeout(resolve, 1);
      setIsDone(true);
    });
  }

  return <div />;
}

export default function TextareaAutosizeSuspense() {
  const [showRoute, setShowRoute] = React.useState(false);

  return (
    <React.Fragment>
      <button type="button" onClick={() => setShowRoute((r) => !r)}>
        Toggle view
      </button>
      <React.Suspense fallback={null}>
        {showRoute ? <LazyRoute /> : <TextareaAutosize />}
      </React.Suspense>
    </React.Fragment>
  );
}
