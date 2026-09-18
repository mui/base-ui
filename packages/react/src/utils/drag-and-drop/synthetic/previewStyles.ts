import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { isShadowRoot } from '@floating-ui/utils/dom';
import { getSharedSlot } from '../sharedState';

const STRUCTURAL_SELECTOR = /[>+~]|:(?:first|last|nth|only|empty|has)\b/;
const PSEUDO_ELEMENT = /::(before|after|marker)\b/g;
const NODE_ATTRIBUTE = 'data-drag-preview-node';
const ids = getSharedSlot('dragPreviewStyleIds', () => ({ next: 0 }));

type Properties = Map<string, Set<string>>;

/**
 * Snapshot only declarations whose selectors may stop matching through the
 * preview wrapper. Ordinary class rules need no computed-style copying.
 */
export function capturePreviewStyles(element: HTMLElement, nodes: Element[]) {
  const win = ownerWindow(element);
  const root = element.getRootNode() as Document | ShadowRoot;
  const properties = new Map<Element, Properties>();
  let unreadableSheet = false;

  function add(node: Element, pseudo: string, names: Iterable<string>) {
    let byPseudo = properties.get(node);
    if (!byPseudo) {
      byPseudo = new Map();
      properties.set(node, byPseudo);
    }
    let set = byPseudo.get(pseudo);
    if (!set) {
      set = new Set();
      byPseudo.set(pseudo, set);
    }
    for (const name of names) {
      set.add(name);
    }
  }

  function readSheet(sheet: CSSStyleSheet) {
    if (sheet.disabled) {
      return;
    }
    try {
      readRules(sheet.cssRules);
    } catch {
      // Cross-origin sheets cannot expose their selectors. Preserve their
      // computed styles conservatively; same-origin sheets use the fast path.
      unreadableSheet = true;
    }
  }

  function readRules(rules: CSSRuleList, parentSelector?: string) {
    for (const rule of Array.from(rules)) {
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
          const names = Array.from(styleRule.style);
          try {
            // Shadow selectors cannot be queried from an element. Comparing
            // their declared properties also covers slotted preview roots.
            const matches = shadowSelector
              ? nodes
              : Array.from(element.querySelectorAll(matchSelector));
            if (!shadowSelector && element.matches(matchSelector)) {
              matches.push(element);
            }
            for (const node of matches) {
              for (const pseudo of new Set(['', ...pseudos])) {
                add(node, pseudo, names);
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

  const slotRoot = element.assignedSlot?.getRootNode();
  const roots = isShadowRoot(slotRoot) && slotRoot !== root ? [root, slotRoot] : [root];
  for (const styleRoot of roots) {
    for (const sheet of new Set([
      ...(styleRoot.styleSheets ?? []),
      ...(styleRoot.adoptedStyleSheets ?? []),
    ])) {
      readSheet(sheet);
    }
  }
  if (unreadableSheet) {
    for (const node of nodes) {
      add(node, '', win.getComputedStyle(node));
      for (const pseudo of ['::before', '::after', '::marker']) {
        const computed = win.getComputedStyle(node, pseudo);
        if (computed.content !== 'none' && computed.content !== 'normal') {
          add(node, pseudo, computed);
        }
      }
    }
  }

  const snapshots = Array.from(properties, ([node, byPseudo]) =>
    Array.from(byPseudo, ([pseudo, names]) => {
      const computed = win.getComputedStyle(node, pseudo || null);
      return {
        node,
        pseudo,
        values: Array.from(names)
          .filter((name) => !name.startsWith('transition') && !name.startsWith('animation'))
          .map((name) => [name, computed.getPropertyValue(name)] as const),
      };
    }),
  ).flat();
  let sheet: CSSStyleSheet | null = null;
  let sheetRoot: Document | ShadowRoot | null = null;

  function reconnect() {
    if (!sheet) {
      return;
    }
    const currentRoot = element.getRootNode();
    const target = isShadowRoot(currentRoot) ? currentRoot : ownerDocument(element);
    if (sheetRoot === target && target.adoptedStyleSheets.includes(sheet)) {
      return;
    }
    if (sheetRoot) {
      sheetRoot.adoptedStyleSheets = sheetRoot.adoptedStyleSheets.filter(
        (value) => value !== sheet,
      );
    }
    sheetRoot = target;
    target.adoptedStyleSheets = [...target.adoptedStyleSheets, sheet];
  }

  return {
    restore() {
      // Finish all reads before writing styles, avoiding a layout per node.
      const changed = snapshots.map(({ node, pseudo, values }) => {
        const computed = win.getComputedStyle(node, pseudo || null);
        return {
          node,
          pseudo,
          values: values.filter(([name, value]) => computed.getPropertyValue(name) !== value),
        };
      });
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
        for (const [name, value] of values) {
          style.setProperty(name, value, pseudo ? 'important' : '');
        }
      }
      snapshots.length = 0;
      reconnect();
    },
    reconnect,
    destroy() {
      if (sheetRoot) {
        sheetRoot.adoptedStyleSheets = sheetRoot.adoptedStyleSheets.filter(
          (value) => value !== sheet,
        );
      }
    },
  };
}
