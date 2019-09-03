export const RESET: string = '\x1b[0m';
export const RED: string = '\x1b[31m';
export const GREEN: string = '\x1b[32m';
export const YELLOW: string = '\x1b[33m';
export const BLUE: string = '\x1b[34m';
export const MAGENTA: string = '\x1b[35m';
export const CYAN: string = '\x1b[36m';

/**
 * Return an element in a different color
 * @param element The word/ sentence that should be printed in
 * @param color this color
 */
export function inColor(element: string, color: string) {
  return `${color}${element}${RESET}`;
}
