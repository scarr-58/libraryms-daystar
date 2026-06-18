/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member, Book, Loan, Reservation, Notification } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  Users, 
  Coins, 
  Bell, 
  LogOut, 
  FileText, 
  Calendar, 
  FolderPlus, 
  ShieldAlert, 
  Upload, 
  Check, 
  X, 
  UserCheck, 
  UserX, 
  RefreshCw 
} from 'lucide-react';

interface LibrarianPortalProps {
  librarian: Member;
  books: Book[];
  members: Member[];
  loans: Loan[];
  reservations: Reservation[];
  notifications: Notification[];
  onLogout: () => void;
  onAddBook: (book: Book) => void;
  onUpdateBookCopies: (bookId: string, totalCopies: number) => void;
  onAddLoan: (loan: Loan) => void;
  onReturnBook: (loanId: string, returnDate: string) => void;
  onRecordFinePaid: (loanId: string) => void;
  onAddNotification: (n: Notification) => void;
  onToggleMemberStatus: (memberId: string) => void;
  onUpdateMemberPhoto: (memberId: string, base64Image: string) => void;
}

export default function LibrarianPortal({
  librarian,
  books,
  members,
  loans,
  reservations,
  notifications,
  onLogout,
  onAddBook,
  onUpdateBookCopies,
  onAddLoan,
  onReturnBook,
  onRecordFinePaid,
  onAddNotification,
  onToggleMemberStatus,
  onUpdateMemberPhoto
}: LibrarianPortalProps) {
  const [activeTab, setActiveTab] = useState<'books' | 'members' | 'loans' | 'broadcasts'>('books');

  // Interactive Form States
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookIsbn, setNewBookIsbn] = useState('');
  const [newBookCategory, setNewBookCategory] = useState('Computer Science');
  const [newBookCopies, setNewBookCopies] = useState<number>(3);
  const [newBookYear, setNewBookYear] = useState<number>(2024);

  // New Loan Form States
  const [loanMemberId, setLoanMemberId] = useState('');
  const [loanBookId, setLoanBookId] = useState('');

  // Broadcast Notification Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState('all');

  // Search/Filters
  const [bookSearch, setBookSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [loanSearch, setLoanSearch] = useState('');

  // Toast alert feedback states
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'fail'; text: string } | null>(null);

  const triggerFeedback = (type: 'ok' | 'fail', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Stats Counters
  const totalBooksCount = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const totalActiveLoansCount = loans.filter((l) => l.returnDate === null).length;
  const overdueLoans = loans.filter((l) => l.returnDate === null && new Date(l.dueDate) < new Date('2026-06-18'));
  const aggregateFinesOutstanding = loans
    .filter((l) => !l.finePaid && l.fineAmount > 0)
    .reduce((sum, current) => sum + current.fineAmount, 0);

  // Submit dynamic manual book registration
  const handleCreateBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim() || !newBookAuthor.trim() || !newBookIsbn.trim()) {
      triggerFeedback('fail', 'Please fill in all book parameters correctly.');
      return;
    }

    const nextId = `B0${books.length + 10}`;
    const newBook: Book = {
      id: nextId,
      title: newBookTitle.trim(),
      author: newBookAuthor.trim(),
      isbn: newBookIsbn.trim(),
      category: newBookCategory,
      totalCopies: newBookCopies,
      availableCopies: newBookCopies,
      publishedYear: newBookYear
    };

    onAddBook(newBook);
    triggerFeedback('ok', `Book "${newBookTitle}" cataloged successfully with ${newBookCopies} units.`);
    
    // Clear registration fields
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewBookIsbn('');
    setNewBookCopies(3);
  };

  // Issue custom new Loan physical hand-out
  const handleIssueLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanMemberId || !loanBookId) {
      triggerFeedback('fail', 'Please pick a valid registered Student and volume.');
      return;
    }

    const selectedStudent = members.find((m) => m.id === loanMemberId);
    const selectedBook = books.find((b) => b.id === loanBookId);

    if (!selectedStudent || !selectedBook) {
      triggerFeedback('fail', 'Validation failed: ID credentials mismatch.');
      return;
    }

    if (selectedStudent.status === 'suspended') {
      triggerFeedback('fail', 'Security Lock: This member is suspended due to unpaid fines.');
      return;
    }

    if (selectedBook.availableCopies <= 0) {
      triggerFeedback('fail', 'Catalog Shortage: No copies of this book are currently on shelf.');
      return;
    }

    // Set up loan date dates
    const today = '2026-06-18';
    const due = new Date();
    due.setDate(due.getDate() + 14); // 14 day hand-out period
    const dueDateStr = due.toISOString().split('T')[0];

    const newLoanObj: Loan = {
      id: `L00${loans.length + 1}`,
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      memberId: selectedStudent.id,
      memberName: selectedStudent.name,
      borrowDate: today,
      dueDate: dueDateStr,
      returnDate: null,
      fineAmount: 0,
      finePaid: false
    };

    onAddLoan(newLoanObj);
    triggerFeedback('ok', `Checked out "${selectedBook.title}" to ${selectedStudent.name}! Due Date: ${dueDateStr}`);
    
    setLoanMemberId('');
    setLoanBookId('');
  };

  // Submit system notification
  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      triggerFeedback('fail', 'Broadcast notification must contain a title and body.');
      return;
    }

    const newBroadcast: Notification = {
      id: `N00${notifications.length + 1}`,
      memberId: notifTarget,
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      date: '2026-06-18',
      read: false
    };

    onAddNotification(newBroadcast);
    triggerFeedback('ok', 'Educational bulletin posted to global user feed.');
    
    setNotifTitle('');
    setNotifMessage('');
  };

  // Member photo file uploader with high performance support for photos up to 50MB
  const handleMemberPicUpload = (memberId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        triggerFeedback('fail', 'Verification photograph exceeds the maximum 50MB size limit.');
        return;
      }
      
      const objectUrl = URL.createObjectURL(file);
      const tempImg = new Image();
      tempImg.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = tempImg.width;
        let height = tempImg.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempImg, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          onUpdateMemberPhoto(memberId, compressed);
          triggerFeedback('ok', `Verification photograph updated for Student ID: ${memberId}`);
        }
        URL.revokeObjectURL(objectUrl);
      };
      tempImg.src = objectUrl;
    }
  };

  return (
    <div id="librarian-portal" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Dynamic Header */}
      <header id="librarian-header" className="bg-slate-900 text-white shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Brand Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 text-white p-2 rounded-xl border border-indigo-400/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-sans font-extrabold text-white text-md tracking-wider">Strathmore Admin Portal</span>
                <span className="text-[10px] text-indigo-300 block -mt-1 font-mono font-bold">LIBRARIAN CONTROL SYSTEMS</span>
              </div>
            </div>

            {/* Quick Stats Banner Header */}
            <div className="hidden lg:flex items-center space-x-6 text-xs text-slate-300 font-mono">
              <div>
                <span>OVERDUE FINES: </span>
                <span className="text-amber-400 font-bold">KES {aggregateFinesOutstanding}</span>
              </div>
              <div className="h-4 w-px bg-slate-800" />
              <div>
                <span>ACTIVE LOANS: </span>
                <span className="text-indigo-400 font-bold">{totalActiveLoansCount}</span>
              </div>
            </div>

            {/* Menu Links */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2.5">
                <img
                  src={librarian.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(librarian.name)}`}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-200">{librarian.name}</span>
              </div>

              <button
                id="btn-lib-logout"
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl transition-all"
                title="Log Out Access"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Stats ribbon */}
      <section className="bg-slate-800 text-slate-300 py-3 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-6 text-xs justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Students Monitored: <strong className="text-white">{members.length}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Total Catalog Volumes: <strong className="text-white">{totalBooksCount}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Overdue Warnings: <strong className="text-amber-400">{overdueLoans.length}</strong></span>
          </div>
        </div>
      </section>

      {/* Primary Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Toast Notification Alert */}
        {feedback && (
          <div className={`p-4 rounded-xl mb-6 shadow-sm border flex items-center space-x-3 transition-all ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/40' : 'bg-rose-50 text-rose-800 border-rose-200/40'
          }`}>
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-bold leading-normal">{feedback.text}</p>
          </div>
        )}

        {/* Tab Controls Navigation */}
        <div className="flex border-b border-slate-200 mb-8 p-1 bg-white rounded-xl border">
          <button
            onClick={() => setActiveTab('books')}
            className={`flex-1 py-3 text-center rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'books' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Books Inventory & Stock
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-3 text-center rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'members' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Students Directory & Profile Photos
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`flex-1 py-3 text-center rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'loans' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Borrowing Ledger & Overdues
          </button>
          <button
            onClick={() => setActiveTab('broadcasts')}
            className={`flex-1 py-3 text-center rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'broadcasts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Announcements
          </button>
        </div>

        {/* Tab Content Display Panels */}
        <div id="tab-content-display">
          
          {/* TAB A: BOOKS INVENTORY */}
          {activeTab === 'books' && (
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Form Col: Add Book */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                  <div className="flex items-center space-x-2 mb-4">
                    <FolderPlus className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-md font-bold text-slate-900">Add Book to Catalog</h3>
                  </div>

                  <form onSubmit={handleCreateBookSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Book Title</label>
                      <input
                        type="text"
                        required
                        value={newBookTitle}
                        onChange={(e) => setNewBookTitle(e.target.value)}
                        placeholder="e.g. Modern Database Systems"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Lead Author</label>
                      <input
                        type="text"
                        required
                        value={newBookAuthor}
                        onChange={(e) => setNewBookAuthor(e.target.value)}
                        placeholder="e.g. Abraham Silberschatz"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">ISBN Code</label>
                        <input
                          type="text"
                          required
                          value={newBookIsbn}
                          onChange={(e) => setNewBookIsbn(e.target.value)}
                          placeholder="978-..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                        <select
                          value={newBookCategory}
                          onChange={(e) => setNewBookCategory(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                        >
                          <option value="Computer Science">Computer Science</option>
                          <option value="Business">Business</option>
                          <option value="Research">Research</option>
                          <option value="Communication">Communication</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Stock Copies</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={newBookCopies}
                          onChange={(e) => setNewBookCopies(Number(e.target.value))}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Publish Year</label>
                        <input
                          type="number"
                          min={1900}
                          max={2026}
                          required
                          value={newBookYear}
                          onChange={(e) => setNewBookYear(Number(e.target.value))}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Release Catalog Listing</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* List Col: Books Listing */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100 mb-6">
                    <div>
                      <h3 className="text-md font-bold text-slate-900">Current Library Catalog Inventory</h3>
                      <p className="text-xs text-slate-500">Track and update active counts and volume statuses on-shelf.</p>
                    </div>
                    {/* Search Input Filter */}
                    <div className="relative max-w-xs">
                      <input
                        type="text"
                        value={bookSearch}
                        onChange={(e) => setBookSearch(e.target.value)}
                        placeholder="Search books..."
                        className="pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 w-full"
                      />
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-50/50">
                          <th className="py-2.5 px-4">Book Title & Author</th>
                          <th className="py-2.5 px-4">ISBN</th>
                          <th className="py-2.5 px-4">Category</th>
                          <th className="py-2.5 px-4 text-center">In-Stock Status</th>
                          <th className="py-2.5 px-4 text-right">Edit Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {books
                          .filter((b) => b.title.toLowerCase().includes(bookSearch.toLowerCase()) || b.author.toLowerCase().includes(bookSearch.toLowerCase()))
                          .map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50/25 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-serif font-bold text-slate-800 text-sm">{b.title}</span>
                                <span className="text-[10px] text-slate-500 block">By {b.author}</span>
                              </td>
                              <td className="py-3 px-4 font-mono text-xs text-slate-500">{b.isbn}</td>
                              <td className="py-3 px-4 text-xs text-slate-600">{b.category}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  b.availableCopies > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {b.availableCopies} of {b.totalCopies} left
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center space-x-1.5">
                                  <button
                                    onClick={() => onUpdateBookCopies(b.id, Math.max(0, b.totalCopies - 1))}
                                    className="p-1 border border-slate-200 text-slate-400 hover:text-slate-800 rounded-md bg-white hover:bg-slate-50 transition-colors"
                                    title="Decrease catalog capacity"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono text-xs font-semibold px-1 text-slate-700">{b.totalCopies}</span>
                                  <button
                                    onClick={() => onUpdateBookCopies(b.id, b.totalCopies + 1)}
                                    className="p-1 border border-slate-200 text-slate-400 hover:text-slate-800 rounded-md bg-white hover:bg-slate-50 transition-colors"
                                    title="Increase catalog capacity"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB B: MEMBERS DIRECTORY / ADDING PROFILE PHOTOS */}
          {activeTab === 'members' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100 mb-6 font-sans">
                <div>
                  <h3 className="text-md font-bold text-slate-900">Student & Librarian Information Directory</h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    Check account statuses and upload/configure verified headshot identification photographs for Strathmore members.
                  </p>
                </div>
                {/* Search */}
                <div className="relative max-w-xs">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search students..."
                    className="pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden w-full"
                  />
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* Directory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members
                  .filter((m) => m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.email.toLowerCase().includes(memberSearch.toLowerCase()))
                  .map((m) => (
                    <div 
                      key={m.id} 
                      className={`p-5 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all ${
                        m.status === 'suspended' ? 'bg-rose-50/20' : 'bg-slate-55/10'
                      }`}
                    >
                      {/* Member Info Card Body */}
                      <div className="flex items-center space-x-4">
                        
                        {/* Interactive Avatar Upload for Librarian (Admin Action) */}
                        <div className="relative group/avatar">
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-200 group-hover/avatar:border-indigo-600 transition-colors bg-slate-100">
                            <img
                              src={m.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`}
                              alt={m.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Admin Overlay Upload Flag */}
                          <label className="absolute inset-0 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleMemberPicUpload(m.id, e)}
                              className="absolute hidden"
                            />
                            <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-full text-[8px] border border-white hover:bg-slate-950 shadow-xs block">
                              <Upload className="w-2.5 h-2.5" />
                            </span>
                          </label>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{m.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                          <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm mr-1.5 font-bold">
                            {m.id}
                          </span>
                          <span className="text-[9px] font-mono uppercase bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm capitalize font-bold">
                            {m.role}
                          </span>
                        </div>
                      </div>

                      {/* Admin action controls */}
                      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-sans">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400 text-[10px]">Verification status:</span>
                          <span className={`text-[10px] font-semibold uppercase ${m.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {m.status}
                          </span>
                        </div>

                        <div className="flex space-x-1.5">
                          {/* Trigger Update Picture manual file link */}
                          <label className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-semibold py-1 px-2 rounded-md cursor-pointer transition-all flex items-center space-x-1">
                            <Upload className="w-3 h-3" />
                            <span>Update Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleMemberPicUpload(m.id, e)}
                              className="absolute hidden"
                            />
                          </label>

                          <button
                            onClick={() => onToggleMemberStatus(m.id)}
                            className={`text-[10px] uppercase font-bold py-1 px-2.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                              m.status === 'active'
                                ? 'bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200/50'
                                : 'bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200/50'
                            }`}
                            title="Toggle User Suspension lock"
                          >
                            {m.status === 'active' ? (
                              <>
                                <UserX className="w-3 h-3" /> Suspend
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" /> Activate
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB C: BORROWING LEDGER & MANUAL LOANS */}
          {activeTab === 'loans' && (
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Checkout Book Form Column */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                  <div className="flex items-center space-x-2 mb-4">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Issue Book (Check-Out)</h3>
                  </div>

                  <form onSubmit={handleIssueLoanSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Select Student</label>
                      <select
                        required
                        value={loanMemberId}
                        onChange={(e) => setLoanMemberId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                      >
                        <option value="">-- Choose student ID --</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.id}) - {m.status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Select Catalog Book</label>
                      <select
                        required
                        value={loanBookId}
                        onChange={(e) => setLoanBookId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                      >
                        <option value="">-- Choose volumes available --</option>
                        {books.map((b) => (
                          <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                            {b.title} ({b.availableCopies}/{b.totalCopies} left)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-xl">
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Default borrowing parameters apply: loan period is exactly <strong>14 days</strong>. System automatically tallies subsequent delays at KES 10/day.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs"
                    >
                      <span>Generate Checkout Receipt</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Outstanding Loans Table Column */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6 font-sans">
                    <div>
                      <h3 className="text-md font-bold text-slate-900">Current Borrowing Activity Ledger</h3>
                      <p className="text-xs text-slate-500">Calculate dues, record physical return events and clear payments.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-50/50">
                          <th className="py-2.5 px-4">Student ID / Name</th>
                          <th className="py-2.5 px-4">Book borrowed</th>
                          <th className="py-2.5 px-4">Due Date</th>
                          <th className="py-2.5 px-4">Fine Delay</th>
                          <th className="py-2.5 px-4 text-right">Librarian Operations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loans.map((loan) => {
                          const isActive = loan.returnDate === null;
                          const isOverdue = isActive && new Date(loan.dueDate) < new Date('2026-06-18');
                          return (
                            <tr key={loan.id} className="hover:bg-slate-50/20 text-xs">
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-slate-800 block text-xs">{loan.memberName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {loan.memberId}</span>
                              </td>
                              <td className="py-3.5 px-4 font-serif text-slate-800">{loan.bookTitle}</td>
                              <td className="py-3.5 px-4 font-mono text-slate-500">
                                <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>{loan.dueDate}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                {loan.fineAmount > 0 ? (
                                  <div className="flex flex-col">
                                    <span className={`font-bold font-mono ${loan.finePaid ? 'text-emerald-500 line-through' : 'text-rose-600'}`}>
                                      KES {loan.fineAmount}
                                    </span>
                                    <span className="text-[9px] text-slate-400">
                                      {loan.finePaid ? 'Paid & Audited' : 'Unpaid Overdue'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Consistent</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex justify-end gap-1.5 w-full">
                                  {isActive ? (
                                    <button
                                      onClick={() => onReturnBook(loan.id, '2026-06-18')}
                                      className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold py-1 px-2.5 rounded-md transition-all whitespace-nowrap"
                                    >
                                      Return Book
                                    </button>
                                  ) : (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-600" /> Closed
                                    </span>
                                  )}

                                  {loan.fineAmount > 0 && !loan.finePaid && (
                                    <button
                                      onClick={() => onRecordFinePaid(loan.id)}
                                      className="bg-amber-500 hover:bg-slate-900 text-white font-bold py-1 px-2.5 rounded-md transition-colors"
                                      title="Clear Student balance manually"
                                    >
                                      Clear Fine
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB D: BROADCAST NOTIFICATIONS */}
          {activeTab === 'broadcasts' && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 mb-6">
                <Bell className="w-5 h-5 text-indigo-600 animate-bounce" />
                <h3 className="text-md font-bold text-slate-900">Push Scholarly Alerts & Announcements</h3>
              </div>

              <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Target Distribution</label>
                  <select
                    value={notifTarget}
                    onChange={(e) => setNotifTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="all">Publish to Global Dashboard (All Members)</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        Private Message to: {m.name} ({m.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Subject Header</label>
                  <input
                    type="text"
                    required
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="e.g. Strathmore Semester Hours Update"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Announcement Body Message</label>
                  <textarea
                    required
                    rows={4}
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Provide relevant information..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Post Public bulletin</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
