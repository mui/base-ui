export type FilterJoin = 'AND' | 'OR';

export type ColumnType = 'text' | 'number' | 'date';

export interface ColumnDefinition {
  id: string;
  label: string;
  type: ColumnType;
  /**
   * The values offered by the column's set filter.
   * Columns with a set filter gain the `is any of` and `is none of` operators.
   */
  setValues?: readonly string[];
}

export type OperatorId =
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'notEqual'
  | 'startsWith'
  | 'endsWith'
  | 'eq'
  | 'ne'
  | 'gt'
  | 'ge'
  | 'lt'
  | 'le'
  | 'between'
  | 'blank'
  | 'notBlank'
  | 'in'
  | 'notIn';

export interface OperatorDefinition {
  id: OperatorId;
  label: string;
  operand: 'none' | 'single' | 'range' | 'set';
}

export interface FilterGroup {
  kind: 'group';
  id: string;
  join: FilterJoin;
  children: FilterNode[];
}

export interface FilterCondition {
  kind: 'condition';
  id: string;
  column: string | null;
  operator: OperatorId | null;
  value: string;
  valueTo: string;
  values: string[];
}

export type FilterNode = FilterGroup | FilterCondition;

export interface ConditionError {
  /** The control holding the invalid input. */
  field: 'column' | 'operator' | 'value' | 'valueTo' | 'values';
  message: string;
}

export const COLUMNS: readonly ColumnDefinition[] = [
  { id: 'athlete', label: 'Athlete', type: 'text' },
  { id: 'age', label: 'Age', type: 'number' },
  {
    id: 'country',
    label: 'Country',
    type: 'text',
    setValues: [
      'Australia',
      'Canada',
      'China',
      'France',
      'Germany',
      'Great Britain',
      'Italy',
      'Japan',
      'Netherlands',
      'Russia',
      'South Korea',
      'United States',
    ],
  },
  { id: 'date', label: 'Date', type: 'date' },
  { id: 'gold', label: 'Gold', type: 'number' },
  {
    id: 'sport',
    label: 'Sport',
    type: 'text',
    setValues: ['Athletics', 'Cycling', 'Gymnastics', 'Rowing', 'Sailing', 'Swimming', 'Tennis'],
  },
];

const COLUMN_LOOKUP = new Map(COLUMNS.map((column) => [column.id, column]));

const SET_OPERATORS: readonly OperatorDefinition[] = [
  { id: 'in', label: 'is any of', operand: 'set' },
  { id: 'notIn', label: 'is none of', operand: 'set' },
];

const TEXT_OPERATORS: readonly OperatorDefinition[] = [
  { id: 'contains', label: 'contains', operand: 'single' },
  { id: 'notContains', label: 'does not contain', operand: 'single' },
  { id: 'equals', label: 'equals', operand: 'single' },
  { id: 'notEqual', label: 'does not equal', operand: 'single' },
  { id: 'startsWith', label: 'begins with', operand: 'single' },
  { id: 'endsWith', label: 'ends with', operand: 'single' },
  { id: 'blank', label: 'is blank', operand: 'none' },
  { id: 'notBlank', label: 'is not blank', operand: 'none' },
];

const SCALAR_OPERATORS: readonly OperatorDefinition[] = [
  { id: 'eq', label: '=', operand: 'single' },
  { id: 'ne', label: '!=', operand: 'single' },
  { id: 'gt', label: '>', operand: 'single' },
  { id: 'ge', label: '>=', operand: 'single' },
  { id: 'lt', label: '<', operand: 'single' },
  { id: 'le', label: '<=', operand: 'single' },
  { id: 'between', label: 'is between', operand: 'range' },
  { id: 'blank', label: 'is blank', operand: 'none' },
  { id: 'notBlank', label: 'is not blank', operand: 'none' },
];

export function getColumn(columnId: string | null): ColumnDefinition | undefined {
  return columnId == null ? undefined : COLUMN_LOOKUP.get(columnId);
}

export function getOperators(column: ColumnDefinition): readonly OperatorDefinition[] {
  const typeOperators = column.type === 'text' ? TEXT_OPERATORS : SCALAR_OPERATORS;
  return column.setValues ? [...SET_OPERATORS, ...typeOperators] : typeOperators;
}

export function getOperator(
  column: ColumnDefinition | undefined,
  operatorId: OperatorId | null,
): OperatorDefinition | undefined {
  if (column == null || operatorId == null) {
    return undefined;
  }
  return getOperators(column).find((operator) => operator.id === operatorId);
}

let nextId = 0;

export function createCondition(): FilterCondition {
  nextId += 1;
  return {
    kind: 'condition',
    id: `condition-${nextId}`,
    column: null,
    operator: null,
    value: '',
    valueTo: '',
    values: [],
  };
}

export function createGroup(join: FilterJoin = 'AND'): FilterGroup {
  nextId += 1;
  return { kind: 'group', id: `group-${nextId}`, join, children: [createCondition()] };
}

export function duplicateNode(node: FilterNode): FilterNode {
  nextId += 1;
  return node.kind === 'group'
    ? { ...node, id: `group-${nextId}`, children: node.children.map(duplicateNode) }
    : { ...node, id: `condition-${nextId}` };
}

export const ROOT_ID = 'root';

/**
 * Returns why a condition can't be applied, or `null` when it is complete.
 */
export function getConditionError(condition: FilterCondition): ConditionError | null {
  const column = getColumn(condition.column);
  if (column == null) {
    return { field: 'column', message: 'Select a column' };
  }
  const operator = getOperator(column, condition.operator);
  if (operator == null) {
    return { field: 'operator', message: 'Select an operator' };
  }
  switch (operator.operand) {
    case 'none':
      return null;
    case 'set':
      return condition.values.length === 0
        ? { field: 'values', message: 'Select at least one value' }
        : null;
    case 'single':
      return getValueError(column, condition.value, 'value');
    case 'range': {
      const error =
        getValueError(column, condition.value, 'value') ??
        getValueError(column, condition.valueTo, 'valueTo');
      if (error != null) {
        return error;
      }
      const isOrdered =
        column.type === 'number'
          ? Number(condition.value) < Number(condition.valueTo)
          : condition.value < condition.valueTo;
      return isOrdered
        ? null
        : { field: 'valueTo', message: 'The first value must be lower than the second' };
    }
    default:
      return null;
  }
}

function getValueError(
  column: ColumnDefinition,
  value: string,
  field: 'value' | 'valueTo',
): ConditionError | null {
  if (value.trim() === '') {
    return { field, message: 'Enter a value' };
  }
  if (column.type === 'number' && !Number.isFinite(Number(value))) {
    return { field, message: 'Enter a number' };
  }
  return null;
}

export function isFilterValid(node: FilterNode): boolean {
  if (node.kind === 'condition') {
    return getConditionError(node) == null;
  }
  return node.children.every(isFilterValid);
}

/**
 * Formats a condition like the Advanced Filter input: `[Country] is any of ("Australia", "Canada")`.
 * Row labels use the `plain` form, since screen readers and typeahead read the brackets and quotes.
 */
export function formatCondition(condition: FilterCondition, plain = false): string {
  const column = getColumn(condition.column);
  if (column == null) {
    return 'New condition';
  }
  const formatValue = (value: string) =>
    plain || column.type === 'number' ? value : JSON.stringify(value);
  const columnLabel = plain ? column.label : `[${column.label}]`;
  const operator = getOperator(column, condition.operator);
  if (operator == null) {
    return columnLabel;
  }
  const prefix = `${columnLabel} ${operator.label}`;
  switch (operator.operand) {
    case 'none':
      return prefix;
    case 'set': {
      const values = condition.values.map(formatValue).join(', ');
      return plain ? `${prefix} ${values}` : `${prefix} (${values})`;
    }
    case 'range':
      return `${prefix} ${formatValue(condition.value)} and ${formatValue(condition.valueTo)}`;
    default:
      return `${prefix} ${formatValue(condition.value)}`;
  }
}

export function getNodeLabel(node: FilterNode): string {
  return node.kind === 'group' ? `${node.join} group` : formatCondition(node, true).trim();
}

/**
 * Formats the whole model, wrapping nested groups that combine several conditions in parentheses.
 * Empty groups are skipped.
 */
export function formatFilter(node: FilterNode, nested = false): string {
  if (node.kind === 'condition') {
    return formatCondition(node);
  }
  const parts = node.children.map((child) => formatFilter(child, true)).filter(Boolean);
  const expression = parts.join(` ${node.join} `);
  return nested && parts.length > 1 ? `(${expression})` : expression;
}

export function getGroupIds(node: FilterNode, result: string[] = []): string[] {
  if (node.kind === 'group') {
    result.push(node.id);
    node.children.forEach((child) => getGroupIds(child, result));
  }
  return result;
}
