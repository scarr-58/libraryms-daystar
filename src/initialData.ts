/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member, Book, Loan, Reservation, Notification } from './types';

export const initialMembers: Member[] = [
  {
    id: "M001",
    name: "Dr. Grace Mwangi",
    email: "grace.mwangi@strathmore.edu",
    passwordHash: "pass123",
    role: "librarian",
    status: "active",
    profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
    joinedDate: "2023-01-15"
  },
  {
    id: "M002",
    name: "Oscar Tanui",
    email: "oscar.tanui@strathmore.edu",
    passwordHash: "pass123",
    role: "member",
    status: "active",
    profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    joinedDate: "2024-02-10"
  },
  {
    id: "M003",
    name: "Amina Khalid",
    email: "amina.khalid@strathmore.edu",
    passwordHash: "pass123",
    role: "member",
    status: "active",
    profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    joinedDate: "2024-03-01"
  },
  {
    id: "M004",
    name: "David Kiprop",
    email: "david.kiprop@strathmore.edu",
    passwordHash: "pass123",
    role: "member",
    status: "suspended",
    profilePicture: null,
    joinedDate: "2023-11-20"
  }
];

export const initialBooks: Book[] = [
  {
    id: "B001",
    title: "Introduction to Computer Science",
    author: "Grace Hopper",
    isbn: "978-0131103627",
    category: "Computer Science",
    totalCopies: 5,
    availableCopies: 3,
    publishedYear: 2020
  },
  {
    id: "B002",
    title: "Strategic Management & Planning",
    author: "Michael Porter",
    isbn: "978-0029253502",
    category: "Business",
    totalCopies: 3,
    availableCopies: 2,
    publishedYear: 2018
  },
  {
    id: "B003",
    title: "Research Methods in Social Sciences",
    author: "C.R. Kothari",
    isbn: "978-8122436235",
    category: "Research",
    totalCopies: 8,
    availableCopies: 7,
    publishedYear: 2021
  },
  {
    id: "B004",
    title: "The Art of Public Speaking",
    author: "Dale Carnegie",
    isbn: "978-1508215325",
    category: "Communication",
    totalCopies: 4,
    availableCopies: 4,
    publishedYear: 2019
  },
  {
    id: "B005",
    title: "Database Management Systems",
    author: "Raghu Ramakrishnan",
    isbn: "978-0072465631",
    category: "Computer Science",
    totalCopies: 3,
    availableCopies: 1,
    publishedYear: 2003
  }
];

export const initialLoans: Loan[] = [
  {
    id: "L001",
    bookId: "B001",
    bookTitle: "Introduction to Computer Science",
    memberId: "M002",
    memberName: "Oscar Tanui",
    borrowDate: "2026-06-01",
    dueDate: "2026-06-15",
    returnDate: null,
    fineAmount: 30, // 3 days overdue (assume current date is 2026-06-18)
    finePaid: false
  },
  {
    id: "L002",
    bookId: "B005",
    bookTitle: "Database Management Systems",
    memberId: "M002",
    memberName: "Oscar Tanui",
    borrowDate: "2026-06-10",
    dueDate: "2026-06-24",
    returnDate: null,
    fineAmount: 0,
    finePaid: false
  },
  {
    id: "L003",
    bookId: "B002",
    bookTitle: "Strategic Management & Planning",
    memberId: "M003",
    memberName: "Amina Khalid",
    borrowDate: "2026-05-15",
    dueDate: "2026-05-29",
    returnDate: "2026-06-05", // Returned late
    fineAmount: 70, // 7 days late
    finePaid: true
  },
  {
    id: "L004",
    bookId: "B005",
    bookTitle: "Database Management Systems",
    memberId: "M004",
    memberName: "David Kiprop",
    borrowDate: "2026-05-01",
    dueDate: "2026-05-15",
    returnDate: null,
    fineAmount: 340, // Overdue by loads
    finePaid: false
  }
];

export const initialReservations: Reservation[] = [
  {
    id: "R001",
    bookId: "B001",
    bookTitle: "Introduction to Computer Science",
    memberId: "M003",
    memberName: "Amina Khalid",
    reserveDate: "2026-06-16",
    status: "pending"
  }
];

export const initialNotifications: Notification[] = [
  {
    id: "N001",
    memberId: "all",
    title: "Library Semester Hours",
    message: "Strathmore University Library will remain open from 8:00 AM to 10:00 PM on weekdays and 9:00 AM to 5:00 PM on Saturdays.",
    date: "2026-06-12",
    read: false
  },
  {
    id: "N002",
    memberId: "M002",
    title: "Overdue Book Reminder",
    message: "Your loan for 'Introduction to Computer Science' is overdue. Please return it to avoid further fines (KES 10/day).",
    date: "2026-06-16",
    read: false
  }
];
