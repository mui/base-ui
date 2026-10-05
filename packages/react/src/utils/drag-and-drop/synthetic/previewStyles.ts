import { ownerWindow } from '@base-ui/utils/owner';
import { isShadowRoot } from '@floating-ui/utils/dom';
import { getSharedSlot } from '../sharedState';
import * as DraggablePreviewDataAttributes from '../../../draggable/preview/DraggablePreviewDataAttributes';
import { adoptStyleSheet, getDragEventRoot, getOrCreate, unadoptStyleSheet } from '../utils';

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

export function isPreviewRootProperty(name: string): boolean {
  return (
    PREVIEW_ROOT_PROPERTIES.has(name) ||
    /^(?:margin|inset)(?:-|$)/.test(name) ||
    /^(?:(?:min|max)-)?(?:width|height|inline-size|block-size)$/.test(name)
  );
}

/**
 * Properties never restored onto any node. Motion is the engine's (see
 * `NEUTRALIZED_PROPERTIES` in `cloneDragPreview`). The clone root's inline
 * `pointer-events: none` and `inert` reach every descendant through inheritance,
 * and copying the source's `auto` onto a descendant would make it hit-testable
 * and focusable again.
 */
export function isEngineOwnedProperty(name: string): boolean {
  return (
    name.startsWith('transition') ||
    name.startsWith('animation') ||
    name === 'pointer-events' ||
    name === 'interactivity'
  );
}

// Internal, like every `data-base-ui-` attribute. It only keys the pseudo-element
// rules restored below.
const NODE_ATTRIBUTE = 'data-base-ui-drag-preview-node';
const ids = getSharedSlot('dragPreviewStyleIds', () => ({ next: 0 }));

type Properties = Map<string, Map<string, string>>;

/**
 * Bound selector work before falling back to computed styles. Larger source
 * trees get a larger budget because a full snapshot also grows with the tree.
 */
const MIN_RULE_BUDGET = 4096;
const RULES_PER_SOURCE_NODE = 512;

/**
 * Snapshot only declarations whose selectors may stop matching once the clone sits
 * at the end of the source's parent, or in the preview `container`. Ordinary class
 * rules still match and need no copying.
 *
 * Selectors are matched against the source tree, and values are read from the
 * source nodes. The clone is not in the DOM yet. Once inserted, it is the last
 * child of its parent rather than at the source's sibling position, so
 * `:nth-child`, `:first-child`, `:last-child` and sibling combinators would resolve
 * to the wrong value. In a `container`, child combinators can stop matching too.
 * `sourceNodes` lists the source tree in order, rooted at the source, and
 * `clonesBySource` maps each source node to its clone, so each snapshot is keyed by
 * the clone node it is restored onto.
 */
export function capturePreviewStyles(
  sourceNodes: Element[],
  clonesBySource: ReadonlyMap<Element, Element>,
) {
  const clone = clonesBySource.get(sourceNodes[0])!;
  const win = ownerWindow(sourceNodes[0]);
  // Captured in its own scope, so the closures returned below, which live as long
  // as the preview, don't keep the source nodes and the capture maps alive.
  const { snapshots, needsFullSnapshot } = captureSnapshots(sourceNodes, clonesBySource, win);
  let sheet: CSSStyleSheet | null = null;
  let sheetRoot: Document | ShadowRoot | null = null;

  function detachSheet() {
    if (sheetRoot && sheet) {
      unadoptStyleSheet(sheetRoot, sheet);
    }
  }

  function reconnect() {
    if (!sheet) {
      return;
    }
    const target = getDragEventRoot(clone);
    if (sheetRoot !== target) {
      detachSheet();
      sheetRoot = target;
    }
    adoptStyleSheet(target, sheet);
  }

  /**
   * A restored value is a style change on a node that is already rendered, so a
   * descendant whose own `transition` covers it would fade in from the value its
   * position at the end of the parent gave it. The preview must look settled on its first frame.
   * Only transitions are finished. A running `@keyframes` inside the source, such
   * as a spinner, keeps playing on the clone.
   */
  function finishTransitions() {
    if (typeof clone.getAnimations !== 'function' || typeof win.CSSTransition !== 'function') {
      return;
    }
    for (const animation of clone.getAnimations({ subtree: true })) {
      if (animation instanceof win.CSSTransition) {
        animation.finish();
      }
    }
  }

  return {
    /** Call once the clone is inserted, so the diff sees its final cascade. */
    restore() {
      // Finish all reads before writing styles, avoiding a layout per node.
      const changed = snapshots.map(({ node, pseudo, values }) => {
        // A clone node `sanitize()` dropped (a script) has nothing to restore.
        if (!node.isConnected) {
          return { node, pseudo, values: [] };
        }
        const computed = win.getComputedStyle(node, pseudo || null);
        // Each changed value keeps the one the clone has now, for the marker check below.
        const changedValues: Array<readonly [string, string, string, string]> = [];
        for (const [name, value, priority] of values) {
          const current = computed.getPropertyValue(name);
          if (current !== value) {
            changedValues.push([name, value, priority, current]);
          }
        }
        return { node, pseudo, values: changedValues };
      });
      // A broad snapshot must not overwrite styles consumers apply to previews.
      // Before writing, drop any value that changes when the marker is removed.
      // It comes from a preview rule, not from the lost ancestry.
      if (changed.some(({ values }) => values.length > 0)) {
        clone.removeAttribute(DraggablePreviewDataAttributes.dragPreview);
        try {
          changed.forEach((entry) => {
            const computed = win.getComputedStyle(entry.node, entry.pseudo || null);
            entry.values = entry.values.filter(
              ([name, , , current]) => computed.getPropertyValue(name) === current,
            );
          });
        } finally {
          clone.setAttribute(DraggablePreviewDataAttributes.dragPreview, '');
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
          const id = getOrCreate(nodeIds, node, () => {
            const next = String(ids.next);
            ids.next += 1;
            node.setAttribute(NODE_ATTRIBUTE, next);
            return next;
          });
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
      if (!changed.some(({ values }) => values.length > 0)) {
        snapshots.length = 0;
        return;
      }
      finishTransitions();
      // An unreadable sheet can also hold `!important` declarations. Computed
      // styles do not expose priority, so raise only the restorations that still
      // lose to a surviving declaration. Reads are batched before writes.
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
        if (important.length > 0) {
          finishTransitions();
        }
      }
      snapshots.length = 0;
    },
    reconnect,
    destroy: detachSheet,
  };
}

/** The values to restore onto each clone node, and whether they came from a full snapshot. */
function captureSnapshots(
  sourceNodes: Element[],
  clonesBySource: ReadonlyMap<Element, Element>,
  win: Window & typeof globalThis,
) {
  const source = sourceNodes[0];
  const clone = clonesBySource.get(source)!;
  const root = source.getRootNode() as Document | ShadowRoot;
  const properties = new Map<Element, Properties>();
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
    // A selector can match source nodes the clone left out, such as an earlier
    // preview inside the source. They have nothing to restore onto.
    if (!clonesBySource.has(sourceNode)) {
      return;
    }
    const byPseudo = getOrCreate(properties, sourceNode, () => new Map());
    const set = getOrCreate(byPseudo, pseudo, () => new Map());
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
      // A cross-origin sheet, such as one on a CDN, hides its rules. Fall back to
      // computed styles when selectors cannot be inspected.
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
  // Large apps can have thousands of unrelated structural selectors. Past the
  // rule budget, snapshot the whole source subtree instead. Pickup cost then stays
  // independent of stylesheet size without caching a stale CSSOM.
  if (needsFullSnapshot) {
    // Engines list a computed style's standard properties first, in one order
    // shared by every element, then the element's custom properties. Reading a
    // name by index costs about as much as reading its value, so the standard
    // names are listed once and each later node only walks its custom tail.
    let standardNames: string[] | null = null;
    // Each node's custom properties, kept until its children compare against them.
    // `sourceNodes` is in tree order, so a parent is always read first.
    const customValues = new Map<Element, Map<string, string>>();
    const readProperties = (
      computed: CSSStyleDeclaration,
      parentCustom: Map<string, string> | undefined,
      custom: Map<string, string>,
    ) => {
      const names: string[] = [];
      const standardCount = standardNames?.length ?? 0;
      let start = 0;
      if (
        standardNames &&
        standardCount > 0 &&
        computed.length >= standardCount &&
        !computed[standardCount - 1].startsWith('--') &&
        (computed.length === standardCount || computed[standardCount].startsWith('--'))
      ) {
        names.push(...standardNames);
        start = standardCount;
      }
      for (let i = start; i < computed.length; i += 1) {
        const name = computed[i];
        if (!name.startsWith('--')) {
          names.push(name);
          continue;
        }
        // Design systems declare hundreds of tokens on `:root`, and every node
        // reports all of them. A custom property equal to the parent's is
        // inherited. The clone's parent ends up with that same value, restored if
        // needed, so the clone inherits it too and it needs no copy. Only the root
        // copies every token, since a `container` above it may not be one of the
        // source's ancestors.
        const value = computed.getPropertyValue(name);
        custom.set(name, value);
        if (parentCustom?.get(name) !== value) {
          names.push(name);
        }
      }
      // Only a list with every standard name ahead of every custom one can be
      // reused as a prefix.
      if (standardNames === null && start === 0) {
        const firstCustom = names.findIndex((name) => name.startsWith('--'));
        const standard = firstCustom === -1 ? names : names.slice(0, firstCustom);
        standardNames =
          standard.length > 0 && !names.slice(standard.length).some((n) => !n.startsWith('--'))
            ? standard
            : [];
      }
      return names;
    };
    for (const node of sourceNodes) {
      const parentCustom =
        node === source || !node.parentElement ? undefined : customValues.get(node.parentElement);
      const custom = new Map<string, string>();
      if (node.childElementCount > 0) {
        customValues.set(node, custom);
      }
      add(node, '', readProperties(win.getComputedStyle(node), parentCustom, custom));
      for (const pseudo of ['::before', '::after', '::marker']) {
        const computed = win.getComputedStyle(node, pseudo);
        if (computed.content !== 'none' && computed.content !== 'normal') {
          // A pseudo-element inherits from its element, whose custom properties
          // were just read.
          add(node, pseudo, readProperties(computed, custom, new Map()));
        }
      }
    }
  }

  const snapshots = Array.from(properties).flatMap(([sourceNode, byPseudo]) => {
    const node = clonesBySource.get(sourceNode)!;
    return Array.from(byPseudo, ([pseudo, names]) => {
      const computed = win.getComputedStyle(sourceNode, pseudo || null);
      return {
        node,
        pseudo,
        values: Array.from(names)
          // Skip what the engine owns: motion and interactivity everywhere, and
          // the clone root's layout. Descendants and pseudo-elements get their
          // contextual styles back.
          .filter(
            ([name]) =>
              !isEngineOwnedProperty(name) &&
              !(node === clone && pseudo === '' && isPreviewRootProperty(name)),
          )
          .map(([name, priority]) => [name, computed.getPropertyValue(name), priority] as const),
      };
    });
  });
  return { snapshots, needsFullSnapshot };
}
