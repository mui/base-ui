import * as React from 'react';
import styles from '../select.module.css';
import rw from '../select-real-world.module.css';
import { DemoSelect } from '../DemoSelect';

/**
 * Recreation of a data-QA filter bar: several controlled selects with `items` and
 * `""` "All" sentinel values driving shared filter state. Recomposed from
 * climatepolicyradar/knowledge-graph `PredictionFilters.tsx` (Apache-2.0, code-ok,
 * research/d-real-world-usage/select/ranked.json #9).
 */

const predictions = [
  { id: 1, concept: 'Flood risk', model: 'alpha', status: 'correct' },
  { id: 2, concept: 'Heatwave', model: 'beta', status: 'incorrect' },
  { id: 3, concept: 'Drought', model: 'alpha', status: 'correct' },
  { id: 4, concept: 'Wildfire', model: 'gamma', status: 'uncertain' },
  { id: 5, concept: 'Sea level rise', model: 'beta', status: 'correct' },
  { id: 6, concept: 'Air quality', model: 'alpha', status: 'incorrect' },
];

const modelFilterItems = [
  { value: '', label: 'All models' },
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
  { value: 'gamma', label: 'Gamma' },
];

const statusFilterItems = [
  { value: '', label: 'All statuses' },
  { value: 'correct', label: 'Correct' },
  { value: 'incorrect', label: 'Incorrect' },
  { value: 'uncertain', label: 'Uncertain' },
];

export function DashboardFilterExample() {
  const [model, setModel] = React.useState('');
  const [status, setStatus] = React.useState('');
  const rows = predictions.filter(
    (prediction) =>
      (model === '' || prediction.model === model) &&
      (status === '' || prediction.status === status),
  );
  return (
    <div className={styles.Stack}>
      <div className={styles.Row}>
        <DemoSelect
          label="Model"
          options={modelFilterItems}
          root={{ value: model, onValueChange: (value) => setModel(value ?? '') }}
          positioner={{ alignItemWithTrigger: false }}
        />
        <DemoSelect
          label="Status"
          options={statusFilterItems}
          root={{ value: status, onValueChange: (value) => setStatus(value ?? '') }}
          positioner={{ alignItemWithTrigger: false }}
        />
        <button
          type="button"
          className={styles.Button}
          onClick={() => {
            setModel('');
            setStatus('');
          }}
        >
          Reset
        </button>
      </div>
      <table className={rw.FilterTable}>
        <thead>
          <tr>
            <th>Concept</th>
            <th>Model</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((prediction) => (
            <tr key={prediction.id}>
              <td>{prediction.concept}</td>
              <td>{prediction.model}</td>
              <td>{prediction.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <output className={styles.Output}>
        {rows.length} of {predictions.length} predictions
      </output>
    </div>
  );
}
