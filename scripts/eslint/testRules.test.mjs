/**
 * RuleTester coverage for the Base UI test lint rules.
 * Run with `pnpm test:lint-rules` (Vitest doesn't collect `scripts/`). It also runs before ESLint in
 * `pnpm eslint` and `pnpm eslint:ci`, so CI's Linting job catches rule regressions.
 */
import { RuleTester } from 'eslint';
import baseUiTestRules from './testRules.mjs';

// RuleTester registers its cases through `describe`/`it` when a test framework provides them.
if (typeof globalThis.describe !== 'function') {
  globalThis.describe = (_title, fn) => fn();
}
if (typeof globalThis.it !== 'function') {
  globalThis.it = (_title, fn) => fn();
}

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
});

const { rules } = baseUiTestRules;

ruleTester.run('no-chai-style', rules['no-chai-style'], {
  valid: [
    'expect(a).toBe(1);',
    'expect(a).not.toBe(1);',
    'expect.soft(a).toEqual(1);',
    'expect.element(locator).toBeVisible();',
    // Not rooted in expect.
    'chain.to.equal(1);',
    'foo(a).not.to.equal(1);',
    'expect.to;',
  ],
  invalid: [
    { code: 'expect(a).to.equal(1);', errors: [{ messageId: 'chai' }] },
    { code: 'expect(a).not.to.equal(1);', errors: [{ messageId: 'chai' }] },
    { code: 'expect.soft(a).to.equal(1);', errors: [{ messageId: 'chai' }] },
    { code: 'expect.element(locator).to.be.visible;', errors: [{ messageId: 'chai' }] },
    { code: 'expect(spy).to.have.been.calledOnce;', errors: [{ messageId: 'chai' }] },
  ],
});

ruleTester.run('wait-for-single-expect', rules['wait-for-single-expect'], {
  valid: [
    'waitFor(() => { expect(a).toBe(1); });',
    'waitFor(() => expect(a).toBe(1));',
    'waitFor(() => { expect.soft(a).toBe(1); });',
    // Branches are alternatives: only one assertion runs per poll.
    'waitFor(() => { if (x) { expect(a).toBe(1); } else { expect(b).toBe(1); } });',
    'waitFor(() => { if (x) expect(a).toBe(1); else if (y) expect(b).toBe(1); else expect(c).toBe(1); });',
    'waitFor(() => (x ? expect(a).toBe(1) : expect(b).toBe(1)));',
    'waitFor(() => { switch (x) { case 1: expect(a).toBe(1); break; default: expect(b).toBe(1); } });',
    'waitFor(() => { const value = compute(); expect(value).toBe(1); });',
    'notWaitFor(() => { expect(a).toBe(1); expect(b).toBe(1); });',
  ],
  invalid: [
    {
      code: 'waitFor(() => { expect(a).toBe(1); expect(b).toBe(1); });',
      errors: [{ messageId: 'multiple', data: { count: '2' } }],
    },
    {
      code: 'waitFor(() => { expect.soft(a).toBe(1); expect.element(b).toBeVisible(); });',
      errors: [{ messageId: 'multiple', data: { count: '2' } }],
    },
    {
      code: 'waitFor(() => { if (x) { expect(a).toBe(1); } expect(b).toBe(1); });',
      errors: [{ messageId: 'multiple', data: { count: '2' } }],
    },
    {
      code: 'waitFor(() => { if (x) { expect(a).toBe(1); expect(b).toBe(1); } else { expect(c).toBe(1); } });',
      errors: [{ messageId: 'multiple', data: { count: '2' } }],
    },
    {
      code: 'waitFor(() => (x ? expect(a).toBe(1) : expect(b).toBe(1)) && expect(c).toBe(1));',
      errors: [{ messageId: 'multiple', data: { count: '2' } }],
    },
    {
      code: 'waitFor(() => { for (const item of items) { expect(item).toBeVisible(); } });',
      errors: [{ messageId: 'multiple', data: { count: '2' } }],
    },
    {
      code: 'waitFor(() => { items.forEach((item) => expect(item).toBeVisible()); });',
      errors: [{ messageId: 'multiple', data: { count: '2' } }],
    },
    {
      code: 'screen.waitFor(async () => { expect(a).toBe(1); expect(b).not.toBe(2); });',
      errors: [{ messageId: 'multiple', data: { count: '2' } }],
    },
  ],
});

ruleTester.run('no-tests-in-foreach', rules['no-tests-in-foreach'], {
  valid: [
    "it.each(rows)('$name', ({ name }) => {});",
    "describe.each(rows)('$name', ({ name }) => { it('works', () => {}); });",
    "it('loops inside a test', () => { rows.forEach((row) => expect(row).toBeTruthy()); });",
    "describe('suite', () => { it('a', () => {}); });",
    'rows.forEach((row) => register(row));',
    'const titles = rows.map((row) => row.name);',
  ],
  invalid: [
    { code: "rows.forEach((row) => { it('a', () => {}); });", errors: [{ messageId: 'forEach' }] },
    {
      code: "rows.forEach((row) => { test('a', () => {}); });",
      errors: [{ messageId: 'forEach' }],
    },
    {
      code: "rows.forEach((row) => { it.skipIf(row.skip)('a', () => {}); });",
      errors: [{ messageId: 'forEach' }],
    },
    {
      code: "rows.forEach((row) => { it.skip.each(cases)('$name', () => {}); });",
      errors: [{ messageId: 'forEach' }],
    },
    {
      code: "rows.forEach((row) => { it.skipIf(row.skip).each(cases)('$name', () => {}); });",
      errors: [{ messageId: 'forEach' }],
    },
    { code: "rows.map((row) => it('a', () => {}));", errors: [{ messageId: 'forEach' }] },
    {
      // Only the suite is reported, not every test inside it.
      code: "rows.forEach((row) => { describe('x', () => { it('a', () => {}); it('b', () => {}); }); });",
      errors: [{ messageId: 'forEach' }],
    },
    {
      code: "rows.forEach((row) => { describe.skipIf(row.skip)('x', () => {}); });",
      errors: [{ messageId: 'forEach' }],
    },
    {
      code: "describe('outer', () => { rows.forEach(function (row) { it('a', () => {}); }); });",
      errors: [{ messageId: 'forEach' }],
    },
    {
      // A loop inside a looped suite is reported separately.
      code: "rows.forEach((row) => { describe('x', () => { cases.forEach(() => { it('a', () => {}); }); }); });",
      errors: [{ messageId: 'forEach' }, { messageId: 'forEach' }],
    },
  ],
});

ruleTester.run('no-event-init-spies', rules['no-event-init-spies'], {
  valid: [
    'fireEvent.click(element, { button: 0 });',
    'new MouseEvent("click", { bubbles: true });',
    'const init = { bubbles: true }; fireEvent.click(element, init);',
    // Only `const` bindings are resolved.
    'let init = { preventDefault: spy }; init = {}; fireEvent.click(element, init);',
    'new Thing("click", { preventDefault: spy });',
    'other.click(element, { preventDefault: spy });',
  ],
  invalid: [
    {
      code: 'fireEvent.click(element, { preventDefault: spy });',
      errors: [{ messageId: 'forbidden', data: { key: 'preventDefault' } }],
    },
    {
      code: 'fireEvent.keyDown(element, { key: "Enter", stopPropagation: spy });',
      errors: [{ messageId: 'forbidden', data: { key: 'stopPropagation' } }],
    },
    {
      code: 'new MouseEvent("click", { preventDefault: spy });',
      errors: [{ messageId: 'forbidden', data: { key: 'preventDefault' } }],
    },
    {
      code: 'new window.MouseEvent("click", { preventDefault: spy });',
      errors: [{ messageId: 'forbidden', data: { key: 'preventDefault' } }],
    },
    {
      code: 'new win.KeyboardEvent("keydown", { stopPropagation: spy });',
      errors: [{ messageId: 'forbidden', data: { key: 'stopPropagation' } }],
    },
    {
      code: 'const init = { preventDefault: spy }; fireEvent.click(element, init);',
      errors: [{ messageId: 'forbidden', data: { key: 'preventDefault' } }],
    },
    {
      code: 'const init = { stopPropagation: spy }; function run() { new PointerEvent("pointerdown", init); }',
      errors: [{ messageId: 'forbidden', data: { key: 'stopPropagation' } }],
    },
    {
      // Reported once, where the object is defined.
      code: 'const init = { preventDefault: spy }; fireEvent.click(a, init); fireEvent.click(b, init);',
      errors: [{ messageId: 'forbidden', data: { key: 'preventDefault' } }],
    },
  ],
});

ruleTester.run('no-flush-after-render', rules['no-flush-after-render'], {
  valid: [
    'async function t() { await render(<div />); await user.click(button); await flushMicrotasks(); }',
    'async function t() { await render(<div />); expect(a).toBe(1); await flushMicrotasks(); }',
    'async function t() { render(<div />); await flushMicrotasks(); }',
    'async function t() { await flushMicrotasks(); await render(<div />); }',
  ].map((code) => ({
    code,
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  })),
  invalid: [
    'async function t() { await render(<div />); await flushMicrotasks(); }',
    'async function t() { const { user } = await render(<div />); await flushMicrotasks(); }',
    'async function t() { await renderer.render(<div />); await flushMicrotasks(); }',
  ].map((code) => ({
    code,
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    errors: [{ messageId: 'redundant' }],
  })),
});

ruleTester.run('no-standalone-user-event-setup', rules['no-standalone-user-event-setup'], {
  valid: [
    // Direct calls are outside the rule's scope.
    "import userEvent from '@testing-library/user-event'; await userEvent.click(button);",
    // `vitest/browser`'s userEvent drives real input.
    "import { userEvent } from 'vitest/browser'; const user = userEvent.setup();",
    'const user = userEvent.setup();',
    "import userEvent from '@testing-library/user-event'; other.setup();",
  ],
  invalid: [
    {
      code: "import userEvent from '@testing-library/user-event'; const user = userEvent.setup();",
      errors: [{ messageId: 'setup' }],
    },
    {
      code: "import ue from '@testing-library/user-event'; const user = ue.setup({ delay: null });",
      errors: [{ messageId: 'setup' }],
    },
    {
      code: "import { userEvent } from '@testing-library/user-event'; userEvent.setup();",
      errors: [{ messageId: 'setup' }],
    },
  ],
});

process.stdout.write('base-ui-test rules: all RuleTester cases passed.\n');
