import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names the way shadcn components expect: conditional classes through
 * `clsx`, then conflicting Tailwind utilities resolved by `tailwind-merge`, so a
 * caller's `className` always beats the component's default.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
