/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member } from '../types';
import { LogIn, UserPlus, Upload, FileText, Sparkles, BookOpen, Key } from 'lucide-react';

interface LoginPortalProps {
  members: Member[];
  onLoginSuccess: (member: Member) => void;
  onRegisterMember: (newMember: Member) => void;
}

export default function LoginPortal({ members, onLoginSuccess, onRegisterMember }: LoginPortalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'member' | 'librarian'>('member');
  const [regPhoto, setRegPhoto] = useState<string | null>(null);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Drag and Drop State for Signup Profile Picture
  const [isDragOver, setIsDragOver] = useState(false);

  // Profile image pan & zoom adjuster crop state for Login Registration Photo
  const [adjusterImageSrc, setAdjusterImageSrc] = useState<string | null>(null);
  const [adjusterZoom, setAdjusterZoom] = useState(100);
  const [adjusterX, setAdjusterX] = useState(0);
  const [adjusterY, setAdjusterY] = useState(0);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imgFitDims, setImgFitDims] = useState<{ w: number; h: number }>({ w: 280, h: 280 });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const found = members.find(
      (m) => m.email.toLowerCase() === email.toLowerCase().trim() && m.passwordHash === password
    );

    if (found) {
      if (found.status === 'suspended') {
        setLoginError('Your library account is suspended. Please contact the librarian.');
        return;
      }
      onLoginSuccess(found);
    } else {
      setLoginError('Invalid email or password.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setRegError('This image file exceeds 50MB. Please use an image within 50MB.');
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
      
      setRegPhoto(compressed);
      
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

  const handleRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setRegError('All fields are required.');
      return;
    }

    if (members.some((m) => m.email.toLowerCase() === regEmail.toLowerCase().trim())) {
      setRegError('An account with this email already exists.');
      return;
    }

    const newMemberId = `M0${members.length + 1}`;
    const newMember: Member = {
      id: newMemberId,
      name: regName.trim(),
      email: regEmail.trim(),
      passwordHash: regPassword,
      role: regRole,
      status: 'active',
      profilePicture: regPhoto,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    onRegisterMember(newMember);
    setRegSuccess(`Account generated successfully for ${newMember.name}! You can now login.`);
    
    // Clear registration fields
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegPhoto(null);
    
    // Switch to login tab after success simulation delay
    setTimeout(() => {
      setActiveTab('login');
      setEmail(newMember.email);
    }, 1800);
  };

  const selectDemoUser = (m: Member) => {
    setEmail(m.email);
    setPassword(m.passwordHash);
  };

  return (
    <div id="login-container" className="min-h-screen grid lg:grid-cols-12 bg-slate-50">
      {/* Branding Column */}
      <div id="branding-panel" className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center space-x-3 z-10">
          <div className="bg-indigo-600/30 p-2.5 rounded-xl border border-indigo-400/20 backdrop-blur-sm">
            <BookOpen className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg tracking-wider text-indigo-100 uppercase">Strathmore</h1>
            <p className="text-xs text-indigo-300 font-mono tracking-widest">Library System</p>
          </div>
        </div>

        {/* Hero Visual Middle */}
        <div id="hero-graphic" className="my-12 lg:my-0 space-y-6 z-10 max-w-sm">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modern Portal Platform v2.0</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-sans tracking-tight leading-tight font-extrabold text-white">
            Access Thousands of Scholarly Resources
          </h2>
          <p className="text-indigo-200/80 text-sm leading-relaxed">
            Manage your books, read research articles, browse catalog reservations, pay library fines via automated ledger system seamlessly.
          </p>
          <div className="pt-2 flex items-center space-x-4">
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((m, idx) => (
                <img
                  key={m.id}
                  className="w-8 h-8 rounded-full border-2 border-slate-900 object-cover"
                  src={m.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
            <span className="text-xs text-indigo-300 font-medium">Joined by 120+ students today</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-indigo-400 font-mono z-10 flex flex-col gap-1">
          <p>© 2026 Strathmore University Libraries</p>
          <p>Nairobi & Athi River Campuses</p>
        </div>
      </div>

      {/* Forms Column */}
      <div id="form-panel" className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-12 lg:p-16 xl:p-24 bg-white">
        <div className="max-w-md w-full mx-auto">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 mb-8 p-1 bg-slate-100/80 rounded-lg">
            <button
              id="tab-login"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-center rounded-md text-sm font-medium transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-register"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 text-center rounded-md text-sm font-medium transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Quick Register
            </button>
          </div>

          {activeTab === 'login' ? (
            <div id="login-section">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h3>
                <p className="text-slate-500 text-sm mt-1">Please enter your credentials to access your dashboard.</p>
              </div>

              {loginError && (
                <div id="login-error" className="bg-red-50 text-red-700 text-xs px-4 py-3 rounded-xl border border-red-200/50 mb-4 font-medium">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-sm transition-colors"
                    placeholder="name@strathmore.edu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-sm transition-colors"
                      placeholder="••••••••"
                    />
                    <Key className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-login-submit"
                  className="w-full inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors cursor-pointer text-sm shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Access Dashboard</span>
                </button>
              </form>

              {/* Demo Section */}
              <div className="mt-8 pt-8 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Demo Accounts (Select to Autofill)
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectDemoUser(m)}
                      className="text-left py-2.5 px-3.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={m.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {m.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {m.email}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                        m.role === 'librarian' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                      }`}>
                        {m.role === 'librarian' ? 'Librarian' : 'Student'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div id="register-section">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Create an Account</h3>
                <p className="text-slate-500 text-sm mt-1">Register as a Student or Librarian to manage loans instantly.</p>
              </div>

              {regError && (
                <div className="bg-red-50 text-red-700 text-xs px-4 py-3 rounded-xl border border-red-200/30 mb-4 font-medium">
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div className="bg-emerald-50 text-emerald-700 text-xs px-4 py-3 rounded-xl border border-emerald-200/30 mb-4 font-medium">
                  {regSuccess}
                </div>
              )}

              <form onSubmit={handleRegSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 pb-1 bg-slate-100/50 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRegRole('member')}
                    className={`py-1.5 text-center text-xs font-medium rounded-md transition-all ${
                      regRole === 'member' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Student / Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('librarian')}
                    className={`py-1.5 text-center text-xs font-medium rounded-md transition-all ${
                      regRole === 'librarian' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Librarian
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-sm transition-colors"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-sm transition-colors"
                    placeholder="yourname@strathmore.edu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-sm transition-colors"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                {/* Profile Picture Upload Section */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Profile Picture Verification
                  </label>
                  
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {regPhoto ? (
                        <img
                          src={regPhoto}
                          alt="Preview"
                          className="w-16 h-16 rounded-full border border-slate-300 object-cover bg-slate-100"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
                          None
                        </div>
                      )}
                      {regPhoto && (
                        <button
                          type="button"
                          onClick={() => setRegPhoto(null)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 text-[8px] leading-none hover:bg-red-600 transition-colors shadow-xs"
                          title="Remove Image"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <label className="relative inline-flex items-center justify-center bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 shadow-xs cursor-pointer transition-colors w-full">
                        <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Support JPG, PNG or WebP files. Recommend 1:1 square ratio image.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-register-submit"
                  className="w-full inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl transition-colors cursor-pointer text-sm shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

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
              <h4 className="font-serif font-bold text-lg text-slate-950">Position Your Profile Photo</h4>
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
