export function binarySearchIndex<T>(
  array: T[],
  value: number,
  getKey: (item: T) => number
): number {
  let low = 0;
  let high = array.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const midKey = getKey(array[mid]!);

    if (midKey === value) {
      return mid;
    }

    if (midKey < value) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return -1;
}

export function binaryInsertionIndex<T>(
  array: T[],
  value: number,
  getKey: (item: T) => number
): number {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    if (getKey(array[mid]!) < value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

export function sortedInsert<T>(
  array: T[],
  item: T,
  value: number,
  getKey: (item: T) => number
): void {
  const index = binaryInsertionIndex(array, value, getKey);
  array.splice(index, 0, item);
}
