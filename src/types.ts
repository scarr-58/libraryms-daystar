/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'librarian' | 'member';
export type MemberStatus = 'active' | 'suspended';
export type ReservationStatus = 'pending' | 'fulfilled' | 'cancelled';

export interface Member {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Stored password (plain for demo)
  role: Role;
  status: MemberStatus;
  profilePicture: string | null; // Base64 image data string
  joinedDate: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  publishedYear: number;
}

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  borrowDate: string; // ISO format (YYYY-MM-DD)
  dueDate: string;    // ISO format (YYYY-MM-DD)
  returnDate: string | null; // ISO format or null
  fineAmount: number; // KES 10 per day overdue
  finePaid: boolean;
}

export interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  reserveDate: string; // ISO format
  status: ReservationStatus;
}

export interface Fine {
  id: string;
  loanId: string;
  memberId: string;
  memberName: string;
  bookTitle: string;
  amount: number; // KES
  paid: boolean;
  paidDate: string | null;
}

export interface Notification {
  id: string;
  memberId: string; // "all" or specific member ID
  title: string;
  message: string;
  date: string;
  read: boolean;
}
