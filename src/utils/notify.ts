let onUnauthorized: (() => void) | null = null;
let onError: (message: string) => void = () => {};

export function setOnUnauthorized(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

export function setOnError(fn: (message: string) => void): void {
  onError = fn;
}

export function notifyUnauthorized(): void {
  onUnauthorized?.();
}

export function notifyError(message: string): void {
  onError(message);
}
