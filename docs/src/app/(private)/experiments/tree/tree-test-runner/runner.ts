import * as ReactDOM from 'react-dom';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { Timeout } from '@base-ui/utils/useTimeout';
import { getAncestorIds, RESULTS } from './suite';
import type { Suite, TestItem, TestResult, TestStatus } from './suite';

export interface RunnerConfig {
  workers: number;
  /** Average test duration, in ms. */
  averageDuration: number;
  /** Share of the tests that fail, from 0 to 1. */
  failureRate: number;
}

export type StatusCounts = Record<TestStatus, number>;

export interface RunSummary {
  counts: StatusCounts;
  runId: number;
  runStatus: 'running' | 'finished' | 'stopped' | null;
  runTestCount: number;
  runCounts: Record<'passed' | 'failed' | 'skipped', number>;
  runDuration: number;
}

export interface RunnerStats {
  /** Result changes. */
  results: number;
  /** Batches of result changes, each notified to the subscribers at once. */
  updates: number;
  /** Time spent applying the batches and rendering them, in ms. */
  handlingTime: number;
}

interface Worker {
  timeout: Timeout;
  /** The tests of the file the worker is running. */
  job: readonly string[] | null;
  position: number;
}

/**
 * Runs a fake suite the way Playwright does: each worker runs the tests of one
 * file at a time, and each finished test is reported in its own task, like a
 * message from the test server.
 */
export class TestRunner {
  public stats: RunnerStats = createStats();

  /** The stats of the latest run. */
  public runStats: RunnerStats = createStats();

  /** Increments when a run starts. */
  public runId = 0;

  public runStartedAt = 0;

  public runEndedAt: number | null = null;

  private runStatus: RunSummary['runStatus'] = null;

  private runTestCount = 0;

  private runCounts: RunSummary['runCounts'] = { passed: 0, failed: 0, skipped: 0 };

  private config: RunnerConfig = { workers: 1, averageDuration: 0, failureRate: 0 };

  private readonly results = new Map<string, TestResult>();

  /** The status counts of each group's tests. The `null` key counts the whole suite. */
  private readonly counts = new Map<string | null, StatusCounts>();

  declare private items: TestItem[];

  declare private summary: RunSummary;

  private queue: string[][] = [];

  private workers: Worker[] = [];

  private activeWorkers = 0;

  private readonly listeners = new Set<(changed: ReadonlySet<string>) => void>();

  private readonly itemListeners = new Map<string, Set<() => void>>();

  private readonly summaryListeners = new Set<() => void>();

  private readonly summaryFrame = AnimationFrame.create();

  /**
   * @param storeResultsInModels Whether to copy each result into the item
   * models, rebuilding the models on the path to the root.
   */
  constructor(
    private readonly suite: Suite,
    private readonly storeResultsInModels: boolean,
  ) {
    this.items = suite.items;
    this.counts.set(null, createCounts(suite.testIds.length));
    for (const groupId of suite.groupIds) {
      this.counts.set(groupId, createCounts(0));
    }
    for (const testId of suite.testIds) {
      for (const groupId of getAncestorIds(suite, testId)) {
        this.counts.get(groupId)!.idle += 1;
      }
    }
    this.summary = this.createSummary();
  }

  public subscribe = (listener: (changed: ReadonlySet<string>) => void) =>
    listen(this.listeners, listener);

  public subscribeToItem = (itemId: string, listener: () => void) => {
    if (!this.itemListeners.has(itemId)) {
      this.itemListeners.set(itemId, new Set());
    }
    return listen(this.itemListeners.get(itemId)!, listener);
  };

  /** The summary changes at most once per frame. */
  public subscribeToSummary = (listener: () => void) => listen(this.summaryListeners, listener);

  public getItems = () => this.items;

  public getSummary = () => this.summary;

  public getResult = (itemId: string) => this.results.get(itemId) ?? RESULTS.idle;

  public getCounts = (groupId: string): Readonly<StatusCounts> | undefined =>
    this.counts.get(groupId);

  public run(testIds: readonly string[], config: RunnerConfig) {
    if (testIds.length === 0) {
      return;
    }
    const changed = new Set<string>();
    this.stopWorkers(changed);
    this.config = config;
    this.runId += 1;
    this.runStats = createStats();
    this.runStartedAt = performance.now();
    this.runEndedAt = null;
    this.runStatus = 'running';
    this.runTestCount = testIds.length;
    this.runCounts = { passed: 0, failed: 0, skipped: 0 };

    for (const testId of testIds) {
      this.setResult(testId, RESULTS.queued, changed);
    }
    this.queue = [];
    let previousFileId: string | undefined;
    for (const testId of testIds) {
      const fileId = this.suite.fileIds.get(testId);
      if (fileId !== previousFileId) {
        this.queue.push([]);
        previousFileId = fileId;
      }
      this.queue[this.queue.length - 1].push(testId);
    }

    this.workers = Array.from({ length: config.workers }, () => ({
      timeout: Timeout.create(),
      job: null,
      position: 0,
    }));
    this.activeWorkers = this.workers.length;
    for (const worker of this.workers) {
      this.startNextTest(worker, changed);
    }
    this.commit(changed);
  }

  public stop() {
    const changed = new Set<string>();
    this.stopWorkers(changed);
    this.commit(changed);
  }

  // Unlike `stop()`, doesn't render, which React forbids while unmounting.
  public dispose = () => {
    this.workers.forEach((worker) => worker.timeout.clear());
    this.summaryFrame.cancel();
  };

  private startNextTest(worker: Worker, changed: Set<string>) {
    while (true) {
      if (worker.job == null || worker.position >= worker.job.length) {
        worker.job = this.queue.shift() ?? null;
        worker.position = 0;
        if (worker.job == null) {
          this.activeWorkers -= 1;
          if (this.activeWorkers === 0) {
            this.runEndedAt = performance.now();
            this.runStatus = 'finished';
          }
          return;
        }
      }

      const testId = worker.job[worker.position];
      worker.position += 1;
      if (this.suite.nodes.get(testId)!.skip) {
        this.setResult(testId, RESULTS.skipped, changed);
        continue;
      }

      this.setResult(testId, RESULTS.running, changed);
      const profile = this.suite.profiles.get(testId)!;
      const startedAt = performance.now();
      worker.timeout.start(this.config.averageDuration * profile.durationFactor, () => {
        const nextChanged = new Set<string>();
        const failed = profile.failureDraw < this.config.failureRate;
        this.setResult(
          testId,
          {
            status: failed ? 'failed' : 'passed',
            // Measured, so a busy main thread shows up as slower tests.
            duration: Math.round(performance.now() - startedAt),
            error: failed ? profile.error : null,
          },
          nextChanged,
        );
        this.startNextTest(worker, nextChanged);
        this.commit(nextChanged);
      });
      return;
    }
  }

  private stopWorkers(changed: Set<string>) {
    for (const worker of this.workers) {
      worker.timeout.clear();
    }
    this.workers = [];
    this.queue = [];
    if (this.activeWorkers > 0) {
      this.activeWorkers = 0;
      this.runEndedAt = performance.now();
      this.runStatus = 'stopped';
    }
    for (const testId of this.suite.testIds) {
      const { status } = this.getResult(testId);
      if (status === 'queued' || status === 'running') {
        this.setResult(testId, RESULTS.idle, changed);
      }
    }
  }

  private setResult(testId: string, result: TestResult, changed: Set<string>) {
    const previous = this.getResult(testId);
    this.results.set(testId, result);
    changed.add(testId);
    this.stats.results += 1;
    this.runStats.results += 1;
    if (previous.status === result.status) {
      return;
    }
    if (result.status === 'passed' || result.status === 'failed' || result.status === 'skipped') {
      this.runCounts[result.status] += 1;
    }

    const suiteCounts = this.counts.get(null)!;
    suiteCounts[previous.status] -= 1;
    suiteCounts[result.status] += 1;
    for (const groupId of getAncestorIds(this.suite, testId)) {
      const counts = this.counts.get(groupId)!;
      counts[previous.status] -= 1;
      counts[result.status] += 1;
      const status = getGroupStatus(counts);
      if (status !== this.getResult(groupId).status) {
        this.results.set(groupId, RESULTS[status]);
        changed.add(groupId);
      }
    }
  }

  private commit(changed: Set<string>) {
    if (changed.size === 0) {
      return;
    }
    const startedAt = performance.now();
    if (this.storeResultsInModels) {
      this.items = applyResults(this.items, changed, this.suite, this.getResult);
    }
    // Rendered right away rather than in a microtask, so the handling time includes the render.
    ReactDOM.flushSync(() => {
      this.listeners.forEach((listener) => listener(changed));
      for (const itemId of changed) {
        this.itemListeners.get(itemId)?.forEach((listener) => listener());
      }
    });
    const handlingTime = performance.now() - startedAt;
    for (const stats of [this.stats, this.runStats]) {
      stats.updates += 1;
      stats.handlingTime += handlingTime;
    }
    if (this.summaryFrame.currentId == null) {
      this.summaryFrame.request(this.publishSummary);
    }
  }

  private publishSummary = () => {
    this.summary = this.createSummary();
    this.summaryListeners.forEach((listener) => listener());
  };

  private createSummary(): RunSummary {
    return {
      counts: { ...this.counts.get(null)! },
      runId: this.runId,
      runStatus: this.runStatus,
      runTestCount: this.runTestCount,
      runCounts: { ...this.runCounts },
      runDuration: (this.runEndedAt ?? performance.now()) - this.runStartedAt,
    };
  }
}

const GROUP_STATUS_PRIORITY: TestStatus[] = ['running', 'queued', 'failed', 'passed', 'skipped'];

function getGroupStatus(counts: StatusCounts): TestStatus {
  return GROUP_STATUS_PRIORITY.find((status) => counts[status] > 0) ?? 'idle';
}

/**
 * Copies the changed results into the models, the way an immutable store
 * would: the changed models and their ancestors are replaced, every other
 * model keeps its identity.
 */
function applyResults(
  items: TestItem[],
  changed: Set<string>,
  suite: Suite,
  getResult: (itemId: string) => TestResult,
) {
  const dirty = new Set<string>();
  for (const itemId of changed) {
    for (
      let current: string | null = itemId;
      current != null && !dirty.has(current);
      current = suite.parentIds.get(current) ?? null
    ) {
      dirty.add(current);
    }
  }

  const update = (models: TestItem[]): TestItem[] => {
    let next: TestItem[] | null = null;
    for (let index = 0; index < models.length; index += 1) {
      const model = models[index];
      if (dirty.has(model.id)) {
        next ??= models.slice();
        const updated: TestItem = { ...model, result: getResult(model.id) };
        if (model.children != null) {
          updated.children = update(model.children);
        }
        next[index] = updated;
      }
    }
    return next ?? models;
  };

  return update(items);
}

function listen<T>(listeners: Set<T>, listener: T) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function createCounts(idle: number): StatusCounts {
  return { idle, queued: 0, running: 0, passed: 0, failed: 0, skipped: 0 };
}

function createStats(): RunnerStats {
  return { results: 0, updates: 0, handlingTime: 0 };
}
