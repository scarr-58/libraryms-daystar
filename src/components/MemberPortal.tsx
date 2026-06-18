/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member, Book, Loan, Reservation, Notification } from '../types';
import { 
  BookOpen, 
  Calendar, 
  Search, 
  ArrowRight, 
  Clock, 
  AlertCircle, 
  LogOut, 
  Layers, 
  Bell, 
  User, 
  Bookmark, 
  Coins, 
  Key, 
  Upload, 
  Image, 
  BookOpenCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface MemberPortalProps {
  member: Member;
  books: Book[];
  loans: Loan[];
  reservations: Reservation[];
  notifications: Notification[];
  onLogout: () => void;
  onUpdateProfilePicture: (memberId: string, base64Image: string) => void;
  onReserveBook: (bookId: string) => void;
  onPayFine: (loanId: string) => void;
}

export default function MemberPortal({
  member,
  books,
  loans,
  reservations,
  notifications,
  onLogout,
  onUpdateProfilePicture,
  onReserveBook,
  onPayFine
}: MemberPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'my-loans' | 'reservations' | 'profile'>('catalog');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Profile section base64 upload state
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

  // Profile image pan & zoom adjuster crop state
  const [adjusterImageSrc, setAdjusterImageSrc] = useState<string | null>(null);
  const [adjusterZoom, setAdjusterZoom] = useState(100);
  const [adjusterX, setAdjusterX] = useState(0);
  const [adjusterY, setAdjusterY] = useState(0);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imgFitDims, setImgFitDims] = useState<{ w: number; h: number }>({ w: 280, h: 280 });

  // Notifications drawer state
  const [showNotifications, setShowNotifications] = useState(false);

  // Messages / feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'err'; text: string } | null>(null);

  // Filter book recommendations
  const categories = ['All', ...Array.from(new Set(books.map((b) => b.category)))];

  const myLoans = loans.filter((l) => l.memberId === member.id);
  const myReservations = reservations.filter((r) => r.memberId === member.id);
  const myNotifications = notifications.filter((n) => n.memberId === 'all' || n.memberId === member.id);

  // Calculated Fine Sum
  const totalFinesUnpaid = myLoans
    .filter((l) => !l.finePaid && l.fineAmount > 0)
    .reduce((sum, current) => sum + current.fineAmount, 0);

  const activeLoansCount = myLoans.filter((l) => l.returnDate === null).length;

  // Catalog Filtration
  const filteredBooks = books.filter((b) => {
    const matchesSearch = 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesAvailability = !onlyAvailable || b.availableCopies > 0;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        triggerToast('err', 'This image file exceeds 50MB. Please use an image within 50MB.');
        return;
      }
      
      const objectUrl = URL.createObjectURL(file);
      setAdjusterImageSrc(objectUrl);
      setAdjusterZoom(100);
      setAdjusterX(0);
      setAdjusterY(0);
    }
  };

  const handleAdjusterImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    let fitW = 280;
    let fitH = 280;
    if (imgW > imgH) {
      fitH = 280;
      fitW = (imgW / imgH) * 280;
    } else {
      fitW = 280;
      fitH = (imgH / imgW) * 280;
    }
    
    setImgFitDims({ w: fitW, h: fitH });
    setAdjusterX((280 - fitW) / 2);
    setAdjusterY((280 - fitH) / 2);
  };

  const handleZoomChange = (val: number) => {
    const oldScale = adjusterZoom / 100;
    const newScale = val / 100;
    
    const viewportCenter = 140;
    let newX = viewportCenter - (viewportCenter - adjusterX) * (newScale / oldScale);
    let newY = viewportCenter - (viewportCenter - adjusterY) * (newScale / oldScale);
    
    const currentW = imgFitDims.w * newScale;
    const currentH = imgFitDims.h * newScale;
    
    if (currentW >= 280) {
      newX = Math.max(280 - currentW, Math.min(0, newX));
    } else {
      newX = (280 - currentW) / 2;
    }
    
    if (currentH >= 280) {
      newY = Math.max(280 - currentH, Math.min(0, newY));
    } else {
      newY = (280 - currentH) / 2;
    }
    
    setAdjusterZoom(val);
    setAdjusterX(newX);
    setAdjusterY(newY);
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    setDragStart({ x: clientX - adjusterX, y: clientY - adjusterY });
  };
  
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStart) return;
    let newX = clientX - dragStart.x;
    let newY = clientY - dragStart.y;
    
    const currentScale = adjusterZoom / 100;
    const currentW = imgFitDims.w * currentScale;
    const currentH = imgFitDims.h * currentScale;
    
    if (currentW >= 280) {
      newX = Math.max(280 - currentW, Math.min(0, newX));
    } else {
      newX = (280 - currentW) / 2;
    }
    
    if (currentH >= 280) {
      newY = Math.max(280 - currentH, Math.min(0, newY));
    } else {
      newY = (280 - currentH) / 2;
    }
    
    setAdjusterX(newX);
    setAdjusterY(newY);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleDragStart(e.clientX, e.clientY);
    e.preventDefault();
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleSaveCrop = () => {
    if (!adjusterImageSrc) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      const ratio = 400 / 280;
      const scale = adjusterZoom / 100;
      
      const renderX = adjusterX * ratio;
      const renderY = adjusterY * ratio;
      const renderW = imgFitDims.w * scale * ratio;
      const renderH = imgFitDims.h * scale * ratio;
      
      ctx.drawImage(img, renderX, renderY, renderW, renderH);
      const compressed = canvas.toDataURL('image/jpeg', 0.85);
      
      setProfilePicPreview(compressed);
      onUpdateProfilePicture(member.id, compressed);
      triggerToast('success', 'Profile image alignment updated successfully!');
      
      URL.revokeObjectURL(adjusterImageSrc);
      setAdjusterImageSrc(null);
    };
    img.src = adjusterImageSrc;
  };

  const handleCancelCrop = () => {
    if (adjusterImageSrc) {
      URL.revokeObjectURL(adjusterImageSrc);
    }
    setAdjusterImageSrc(null);
  };

  const triggerToast = (type: 'success' | 'err', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleBookReservation = (book: Book) => {
    // If book has available copies, user must issue/request from desk.
    // If out of stock, they reserve
    onReserveBook(book.id);
    triggerToast('success', `Book "${book.title}" reservation logged successfully.`);
  };

  const handlePayFineClick = (loan: Loan) => {
    onPayFine(loan.id);
    triggerToast('success', `KES ${loan.fineAmount} Fine payment cleared successfully!`);
  };

  return (
    <div id="member-portal" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Dynamic Notifications Alert Banner */}
      {totalFinesUnpaid > 0 && (
        <div id="fines-banner" className="bg-rose-600 text-white text-xs py-2 px-4 flex items-center justify-between text-center font-medium animate-pulse">
          <div className="mx-auto flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Attention: You have unpaid overdue library fines totaling KES {totalFinesUnpaid}. Please settle them to maintain active borrowing privileges.</span>
          </div>
        </div>
      )}

      {/* Main Header / Navigation */}
      <header id="member-navbar" className="bg-white border-b border-rose-100 shadow-xs sticky top-0 z-40 navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo Group */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveSubTab('catalog')}>
              <div className="bg-indigo-600 text-white p-2 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-sans font-bold text-slate-900 text-lg tracking-tight">Daystar Library</span>
                <span className="text-[10px] text-slate-400 block -mt-1 font-mono font-medium">STUDENT PORTAL</span>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="hidden md:flex items-center space-x-1">
              <button
                id="btn-nav-catalog"
                onClick={() => setActiveSubTab('catalog')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeSubTab === 'catalog' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                Search Catalog
              </button>
              <button
                id="btn-nav-loans"
                onClick={() => setActiveSubTab('my-loans')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                  activeSubTab === 'my-loans' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                My Loans
                {activeLoansCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-indigo-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
                    {activeLoansCount}
                  </span>
                )}
              </button>
              <button
                id="btn-nav-reservations"
                onClick={() => setActiveSubTab('reservations')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeSubTab === 'reservations' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                My Reservations
              </button>
              <button
                id="btn-nav-profile"
                onClick={() => setActiveSubTab('profile')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeSubTab === 'profile' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                My Profile Panel
              </button>
            </div>

            {/* User Dropdown Profile Actions & Notifications */}
            <div className="flex items-center space-x-4">
              
              {/* Notifications Toggle bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
                  title="Unread Alerts"
                >
                  <Bell className="w-5 h-5" />
                  {myNotifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
                  )}
                </button>

                {/* Notifications Drawer Component */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 py-3 z-50">
                    <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">System Broadcasts</span>
                      <span className="text-[10px] text-slate-400 font-mono">{myNotifications.length} Info</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                      {myNotifications.length === 0 ? (
                        <p className="text-center py-6 text-slate-400 text-xs">No active declarations received.</p>
                      ) : (
                        myNotifications.map((n) => (
                          <div key={n.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <h4 className="text-xs font-semibold text-slate-800">{n.title}</h4>
                              <span className="text-[8px] text-slate-400 font-mono">{n.date}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-normal">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar Trigger Header */}
              <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-100">
                <button 
                  onClick={() => setActiveSubTab('profile')}
                  className="w-9 h-9 rounded-full overflow-hidden border border-indigo-100"
                >
                  <img
                    id="member-avatar-header"
                    src={member.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
                <div className="hidden lg:block text-left text-xs">
                  <span className="font-semibold text-slate-700 block">{member.name}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">ID: {member.id}</span>
                </div>
              </div>

              {/* Log out */}
              <button
                id="btn-logout"
                onClick={onLogout}
                className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                title="logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div className={`p-4 rounded-xl mb-6 shadow-sm border flex items-center space-x-3 transition-all ${
            feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50' : 'bg-rose-50 text-rose-800 border-rose-200/50'
          }`}>
            <CheckCircle className="w-5 h-5" />
            <p className="text-xs font-medium">{feedbackMsg.text}</p>
          </div>
        )}

        {/* Dashboard Stat Overview panels */}
        <div id="quick-stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-mono uppercase tracking-widest">Active Books Held</p>
              <h3 className="text-xl font-bold text-slate-800">{activeLoansCount} Volumes</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${totalFinesUnpaid > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-mono uppercase tracking-widest">Outstanding Fines</p>
              <h3 id="stat-fines" className="text-xl font-bold text-slate-800">KES {totalFinesUnpaid}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-mono uppercase tracking-widest">Reservations</p>
              <h3 className="text-xl font-bold text-slate-800">{myReservations.length} Pending</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-mono uppercase tracking-widest">Status Privileges</p>
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                {member.status}
              </h3>
            </div>
          </div>

        </div>

        {/* Dynamic Sub-tab Views Container */}
        <div id="subtab-views-container">
          
          {/* TAB 1: BOOK CATALOG */}
          {activeSubTab === 'catalog' && (
            <div id="view-catalog" className="space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search books by title, author, or ISBN core code..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                </div>

                {/* Categories Scroll/Select */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium mr-1 font-mono uppercase">Category:</span>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Filter Checkbox */}
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Only Available Books</span>
                </label>
              </div>

              {/* Books Grid Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.length === 0 ? (
                  <div className="col-span-full py-16 bg-white rounded-2xl border border-slate-100 text-center flex flex-col justify-center items-center">
                    <BookOpen className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-slate-500 font-medium">No catalog results matched your active filters or query.</p>
                    <button 
                      onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setOnlyAvailable(false); }}
                      className="text-xs text-indigo-600 font-semibold mt-2 hover:underline"
                    >
                      Reset Catalog Filter parameters
                    </button>
                  </div>
                ) : (
                  filteredBooks.map((book) => {
                    const isAvailable = book.availableCopies > 0;
                    return (
                      <div 
                        key={book.id} 
                        className="bg-white rounded-2xl border border-slate-100 hover:border-slate-300 transition-all shadow-xs hover:shadow-md p-6 flex flex-col justify-between group"
                      >
                        <div>
                          {/* Top row */}
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] uppercase font-mono tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-bold">
                              {book.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider">
                              ISBN: {book.isbn}
                            </span>
                          </div>

                          <h3 className="font-serif text-lg font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                            {book.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            By <span className="font-medium text-slate-700">{book.author}</span>
                          </p>

                          {/* Inventory visual */}
                          <div className="flex items-center space-x-4 mt-5 pb-5 border-b border-slate-50">
                            <div>
                              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Available Status</p>
                              <span className={`text-xs font-bold leading-normal ${isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isAvailable ? `${book.availableCopies} of ${book.totalCopies} left` : 'Out of Stock'}
                              </span>
                            </div>
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{ width: `${(book.availableCopies / book.totalCopies) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action section footer */}
                        <div className="pt-4 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono uppercase">Published: {book.publishedYear}</span>
                          
                          {isAvailable ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] text-slate-400 font-mono mb-1">Pick up at Circulation Desk</span>
                              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Available
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBookReservation(book)}
                              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-slate-900 text-white font-semibold py-2 px-3.5 rounded-xl transition-all text-xs cursor-pointer shadow-xs"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>Reserve Volume</span>
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY LOANS HISTORY */}
          {activeSubTab === 'my-loans' && (
            <div id="view-loans" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 md:p-8">
              
              <div className="border-b border-slate-100 pb-5 mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Active & Past Books Borrowed</h3>
                  <p className="text-slate-500 text-xs mt-1">Overdue library loans accrue fines at KES 10 per calendar day.</p>
                </div>
                <BookOpenCheck className="w-8 h-8 text-indigo-500" />
              </div>

              {myLoans.length === 0 ? (
                <div className="text-center py-16">
                  <HelpCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">You do not have any physical books on loan currently.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-50/50">
                        <th className="py-3 px-4">Book Title</th>
                        <th className="py-3 px-4">Issue Date</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Return Status</th>
                        <th className="py-3 px-4 text-right">Fines (Overdue)</th>
                        <th className="py-3 px-4 text-right">Financial Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                      {myLoans.map((loan) => {
                        const isOverdue = !loan.returnDate && new Date(loan.dueDate) < new Date('2026-06-18');
                        return (
                          <tr key={loan.id} className="hover:bg-slate-50/35 transition-colors">
                            <td className="py-4 px-4 font-medium text-slate-800 font-serif text-sm">
                              {loan.bookTitle}
                              <span className="text-[10px] text-slate-400 block font-mono font-normal">LOAN_ID: {loan.id}</span>
                            </td>
                            <td className="py-4 px-4 text-slate-600 text-xs font-mono">{loan.borrowDate}</td>
                            <td className="py-4 px-4 text-slate-600 text-xs font-mono">
                              <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                                {loan.dueDate}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {loan.returnDate ? (
                                <span className="text-[10px] bg-slate-100 py-1 px-2.5 rounded-full font-semibold text-slate-600 inline-flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Returned on {loan.returnDate}
                                </span>
                              ) : (
                                <span className={`text-[10px] py-1 px-2.5 rounded-full font-semibold inline-flex items-center gap-1 ${
                                  isOverdue ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700 font-normal'
                                }`}>
                                  <Clock className="w-3 h-3" /> {isOverdue ? 'Overdue' : 'Active Duty'}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-bold text-xs text-slate-800">
                              {loan.fineAmount > 0 ? (
                                <span className={loan.finePaid ? 'text-emerald-600 line-through' : 'text-rose-600'}>
                                  KES {loan.fineAmount}
                                </span>
                              ) : 'None'}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {loan.fineAmount > 0 && !loan.finePaid ? (
                                <button
                                  onClick={() => handlePayFineClick(loan)}
                                  className="text-[11px] bg-rose-600 hover:bg-slate-900 text-white font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                                >
                                  Clear Fine
                                </button>
                              ) : loan.finePaid ? (
                                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">Paid Ledger</span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono">Verified Account</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESERVATIONS BOARD */}
          {activeSubTab === 'reservations' && (
            <div id="view-reservations" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
              
              <div className="border-b border-slate-100 pb-5 mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Active Book Reservations</h3>
                  <p className="text-slate-500 text-xs mt-1">If a book catalog copy is fully lent, students register dynamic waitlist holds.</p>
                </div>
                <Bookmark className="w-6 h-6 text-indigo-500" />
              </div>

              {myReservations.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">You do not have any books reserved currently.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myReservations.map((res) => (
                    <div key={res.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-mono text-slate-400 font-bold bg-white border border-slate-100 px-2 py-0.5 rounded-full">RES_ID: {res.id}</span>
                          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md uppercase font-mono tracking-wider">{res.status}</span>
                        </div>
                        <h4 className="font-serif font-bold text-slate-800 mt-2 text-md">{res.bookTitle}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {res.reserveDate}</span>
                        <span className="text-[10px] text-slate-400">Position 1 on queue</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE MANIPULATION & AVATAR EDITING */}
          {activeSubTab === 'profile' && (
            <div id="view-profile" className="grid lg:grid-cols-12 gap-8">
              
              {/* Profile Card & Photo Uploader */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col items-center text-center">
                <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full mb-4">
                  Daystar University ID Card
                </span>

                {/* Main Interactive Avatar Upload Group */}
                <div className="relative group mb-5">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-100 group-hover:border-indigo-100 transition-colors bg-slate-50 shadow-inner relative">
                    <img
                      id="member-avatar-profile"
                      src={member.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload className="w-6 h-6 mb-1 text-slate-100" />
                      <span className="text-[10px] font-semibold tracking-wider font-sans uppercase">Update Photo</span>
                    </div>
                  </div>

                  {/* Hidden Input File Picker */}
                  <label className="absolute inset-0 cursor-pointer">
                    <input
                      type="file"
                      id="profile-pic-uploader"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                      className="absolute hidden"
                    />
                  </label>
                </div>

                <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                <p className="text-xs text-indigo-600 font-mono font-medium mt-1">Unique Student ID: {member.id}</p>
                
                <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 mt-6 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-serif">Status Level</span>
                    <span className="font-semibold text-slate-700 capitalize">{member.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-serif">Member Role</span>
                    <span className="font-semibold text-slate-700 font-mono text-[10px] capitalize bg-indigo-50/60 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{member.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-serif">Date Registered</span>
                    <span className="font-semibold text-slate-700 font-mono">{member.joinedDate}</span>
                  </div>
                </div>

                <div className="mt-6 w-full">
                  <label className="relative flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-4 h-4 mr-2" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                      className="absolute hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-2 italic">Supports direct Drag & Drop files from local disc</p>
                </div>
              </div>

              {/* Accompanying Account Settings Info Form */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xs">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Member Account Information</h3>
                <p className="text-slate-500 text-xs mb-6Leading-normal">These settings are dynamically configured for security and verified credential indexing.</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input
                        type="text"
                        disabled
                        value={member.name}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Registered Email</label>
                      <input
                        type="email"
                        disabled
                        value={member.email}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mt-4 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Dynamic Profile Synchronization</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Setting a customized profile picture helps our Librarians quickly identify you during physical resource pickup at the Athi River and Valley Road circulation desks. This reduces verification times by over 80%.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
                    <button
                      onClick={() => setActiveSubTab('catalog')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:border-slate-300 text-slate-600 transition-colors"
                    >
                      Back to Catalog
                    </button>
                    <button
                      onClick={() => {
                        triggerToast('success', 'Demo Preferences Saved successfully!');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                    >
                      Update Profile Preferences
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

      {adjusterImageSrc && (
        <div 
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none font-sans animate-fade-in"
          onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
          onMouseUp={() => setDragStart(null)}
          onMouseLeave={() => setDragStart(null)}
          onTouchMove={(e) => {
            if (e.touches.length === 1) {
              handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={() => setDragStart(null)}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h4 className="font-serif font-bold text-lg text-slate-950">Position Your Profile Picture</h4>
              <button 
                onClick={handleCancelCrop}
                className="text-slate-400 hover:text-slate-600 text-xl cursor-pointer leading-none"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center bg-slate-50 border-b border-slate-100">
              {/* Circular view port crop */}
              <div 
                className="relative rounded-full overflow-hidden border-4 border-indigo-600 shadow-md bg-slate-300 cursor-move"
                style={{ width: '280px', height: '280px' }}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
              >
                <img 
                  src={adjusterImageSrc}
                  alt="Crop preview source"
                  onLoad={handleAdjusterImageLoad}
                  className="absolute origin-top-left pointer-events-none max-w-none transition-none"
                  style={{
                    width: `${imgFitDims.w}px`,
                    height: `${imgFitDims.h}px`,
                    transform: `translate(${adjusterX}px, ${adjusterY}px) scale(${adjusterZoom / 100})`,
                  }}
                />
              </div>
              
              <p className="text-xs text-slate-500 mt-4 text-center font-medium">Drag the image to move, use the slider below to expand.</p>
              
              {/* Zoom controls */}
              <div className="w-full flex items-center gap-3 mt-4 px-4">
                <span className="text-xs font-semibold text-slate-500 uppercase select-none">A</span>
                <input 
                  type="range"
                  min="100"
                  max="400"
                  value={adjusterZoom}
                  onChange={(e) => handleZoomChange(Number(e.target.value))}
                  className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
                <span className="text-lg font-semibold text-slate-500 uppercase select-none">A</span>
              </div>
            </div>
            
            <div className="px-5 py-3 bg-white flex justify-end gap-3">
              <button 
                onClick={handleCancelCrop}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCrop}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
              >
                Apply Image & Fit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
