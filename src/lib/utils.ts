import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: number | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(typeof date === 'number' ? new Date(date) : date);
}

export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})/g, '$1 ').trim();
}

export function maskCardNumber(cardNumber: string): string {
  if (cardNumber.length < 8) return cardNumber;
  const last4 = cardNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
