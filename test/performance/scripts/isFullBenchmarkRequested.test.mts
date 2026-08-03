import assert from 'node:assert/strict';
import test from 'node:test';
import { hasFreshBenchmarkRequest } from './isFullBenchmarkRequested.mts';

const now = Date.parse('2026-08-03T04:00:00.000Z');

test('accepts the latest successful request for two hours', () => {
  assert.equal(
    hasFreshBenchmarkRequest(
      [
        {
          context: 'benchmark/full-requested',
          created_at: '2026-08-03T02:00:00.001Z',
          state: 'success',
        },
      ],
      now,
    ),
    true,
  );
});

test('rejects expired, future, and malformed requests', () => {
  for (const createdAt of ['2026-08-03T02:00:00.000Z', '2026-08-03T04:00:00.001Z', 'not-a-date']) {
    assert.equal(
      hasFreshBenchmarkRequest(
        [
          {
            context: 'benchmark/full-requested',
            created_at: createdAt,
            state: 'success',
          },
        ],
        now,
      ),
      false,
    );
  }
});

test('uses the newest matching status returned by the combined status API', () => {
  assert.equal(
    hasFreshBenchmarkRequest(
      [
        {
          context: 'benchmark/full-requested',
          created_at: '2026-08-03T03:58:00.000Z',
          state: 'success',
        },
        {
          context: 'benchmark/full-requested',
          created_at: '2026-08-03T03:59:00.000Z',
          state: 'error',
        },
      ],
      now,
    ),
    false,
  );
});

test('rejects a missing request', () => {
  assert.equal(hasFreshBenchmarkRequest([], now), false);
});
