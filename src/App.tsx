import React, { useState, useEffect, useMemo } from 'react';
import {
  UserAccount,
  UserSession,
} from './types';
import {
  parseAll,
  parseNumberTokens,
} from './utils/lotteryParser';
import {
  getUsers,
  saveUsers,
  getSession,
  saveSession,
  clearSession,
  LOCAL_STORAGE_KEYS,
  DEFAULT_SAMPLE_BET_TEXT,
} from './utils/storage';
import { DEFAULT_WEBAPP_URL } from './utils/googleSheetService';

import { Header } from './components/Header';
import { BetEntryPanel } from './components/BetEntryPanel';
import { SummaryReceiptCard } from './components/SummaryReceiptCard';
import { GoogleSheetActionBar } from './components/GoogleSheetActionBar';
import { TablesView } from './components/TablesView';
import { SyntaxGuideModal } from './components/SyntaxGuideModal';
import { AdminModal } from './components/AdminModal';
import { LoginModal } from './components/LoginModal';

export default function App() {
  // State for Users & Session
  const [users, setUsers] = useState<UserAccount[]>(getUsers);
  const [session, setSession] = useState<UserSession | null>(getSession);

  // Modals state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Live ticket clock
  const [ticketTime, setTicketTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      const p = (n: number) => (n < 10 ? '0' + n : String(n));
      setTicketTime(
        `#${p(d.getDate())}${p(d.getMonth() + 1)}${d.getFullYear()} ${p(
          d.getHours()
        )}:${p(d.getMinutes())}`
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 10000);
    return () => clearInterval(timer);
  }, []);

  // Form Inputs State (Persisted in localStorage)
  const [betText, setBetText] = useState(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.BET_TEXT) ?? DEFAULT_SAMPLE_BET_TEXT;
  });

  const [bannedText, setBannedText] = useState(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.BANNED_TEXT) ?? '89';
  });

  const [commissionPct, setCommissionPct] = useState<number>(() => {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.COMMISSION_PCT);
    return raw ? parseFloat(raw) : 20;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.BET_TEXT, betText);
  }, [betText]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.BANNED_TEXT, bannedText);
  }, [bannedText]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.COMMISSION_PCT, String(commissionPct));
  }, [commissionPct]);

  // Current logged in user account details
  const currentUserAccount = useMemo(() => {
    if (!session) return users.find((u) => u.username === 'bk') || users[0];
    return users.find((u) => u.username === session.username) || null;
  }, [session, users]);

  // Banned numbers set
  const bannedSet = useMemo(() => {
    const tokens = parseNumberTokens(bannedText);
    return new Set(tokens);
  }, [bannedText]);

  // Parse result (Calculation engine)
  const parseResult = useMemo(() => {
    return parseAll(betText, bannedSet);
  }, [betText, bannedSet]);

  const rows = parseResult.rows;
  const warnings = parseResult.warnings;

  // Calculate totals
  const { totalAll, totalBanned } = useMemo(() => {
    let totAll = 0;
    let totBanned = 0;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].banned) totBanned += rows[i].subtotal;
      else totAll += rows[i].subtotal;
    }
    return { totalAll: totAll, totalBanned: totBanned };
  }, [rows]);

  // Handle user actions
  const handleLoginSuccess = (username: string) => {
    const found = users.find((u) => u.username === username);
    const newSession: UserSession = {
      username: found?.username || username,
      expiry: found?.expiry,
      sheetUrl: found?.sheetUrl,
      sheetTab: found?.sheetTab,
      checkedAt: Date.now(),
    };
    saveSession(newSession);
    setSession(newSession);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  const handleAddOrUpdateUser = (updatedUser: UserAccount) => {
    const exists = users.some((u) => u.username === updatedUser.username);
    let nextUsers: UserAccount[];
    if (exists) {
      nextUsers = users.map((u) => (u.username === updatedUser.username ? updatedUser : u));
    } else {
      nextUsers = [...users, updatedUser];
    }
    setUsers(nextUsers);
    saveUsers(nextUsers);

    // If active session is the updated user, sync session state
    if (session && session.username === updatedUser.username) {
      const newSession: UserSession = {
        ...session,
        expiry: updatedUser.expiry,
        sheetUrl: updatedUser.sheetUrl,
        sheetTab: updatedUser.sheetTab,
      };
      saveSession(newSession);
      setSession(newSession);
    }
  };

  const handleDeleteUser = (username: string) => {
    if (username === 'bk') return; // Cannot delete primary admin
    const nextUsers = users.filter((u) => u.username !== username);
    setUsers(nextUsers);
    saveUsers(nextUsers);
    if (session?.username === username) {
      handleLogout();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* Container Wrap */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <Header
          session={session}
          currentUserAccount={currentUserAccount}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={handleLogout}
          onToggleGuide={() => setIsGuideOpen(true)}
          ticketTime={ticketTime}
        />

        {/* 1. Google Sheet Action Bar (MOVED UP FOR EASY ACCESS) */}
        <GoogleSheetActionBar
          session={session}
          currentUserAccount={currentUserAccount}
          webAppUrl={DEFAULT_WEBAPP_URL}
          totalAllNonBanned={totalAll}
          bannedSet={bannedSet}
        />

        {/* 2. Main Grid: Bet Entry Input (Left) & Ticket Summary Receipt (Right) */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Bet Entry Input Panel (Textarea with hidden text syntax explanation) */}
          <div className="lg:col-span-7">
            <BetEntryPanel
              betText={betText}
              onBetTextChange={setBetText}
              bannedText={bannedText}
              onBannedTextChange={setBannedText}
              commissionPct={commissionPct}
              onCommissionPctChange={setCommissionPct}
              onCalculate={() => {
                // Trigger re-render / calculation toast if needed
              }}
              onClear={() => setBetText('')}
              onLoadSample={() => setBetText(DEFAULT_SAMPLE_BET_TEXT)}
              onOpenGuide={() => setIsGuideOpen(true)}
              warnings={warnings}
            />
          </div>

          {/* Ticket Summary Receipt Card (Right) */}
          <div className="lg:col-span-5">
            <SummaryReceiptCard
              totalAll={totalAll}
              totalBanned={totalBanned}
              commissionPct={commissionPct}
              onCommissionChange={setCommissionPct}
              ticketTime={ticketTime}
              activeUsername={session?.username || 'Guest'}
            />
          </div>
        </div>

        {/* 3. Detailed Tables View (Grouped & Raw) */}
        <TablesView rows={rows} />

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-900 text-center text-xs text-slate-500 font-mono">
          <p>
            ຕູ້ຄິດໄລ່ຫວຍ & ຈັດການຍອດສົ່ງ Google Sheet (Lao Lottery System) · ຄິດໄລ່ຝັ່ງເບຼົາເຊີ 100% ປອດໄພ
          </p>
        </footer>
      </div>

      {/* Modals */}
      <SyntaxGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onApplyExample={(example) => setBetText(example)}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        users={users}
        onAddOrUpdateUser={handleAddOrUpdateUser}
        onDeleteUser={handleDeleteUser}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        users={users}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
