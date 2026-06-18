/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Loan } from './types';

// Standard current date set to 2026-06-18 as per metadata
export const CURRENT_DATE = '2026-06-18';

/**
 * Calculates fine amount for a given loan based on CURRENT_DATE.
 * Overdue rate = KES 10 per day after due date.
 */
export function calculateFineAmount(loan: Loan): number {
  if (loan.finePaid) return loan.fineAmount;

  const endStr = loan.returnDate || CURRENT_DATE;
  const dueDate = new Date(loan.dueDate);
  const endDate = new Date(endStr);

  const diffTime = endDate.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return diffDays * 10; // KES 10 per day
  }
  return 0;
}

/**
 * Helper to read from LocalStorage or return default
 */
export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    console.error(`Error reading key ${key} from storage`, e);
    return defaultValue;
  }
}

/**
 * Helper to write to LocalStorage
 */
export function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing key ${key} to storage`, e);
  }
}
