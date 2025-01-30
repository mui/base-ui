import * as React from 'react';
import { ExperimentsList } from './infra/ExperimentsList';

export default async function Experiments() {
  return (
    <div>
      <h1>Base UI Experiments</h1>
      <ExperimentsList />
    </div>
  );
}
