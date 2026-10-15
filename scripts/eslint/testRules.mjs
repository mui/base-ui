/**
 * Lint rules for Base UI test files. Each rule targets a pattern that made tests pass
 * without checking anything (see the AGENTS.md "Testing" section).
 * Run `node scripts/eslint/testRules.test.mjs` after changing them.
 */

const FUNCTION_TYPES = new Set(['ArrowFunctionExpression', 'FunctionExpression']);
const LOOP_TYPES = new Set([
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
]);
const ITERATION_METHODS = new Set(['forEach', 'map', 'every', 'some']);
const TEST_REGISTRATION_METHODS = new Set(['forEach', 'map']);
const TEST_FUNCTION_NAMES = new Set(['it', 'test', 'describe']);
const EXPECT_MODIFIERS = new Set(['soft', 'element']);

function getCalleeName(node) {
  if (node.type === 'Identifier') {
    return node.name;
  }
  if (node.type === 'MemberExpression' && !node.computed) {
    return node.property.name;
  }
  return null;
}

/**
 * Matches `expect(...)`, `expect.soft(...)` and `expect.element(...)`.
 */
function isExpectCall(node) {
  if (node?.type !== 'CallExpression') {
    return false;
  }
  const callee = node.callee;
  if (callee.type === 'Identifier') {
    return callee.name === 'expect';
  }
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'expect' &&
    EXPECT_MODIFIERS.has(callee.property.name)
  );
}

/**
 * Whether `node` is a function passed to `.forEach()`, `.map()` or another method in `methods`.
 */
function isCallbackOf(node, parent, methods) {
  return (
    FUNCTION_TYPES.has(node.type) &&
    parent?.type === 'CallExpression' &&
    parent.arguments.includes(node) &&
    parent.callee.type === 'MemberExpression' &&
    methods.has(getCalleeName(parent.callee))
  );
}

function getChildNodes(node) {
  const children = [];
  for (const key of Object.keys(node)) {
    if (key === 'parent') {
      continue;
    }
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child.type === 'string') {
          children.push(child);
        }
      }
    } else if (value && typeof value.type === 'string') {
      children.push(value);
    }
  }
  return children;
}

/**
 * Counts the assertions one run of `node` can make. Branches are alternatives, so only the
 * largest one counts; an assertion inside a loop or an iteration callback runs once per item,
 * so it counts twice.
 */
function countExpects(node, parent) {
  if (!node) {
    return 0;
  }
  const sum = (nodes) => nodes.reduce((total, child) => total + countExpects(child, node), 0);

  if (node.type === 'IfStatement' || node.type === 'ConditionalExpression') {
    return (
      countExpects(node.test, node) +
      Math.max(countExpects(node.consequent, node), countExpects(node.alternate, node))
    );
  }
  if (node.type === 'SwitchStatement') {
    return (
      countExpects(node.discriminant, node) +
      Math.max(0, ...node.cases.map((switchCase) => sum(switchCase.consequent)))
    );
  }

  const count = sum(getChildNodes(node)) + (isExpectCall(node) ? 1 : 0);
  if (LOOP_TYPES.has(node.type) || isCallbackOf(node, parent, ITERATION_METHODS)) {
    return count * 2;
  }
  return count;
}

const waitForSingleExpect = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Allow one `expect()` per `waitFor()` callback so retries are scoped to one condition.',
    },
    messages: {
      multiple:
        'This waitFor callback runs {{count}} assertions. Wait for the one condition that settles last (or use findBy*), then assert the rest after the waitFor. Negative assertions never belong inside waitFor: they pass on the first poll.',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (getCalleeName(node.callee) !== 'waitFor') {
          return;
        }
        const callback = node.arguments[0];
        if (!callback || !FUNCTION_TYPES.has(callback.type)) {
          return;
        }
        const count = countExpects(callback.body, callback);
        if (count > 1) {
          context.report({ node, messageId: 'multiple', data: { count: String(count) } });
        }
      },
    };
  },
};

const EVENT_INIT_FORBIDDEN_KEYS = new Set(['preventDefault', 'stopPropagation']);

function findVariable(scope, name) {
  for (let current = scope; current; current = current.upper) {
    const variable = current.set.get(name);
    if (variable) {
      return variable;
    }
  }
  return null;
}

const noEventInitSpies = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow `preventDefault`/`stopPropagation` in event init objects; they are never attached to the dispatched event.',
    },
    messages: {
      forbidden:
        '`{{key}}` in an event init object is ignored: the dispatched event gets its own method, so this spy is never called. Assert on the boolean returned by `fireEvent.*()` (false means default prevented), or dispatch a real event and check `event.defaultPrevented`.',
    },
    schema: [],
  },
  create(context) {
    const reported = new Set();

    // Follows `const init = { ... }` so the init object can be checked where it is defined.
    function resolveInit(node) {
      if (node?.type !== 'Identifier') {
        return node;
      }
      const variable = findVariable(context.sourceCode.getScope(node), node.name);
      const definition = variable?.defs.length === 1 ? variable.defs[0] : null;
      if (
        definition?.type === 'Variable' &&
        definition.parent.kind === 'const' &&
        definition.node.id.type === 'Identifier'
      ) {
        return definition.node.init;
      }
      return null;
    }

    function check(initNode) {
      const objectNode = resolveInit(initNode);
      if (!objectNode || objectNode.type !== 'ObjectExpression') {
        return;
      }
      for (const property of objectNode.properties) {
        if (
          property.type === 'Property' &&
          !property.computed &&
          property.key.type === 'Identifier' &&
          EVENT_INIT_FORBIDDEN_KEYS.has(property.key.name) &&
          !reported.has(property)
        ) {
          reported.add(property);
          context.report({
            node: property,
            messageId: 'forbidden',
            data: { key: property.key.name },
          });
        }
      }
    }

    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'fireEvent'
        ) {
          check(node.arguments[1]);
        }
      },
      NewExpression(node) {
        // `new MouseEvent(...)`, `new window.MouseEvent(...)`, `new win.KeyboardEvent(...)`
        const name = getCalleeName(node.callee);
        if (name && /Event$/.test(name)) {
          check(node.arguments[1]);
        }
      },
    };
  },
};

/**
 * Whether `node` registers a test or a suite: `it(...)`, `test(...)`, `describe(...)`, and
 * their variants (`it.only(...)`, `it.skipIf(cond)(...)`, `it.skip.each(rows)(...)`,
 * `describe.skipIf(cond).each(rows)(...)`).
 */
function isTestCall(node) {
  let callee = node.callee;
  while (callee.type === 'CallExpression' || callee.type === 'MemberExpression') {
    callee = callee.type === 'CallExpression' ? callee.callee : callee.object;
  }
  return callee.type === 'Identifier' && TEST_FUNCTION_NAMES.has(callee.name);
}

const noTestsInForEach = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Use `it.each`/`describe.each` instead of registering tests or suites inside `forEach`/`map`.',
    },
    messages: {
      forEach:
        'Register parametrized tests with `it.each` (object rows with `$name` titles) or `describe.each`, not inside `forEach` or `map`, so each row reports its own title.',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isTestCall(node)) {
          return;
        }
        // Only report the outermost call of a chain such as `it.skipIf(cond).each(rows)(...)`.
        if (
          (node.parent.type === 'CallExpression' && node.parent.callee === node) ||
          (node.parent.type === 'MemberExpression' && node.parent.object === node)
        ) {
          return;
        }
        const ancestors = context.sourceCode.getAncestors(node);
        for (let index = ancestors.length - 1; index > 0; index -= 1) {
          const ancestor = ancestors[index];
          // The enclosing suite is the one reported if it is inside a loop.
          if (ancestor.type === 'CallExpression' && isTestCall(ancestor)) {
            return;
          }
          if (isCallbackOf(ancestor, ancestors[index - 1], TEST_REGISTRATION_METHODS)) {
            context.report({ node, messageId: 'forEach' });
            return;
          }
        }
      },
    };
  },
};

function isAwaitedCall(expression, name) {
  return (
    expression?.type === 'AwaitExpression' &&
    expression.argument.type === 'CallExpression' &&
    getCalleeName(expression.argument.callee) === name
  );
}

function isRenderStatement(statement) {
  if (statement.type === 'ExpressionStatement') {
    return isAwaitedCall(statement.expression, 'render');
  }
  if (statement.type === 'VariableDeclaration') {
    return statement.declarations.some((declaration) => isAwaitedCall(declaration.init, 'render'));
  }
  return false;
}

const noFlushAfterRender = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow `await flushMicrotasks()` directly after `await render(...)`. Assumes `render` comes from the async `#test-utils` renderer, so enable it only for @base-ui/react tests: awaiting the synchronous `@mui/internal-test-utils` renderer flushes nothing.',
    },
    messages: {
      redundant:
        'The `#test-utils` `render` is async and wraps its work in act, so once it is awaited, flushing microtasks right after it does nothing.',
    },
    schema: [],
  },
  create(context) {
    function checkBody(body) {
      for (let index = 1; index < body.length; index += 1) {
        const statement = body[index];
        if (
          statement.type === 'ExpressionStatement' &&
          isAwaitedCall(statement.expression, 'flushMicrotasks') &&
          isRenderStatement(body[index - 1])
        ) {
          context.report({ node: statement, messageId: 'redundant' });
        }
      }
    }
    return {
      BlockStatement(node) {
        checkBody(node.body);
      },
    };
  },
};

const noChaiStyle = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Chai-style `.to` chains on `expect(...)`, `expect.soft(...)` and `expect.element(...)`.',
    },
    messages: {
      chai: 'Use Vitest/jest-dom matchers directly on `expect(...)`; `.to` is a Chai leftover.',
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (node.computed || node.property.type !== 'Identifier' || node.property.name !== 'to') {
          return;
        }
        // Walk down `expect(a).not.to` to the call the chain starts from.
        let object = node.object;
        while (object.type === 'MemberExpression') {
          object = object.object;
        }
        if (isExpectCall(object)) {
          context.report({ node, messageId: 'chai' });
        }
      },
    };
  },
};

const noStandaloneUserEventSetup = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow `userEvent.setup()` from `@testing-library/user-event`; use the `user` returned by `render` instead. Only `setup()` is reported: direct calls such as `userEvent.click()` are allowed.',
    },
    messages: {
      setup:
        'Use the `user` returned by `await render(...)` instead of creating a user-event instance with `setup()`, so user-event shares the renderer’s act and timer setup.',
    },
    schema: [],
  },
  create(context) {
    // Only Testing Library's user-event; `userEvent` from `vitest/browser` drives real input.
    const localNames = new Set();
    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@testing-library/user-event') {
          return;
        }
        for (const specifier of node.specifiers) {
          localNames.add(specifier.local.name);
        }
      },
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          localNames.has(node.callee.object.name) &&
          getCalleeName(node.callee) === 'setup'
        ) {
          context.report({ node, messageId: 'setup' });
        }
      },
    };
  },
};

export default {
  meta: { name: 'base-ui-test' },
  rules: {
    'wait-for-single-expect': waitForSingleExpect,
    'no-event-init-spies': noEventInitSpies,
    'no-tests-in-foreach': noTestsInForEach,
    'no-flush-after-render': noFlushAfterRender,
    'no-chai-style': noChaiStyle,
    'no-standalone-user-event-setup': noStandaloneUserEventSetup,
  },
};
