import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { isShadowRoot } from '@floating-ui/utils/dom';
import { getSharedSlot } from '../sharedState';
import { DRAG_PREVIEW_ATTR } from '../dragAttributes';

const STRUCTURAL_SELECTOR = /[>+~]|:(?:first|last|nth|only|empty|has)\b/;
const PSEUDO_ELEMENT = /::(before|after|marker)\b/g;
// These properties belong to the positioned clone, not its source layout.
const PREVIEW_ROOT_PROPERTIES = new Set([
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'box-sizing',
  'pointer-events',
  'will-change',
  'translate',
  'transform',
  'z-index',
]);

function isPreviewRootProperty(name: string): boolean {
  return (
    PREVIEW_ROOT_PROPERTIES.has(name) ||
    /^(?:margin|inset)(?:-|$)/.test(name) ||
    /^(?:(?:min|max)-)?(?:width|height|inline-size|block-size)$/.test(name)
  );
}

const NODE_ATTRIBUTE = 'data-drag-preview-node';
const ids = getSharedSlot('dragPreviewStyleIds', () => ({ next: 0 }));

type Properties = Map<string, Map<string, string>>;

const MIN_RULE_BUDGET = 128;
const RULES_PER_SOURCE_NODE = 64;

/**
 * Snapshot only declarations whose selectors may stop matching through the
 * preview wrapper. Ordinary class rules need no computed-style copying.
 *
 * Selectors are matched against the *source* tree and their values read from the
 * source nodes: the clone is not yet in the DOM, and even if it were, a sibling
 * position it does not share with the source (it ends up first in the wrapper,
 * and could only be appended after every existing sibling) would resolve
 * `:nth-child`, `:first-child`, `:last-child` and combinator rules to the wrong
 * value. `sourceNodes` and `cloneNodes` are the two trees in the same order, so
 * each snapshot is keyed by the clone node it is later restored onto.
 */
export function capturePreviewStyles(
  source: HTMLElement,
  sourceNodes: Element[],
  clone: HTMLElement,
  cloneNodes: Element[],
) {
  const win = ownerWindow(source);
  const root = source.getRootNode() as Document | ShadowRoot;
  const properties = new Map<Element, Properties>();
  const clonesBySource = new Map<Element, Element>();
  for (let i = 0; i < sourceNodes.length; i += 1) {
    clonesBySource.set(sourceNodes[i], cloneNodes[i]);
  }
  let needsFullSnapshot = false;
  let inspectedRules = 0;
  // Full snapshots scale with the dragged subtree. Give a large subtree more
  // selector work before switching, since copying all its styles also costs more.
  const ruleBudget = Math.max(MIN_RULE_BUDGET, sourceNodes.length * RULES_PER_SOURCE_NODE);

  function add(
    sourceNode: Element,
    pseudo: string,
    names: Iterable<string>,
    declaration?: CSSStyleDeclaration,
  ) {
    let byPseudo = properties.get(sourceNode);
    if (!byPseudo) {
      byPseudo = new Map();
      properties.set(sourceNode, byPseudo);
    }
    let set = byPseudo.get(pseudo);
    if (!set) {
      set = new Map();
      byPseudo.set(pseudo, set);
    }
    for (const name of names) {
      set.set(name, set.get(name) || declaration?.getPropertyPriority(name) || '');
    }
  }

  function readSheet(sheet: CSSStyleSheet) {
    if (sheet.disabled || needsFullSnapshot) {
      return;
    }
    try {
      readRules(sheet.cssRules);
    } catch {
      // App styles can live on a CDN or otherwise hide their rules. Preserve
      // computed styles when their selectors cannot be inspected.
      needsFullSnapshot = true;
    }
  }

  function readRules(rules: CSSRuleList, parentSelector?: string) {
    if (rules.length > ruleBudget - inspectedRules) {
      needsFullSnapshot = true;
      return;
    }
    for (const rule of rules) {
      if (needsFullSnapshot || inspectedRules >= ruleBudget) {
        needsFullSnapshot = true;
        return;
      }
      inspectedRules += 1;
      let selector = parentSelector;
      if ('selectorText' in rule && 'style' in rule) {
        const styleRule = rule as CSSStyleRule;
        selector = styleRule.selectorText;
        if (parentSelector) {
          selector = selector.includes('&')
            ? selector.replaceAll('&', `:is(${parentSelector})`)
            : `:is(${parentSelector}) ${selector}`;
        }
        const shadowSelector = /:host|::slotted/.test(selector);
        if (STRUCTURAL_SELECTOR.test(selector) || shadowSelector) {
          const pseudos = Array.from(selector.matchAll(PSEUDO_ELEMENT), (match) => match[0]);
          const matchSelector = selector.replace(PSEUDO_ELEMENT, '');
          try {
            const matches = shadowSelector
              ? sourceNodes
              : Array.from(source.querySelectorAll(matchSelector));
            if (!shadowSelector && source.matches(matchSelector)) {
              matches.push(source);
            }
            for (const node of matches) {
              for (const pseudo of new Set(['', ...pseudos])) {
                add(node, pseudo, styleRule.style, styleRule.style);
              }
            }
          } catch {
            // Unsupported selectors do not match in this browser either.
          }
        }
      }
      if ('styleSheet' in rule && rule.styleSheet) {
        readSheet(rule.styleSheet as CSSStyleSheet);
      } else if ('cssRules' in rule) {
        readRules(rule.cssRules as CSSRuleList, selector);
      }
    }
  }

  const slotRoot = source.assignedSlot?.getRootNode();
  const roots = isShadowRoot(slotRoot) && slotRoot !== root ? [root, slotRoot] : [root];
  for (const styleRoot of roots) {
    for (const sheet of new Set([
      ...(styleRoot.styleSheets ?? []),
      ...(styleRoot.adoptedStyleSheets ?? []),
    ])) {
      readSheet(sheet);
    }
  }
  // Large applications can have thousands of unrelated structural selectors.
  // Bound their inspection and snapshot the source subtree instead. This keeps
  // pickup work independent of the stylesheet size without caching stale CSSOM.
  if (needsFullSnapshot) {
    for (const node of sourceNodes) {
      add(node, '', win.getComputedStyle(node));
      for (const pseudo of ['::before', '::after', '::marker']) {
        const computed = win.getComputedStyle(node, pseudo);
        if (computed.content !== 'none' && computed.content !== 'normal') {
          add(node, pseudo, computed);
        }
      }
    }
  }

  const snapshots = Array.from(properties, ([sourceNode, byPseudo]) => {
    const node = clonesBySource.get(sourceNode);
    if (!node) {
      return [];
    }
    return Array.from(byPseudo, ([pseudo, names]) => {
      const computed = win.getComputedStyle(sourceNode, pseudo || null);
      return {
        node,
        pseudo,
        values: Array.from(names)
          // Preserve the engine's root layout and neutralized motion while
          // restoring contextual styles on descendants and pseudo-elements.
          .filter(
            ([name]) =>
              !name.startsWith('transition') &&
              !name.startsWith('animation') &&
              !(node === clone && pseudo === '' && isPreviewRootProperty(name)),
          )
          .map(([name, priority]) => [name, computed.getPropertyValue(name), priority] as const),
      };
    });
  }).flat();
  let sheet: CSSStyleSheet | null = null;
  let sheetRoot: Document | ShadowRoot | null = null;

  function detachSheet() {
    if (sheetRoot) {
      sheetRoot.adoptedStyleSheets = sheetRoot.adoptedStyleSheets.filter(
        (value) => value !== sheet,
      );
    }
  }

  function reconnect() {
    if (!sheet) {
      return;
    }
    const currentRoot = clone.getRootNode();
    const target = isShadowRoot(currentRoot) ? currentRoot : ownerDocument(clone);
    if (sheetRoot === target && target.adoptedStyleSheets.includes(sheet)) {
      return;
    }
    detachSheet();
    sheetRoot = target;
    target.adoptedStyleSheets = [...target.adoptedStyleSheets, sheet];
  }

  return {
    /** Call once the clone is in its wrapper, so the diff sees its final cascade. */
    restore() {
      // Finish all reads before writing styles, avoiding a layout per node.
      const changed = snapshots.map(({ node, pseudo, values }) => {
        // A clone node `sanitize()` dropped (a script) has nothing to restore.
        if (!node.isConnected) {
          return { node, pseudo, values: [] };
        }
        const computed = win.getComputedStyle(node, pseudo || null);
        return {
          node,
          pseudo,
          values: values.filter(([name, value]) => computed.getPropertyValue(name) !== value),
        };
      });
      // A broad snapshot must not overwrite styles consumers explicitly apply
      // to previews. Compare with the marker removed before writing anything;
      // those differences belong to the preview, not to its lost ancestry.
      if (
        changed.some(({ values }) => values.length > 0) &&
        clone.hasAttribute(DRAG_PREVIEW_ATTR)
      ) {
        const previewValues = changed.map(({ node, pseudo, values }) => {
          const computed = win.getComputedStyle(node, pseudo || null);
          return values.map(([name]) => computed.getPropertyValue(name));
        });
        const marker = clone.getAttribute(DRAG_PREVIEW_ATTR)!;
        clone.removeAttribute(DRAG_PREVIEW_ATTR);
        try {
          changed.forEach((entry, index) => {
            const computed = win.getComputedStyle(entry.node, entry.pseudo || null);
            entry.values = entry.values.filter(
              ([name], valueIndex) =>
                computed.getPropertyValue(name) === previewValues[index][valueIndex],
            );
          });
        } finally {
          clone.setAttribute(DRAG_PREVIEW_ATTR, marker);
        }
      }
      const nodeIds = new Map<Element, string>();
      for (const { node, pseudo, values } of changed) {
        if (values.length === 0) {
          continue;
        }
        let style: CSSStyleDeclaration;
        if (pseudo) {
          sheet ??= new win.CSSStyleSheet();
          let id = nodeIds.get(node);
          if (id === undefined) {
            id = String(ids.next);
            ids.next += 1;
            nodeIds.set(node, id);
            node.setAttribute(NODE_ATTRIBUTE, id);
          }
          const index = sheet.insertRule(
            `[${NODE_ATTRIBUTE}="${id}"]${pseudo} {}`,
            sheet.cssRules.length,
          );
          style = (sheet.cssRules[index] as CSSStyleRule).style;
        } else if (node instanceof win.HTMLElement || node instanceof win.SVGElement) {
          style = node.style;
        } else {
          continue;
        }
        for (const [name, value, priority] of values) {
          style.setProperty(name, value, pseudo ? 'important' : priority);
        }
      }
      reconnect();
      // An unreadable sheet can contain !important declarations too. Computed
      // styles do not expose their priority, so elevate only restorations that
      // still lose to a surviving declaration. Batch the reads before writes.
      if (needsFullSnapshot) {
        const important = changed.flatMap(({ node, pseudo, values }) => {
          if (pseudo || !(node instanceof win.HTMLElement || node instanceof win.SVGElement)) {
            return [];
          }
          const computed = win.getComputedStyle(node);
          return values
            .filter(([name, value]) => computed.getPropertyValue(name) !== value)
            .map(([name, value]) => ({ node, name, value }));
        });
        for (const { node, name, value } of important) {
          node.style.setProperty(name, value, 'important');
        }
      }
      snapshots.length = 0;
    },
    reconnect,
    destroy: detachSheet,
  };
}
