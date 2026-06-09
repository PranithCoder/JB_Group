import React, { useState } from 'react';
import { db } from '../lib/db';
import { Scissors, ShieldAlert, Sparkles, Mail, Lock, User, Check, ArrowLeft, Key, UserCheck } from 'lucide-react';

export default function WelcomePortal({ onLoginAdmin, onLoginTailor }) {
  const [portalMode, setPortalMode] = useState('select'); // select | tailor_list | tailor_pin | admin_login
  const [selectedTailor, setSelectedTailor] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const staff = db.getStaff().filter(s => s.role !== 'Store Assistant');

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) {
      return { title: 'Good Morning!', subtitle: 'Wishing you a productive day at the shop.' };
    } else if (hours >= 12 && hours < 17) {
      return { title: 'Good Afternoon!', subtitle: 'Welcome to the workshop hub.' };
    } else {
      return { title: 'Good Evening!', subtitle: 'Thank you for your dedicated service tonight.' };
    }
  };

  const greeting = getGreeting();

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const emailClean = adminEmail.trim().toLowerCase();
    const passClean = adminPassword.trim();

    if (passClean !== 'admin123') {
      setErrorMsg('Incorrect password. Please use admin123.');
      triggerShake();
      return;
    }

    const users = db.getUsers();
    let matchedUser = users.find(u => u.email && u.email.toLowerCase() === emailClean);

    if (!matchedUser) {
      if (emailClean === 'officer@jbgroup.com' || emailClean === 'abi@jbgroup.com') {
        matchedUser = users.find(u => u.role === 'officer');
      } else if (emailClean === 'admin@jbgroup.com' || emailClean === 'manager@jbgroup.com' || emailClean === 'thuvaragan@jbgroup.com') {
        matchedUser = users.find(u => u.role === 'manager');
      } else if (emailClean === 'josephtheepan@jbgroup.com' || emailClean === 'boss@jbgroup.com') {
        matchedUser = users.find(u => u.role === 'boss');
      } else if (emailClean === 'superadmin@jbgroup.com' || emailClean === 'super@jbgroup.com' || emailClean === 'pranith@jbgroup.com') {
        matchedUser = users.find(u => u.role === 'super_admin');
      }
    }

    if (!matchedUser) {
      setErrorMsg('Unauthorized admin email. Please check your credentials.');
      triggerShake();
      return;
    }

    if (matchedUser.status === 'Suspended') {
      setErrorMsg('This account has been deactivated / suspended. Please contact the administrator.');
      triggerShake();
      return;
    }

    onLoginAdmin(matchedUser.role);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleKeyPress = (num) => {
    setErrorMsg('');
    if (pinInput.length < 4) {
      const newInput = pinInput + num;
      setPinInput(newInput);
      
      if (newInput.length === 4) {
        // Automatically check PIN
        const targetPin = selectedTailor.pin || '1234';
        if (newInput === targetPin) {
          onLoginTailor(selectedTailor.id);
        } else {
          setTimeout(() => {
            setErrorMsg('Invalid Security PIN. Please try again.');
            setPinInput('');
            triggerShake();
          }, 300);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMsg('');
  };

  const getBackgroundClass = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) {
      return 'portal-bg-morning';
    } else if (hours >= 12 && hours < 17) {
      return 'portal-bg-afternoon';
    } else {
      return 'portal-bg-evening';
    }
  };

  const bgClass = getBackgroundClass();

  return (
    <div className={`welcome-portal-container ${bgClass}`} style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      fontFamily: 'var(--font-sans)',
      color: '#f8fafc',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background visual floating glowing orbs */}
      <div className="portal-orb-1"></div>
      <div className="portal-orb-2"></div>
      <div className="portal-orb-3"></div>

      <div style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '28px',
        boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        padding: '2.5rem',
        zIndex: 10,
        transition: 'all 0.35s ease'
      }} className={`portal-card ${isShaking ? 'shake-animation' : ''}`}>
        
        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1rem' }}>
            <Sparkles size={16} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              JB Groups (Pvt) Ltd
            </span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0, background: 'linear-gradient(to right, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {portalMode === 'select' ? greeting.title : 
             portalMode === 'tailor_list' ? 'Select Your Profile' : 
             portalMode === 'tailor_pin' ? `Enter Security PIN` : 'Admin Portal Login'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: 0 }}>
            {portalMode === 'select' ? greeting.subtitle : 
             portalMode === 'tailor_list' ? 'Choose your name to clock in for your shift.' : 
             portalMode === 'tailor_pin' ? `Verify credentials for ${selectedTailor?.name}` : 'Enter your email and password to log in.'}
          </p>
        </div>

        {errorMsg && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: '#fca5a5', 
            borderRadius: '12px', 
            padding: '0.75rem 1rem', 
            fontSize: '0.825rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '1.5rem' 
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dynamic portal pages rendered inside an animated fading container */}
        <div className="portal-content-fade" key={portalMode}>
          {/* MODE 1: Select Portal */}
          {portalMode === 'select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <button 
                onClick={() => setPortalMode('tailor_list')}
                className="portal-tile-tailor"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  width: '100%',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#fff'
                }}
              >
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '12px' }}>
                  <Scissors size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Tailor Workstation</h3>
                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Clock in, manage cutting/stitching and claim commissions.</p>
                </div>
              </button>

              <button 
                onClick={() => setPortalMode('admin_login')}
                className="portal-tile-admin"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  width: '100%',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#fff'
                }}
              >
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', borderRadius: '12px' }}>
                  <UserCheck size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Administration & Manager</h3>
                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Manage orders, payroll roster, inventory, approvals & audit logs.</p>
                </div>
              </button>
            </div>
          )}

          {/* MODE 2: Tailor List */}
          {portalMode === 'tailor_list' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {staff.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => {
                      setSelectedTailor(t);
                      setPinInput('');
                      setPortalMode('tailor_pin');
                    }}
                    className="tailor-bubble"
                  >
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.4rem',
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                      boxShadow: '0 4px 10px rgba(16,185,129,0.1)'
                    }}>
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.name}</div>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.125rem', textTransform: 'capitalize' }}>{t.role}</div>
                    </div>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setPortalMode('select')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  width: '100%',
                  padding: '0.5rem',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                <ArrowLeft size={16} /> Back to Main Portal
              </button>
            </div>
          )}

          {/* MODE 3: Tailor PIN keypad */}
          {portalMode === 'tailor_pin' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Key size={16} style={{ color: '#34d399' }} />
                <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>Secure Keypad Verification</span>
              </div>

              {/* Password Dots Indicator */}
              <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2rem' }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: pinInput.length > i ? '#34d399' : 'rgba(255, 255, 255, 0.1)',
                    border: pinInput.length > i ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: pinInput.length > i ? '0 0 10px rgba(52,211,153,0.6)' : 'none',
                    transition: 'all 0.2s ease'
                  }} />
                ))}
              </div>

              {/* Custom Keypad Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '0.875rem', 
                width: '100%', 
                maxWidth: '280px',
                marginBottom: '1.75rem'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button 
                    key={num} 
                    type="button"
                    onClick={() => handleKeyPress(num)}
                    className="keypad-btn"
                  >
                    {num}
                  </button>
                ))}
                <button 
                  type="button"
                  onClick={handleClear}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#f87171',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '64px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#f87171'}
                >
                  Clear
                </button>
                <button 
                  type="button"
                  onClick={() => handleKeyPress(0)}
                  className="keypad-btn"
                >
                  0
                </button>
                <button 
                  type="button"
                  onClick={handleBackspace}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '64px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  Back
                </button>
              </div>

              <button 
                onClick={() => {
                  setPortalMode('tailor_list');
                  setErrorMsg('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  width: '100%',
                  padding: '0.5rem',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                <ArrowLeft size={16} /> Choose different tailor
              </button>
            </div>
          )}

          {/* MODE 4: Admin Login Form */}
          {portalMode === 'admin_login' && (
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>Admin Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="email"
                    required
                    placeholder="e.g. admin@jbgroup.com"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '0.625rem 1rem 0.625rem 2.5rem',
                      color: '#fff',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border 0.2s ease'
                    }}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>Secret Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="password"
                    required
                    placeholder="admin123"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '0.625rem 1rem 0.625rem 2.5rem',
                      color: '#fff',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border 0.2s ease'
                    }}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                style={{
                  width: '100%',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  marginTop: '0.5rem'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Secure Login & Access
              </button>

              <button 
                type="button"
                onClick={() => {
                  setPortalMode('select');
                  setErrorMsg('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  width: '100%',
                  padding: '0.5rem',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                <ArrowLeft size={16} /> Back to Main Portal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
