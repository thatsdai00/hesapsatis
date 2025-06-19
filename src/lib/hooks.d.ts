/**
 * Type declarations for custom hooks
 */

/**
 * A hook that debounces a value.
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T; 