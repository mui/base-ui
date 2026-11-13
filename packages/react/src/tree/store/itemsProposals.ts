import type { TreeItemId, TreeItemsState, TreeState } from './types';
import { ITEM_READER_KEYS } from '../items/itemCollection';

/**
 * An items change the tree made. It is accepted at once while the tree owns
 * `items`. With controlled `items`, it is accepted once the parent renders the
 * proposed items, and rejected once the parent renders other items instead.
 */
export interface TreeItemsProposal {
  /** Runs `callback` once the change is settled, or at once if it already is. */
  whenSettled(callback: (accepted: boolean) => void): void;
}

export const ACCEPTED_PROPOSAL: TreeItemsProposal = { whenSettled: (callback) => callback(true) };

function createItemsProposal() {
  let outcome: boolean | undefined;
  let callbacks: Array<(accepted: boolean) => void> = [];
  const proposal: TreeItemsProposal = {
    whenSettled(callback) {
      if (outcome === undefined) {
        callbacks.push(callback);
      } else {
        callback(outcome);
      }
    },
  };
  const settle = (accepted: boolean) => {
    if (outcome !== undefined) {
      return;
    }
    outcome = accepted;
    const pending = callbacks;
    callbacks = [];
    for (const callback of pending) {
      callback(accepted);
    }
  };
  return { proposal, settle };
}

export interface TreeItemsProposalEntry<TItem> {
  items: readonly TItem[];
  /**
   * The state the proposal describes and the store lookups it was built from.
   * Only the latest proposal keeps them: earlier ones can still be accepted, but
   * their lookups are rebuilt rather than reused.
   */
  snapshot: { state: TreeState<TItem>; baseItemsState: TreeItemsState<TItem> } | null;
  /**
   * The pending proposal this one was built on. A change made from
   * `onItemsChange` records its proposal before the one that called it, which
   * builds on neither.
   */
  base: TreeItemsProposalEntry<TItem> | null;
  /** Ids removed by this proposal and the ones it builds on, pruned on acceptance. */
  removedIds: ReadonlySet<TreeItemId>;
  reconcileSelection: boolean;
  settle: (accepted: boolean) => void;
}

/** What a rendered `items` value accepted, to apply before the proposals settle. */
export interface TreeItemsAcceptance {
  /** The ids the accepted proposal and the ones it builds on removed. */
  removedIds: ReadonlySet<TreeItemId>;
  reconcileSelection: boolean;
  /** Settles the proposals: the accepted ones, and the ones it rejected or superseded. */
  settle: () => void;
}

const NO_IDS: ReadonlySet<TreeItemId> = new Set();

/**
 * The items changes proposed to a parent that controls `items`, until the
 * parent renders them. It decides which proposals a rendered `items` value
 * settles, the state the next change builds on, and whether a render can
 * reuse the lookups a proposal prepared. The item mutation plugin applies its
 * decisions to the store.
 */
export class TreeItemsProposals<TItem> {
  private proposals: Array<TreeItemsProposalEntry<TItem>> = [];

  /** The items passed to the running `onItemsChange`, before their proposal is recorded. */
  private notifyingItems: readonly TItem[] | null = null;

  /** Whether the current task proposed a change. The changes that follow in it build on it. */
  private batchOpen = false;

  constructor(
    /** Whether `items` holds the content of `expected`, such as an equivalent copy. */
    private readonly matches: (items: readonly TItem[], expected: readonly TItem[]) => boolean,
  ) {}

  /** The latest proposal, which a change about to notify builds on. */
  public get latest(): TreeItemsProposalEntry<TItem> | null {
    return this.proposals.at(-1) ?? null;
  }

  /** The state of the latest proposal, which the next change builds on. */
  public get baseState(): TreeState<TItem> | null {
    return this.latest?.snapshot?.state ?? null;
  }

  /**
   * Whether the proposals must settle against the rendered items before a change
   * made now. Changes in one task build on each other, but a later task doesn't
   * build on proposals the parent ignored.
   */
  public isStale(): boolean {
    return !this.batchOpen && this.latest != null;
  }

  /**
   * Runs `notify`, which calls `onItemsChange` with `items`. A `flushSync` parent
   * renders them before their proposal is recorded, which then settles them.
   */
  public notify<T>(items: readonly TItem[], notify: () => T): T {
    const previous = this.notifyingItems;
    this.notifyingItems = items;
    try {
      return notify();
    } finally {
      this.notifyingItems = previous;
    }
  }

  /** Records a proposal built on `base`, if `onItemsChange` didn't settle it meanwhile. */
  public propose(proposal: {
    base: TreeItemsProposalEntry<TItem> | null;
    items: readonly TItem[];
    state: TreeState<TItem>;
    baseItemsState: TreeItemsState<TItem>;
    removedIds: ReadonlySet<TreeItemId> | undefined;
    reconcileSelection: boolean;
  }): TreeItemsProposal {
    if (!this.batchOpen) {
      this.batchOpen = true;
      queueMicrotask(() => {
        this.batchOpen = false;
      });
    }
    const base =
      proposal.base != null && this.proposals.includes(proposal.base) ? proposal.base : null;
    const removedIds = new Set(base?.removedIds);
    proposal.removedIds?.forEach((id) => removedIds.add(id));
    const latest = this.latest;
    if (latest != null) {
      // Only the latest proposal is reused as a base or as prepared lookups.
      latest.snapshot = null;
    }
    const { proposal: handle, settle } = createItemsProposal();
    this.proposals.push({
      items: proposal.items,
      snapshot: { state: proposal.state, baseItemsState: proposal.baseItemsState },
      base,
      removedIds,
      reconcileSelection: (base?.reconcileSelection ?? false) || proposal.reconcileSelection,
      settle,
    });
    return handle;
  }

  /**
   * The lookups of the latest proposal, the only one that keeps them, when it
   * proposed `items` and the lookups and readers it was built from are current.
   */
  public getPreparedItemsState(
    items: readonly TItem[],
    current: TreeState<TItem>,
  ): TreeItemsState<TItem> | null {
    const latest = this.latest;
    const snapshot = latest?.snapshot;
    if (latest?.items !== items || snapshot == null) {
      return null;
    }
    const base = snapshot.baseItemsState;
    const collection = snapshot.state.itemCollection;
    if (
      base.itemModelLookup !== current.itemModelLookup ||
      base.itemMetaLookup !== current.itemMetaLookup ||
      base.itemOrderedChildrenIdsLookup !== current.itemOrderedChildrenIdsLookup ||
      ITEM_READER_KEYS.some((key) => collection[key] !== current.itemCollection[key])
    ) {
      return null;
    }
    const { itemModelLookup, itemMetaLookup, itemOrderedChildrenIdsLookup } = snapshot.state;
    return { itemModelLookup, itemMetaLookup, itemOrderedChildrenIdsLookup };
  }

  /**
   * Settles the proposals against rendered `items`. The latest proposal they
   * match is accepted with the ones it builds on, the later ones stay pending,
   * and the others are rejected. Returns `null` while `onItemsChange` renders the
   * items it is proposing.
   */
  public accept(items: readonly TItem[]): TreeItemsAcceptance | null {
    if (this.notifyingItems != null && this.matches(items, this.notifyingItems)) {
      return null;
    }
    const proposals = this.proposals;
    let acceptedIndex = -1;
    for (let index = proposals.length - 1; index >= 0; index -= 1) {
      if (this.matches(items, proposals[index].items)) {
        acceptedIndex = index;
        break;
      }
    }
    if (acceptedIndex === -1) {
      this.proposals = [];
      return {
        removedIds: NO_IDS,
        reconcileSelection: false,
        settle: () => {
          for (const proposal of proposals) {
            proposal.settle(false);
          }
        },
      };
    }
    // Later proposals build on the accepted one, so the parent can still accept them.
    this.proposals = proposals.slice(acceptedIndex + 1);
    for (const proposal of this.proposals) {
      if (proposal.base != null && !this.proposals.includes(proposal.base)) {
        proposal.base = null;
      }
    }
    const accepted = proposals[acceptedIndex];
    const acceptedChain = new Set<TreeItemsProposalEntry<TItem>>();
    for (let proposal: typeof accepted | null = accepted; proposal != null;) {
      acceptedChain.add(proposal);
      proposal = proposal.base;
    }
    return {
      removedIds: accepted.removedIds,
      reconcileSelection: accepted.reconcileSelection,
      // An earlier proposal the accepted one doesn't build on was superseded.
      settle: () => {
        for (let index = 0; index <= acceptedIndex; index += 1) {
          const proposal = proposals[index];
          proposal.settle(acceptedChain.has(proposal));
        }
      },
    };
  }
}
