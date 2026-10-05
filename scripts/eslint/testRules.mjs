/**
 * Lint rules for Base UI test files. Each rule targets a pattern that made tests pass
 * without checking anything (see the AGENTS.md "Testing" section).
 */

const FUNCTION_TYPES = new Set(['ArrowFunctionExpression', 'FunctionExpression']);
const LOOP_TYPES = new Set([
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
]);

function getCalleeName(node) {
  if (node.type === 'Identifier') {
    return node.name;
  }
  if (node.type === 'MemberExpression' && !node.computed) {
    return node.property.name;
  }
  return null;
}

function isExpectCall(node) {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'expect'
  );
}

/**
 * Walks every descendant of `root`, calling `visit(node, parents)`.
 */
function walk(root, visit, parents = []) {
  visit(root, parents);
  const nextParents = [...parents, root];
  for (const key of Object.keys(root)) {
    if (key === 'parent') {
      continue;
    }
    const value = root[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child.type === 'string') {
          walk(child, visit, nextParents);
        }
      }
    } else if (value && typeof value.type === 'string') {
      walk(value, visit, nextParents);
    }
  }
}

function isIterationCallback(node, parent) {
  return (
    parent?.type === 'CallExpression' &&
    parent.arguments.includes(node) &&
    parent.callee.type === 'MemberExpression' &&
    ['forEach', 'map', 'every', 'some'].includes(getCalleeName(parent.callee))
  );
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
        let count = 0;
        walk(callback.body, (child, parents) => {
          if (!isExpectCall(child)) {
            return;
          }
          // An expect inside a loop or an iteration callback runs once per item.
          const repeated = parents.some(
            (ancestor, index) =>
              LOOP_TYPES.has(ancestor.type) ||
              (FUNCTION_TYPES.has(ancestor.type) &&
                isIterationCallback(ancestor, parents[index - 1])),
          );
          count += repeated ? 2 : 1;
        });
        if (count > 1) {
          context.report({ node, messageId: 'multiple', data: { count: String(count) } });
        }
      },
    };
  },
};

const EVENT_INIT_FORBIDDEN_KEYS = new Set(['preventDefault', 'stopPropagation']);

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
    function check(objectNode) {
      if (!objectNode || objectNode.type !== 'ObjectExpression') {
        return;
      }
      for (const property of objectNode.properties) {
        if (
          property.type === 'Property' &&
          !property.computed &&
          property.key.type === 'Identifier' &&
          EVENT_INIT_FORBIDDEN_KEYS.has(property.key.name)
        ) {
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
        if (node.callee.type === 'Identifier' && /Event$/.test(node.callee.name)) {
          check(node.arguments[1]);
        }
      },
    };
  },
};

function isTestCall(node) {
  // it(...), test(...), it.skipIf(cond)(...), it.only(...), etc.
  let callee = node.callee;
  if (callee.type === 'CallExpression') {
    callee = callee.callee;
  }
  if (callee.type === 'MemberExpression') {
    callee = callee.object;
  }
  return callee.type === 'Identifier' && (callee.name === 'it' || callee.name === 'test');
}

const noTestsInForEach = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Use `it.each`/`describe.each` instead of registering tests inside `forEach`.',
    },
    messages: {
      forEach:
        'Register parametrized tests with `it.each` (object rows with `$name` titles) or `describe.each`, not inside `forEach`, so each row reports its own title.',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        // For `it.skipIf(cond)(...)`, only report the outer call.
        if (
          !isTestCall(node) ||
          (node.parent.type === 'CallExpression' && node.parent.callee === node)
        ) {
          return;
        }
        const ancestors = context.sourceCode.getAncestors(node);
        for (let index = ancestors.length - 1; index > 0; index -= 1) {
          const ancestor = ancestors[index];
          if (
            FUNCTION_TYPES.has(ancestor.type) &&
            ancestors[index - 1].type === 'CallExpression' &&
            ancestors[index - 1].callee.type === 'MemberExpression' &&
            getCalleeName(ancestors[index - 1].callee) === 'forEach'
          ) {
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
      description: 'Disallow `await flushMicrotasks()` directly after `await render(...)`.',
    },
    messages: {
      redundant:
        '`render` is already awaited and wrapped in act, so flushing microtasks right after it does nothing.',
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
    docs: { description: 'Disallow Chai-style `expect(...).to` chains.' },
    messages: {
      chai: 'Use Vitest/jest-dom matchers directly on `expect(...)`; `.to` is a Chai leftover.',
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          !node.computed &&
          node.property.type === 'Identifier' &&
          node.property.name === 'to' &&
          isExpectCall(node.object)
        ) {
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
        'Use the `user` returned by `render` instead of `@testing-library/user-event`’s `userEvent.setup()`.',
    },
    messages: {
      setup:
        'Use the `user` returned by `await render(...)` so user-event shares the renderer’s act and timer setup.',
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
