'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { Toolbar } from '@base-ui/react/toolbar';
import { Tooltip } from '@base-ui/react/tooltip';
import { Tree } from '@base-ui/react/tree';
import { closest } from '@base-ui/utils/shadowDom';
import { useInterval } from '@base-ui/utils/useInterval';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useExperimentSettings } from '../_components/SettingsPanel';
import type { SettingsMetadata } from '../_components/SettingsPanel';

import styles from './tree-test-runner.module.css';
import { createSuite, getAncestorIds, getTestIds } from './tree-test-runner/suite';
import type { Suite, TestItem, TestResult, TestStatus } from './tree-test-runner/suite';
import { TestRunner } from './tree-test-runner/runner';
import type { RunSummary, StatusCounts } from './tree-test-runner/runner';
import { PerformancePanel, PerformanceRecorder } from './tree-test-runner/performance';
import {
  createShortcutHandler,
  getAriaKeyShortcuts,
  ShortcutKeys,
  SHORTCUTS,
} from './tree-test-runner/shortcuts';
import type { ShortcutName } from './tree-test-runner/shortcuts';
import {
  ChevronIcon,
  CollapseAllIcon,
  ExpandAllIcon,
  KeyboardIcon,
  PlayIcon,
  RerunIcon,
  StatusIcon,
  StopIcon,
} from './tree-test-runner/icons';

interface Settings {
  tests: number;
  workers: number;
  duration: number;
  failureRate: number;
  results: string;
  transactionThrottle: number;
}

const RESULTS_IN_MODELS = 'in the item models';
const RESULTS_IN_TRANSACTIONS = 'in the item models, via applyTransaction()';
const RESULTS_IN_STORE = 'in a store each row subscribes to';

export const settingsMetadata: SettingsMetadata<Settings> = {
  tests: { type: 'number', label: 'Tests', default: 2000 },
  workers: { type: 'number', label: 'Workers', default: 8 },
  duration: { type: 'number', label: 'Average test duration (ms)', default: 100 },
  failureRate: { type: 'number', label: 'Failing tests (%)', default: 5 },
  results: {
    type: 'string',
    label: 'Test results live',
    options: [RESULTS_IN_MODELS, RESULTS_IN_TRANSACTIONS, RESULTS_IN_STORE],
    default: RESULTS_IN_MODELS,
  },
  transactionThrottle: { type: 'number', label: 'Transaction throttle (ms)', default: 0 },
};

const PROGRESS_ANNOUNCEMENT_INTERVAL = 5000;

const STATUS_LABELS: Record<TestStatus, string> = {
  idle: 'Not run',
  queued: 'Queued',
  running: 'Running',
  passed: 'Passed',
  failed: 'Failed',
  skipped: 'Skipped',
};

/**
 * A test explorer modeled on Playwright's UI mode, whose results stream in from
 * a fake runner: a baseline for how the tree copes with frequent updates.
 */
export default function TreeTestRunner() {
  const { settings } = useExperimentSettings<Settings>();
  const testCount = toInteger(settings.tests, 1, 100_000, 2000);

  // A new suite or result storage starts over.
  return (
    <TestRunnerSession
      key={`${testCount}:${settings.results}`}
      testCount={testCount}
      settings={settings}
    />
  );
}

function TestRunnerSession(props: { testCount: number; settings: Settings }) {
  const { testCount, settings } = props;
  const [suite] = React.useState(() => createSuite(testCount));
  const [runner] = React.useState(
    () => new TestRunner(suite, settings.results === RESULTS_IN_MODELS),
  );
  const [recorder] = React.useState(() => new PerformanceRecorder(runner));
  const [selectedItemId, setSelectedItemId] = React.useState<Tree.ItemId | null>(null);
  const selectedNode = selectedItemId == null ? undefined : suite.nodes.get(String(selectedItemId));
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const actionsRef = React.useRef<Tree.Root.Actions<TestItem>>(null);
  const filterRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => recorder.start(), [recorder]);
  React.useEffect(() => runner.dispose, [runner]);

  const run = (testIds: readonly string[]) =>
    runner.run(testIds, {
      workers: toInteger(settings.workers, 1, 256, 8),
      averageDuration: toInteger(settings.duration, 0, 60_000, 100),
      failureRate: toInteger(settings.failureRate, 0, 100, 5) / 100,
    });
  const runItem = useStableCallback((itemId: string) => run(getTestIds(suite, itemId)));
  const isFailedTest = (nodeId: string) =>
    suite.nodes.get(nodeId)!.kind === 'test' && runner.getResult(nodeId).status === 'failed';

  const focusFailure = (direction: 1 | -1) => {
    const tree = actionsRef.current!;
    const nodeIds = Array.from(suite.nodes.keys());
    const current = nodeIds.indexOf(String(tree.getFocusedItemId() ?? selectedItemId));
    const start = current === -1 && direction === -1 ? nodeIds.length : current;
    for (let step = 1; step <= nodeIds.length; step += 1) {
      const nodeId = nodeIds[(start + direction * step + nodeIds.length) % nodeIds.length];
      if (!isFailedTest(nodeId)) {
        continue;
      }
      getAncestorIds(suite, nodeId).forEach((id) => tree.setItemExpansion(id, true));
      tree.focusItem(nodeId);
      // A test the filter hides can't take focus.
      if (tree.getFocusedItemId() === nodeId) {
        tree.setItemSelection(nodeId, true);
        return;
      }
    }
  };

  const actions = {
    runAll: () => run(suite.testIds),
    runFailed: () => run(suite.testIds.filter(isFailedTest)),
    stop: () => runner.stop(),
    expandAll: () => void actionsRef.current?.expandAll(),
    collapseAll: () => actionsRef.current?.collapseAll(),
  };

  const handleKeyDown = createShortcutHandler({
    ...actions,
    runFocused: (focused) => {
      const itemId = closest(focused, '[data-item-id]')?.getAttribute('data-item-id');
      return itemId == null ? false : runItem(itemId);
    },
    nextFailure: () => focusFailure(1),
    previousFailure: () => focusFailure(-1),
    filter: () => filterRef.current?.select(),
    help: () => setShortcutsOpen((open) => !open),
  });

  return (
    <div className={styles.Experiment}>
      <div className={styles.Explorer} onKeyDownCapture={handleKeyDown}>
        <section className={styles.Sidebar} aria-labelledby="tests-title">
          <div className={styles.Header}>
            <h2 id="tests-title">Tests</h2>
            <RunnerToolbar
              runner={runner}
              actions={actions}
              shortcutsOpen={shortcutsOpen}
              onShortcutsOpenChange={setShortcutsOpen}
            />
          </div>
          <React.Profiler id="tree" onRender={recorder.recordRender}>
            <TestTree
              runner={runner}
              suite={suite}
              settings={settings}
              actionsRef={actionsRef}
              filterRef={filterRef}
              onSelectedItemChange={setSelectedItemId}
              onRun={runItem}
            />
          </React.Profiler>
          <RunSummary runner={runner} />
        </section>
        <section className={styles.Details} aria-label="Details">
          {selectedNode == null ? (
            <p className={styles.Muted}>Select a test to see its result.</p>
          ) : (
            <NodeDetails key={selectedNode.id} runner={runner} suite={suite} node={selectedNode} />
          )}
        </section>
      </div>
      <PerformancePanel recorder={recorder} />
      <details className={styles.Hints}>
        <summary>Things to try</summary>
        <ul>
          <li>Run all the tests with each place the results can live, and compare the runs.</li>
          <li>Raise the load to 10,000 tests, 32 workers and 10 ms, then throttle transactions.</li>
          <li>Type in the filter while the tests run.</li>
        </ul>
        <p>
          The workers, duration and failure rate apply to the next run. The update handling misses
          the commits a transaction throttle defers. Long tasks are only reported by Chromium, and
          the tree render time needs a development build.
        </p>
      </details>
    </div>
  );
}

const TestTree = React.memo(function TestTree(props: {
  runner: TestRunner;
  suite: Suite;
  settings: Settings;
  actionsRef: React.RefObject<Tree.Root.Actions<TestItem> | null>;
  filterRef: React.RefObject<HTMLInputElement | null>;
  onSelectedItemChange: (itemId: Tree.ItemId | null) => void;
  onRun: (itemId: string) => void;
}) {
  const { runner, suite, settings, actionsRef, filterRef, onSelectedItemChange, onRun } = props;
  const mode = settings.results;

  const renderItem = React.useCallback(
    (item: TestItem) => (
      <TestRow
        item={item}
        runner={runner}
        resultsInStore={mode === RESULTS_IN_STORE}
        onRun={onRun}
      />
    ),
    [mode, runner, onRun],
  );

  React.useEffect(() => {
    if (mode !== RESULTS_IN_TRANSACTIONS) {
      return undefined;
    }
    return runner.subscribe((changed) => {
      void actionsRef.current?.applyTransaction((transaction) => {
        for (const itemId of changed) {
          transaction.update(itemId, { result: runner.getResult(itemId) });
        }
      });
    });
  }, [mode, runner, actionsRef]);

  // Memoized so that a new `items` value re-renders the root alone.
  const items = React.useSyncExternalStore(runner.subscribe, runner.getItems, runner.getItems);
  const children = React.useMemo(
    () => (
      <React.Fragment>
        <Tree.Input
          ref={filterRef}
          className={styles.Filter}
          aria-label="Filter tests"
          aria-keyshortcuts={getAriaKeyShortcuts('filter')}
          placeholder="Filter tests"
        />
        <Tree.List aria-label="Tests" className={styles.Tree}>
          {renderItem}
        </Tree.List>
        <Tree.Empty className={styles.Empty}>No tests match the filter.</Tree.Empty>
        <Tree.Status className={styles.VisuallyHidden} />
        <RunStatus runner={runner} />
      </React.Fragment>
    ),
    [filterRef, renderItem, runner],
  );

  return (
    <Tree.FilterProvider>
      <Tree.Root
        items={mode === RESULTS_IN_MODELS ? items : undefined}
        defaultItems={suite.items}
        transactionThrottle={toInteger(settings.transactionThrottle, 0, 60_000, 0)}
        actionsRef={actionsRef}
        defaultExpandedItems={suite.groupIds}
        onSelectedItemsChange={onSelectedItemChange}
      >
        {children}
      </Tree.Root>
    </Tree.FilterProvider>
  );
});

function TestRow(props: {
  item: TestItem;
  runner: TestRunner;
  resultsInStore: boolean;
  onRun: (itemId: string) => void;
}) {
  const { item, runner, resultsInStore, onRun } = props;
  const descriptionId = React.useId();
  return (
    <Tree.Item itemId={item.id} className={styles.Item} aria-describedby={descriptionId}>
      <Tree.ItemContent className={styles.ItemContent}>
        <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
          <ChevronIcon className={styles.ChevronIcon} />
        </Tree.ItemExpansionTrigger>
        {resultsInStore ? (
          <SubscribedItemResult
            runner={runner}
            itemId={item.id}
            label={item.label}
            descriptionId={descriptionId}
          />
        ) : (
          <ItemResult result={item.result} label={item.label} descriptionId={descriptionId} />
        )}
        <Tree.ItemButton
          className={styles.RowButton}
          aria-label={`Run ${item.label}`}
          aria-keyshortcuts={getAriaKeyShortcuts('runFocused')}
          onClick={() => onRun(item.id)}
        >
          <PlayIcon />
        </Tree.ItemButton>
      </Tree.ItemContent>
    </Tree.Item>
  );
}

function ItemResult(props: { result: TestResult; label: string; descriptionId: string }) {
  const { result, descriptionId } = props;
  const label = STATUS_LABELS[result.status];
  const duration = result.duration == null ? null : formatDuration(result.duration);
  return (
    <React.Fragment>
      <StatusIcon status={result.status} className={styles.StatusIcon} />
      <span className={styles.Label}>{props.label}</span>
      {duration != null && <span className={styles.Duration}>{duration}</span>}
      <span id={descriptionId} hidden>
        {duration == null ? label : `${label} in ${duration}`}
      </span>
    </React.Fragment>
  );
}

function SubscribedItemResult(props: {
  runner: TestRunner;
  itemId: string;
  label: string;
  descriptionId: string;
}) {
  const { runner, itemId, label, descriptionId } = props;
  return (
    <ItemResult
      result={useItemResult(runner, itemId)}
      label={label}
      descriptionId={descriptionId}
    />
  );
}

function RunnerToolbar(props: {
  runner: TestRunner;
  actions: Record<'runAll' | 'runFailed' | 'stop' | 'expandAll' | 'collapseAll', () => void>;
  shortcutsOpen: boolean;
  onShortcutsOpenChange: (open: boolean) => void;
}) {
  const { runner, actions, shortcutsOpen, onShortcutsOpenChange } = props;
  const running = useSummary(runner, (summary) => summary.runStatus === 'running');
  const hasFailures = useSummary(runner, (summary) => summary.counts.failed > 0);

  return (
    <Tooltip.Provider>
      <Toolbar.Root className={styles.Toolbar}>
        <ToolbarButton shortcut="runAll" onClick={actions.runAll}>
          <PlayIcon />
        </ToolbarButton>
        <ToolbarButton shortcut="runFailed" disabled={!hasFailures} onClick={actions.runFailed}>
          <RerunIcon />
        </ToolbarButton>
        <ToolbarButton shortcut="stop" disabled={!running} onClick={actions.stop}>
          <StopIcon />
        </ToolbarButton>
        <Toolbar.Separator className={styles.Separator} />
        <ToolbarButton shortcut="expandAll" onClick={actions.expandAll}>
          <ExpandAllIcon />
        </ToolbarButton>
        <ToolbarButton shortcut="collapseAll" onClick={actions.collapseAll}>
          <CollapseAllIcon />
        </ToolbarButton>
        <Toolbar.Separator className={styles.Separator} />
        <Popover.Root open={shortcutsOpen} onOpenChange={onShortcutsOpenChange}>
          <ToolbarButton shortcut="help" render={<Popover.Trigger />}>
            <KeyboardIcon />
          </ToolbarButton>
          <Popover.Portal>
            <Popover.Positioner sideOffset={6} align="end">
              <Popover.Popup className={styles.Popup}>
                <Popover.Title>Keyboard shortcuts</Popover.Title>
                <dl className={styles.Fields}>
                  {(Object.keys(SHORTCUTS) as ShortcutName[]).map((name) => (
                    <React.Fragment key={name}>
                      <dt>{SHORTCUTS[name].label}</dt>
                      <dd>
                        <ShortcutKeys name={name} />
                      </dd>
                    </React.Fragment>
                  ))}
                </dl>
                <Popover.Description>
                  In the tree, arrow keys move between tests, Enter expands a folder or selects a
                  test, and typing filters the tests.
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </Toolbar.Root>
    </Tooltip.Provider>
  );
}

function ToolbarButton(props: {
  shortcut: ShortcutName;
  disabled?: boolean | undefined;
  onClick?: (() => void) | undefined;
  render?: React.ReactElement | undefined;
  children: React.ReactNode;
}) {
  const { shortcut, disabled, onClick, render, children } = props;
  const { label } = SHORTCUTS[shortcut];
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={<Toolbar.Button disabled={disabled} render={render} />}
        className={styles.IconButton}
        aria-label={label}
        aria-keyshortcuts={getAriaKeyShortcuts(shortcut)}
        onClick={onClick}
      >
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6}>
          <Tooltip.Popup className={styles.Tooltip}>
            {label}
            <ShortcutKeys name={shortcut} />
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function RunSummary(props: { runner: TestRunner }) {
  const counts = useSummary(props.runner, (summary) => summary.counts);
  const remaining = counts.queued + counts.running;
  const parts: [TestStatus, number, string][] = [
    ['passed', counts.passed, `${counts.passed}/${sumCounts(counts)} passed`],
    ['failed', counts.failed, `${counts.failed} failed`],
    ['skipped', counts.skipped, `${counts.skipped} skipped`],
    ['queued', remaining, `${remaining} to go`],
  ];
  return (
    <div className={styles.Summary}>
      {parts.map(([status, count, text]) => (
        <span key={status} className={styles.Count} data-empty={count === 0 || undefined}>
          <StatusIcon status={status} className={styles.StatusIcon} />
          {text}
        </span>
      ))}
    </div>
  );
}

// A second `Tree.Status`, so the tree's own messages keep theirs.
function RunStatus(props: { runner: TestRunner }) {
  const { runner } = props;
  const [message, setMessage] = React.useState('');
  const interval = useInterval();
  const runId = useSummary(runner, (summary) => summary.runId);
  const runStatus = useSummary(runner, (summary) => summary.runStatus);

  React.useEffect(() => {
    if (runStatus != null) {
      setMessage(describeRun(runner.getSummary()));
    }
    if (runStatus !== 'running') {
      return undefined;
    }
    interval.start(PROGRESS_ANNOUNCEMENT_INTERVAL, () =>
      setMessage(describeRun(runner.getSummary(), true)),
    );
    return interval.clear;
  }, [runId, runStatus, runner, interval]);

  return <Tree.Status className={styles.VisuallyHidden}>{message}</Tree.Status>;
}

function NodeDetails(props: { runner: TestRunner; suite: Suite; node: TestItem }) {
  const { runner, suite, node } = props;
  const result = useItemResult(runner, node.id);
  // A group's counts change with each of its tests, not only when its status does.
  const getCounts = () => {
    const counts = runner.getCounts(node.id);
    return counts == null ? null : formatCounts(counts);
  };
  const counts = React.useSyncExternalStore(runner.subscribeToSummary, getCounts, getCounts);

  const ancestors = getAncestorIds(suite, node.id).map((id) => suite.nodes.get(id)!.label);

  return (
    <React.Fragment>
      {ancestors.length > 0 && (
        <p className={styles.Breadcrumbs}>{ancestors.reverse().join(' › ')}</p>
      )}
      <h2 className={styles.DetailsTitle}>
        <StatusIcon status={result.status} className={styles.StatusIcon} />
        {node.label}
      </h2>
      <dl className={styles.Fields}>
        <dt>Status</dt>
        <dd>{STATUS_LABELS[result.status]}</dd>
        {result.duration != null && (
          <React.Fragment>
            <dt>Duration</dt>
            <dd>{formatDuration(result.duration)}</dd>
          </React.Fragment>
        )}
        {counts != null && (
          <React.Fragment>
            <dt>Tests</dt>
            <dd>{counts}</dd>
          </React.Fragment>
        )}
        <dt>Location</dt>
        <dd>
          <code>{node.location}</code>
        </dd>
      </dl>
      {result.error != null && <pre className={styles.Error}>{result.error}</pre>}
    </React.Fragment>
  );
}

function useSummary<T>(runner: TestRunner, select: (summary: RunSummary) => T) {
  const getSnapshot = () => select(runner.getSummary());
  return React.useSyncExternalStore(runner.subscribeToSummary, getSnapshot, getSnapshot);
}

function useItemResult(runner: TestRunner, itemId: string) {
  const subscribe = React.useCallback(
    (listener: () => void) => runner.subscribeToItem(itemId, listener),
    [runner, itemId],
  );
  const getResult = () => runner.getResult(itemId);
  return React.useSyncExternalStore(subscribe, getResult, getResult);
}

function toInteger(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value) ? Math.min(Math.max(Math.round(value), min), max) : fallback;
}

function formatDuration(duration: number) {
  return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`;
}

function describeRun(summary: RunSummary, progress = false) {
  const { runStatus, runTestCount, runCounts } = summary;
  const { passed, failed, skipped } = runCounts;
  const tests = runTestCount === 1 ? '1 test' : `${runTestCount} tests`;
  if (runStatus === 'stopped') {
    return `Run stopped after ${passed + failed + skipped} of ${tests}.`;
  }
  if (runStatus === 'finished') {
    const seconds = (summary.runDuration / 1000).toFixed(1);
    return `Run finished in ${seconds} seconds: ${passed} passed, ${failed} failed, ${skipped} skipped.`;
  }
  return progress
    ? `${passed + failed + skipped} of ${tests} run, ${failed} failed.`
    : `Running ${tests}.`;
}

function sumCounts(counts: Readonly<StatusCounts>) {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

function formatCounts(counts: Readonly<StatusCounts>) {
  const parts = [`${counts.passed} of ${sumCounts(counts)} passed`];
  if (counts.failed > 0) {
    parts.push(`${counts.failed} failed`);
  }
  if (counts.skipped > 0) {
    parts.push(`${counts.skipped} skipped`);
  }
  return parts.join(', ');
}
