/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Member, Book, Loan, Reservation, Notification } from './types';
import { 
  initialMembers, 
  initialBooks, 
  initialLoans, 
  initialReservations, 
  initialNotifications 
} from './initialData';
import { 
  getStoredData, 
  setStoredData, 
  calculateFineAmount, 
  CURRENT_DATE 
} from './utils';
import LoginPortal from './components/LoginPortal';
import MemberPortal from './components/MemberPortal';
import LibrarianPortal from './components/LibrarianPortal';
import { BookOpen, Sparkles } from 'lucide-react';

export default function App() {
  // Global Library States
  const [members, setMembers] = useState<Member[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Security session state
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  
  // Setup system first load
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Read from localStorage with fallback
    const storedMembers = getStoredData<Member[]>('strathmore_members', initialMembers);
    const storedBooks = getStoredData<Book[]>('strathmore_books', initialBooks);
    const storedLoans = getStoredData<Loan[]>('strathmore_loans', initialLoans);
    const storedReservations = getStoredData<Reservation[]>('strathmore_reservations', initialReservations);
    const storedNotifications = getStoredData<Notification[]>('strathmore_notifications', initialNotifications);

    // Dynamic dynamic fine sync calculator on system load
    const updatedLoans = storedLoans.map((l) => ({
      ...l,
      fineAmount: calculateFineAmount(l)
    }));

    setMembers(storedMembers);
    setBooks(storedBooks);
    setLoans(updatedLoans);
    setReservations(storedReservations);
    setNotifications(storedNotifications);

    // Read active session if present
    const activeSession = localStorage.getItem('strathmore_active_session');
    if (activeSession) {
      try {
        const parsedSession = JSON.parse(activeSession) as Member;
        // Fetch fresh copy of currentUser in case of profile updates
        const freshUser = storedMembers.find((m) => m.id === parsedSession.id);
        if (freshUser && freshUser.status !== 'suspended') {
          setCurrentUser(freshUser);
        } else {
          localStorage.removeItem('strathmore_active_session');
        }
      } catch (e) {
        localStorage.removeItem('strathmore_active_session');
      }
    }

    setIsInitialized(true);
  }, []);

  // Save changes to LocalStorage instantly on mutations
  const syncToStorage = (
    updatedMembers: Member[],
    updatedBooks: Book[],
    updatedLoans: Loan[],
    updatedReservations: Reservation[],
    updatedNotifications: Notification[]
  ) => {
    setStoredData('strathmore_members', updatedMembers);
    setStoredData('strathmore_books', updatedBooks);
    setStoredData('strathmore_loans', updatedLoans);
    setStoredData('strathmore_reservations', updatedReservations);
    setStoredData('strathmore_notifications', updatedNotifications);
  };

  const handleLoginSuccess = (user: Member) => {
    setCurrentUser(user);
    localStorage.setItem('strathmore_active_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('strathmore_active_session');
  };

  const handleRegisterMember = (newMember: Member) => {
    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);
    syncToStorage(updatedMembers, books, loans, reservations, notifications);
  };

  // Profile picture image handler (Allows student/librarian to add profile picture)
  const handleUpdateProfilePicture = (memberId: string, base64Image: string) => {
    const updatedMembers = members.map((m) => {
      if (m.id === memberId) {
        return { ...m, profilePicture: base64Image };
      }
      return m;
    });

    setMembers(updatedMembers);
    syncToStorage(updatedMembers, books, loans, reservations, notifications);

    // If active user is uploading, update standard session structure
    if (currentUser && currentUser.id === memberId) {
      const updatedUser = { ...currentUser, profilePicture: base64Image };
      setCurrentUser(updatedUser);
      localStorage.setItem('strathmore_active_session', JSON.stringify(updatedUser));
    }
  };

  // Student Books Reservation Event Handler
  const handleReserveBook = (bookId: string) => {
    if (!currentUser) return;

    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    const newReservation: Reservation = {
      id: `R00${reservations.length + 1}`,
      bookId: book.id,
      bookTitle: book.title,
      memberId: currentUser.id,
      memberName: currentUser.name,
      reserveDate: CURRENT_DATE,
      status: 'pending'
    };

    const updatedReservations = [...reservations, newReservation];
    setReservations(updatedReservations);
    syncToStorage(members, books, loans, updatedReservations, notifications);
  };

  // Student Clear Unpaid Fine Trigger Handler
  const handlePayFine = (loanId: string) => {
    const updatedLoans = loans.map((l) => {
      if (l.id === loanId) {
        return { ...l, finePaid: true };
      }
      return l;
    });

    setLoans(updatedLoans);
    syncToStorage(members, books, updatedLoans, reservations, notifications);
  };

  // Librarian Add New Book to System Inventory
  const handleAddBook = (newBook: Book) => {
    const updatedBooks = [...books, newBook];
    setBooks(updatedBooks);
    syncToStorage(members, updatedBooks, loans, reservations, notifications);
  };

  // Librarian Manual Inventory Updates
  const handleUpdateBookCopies = (bookId: string, totalCopies: number) => {
    const updatedBooks = books.map((b) => {
      if (b.id === bookId) {
        const diff = totalCopies - b.totalCopies;
        const freshAvailable = Math.max(0, b.availableCopies + diff);
        return { ...b, totalCopies, availableCopies: freshAvailable };
      }
      return b;
    });

    setBooks(updatedBooks);
    syncToStorage(members, updatedBooks, loans, reservations, notifications);
  };

  // Librarian Checkout Issued Loan Request
  const handleAddLoan = (newLoan: Loan) => {
    // Drop shelf availability count
    const updatedBooks = books.map((b) => {
      if (b.id === newLoan.bookId) {
        return { ...b, availableCopies: Math.max(0, b.availableCopies - 1) };
      }
      return b;
    });

    const updatedLoans = [...loans, newLoan];
    setBooks(updatedBooks);
    setLoans(updatedLoans);
    syncToStorage(members, updatedBooks, updatedLoans, reservations, notifications);
  };

  // Librarian Return Handout Book Event
  const handleReturnBook = (loanId: string, returnDate: string) => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) return;

    // Increase shelf availability count
    const updatedBooks = books.map((b) => {
      if (b.id === targetLoan.bookId) {
        return { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) };
      }
      return b;
    });

    const updatedLoans = loans.map((l) => {
      if (l.id === loanId) {
        const withReturn = { ...l, returnDate };
        // Clean calculate fine
        const fineAmt = calculateFineAmount(withReturn);
        return { ...withReturn, fineAmount: fineAmt };
      }
      return l;
    });

    setBooks(updatedBooks);
    setLoans(updatedLoans);
    syncToStorage(members, updatedBooks, updatedLoans, reservations, notifications);
  };

  // Librarian Settle Fine Manually At circulation counter
  const handleRecordFinePaid = (loanId: string) => {
    const updatedLoans = loans.map((l) => {
      if (l.id === loanId) {
        return { ...l, finePaid: true };
      }
      return l;
    });

    setLoans(updatedLoans);
    syncToStorage(members, books, updatedLoans, reservations, notifications);
  };

  // Librarian Post global broad alert
  const handleAddNotification = (newNotification: Notification) => {
    const updatedNotifications = [...notifications, newNotification];
    setNotifications(updatedNotifications);
    syncToStorage(members, books, loans, reservations, updatedNotifications);
  };

  // Librarian Toggle Student Block status
  const handleToggleMemberStatus = (memberId: string) => {
    const updatedMembers = members.map((m) => {
      if (m.id === memberId) {
        return { ...m, status: m.status === 'active' ? 'suspended' : 'active' };
      }
      return m;
    });

    setMembers(updatedMembers);
    syncToStorage(updatedMembers, books, loans, reservations, notifications);
  };

  // Render Loading block if loading persistence
  if (!isInitialized) {
    return (
      <div id="loader-fallback" className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <BookOpen className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wider font-mono">LOADING DAYSTAR LIBRARY SYSTEM...</p>
      </div>
    );
  }

  // Choose dynamic layout view
  if (!currentUser) {
    return (
      <LoginPortal
        members={members}
        onLoginSuccess={handleLoginSuccess}
        onRegisterMember={handleRegisterMember}
      />
    );
  }

  if (currentUser.role === 'librarian') {
    return (
      <LibrarianPortal
        librarian={currentUser}
        books={books}
        members={members}
        loans={loans}
        reservations={reservations}
        notifications={notifications}
        onLogout={handleLogout}
        onAddBook={handleAddBook}
        onUpdateBookCopies={handleUpdateBookCopies}
        onAddLoan={handleAddLoan}
        onReturnBook={handleReturnBook}
        onRecordFinePaid={handleRecordFinePaid}
        onAddNotification={handleAddNotification}
        onToggleMemberStatus={handleToggleMemberStatus}
        onUpdateMemberPhoto={handleUpdateProfilePicture}
      />
    );
  }

  // Default: Student/Member Portal
  return (
    <MemberPortal
      member={currentUser}
      books={books}
      loans={loans}
      reservations={reservations}
      notifications={notifications}
      onLogout={handleLogout}
      onUpdateProfilePicture={handleUpdateProfilePicture}
      onReserveBook={handleReserveBook}
      onPayFine={handlePayFine}
    />
  );
}
