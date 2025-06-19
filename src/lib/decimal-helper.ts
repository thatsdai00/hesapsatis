/**
 * A utility module to handle Decimal values without directly importing Prisma's Decimal class
 * This prevents client-side imports of node-specific modules
 */

/**
 * Check if a value is a Decimal-like object
 * Uses duck typing to avoid importing Prisma's Decimal class
 */
export function isDecimalLike(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { toString?: () => string }).toString === 'function' &&
    (value as { constructor?: { name?: string } }).constructor?.name === 'Decimal'
  );
}

/**
 * Convert Decimal objects to strings in data objects
 * Prevents "Only plain objects can be passed to Client Components from Server Components" errors
 */
export function serializeDecimals<T>(data: T): T {
  const json = JSON.stringify(data, (_key, value) => {
    if (isDecimalLike(value)) {
      return (value as { toString: () => string }).toString();
    }
    return value;
  });
  return JSON.parse(json);
}

/**
 * Parse a string to a number if it's numeric
 * Useful for converting serialized Decimal values
 */
export function parseNumericString(value: string): number | string {
  if (typeof value !== 'string') return value;
  
  // Check if it's a valid number string
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') {
    return num;
  }
  
  return value;
} 