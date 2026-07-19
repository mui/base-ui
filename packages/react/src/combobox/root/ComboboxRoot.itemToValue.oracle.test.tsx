import { expect, vi, type Mock } from 'vitest';
import * as React from 'react';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Combobox } from '@base-ui/react/combobox';

type LabelValue = 'alpha' | 'beta' | 'external' | null;

interface LabelItem {
  id: number;
  value: LabelValue;
  label: string;
}

interface LabelScenario {
  id: string;
  multiple: boolean;
  selection: LabelValue | LabelValue[];
  initialItems: LabelItem[];
  targetItems: LabelItem[];
}

const initialLabelItems: LabelItem[] = [
  { id: 0, value: null, label: 'None' },
  { id: 1, value: 'alpha', label: 'Alpha' },
  { id: 2, value: 'beta', label: 'Beta' },
];

function labelItemToValue(item: LabelItem) {
  return item.value;
}

function permutations<T>(values: T[]): T[][] {
  if (values.length === 0) {
    return [[]];
  }

  const result: T[][] = [];
  values.forEach((value, index) => {
    const remaining = [...values.slice(0, index), ...values.slice(index + 1)];
    permutations(remaining).forEach((permutation) => {
      result.push([value, ...permutation]);
    });
  });
  return result;
}

function orderedSubsets<T>(values: T[]): T[][] {
  return subsets(values).flatMap((subset) => permutations(subset));
}

function subsets<T>(values: T[]): T[][] {
  let result: T[][] = [[]];
  for (const value of values) {
    result = [...result, ...result.map((subset) => [...subset, value])];
  }
  return result;
}

function createLabelScenarios(): LabelScenario[] {
  const selections: Array<{ multiple: boolean; selection: LabelValue | LabelValue[] }> = [
    ...([null, 'alpha', 'beta', 'external'] as LabelValue[]).map((selection) => ({
      multiple: false,
      selection,
    })),
    ...orderedSubsets<LabelValue>([null, 'alpha', 'beta']).map((selection) => ({
      multiple: true,
      selection,
    })),
  ];
  const scenarios: LabelScenario[] = [];

  for (const selected of selections) {
    for (const visibleItems of subsets(initialLabelItems)) {
      for (const reversed of [false, true]) {
        for (const relabeled of [false, true]) {
          let targetItems = visibleItems.map((item) => ({
            ...item,
            label: relabeled ? `${item.label} updated` : item.label,
          }));
          if (reversed) {
            targetItems = targetItems.reverse();
          }

          const mode = selected.multiple ? 'multiple' : 'single';
          scenarios.push({
            id: [
              mode,
              JSON.stringify(selected.selection),
              `visible=${visibleItems.map((item) => item.id).join(',')}`,
              reversed ? 'reversed' : 'forward',
              relabeled ? 'relabeled' : 'original-labels',
            ].join(' | '),
            multiple: selected.multiple,
            selection: selected.selection,
            initialItems: initialLabelItems.map((item) => ({ ...item })),
            targetItems,
          });
        }
      }
    }
  }

  return scenarios;
}

function findLabel(value: LabelValue, items: LabelItem[]) {
  return items.find((item) => Object.is(item.value, value))?.label;
}

function modelLabel(value: LabelValue, currentItems: LabelItem[], previousItems: LabelItem[]) {
  return findLabel(value, currentItems) ?? findLabel(value, previousItems) ?? String(value ?? '');
}

function modelLabelText(scenario: LabelScenario) {
  if (scenario.multiple) {
    const selection = scenario.selection as LabelValue[];
    if (selection.length === 0) {
      return 'Empty';
    }
    return selection
      .map((value) => modelLabel(value, scenario.targetItems, scenario.initialItems))
      .join(', ');
  }

  return modelLabel(scenario.selection as LabelValue, scenario.targetItems, scenario.initialItems);
}

function LabelOracleHarness(props: { scenario: LabelScenario; target: boolean }) {
  const { scenario, target } = props;
  const items = target ? scenario.targetItems : scenario.initialItems;
  const contents = (
    <React.Fragment>
      <Combobox.Input data-testid="oracle-input" />
      <span data-testid="oracle-value">
        <Combobox.Value placeholder="Empty" />
      </span>
    </React.Fragment>
  );

  if (scenario.multiple) {
    return (
      <Combobox.Root
        key={scenario.id}
        filteredItems={items}
        itemToValue={labelItemToValue}
        multiple
        value={scenario.selection as LabelValue[]}
      >
        {contents}
      </Combobox.Root>
    );
  }

  return (
    <Combobox.Root
      key={scenario.id}
      filteredItems={items}
      itemToValue={labelItemToValue}
      value={scenario.selection as LabelValue}
    >
      {contents}
    </Combobox.Root>
  );
}

interface LabelHistoryStep {
  id: string;
  items: LabelItem[];
  expectedLabel: string;
}

interface LabelHistoryScenario {
  id: string;
  multiple: boolean;
  selection: LabelValue | LabelValue[];
  steps: LabelHistoryStep[];
}

function createLabelHistoryScenarios(): LabelHistoryScenario[] {
  const selections: Array<{ multiple: boolean; selection: LabelValue | LabelValue[] }> = [
    ...([null, 'alpha', 'beta', 'external'] as LabelValue[]).map((selection) => ({
      multiple: false,
      selection,
    })),
    ...orderedSubsets<LabelValue>([null, 'alpha', 'beta', 'external'])
      .filter((selection) => selection.length > 0)
      .map((selection) => ({ multiple: true, selection })),
  ];

  return selections.map((selected) => {
    const selectedValues = selected.multiple
      ? (selected.selection as LabelValue[])
      : [selected.selection as LabelValue];
    const isSelected = (item: LabelItem) =>
      selectedValues.some((value) => Object.is(value, item.value));
    const unselectedItems = initialLabelItems.filter((item) => !isSelected(item));
    const selectedItems = selectedValues.map((value, index) => {
      const original = initialLabelItems.find((item) => Object.is(item.value, value));
      return {
        id: original?.id ?? initialLabelItems.length + index,
        value,
        label: `${original?.label ?? 'External'} latest`,
      };
    });
    const sourceSteps = [
      { id: 'initial', items: initialLabelItems.map((item) => ({ ...item })) },
      { id: 'removed', items: unselectedItems.map((item) => ({ ...item })) },
      {
        id: 'reintroduced',
        items: [...unselectedItems, ...selectedItems].reverse().map((item) => ({ ...item })),
      },
      { id: 'removed-again', items: unselectedItems.map((item) => ({ ...item })) },
    ];
    const latestLabels = new Map<LabelValue, string>();
    const steps = sourceSteps.map((step) => {
      for (const item of step.items) {
        latestLabels.set(item.value, item.label);
      }
      const labels = selectedValues.map((value) => latestLabels.get(value) ?? String(value ?? ''));
      return {
        ...step,
        expectedLabel: labels.join(', '),
      };
    });

    return {
      id: `${selected.multiple ? 'multiple' : 'single'} | ${JSON.stringify(selected.selection)}`,
      multiple: selected.multiple,
      selection: selected.selection,
      steps,
    };
  });
}

function LabelHistoryOracleHarness(props: {
  scenario: LabelHistoryScenario;
  step: LabelHistoryStep;
}) {
  const { scenario, step } = props;
  const contents = (
    <React.Fragment>
      <Combobox.Input data-testid="history-input" />
      <span data-testid="history-value">
        <Combobox.Value />
      </span>
    </React.Fragment>
  );

  if (scenario.multiple) {
    return (
      <Combobox.Root
        key={scenario.id}
        filteredItems={step.items}
        itemToValue={labelItemToValue}
        multiple
        value={scenario.selection as LabelValue[]}
      >
        {contents}
      </Combobox.Root>
    );
  }

  return (
    <Combobox.Root
      key={scenario.id}
      filteredItems={step.items}
      itemToValue={labelItemToValue}
      value={scenario.selection as LabelValue}
    >
      {contents}
    </Combobox.Root>
  );
}

type OracleObjectValue = { id: number };
type OracleValue = number | null | OracleObjectValue;
type OracleSource = number | { id: number; value: number | null; label: string };

interface OracleDataset {
  name: string;
  items: OracleSource[];
  getValue: (item: OracleSource) => OracleValue;
  getLabel: (item: OracleSource) => string;
  getValueLabel?: (value: OracleValue) => string;
  isEqual?: (itemValue: OracleValue, value: OracleValue) => boolean;
}

type RenderingStrategy =
  | 'collection'
  | 'collection-explicit'
  | 'grouped'
  | 'virtual-mapped'
  | 'virtual-mapped-indexed'
  | 'virtual-indexed';

type InteractionRootProps = Combobox.Root.MappedProps<OracleValue, false, OracleSource>;
type InteractionHighlightHandler = NonNullable<InteractionRootProps['onItemHighlighted']>;
type InteractionValueChangeHandler = NonNullable<InteractionRootProps['onValueChange']>;

interface InteractionScenario {
  id: string;
  dataset: OracleDataset;
  sourceMode: 'items' | 'filteredItems';
  strategy: RenderingStrategy;
  visibleItems: OracleSource[];
  onItemHighlighted: Mock<InteractionHighlightHandler>;
  onValueChange: Mock<InteractionValueChangeHandler>;
}

const interactionDatasets: OracleDataset[] = [
  {
    name: 'mapped primitives including null',
    items: [
      { id: 1, value: 10, label: 'Ten' },
      { id: 2, value: 20, label: 'Twenty' },
      { id: 3, value: null, label: 'None' },
    ],
    getValue: (item) => (item as Exclude<OracleSource, number>).value,
    getLabel: (item) => (item as Exclude<OracleSource, number>).label,
  },
  {
    name: 'overlapping source and mapped domains',
    items: [1, 2, 3],
    getValue: (item) => (item as number) + 1,
    getLabel: (item) => `Source ${item}`,
    getValueLabel: (value) => `Source ${(value as number) - 1}`,
  },
  {
    name: 'allocating object values with custom equality',
    items: [
      { id: 1, value: 10, label: 'Object one' },
      { id: 2, value: 20, label: 'Object two' },
      { id: 3, value: null, label: 'Object three' },
    ],
    getValue: (item) => ({ id: (item as Exclude<OracleSource, number>).id }),
    getLabel: (item) => (item as Exclude<OracleSource, number>).label,
    getValueLabel: (value) => {
      const id = (value as OracleObjectValue).id;
      return `Object ${['zero', 'one', 'two', 'three'][id]}`;
    },
    isEqual: (itemValue, value) =>
      (itemValue as OracleObjectValue).id === (value as OracleObjectValue).id,
  },
];

function createInteractionScenarios(): InteractionScenario[] {
  const scenarios: InteractionScenario[] = [];
  for (const dataset of interactionDatasets) {
    for (const sourceMode of ['items', 'filteredItems'] as const) {
      for (const strategy of [
        'collection',
        'collection-explicit',
        'grouped',
        'virtual-mapped',
        'virtual-mapped-indexed',
        'virtual-indexed',
      ] as const) {
        for (const reversed of [false, true]) {
          const visibleItems = reversed ? dataset.items.slice().reverse() : dataset.items.slice();
          scenarios.push({
            id: [dataset.name, sourceMode, strategy, reversed ? 'reversed' : 'forward'].join(' | '),
            dataset,
            sourceMode,
            strategy,
            visibleItems,
            onItemHighlighted: vi.fn<InteractionHighlightHandler>(),
            onValueChange: vi.fn<InteractionValueChangeHandler>(),
          });
        }
      }
    }
  }
  return scenarios;
}

function toGroups(items: OracleSource[]) {
  return [
    { value: 'first', items: items.slice(0, 1) },
    { value: 'remaining', items: items.slice(1) },
  ];
}

function OracleItems(props: { scenario: InteractionScenario }) {
  const { scenario } = props;
  const { dataset, strategy, visibleItems } = scenario;

  if (strategy === 'virtual-mapped') {
    return visibleItems.map((item) => (
      <Combobox.Item key={dataset.getLabel(item)} value={dataset.getValue(item)}>
        {dataset.getLabel(item)}
      </Combobox.Item>
    ));
  }

  if (strategy === 'virtual-mapped-indexed') {
    return visibleItems.map((item, index) => (
      <Combobox.Item key={dataset.getLabel(item)} index={index} value={dataset.getValue(item)}>
        {dataset.getLabel(item)}
      </Combobox.Item>
    ));
  }

  if (strategy === 'virtual-indexed') {
    return visibleItems.map((item, index) => (
      <Combobox.Item key={dataset.getLabel(item)} index={index}>
        {dataset.getLabel(item)}
      </Combobox.Item>
    ));
  }

  if (strategy === 'grouped') {
    return (
      <Combobox.List>
        {(group: { value: string; items: OracleSource[] }) => (
          <Combobox.Group key={group.value} items={group.items}>
            <Combobox.Collection>
              {(item: OracleSource) => (
                <Combobox.Item key={dataset.getLabel(item)}>{dataset.getLabel(item)}</Combobox.Item>
              )}
            </Combobox.Collection>
          </Combobox.Group>
        )}
      </Combobox.List>
    );
  }

  if (strategy === 'collection-explicit') {
    return (
      <Combobox.List>
        {(item: OracleSource) => (
          <Combobox.Item key={dataset.getLabel(item)} value={dataset.getValue(item)}>
            {dataset.getLabel(item)}
          </Combobox.Item>
        )}
      </Combobox.List>
    );
  }

  return (
    <Combobox.List>
      {(item: OracleSource) => (
        <Combobox.Item key={dataset.getLabel(item)}>{dataset.getLabel(item)}</Combobox.Item>
      )}
    </Combobox.List>
  );
}

function InteractionOracleHarness(props: {
  scenario: InteractionScenario;
  runId?: string;
  entryPath?: 'open' | 'typeahead';
  name?: string;
}) {
  const { scenario, runId = 'initial', entryPath = 'open', name } = props;
  const { dataset, sourceMode, strategy, visibleItems } = scenario;
  const grouped = strategy === 'grouped';
  const sourceItems = grouped ? toGroups(dataset.items) : dataset.items;
  const filteredItems = grouped ? toGroups(visibleItems) : visibleItems;

  return (
    <Combobox.Root
      key={`${scenario.id} | ${runId}`}
      items={sourceMode === 'items' ? sourceItems : undefined}
      filteredItems={filteredItems}
      itemToValue={dataset.getValue}
      itemToStringLabel={dataset.getValueLabel}
      isItemEqualToValue={dataset.isEqual}
      virtualized={strategy.startsWith('virtual')}
      defaultInputValue={sourceMode === 'items' ? 'filtering' : undefined}
      defaultOpen={entryPath === 'open'}
      name={name}
      onItemHighlighted={scenario.onItemHighlighted}
      onValueChange={scenario.onValueChange}
    >
      <Combobox.Input data-testid="interaction-input" />
      <Combobox.Trigger data-testid="interaction-trigger">Open</Combobox.Trigger>
      {strategy.startsWith('virtual') ? (
        <Combobox.List>
          <OracleItems scenario={scenario} />
        </Combobox.List>
      ) : (
        <OracleItems scenario={scenario} />
      )}
    </Combobox.Root>
  );
}

function ClosedAutofillOracleHarness(props: { scenario: InteractionScenario; name: string }) {
  const { scenario, name } = props;
  const { dataset, sourceMode, visibleItems } = scenario;

  return (
    <Combobox.Root
      key={`${scenario.id} | closed-autofill`}
      items={sourceMode === 'items' ? dataset.items : undefined}
      filteredItems={visibleItems}
      itemToValue={dataset.getValue}
      itemToStringLabel={dataset.getValueLabel}
      isItemEqualToValue={dataset.isEqual}
      defaultInputValue={sourceMode === 'items' ? 'filtering' : undefined}
      name={name}
      onValueChange={scenario.onValueChange}
    >
      <Combobox.Input data-testid="closed-autofill-input" />
      <Combobox.Trigger>Open</Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <OracleItems scenario={scenario} />
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function valuesEqual(first: OracleValue | undefined, second: OracleValue | undefined) {
  if (
    typeof first === 'object' &&
    first !== null &&
    typeof second === 'object' &&
    second !== null
  ) {
    const firstEntries = Object.entries(first);
    const secondEntries = Object.entries(second);
    return (
      firstEntries.length === secondEntries.length &&
      firstEntries.every(([key, value]) => Object.is(value, second[key as keyof typeof second]))
    );
  }
  return Object.is(first, second);
}

function renderedWindowStaysSynchronizedAfterSelection(scenario: InteractionScenario) {
  // A real virtualizer re-windows when the derived order changes. The static test window cannot
  // model that ownership boundary, so only run post-selection paths while its order stays valid.
  const reordersWhenFilteringIsBypassed =
    scenario.sourceMode === 'items' &&
    scenario.visibleItems.some((item, index) => item !== scenario.dataset.items[index]);
  return !reordersWhenFilteringIsBypassed || !scenario.strategy.startsWith('virtual');
}

function SynchronizedVirtualOracleHarness(props: {
  scenario: InteractionScenario;
  runId: string;
  entryPath: 'open' | 'typeahead';
}) {
  const { scenario, runId, entryPath } = props;
  return (
    <SynchronizedVirtualOracleHarnessInner key={runId} scenario={scenario} entryPath={entryPath} />
  );
}

function SynchronizedVirtualOracleHarnessInner(props: {
  scenario: InteractionScenario;
  entryPath: 'open' | 'typeahead';
}) {
  const { scenario, entryPath } = props;
  const { dataset, visibleItems } = scenario;
  const [rewindowed, setRewindowed] = React.useState(false);
  const renderedItems = rewindowed ? dataset.items : visibleItems;
  const renderedScenario = { ...scenario, visibleItems: renderedItems };

  return (
    <Combobox.Root
      items={dataset.items}
      filteredItems={visibleItems}
      itemToValue={dataset.getValue}
      itemToStringLabel={dataset.getValueLabel}
      isItemEqualToValue={dataset.isEqual}
      virtualized
      defaultInputValue="filtering"
      defaultOpen={entryPath === 'open'}
      onItemHighlighted={scenario.onItemHighlighted}
      onValueChange={(value, details) => {
        scenario.onValueChange(value, details);
        setRewindowed(true);
      }}
    >
      <Combobox.Input data-testid="rewindow-input" />
      <Combobox.Trigger data-testid="rewindow-trigger">Open</Combobox.Trigger>
      <Combobox.List>
        <OracleItems scenario={renderedScenario} />
      </Combobox.List>
    </Combobox.Root>
  );
}

type MultipleInteractionRootProps = Combobox.Root.MappedProps<LabelValue, true, LabelItem>;
type MultipleValueChangeHandler = NonNullable<MultipleInteractionRootProps['onValueChange']>;

interface MultipleInteractionScenario {
  id: string;
  selection: LabelValue[];
  pressedItem: LabelItem;
  onValueChange: Mock<MultipleValueChangeHandler>;
}

function createMultipleInteractionScenarios(): MultipleInteractionScenario[] {
  const scenarios: MultipleInteractionScenario[] = [];
  for (const selection of orderedSubsets<LabelValue>([null, 'alpha', 'beta'])) {
    for (const pressedItem of initialLabelItems) {
      scenarios.push({
        id: `${JSON.stringify(selection)} | press=${pressedItem.label}`,
        selection,
        pressedItem,
        onValueChange: vi.fn<MultipleValueChangeHandler>(),
      });
    }
  }
  return scenarios;
}

function MultipleInteractionOracleHarness(props: { scenario: MultipleInteractionScenario }) {
  const { scenario } = props;
  return (
    <Combobox.Root
      key={scenario.id}
      filteredItems={initialLabelItems}
      itemToValue={labelItemToValue}
      multiple
      value={scenario.selection}
      defaultOpen
      onValueChange={scenario.onValueChange}
    >
      <Combobox.Input />
      <Combobox.List>
        {(item: LabelItem) => <Combobox.Item key={item.id}>{item.label}</Combobox.Item>}
      </Combobox.List>
    </Combobox.Root>
  );
}

function modelMultipleSelection(selection: LabelValue[], pressedValue: LabelValue) {
  const selectedIndex = selection.findIndex((value) => Object.is(value, pressedValue));
  if (selectedIndex === -1) {
    return [...selection, pressedValue];
  }
  return selection.filter((_, index) => index !== selectedIndex);
}

interface ObjectMultipleScenario {
  id: string;
  selection: number[];
  pressedId: number;
  onValueChange: Mock<(value: Array<{ id: number }>) => void>;
}

function ObjectMultipleOracleHarness(props: { scenario: ObjectMultipleScenario }) {
  const { scenario } = props;
  const items = [
    { id: 1, label: 'One' },
    { id: 2, label: 'Two' },
  ];

  return (
    <Combobox.Root
      key={scenario.id}
      items={items}
      itemToValue={(item) => ({ id: item.id })}
      isItemEqualToValue={(a, b) => a.id === b.id}
      multiple
      value={scenario.selection.map((id) => ({ id }))}
      defaultOpen
      onValueChange={scenario.onValueChange}
    >
      <Combobox.List>
        {(item) => <Combobox.Item key={item.id}>{item.label}</Combobox.Item>}
      </Combobox.List>
    </Combobox.Root>
  );
}

describe('<Combobox.Root /> itemToValue model oracle', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();
  const labelScenarios = createLabelScenarios();
  const labelHistoryScenarios = createLabelHistoryScenarios();
  const interactionScenarios = createInteractionScenarios();
  const selectionEntryScenarios = interactionScenarios.filter(
    renderedWindowStaysSynchronizedAfterSelection,
  );
  const rewindowScenarios = interactionScenarios.filter(
    (scenario) => !renderedWindowStaysSynchronizedAfterSelection(scenario),
  );
  const strictVirtualStrategies: RenderingStrategy[] = [
    'virtual-indexed',
    'virtual-mapped',
    'virtual-mapped-indexed',
  ];
  const strictInteractionScenarios = interactionDatasets.flatMap((dataset, index) =>
    interactionScenarios.filter(
      (scenario) =>
        scenario.dataset === dataset &&
        scenario.sourceMode === 'items' &&
        scenario.visibleItems[0] === dataset.items[0] &&
        (scenario.strategy === 'collection' ||
          scenario.strategy === strictVirtualStrategies[index]),
    ),
  );
  const multipleInteractionScenarios = createMultipleInteractionScenarios();

  /* eslint-disable no-await-in-loop -- The oracle intentionally advances one mounted state machine serially. */
  it('matches the reference label model for every generated filtered-source transition', async () => {
    const firstScenario = labelScenarios[0];
    const { setProps } = await render(
      <LabelOracleHarness scenario={firstScenario} target={false} />,
      { strict: false },
    );

    for (const scenario of labelScenarios) {
      await setProps({ scenario, target: false });
      await setProps({ scenario, target: true });

      const expected = modelLabelText(scenario);
      expect(screen.getByTestId('oracle-value').textContent, `${scenario.id} | Value`).toBe(
        expected,
      );
      expect(
        (screen.getByTestId('oracle-input') as HTMLInputElement).value,
        `${scenario.id} | input`,
      ).toBe(scenario.multiple ? '' : expected);
    }
  }, 30000);

  it('retains the latest observed labels across removal and reintroduction sequences', async () => {
    const firstScenario = labelHistoryScenarios[0];
    const { setProps } = await render(
      <LabelHistoryOracleHarness scenario={firstScenario} step={firstScenario.steps[0]} />,
      { strict: false },
    );

    for (const scenario of labelHistoryScenarios) {
      for (const step of scenario.steps) {
        await setProps({ scenario, step });

        expect(
          screen.getByTestId('history-value').textContent,
          `${scenario.id} | ${step.id} | Value`,
        ).toBe(step.expectedLabel);
        expect(
          (screen.getByTestId('history-input') as HTMLInputElement).value,
          `${scenario.id} | ${step.id} | input`,
        ).toBe(scenario.multiple ? '' : step.expectedLabel);
      }
    }
  }, 30000);

  it('matches the reference interaction model across source and rendering strategies', async () => {
    const firstScenario = interactionScenarios[0];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { setProps, user } = await render(
        <InteractionOracleHarness scenario={firstScenario} />,
        { strict: false },
      );

      for (const scenario of interactionScenarios) {
        warnSpy.mockClear();
        await setProps({ scenario });

        const options = screen.getAllByRole('option');
        expect(
          options.map((option) => option.textContent),
          `${scenario.id} | rendered labels`,
        ).toEqual(scenario.visibleItems.map(scenario.dataset.getLabel));
        expect(
          new Set(options.map((option) => option.id)).size,
          `${scenario.id} | option ids`,
        ).toBe(options.length);
        expect(
          options.every((option) => option.id !== '' && !option.id.includes('--1')),
          `${scenario.id} | registered indexes`,
        ).toBe(true);
        expect(warnSpy, `${scenario.id} | valid explicit values`).not.toHaveBeenCalled();

        const input = screen.getByTestId('interaction-input');
        await act(async () => {
          input.focus();
        });
        await user.keyboard('{ArrowDown}');

        const firstValue = scenario.dataset.getValue(scenario.visibleItems[0]);
        await waitFor(() => {
          expect(
            valuesEqual(scenario.onItemHighlighted.mock.lastCall?.[0], firstValue),
            `${scenario.id} | highlighted value`,
          ).toBe(true);
        });

        const lastItem = scenario.visibleItems[scenario.visibleItems.length - 1];
        const lastValue = scenario.dataset.getValue(lastItem);
        await user.click(options[options.length - 1]);

        expect(
          valuesEqual(scenario.onValueChange.mock.lastCall?.[0], lastValue),
          `${scenario.id} | selected value`,
        ).toBe(true);
        await waitFor(() => {
          expect(
            (screen.getByTestId('interaction-input') as HTMLInputElement).value,
            `${scenario.id} | selected label`,
          ).toBe(scenario.dataset.getLabel(lastItem));
        });
      }
    } finally {
      warnSpy.mockRestore();
    }
  }, 30000);

  it('matches the reference model for keyboard selection across rendering strategies', async () => {
    const firstScenario = selectionEntryScenarios[0];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { setProps, user } = await render(
        <InteractionOracleHarness scenario={firstScenario} runId="seed" />,
        { strict: false },
      );

      for (const scenario of selectionEntryScenarios) {
        warnSpy.mockClear();
        scenario.onItemHighlighted.mockClear();
        scenario.onValueChange.mockClear();
        await setProps({ scenario, runId: `keyboard | ${scenario.id}`, entryPath: 'open' });

        await act(async () => {
          screen.getByTestId('interaction-input').focus();
        });
        await user.keyboard('{ArrowDown}{Enter}');

        const firstItem = scenario.visibleItems[0];
        const expectedValue = scenario.dataset.getValue(firstItem);
        expect(
          valuesEqual(scenario.onValueChange.mock.lastCall?.[0], expectedValue),
          `${scenario.id} | keyboard selected value`,
        ).toBe(true);
        await waitFor(() => {
          expect(
            (screen.getByTestId('interaction-input') as HTMLInputElement).value,
            `${scenario.id} | keyboard selected label`,
          ).toBe(scenario.dataset.getLabel(firstItem));
        });
        expect(warnSpy, `${scenario.id} | keyboard warnings`).not.toHaveBeenCalled();
      }
    } finally {
      warnSpy.mockRestore();
    }
  }, 30000);

  it('matches the reference model for closed-trigger typeahead across rendering strategies', async () => {
    const firstScenario = selectionEntryScenarios[0];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { setProps, user } = await render(
        <InteractionOracleHarness scenario={firstScenario} runId="seed" entryPath="typeahead" />,
        { strict: false },
      );

      for (const scenario of selectionEntryScenarios) {
        warnSpy.mockClear();
        scenario.onValueChange.mockClear();
        await setProps({
          scenario,
          runId: `typeahead | ${scenario.id}`,
          entryPath: 'typeahead',
        });

        await act(async () => {
          screen.getByTestId('interaction-trigger').focus();
        });
        await user.keyboard(scenario.dataset.getLabel(scenario.visibleItems[0])[0].toLowerCase());

        const expectedValue = scenario.dataset.getValue(scenario.visibleItems[0]);
        await waitFor(() => {
          expect(
            valuesEqual(scenario.onValueChange.mock.lastCall?.[0], expectedValue),
            `${scenario.id} | typeahead selected value`,
          ).toBe(true);
        });
        expect(warnSpy, `${scenario.id} | typeahead warnings`).not.toHaveBeenCalled();
      }
    } finally {
      warnSpy.mockRestore();
    }
  }, 30000);

  it('keeps reordered virtual windows synchronized after keyboard selection', async () => {
    const firstScenario = rewindowScenarios[0];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { setProps, user } = await render(
        <SynchronizedVirtualOracleHarness scenario={firstScenario} runId="seed" entryPath="open" />,
        { strict: false },
      );

      for (const scenario of rewindowScenarios) {
        warnSpy.mockClear();
        scenario.onValueChange.mockClear();
        await setProps({
          scenario,
          runId: `keyboard-rewindow | ${scenario.id}`,
          entryPath: 'open',
        });

        await act(async () => {
          screen.getByTestId('rewindow-input').focus();
        });
        await user.keyboard('{ArrowDown}{Enter}');

        const selectedItem = scenario.visibleItems[0];
        const expectedValue = scenario.dataset.getValue(selectedItem);
        expect(
          valuesEqual(scenario.onValueChange.mock.lastCall?.[0], expectedValue),
          `${scenario.id} | selected value`,
        ).toBe(true);
        await waitFor(() => {
          expect(
            screen.getAllByRole('option').map((option) => option.textContent),
            `${scenario.id} | rewindowed labels`,
          ).toEqual(scenario.dataset.items.map(scenario.dataset.getLabel));
        });
        expect(
          screen.getByRole('option', { name: scenario.dataset.getLabel(selectedItem) }),
          `${scenario.id} | selected option`,
        ).toHaveAttribute('aria-selected', 'true');
        expect(warnSpy, `${scenario.id} | warnings`).not.toHaveBeenCalled();
      }
    } finally {
      warnSpy.mockRestore();
    }
  }, 30000);

  it('keeps reordered virtual windows synchronized after closed-trigger typeahead', async () => {
    const firstScenario = rewindowScenarios[0];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { setProps, user } = await render(
        <SynchronizedVirtualOracleHarness
          scenario={firstScenario}
          runId="seed"
          entryPath="typeahead"
        />,
        { strict: false },
      );

      for (const scenario of rewindowScenarios) {
        warnSpy.mockClear();
        scenario.onValueChange.mockClear();
        await setProps({
          scenario,
          runId: `typeahead-rewindow | ${scenario.id}`,
          entryPath: 'typeahead',
        });

        await act(async () => {
          screen.getByTestId('rewindow-trigger').focus();
        });
        await user.keyboard(scenario.dataset.getLabel(scenario.visibleItems[0])[0].toLowerCase());

        const selectedItem = scenario.visibleItems[0];
        const expectedValue = scenario.dataset.getValue(selectedItem);
        await waitFor(() => {
          expect(
            valuesEqual(scenario.onValueChange.mock.lastCall?.[0], expectedValue),
            `${scenario.id} | selected value`,
          ).toBe(true);
        });
        await waitFor(() => {
          expect(
            screen.getAllByRole('option').map((option) => option.textContent),
            `${scenario.id} | rewindowed labels`,
          ).toEqual(scenario.dataset.items.map(scenario.dataset.getLabel));
        });
        expect(warnSpy, `${scenario.id} | warnings`).not.toHaveBeenCalled();
      }
    } finally {
      warnSpy.mockRestore();
    }
  }, 30000);

  it('matches the reference model for closed browser autofill across mapped value shapes', async () => {
    const autofillScenarios = interactionScenarios.filter(
      (scenario) => scenario.strategy === 'collection',
    );
    const firstScenario = autofillScenarios[0];
    const { setProps } = await render(
      <ClosedAutofillOracleHarness scenario={firstScenario} name="oracle-autofill-seed" />,
      { strict: false },
    );

    for (const [index, scenario] of autofillScenarios.entries()) {
      scenario.onValueChange.mockClear();
      const name = `oracle-autofill-${index}`;
      await setProps({ scenario, name });

      expect(
        screen.queryByRole('listbox', { hidden: true }),
        `${scenario.id} | list starts unmounted`,
      ).toBe(null);

      const autofillItem =
        scenario.visibleItems.find((item) => scenario.dataset.getValue(item) !== null) ??
        scenario.visibleItems[0];
      const autofillInput = screen
        .getAllByDisplayValue('')
        .find((element) => element.getAttribute('name') === name)!;
      fireEvent.change(autofillInput, {
        target: { value: scenario.dataset.getLabel(autofillItem) },
      });
      await flushMicrotasks();

      const expectedValue = scenario.dataset.getValue(autofillItem);
      expect(
        valuesEqual(scenario.onValueChange.mock.lastCall?.[0], expectedValue),
        `${scenario.id} | autofill selected value`,
      ).toBe(true);
      await waitFor(() => {
        expect(
          (screen.getByTestId('closed-autofill-input') as HTMLInputElement).value,
          `${scenario.id} | autofill label`,
        ).toBe(scenario.dataset.getLabel(autofillItem));
      });
      expect(screen.queryByRole('listbox'), `${scenario.id} | list remains closed`).toBe(null);
    }
  }, 30000);

  it('matches the reference multiple-selection toggle model for every ordered selection', async () => {
    const firstScenario = multipleInteractionScenarios[0];
    const { setProps, user } = await render(
      <MultipleInteractionOracleHarness scenario={firstScenario} />,
      { strict: false },
    );

    for (const scenario of multipleInteractionScenarios) {
      await setProps({ scenario });
      await user.click(screen.getByRole('option', { name: scenario.pressedItem.label }));

      expect(scenario.onValueChange.mock.lastCall?.[0], scenario.id).toEqual(
        modelMultipleSelection(scenario.selection, scenario.pressedItem.value),
      );
    }
  }, 30000);

  it('matches the multiple-selection model for allocating object values', async () => {
    const scenarios = orderedSubsets([1, 2]).flatMap((selection) =>
      [1, 2].map((pressedId) => ({
        id: `${selection.join(',')} | press=${pressedId}`,
        selection,
        pressedId,
        onValueChange: vi.fn<(value: Array<{ id: number }>) => void>(),
      })),
    );
    const { setProps, user } = await render(
      <ObjectMultipleOracleHarness scenario={scenarios[0]} />,
      { strict: false },
    );

    for (const scenario of scenarios) {
      await setProps({ scenario });
      await user.click(
        screen.getByRole('option', { name: scenario.pressedId === 1 ? 'One' : 'Two' }),
      );

      const expectedIds = scenario.selection.includes(scenario.pressedId)
        ? scenario.selection.filter((id) => id !== scenario.pressedId)
        : [...scenario.selection, scenario.pressedId];
      expect(scenario.onValueChange.mock.lastCall?.[0], scenario.id).toEqual(
        expectedIds.map((id) => ({ id })),
      );
    }
  });

  it('preserves mapped interaction behavior during Strict Mode lifecycle replay', async () => {
    const firstScenario = strictInteractionScenarios[0];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { setProps, user } = await render(
        <InteractionOracleHarness scenario={firstScenario} runId="strict-seed" />,
        { strict: true },
      );

      for (const scenario of strictInteractionScenarios) {
        warnSpy.mockClear();
        scenario.onItemHighlighted.mockClear();
        scenario.onValueChange.mockClear();
        await setProps({ scenario, runId: `strict | ${scenario.id}` });

        const options = screen.getAllByRole('option');
        expect(
          options.every((option) => option.id !== '' && !option.id.includes('--1')),
          `${scenario.id} | registered indexes`,
        ).toBe(true);

        await act(async () => {
          screen.getByTestId('interaction-input').focus();
        });
        await user.keyboard('{ArrowDown}');

        const firstValue = scenario.dataset.getValue(scenario.visibleItems[0]);
        await waitFor(() => {
          expect(
            valuesEqual(scenario.onItemHighlighted.mock.lastCall?.[0], firstValue),
            `${scenario.id} | highlighted value`,
          ).toBe(true);
        });

        const lastItem = scenario.visibleItems[scenario.visibleItems.length - 1];
        await user.click(options[options.length - 1]);
        expect(
          valuesEqual(
            scenario.onValueChange.mock.lastCall?.[0],
            scenario.dataset.getValue(lastItem),
          ),
          `${scenario.id} | selected value`,
        ).toBe(true);
        expect(warnSpy, `${scenario.id} | warnings`).not.toHaveBeenCalled();
      }
    } finally {
      warnSpy.mockRestore();
    }
  }, 30000);
  /* eslint-enable no-await-in-loop */

  it('distinguishes plausible broken label and value implementations', () => {
    expect(labelScenarios).toHaveLength(640);
    expect(labelHistoryScenarios).toHaveLength(68);
    expect(interactionScenarios).toHaveLength(72);
    expect(selectionEntryScenarios).toHaveLength(63);
    expect(rewindowScenarios).toHaveLength(9);
    expect(strictInteractionScenarios).toHaveLength(6);
    expect(
      interactionScenarios.filter((scenario) => scenario.strategy === 'collection'),
    ).toHaveLength(12);
    expect(multipleInteractionScenarios).toHaveLength(48);

    const labelMutants = {
      'drops a filtered-out selected label': (scenario: LabelScenario) => {
        const values = scenario.multiple
          ? (scenario.selection as LabelValue[])
          : [scenario.selection as LabelValue];
        if (scenario.multiple && values.length === 0) {
          return 'Empty';
        }
        return values
          .map((value) => findLabel(value, scenario.targetItems) ?? String(value ?? ''))
          .join(', ');
      },
      'keeps a stale label when the selected item is still present': (scenario: LabelScenario) => {
        const values = scenario.multiple
          ? (scenario.selection as LabelValue[])
          : [scenario.selection as LabelValue];
        if (scenario.multiple && values.length === 0) {
          return 'Empty';
        }
        return values
          .map((value) => findLabel(value, scenario.initialItems) ?? String(value ?? ''))
          .join(', ');
      },
      'treats a labeled null value as empty': (scenario: LabelScenario) => {
        const values = scenario.multiple
          ? (scenario.selection as LabelValue[])
          : [scenario.selection as LabelValue];
        if (values.length === 0 || values.includes(null)) {
          return 'Empty';
        }
        return modelLabelText(scenario);
      },
      'sorts multiple labels by current source order': (scenario: LabelScenario) => {
        if (!scenario.multiple || (scenario.selection as LabelValue[]).length === 0) {
          return modelLabelText(scenario);
        }
        const selected = scenario.selection as LabelValue[];
        const visibleValues: LabelValue[] = scenario.targetItems.map((item) => item.value);
        return selected
          .slice()
          .sort((a, b) => visibleValues.indexOf(a) - visibleValues.indexOf(b))
          .map((value) => modelLabel(value, scenario.targetItems, scenario.initialItems))
          .join(', ');
      },
    };

    for (const [name, mutant] of Object.entries(labelMutants)) {
      expect(
        labelScenarios.some((scenario) => mutant(scenario) !== modelLabelText(scenario)),
        name,
      ).toBe(true);
    }

    const relabeledHistory = labelHistoryScenarios.find(
      (scenario) => !scenario.multiple && scenario.selection === 'alpha',
    )!;
    expect(
      relabeledHistory.steps[0].expectedLabel !==
        relabeledHistory.steps[relabeledHistory.steps.length - 1].expectedLabel,
      'keeps the first cached label after a selected item is reintroduced with a newer label',
    ).toBe(true);

    expect(
      interactionScenarios.some(
        (scenario) =>
          scenario.dataset.name === 'overlapping source and mapped domains' &&
          scenario.strategy === 'virtual-mapped' &&
          !valuesEqual(
            scenario.dataset.getValue(scenario.visibleItems[0]),
            scenario.dataset.getValue(
              scenario.dataset.items.find((item) =>
                valuesEqual(
                  item as OracleValue,
                  scenario.dataset.getValue(scenario.visibleItems[0]),
                ),
              )!,
            ),
          ),
      ),
      'treats an explicit virtual value as a source value when the domains overlap',
    ).toBe(true);

    expect(
      interactionScenarios.some((scenario) => {
        const firstValue = scenario.dataset.getValue(scenario.visibleItems[0]);
        const secondValue = scenario.dataset.getValue(scenario.visibleItems[0]);
        return (
          scenario.dataset.name === 'allocating object values with custom equality' &&
          scenario.strategy === 'virtual-mapped' &&
          firstValue !== secondValue
        );
      }),
      'uses object identity instead of the configured comparator',
    ).toBe(true);

    const objectDataset = interactionDatasets.find(
      (dataset) => dataset.name === 'allocating object values with custom equality',
    )!;
    const objectSource = objectDataset.items[0];
    expect(
      valuesEqual(objectSource as OracleValue, objectDataset.getValue(objectSource)),
      'emits the source object instead of the exact mapped value shape',
    ).toBe(false);

    expect(
      interactionScenarios.some((scenario) =>
        scenario.visibleItems.some((item) => scenario.dataset.getValue(item) === null),
      ),
      'drops null from the mapped value domain',
    ).toBe(true);
  });
});
