import React, { useState } from 'react';
import { UserAccount, UserSession } from '../types';
import { sendEntriesToGoogleSheet } from '../utils/googleSheetService';
import { parseAll } from '../utils/lotteryParser';
import {
  Send,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface GoogleSheetActionBarProps {
  session: UserSession | null;
  currentUserAccount?: UserAccount | null;
  webAppUrl: string;
  totalAllNonBanned: number;
  bannedSet: Set<string>;
  onRefreshData?: () => void;
}

export const GoogleSheetActionBar: React.FC<GoogleSheetActionBarProps> = ({
  session,
  currentUserAccount,
  webAppUrl,
  totalAllNonBanned,
  bannedSet,
}) => {
  const [quickLine, setQuickLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const activeUsername = session?.username || 'Guest';
  const targetSheetUrl = currentUserAccount?.sheetUrl;
  const targetSheetTab = currentUserAccount?.sheetTab || 'No1.';

  // Quick single line send
  const handleQuickSend = async () => {
    if (!quickLine.trim()) {
      setStatusMsg({ type: 'error', text: 'ກະລຸນາພິມລາຍການກ່ອນ (ເຊັ່ນ 11,51,91=20)' });
      return;
    }

    const parsed = parseAll(quickLine, bannedSet);
    if (parsed.rows.length === 0) {
      setStatusMsg({
        type: 'error',
        text: 'ອ່ານລາຍການບໍ່ອອກ: ' + (parsed.warnings[0] || 'ຮູບແບບບໍ່ຖືກຕ້ອງ'),
      });
      return;
    }

    const entries = parsed.rows.map((r) => ({
      number: r.number,
      price: r.unitValue,
    }));

    setLoading(true);
    setStatusMsg({ type: 'info', text: 'ກຳລັງສົ່ງເຂົ້າ Google Sheet...' });

    const result = await sendEntriesToGoogleSheet(
      {
        action: 'addEntries',
        token: 'bk123',
        username: activeUsername,
        sheetUrl: targetSheetUrl,
        sheetTab: targetSheetTab,
        startRow: 18,
        colIndex: 'B',
        colNumber: 'C',
        colPrice: 'D',
        entries,
      },
      webAppUrl
    );

    setLoading(false);

    if (result.ok) {
      setStatusMsg({
        type: 'success',
        text: `ສົ່ງສຳເລັດ ${result.written || entries.length} ລາຍການ ເຂົ້າຊີດຂອງ ${activeUsername} (${targetSheetTab}) ✓`,
      });
      setQuickLine('');
    } else {
      setStatusMsg({
        type: 'error',
        text: 'ຜິດພາດ: ' + (result.error || 'ບໍ່ສາມາດສົ່ງຂໍ້ມູນໄດ້'),
      });
    }
  };

  // Send Total Summary (ຍອດລວມບໍ່ລວມເລກຫ້າມ)
  const handleSendTotalSummary = async () => {
    if (!totalAllNonBanned || totalAllNonBanned <= 0) {
      setStatusMsg({
        type: 'error',
        text: 'ຍັງບໍ່ມີຍອດລວມ — ກະລຸນາປ້ອນເລກ ແລະ ກົດ "ຄິດໄລ່ຍອດ" ກ່ອນ',
      });
      return;
    }

    setLoading(true);
    setStatusMsg({
      type: 'info',
      text: `ກຳລັງສົ່ງຍອດລວມ ${totalAllNonBanned.toLocaleString()} ກີບ ເຂົ້າ Google Sheet ຂອງ ${activeUsername}...`,
    });

    const entries = [{ number: '', price: totalAllNonBanned }];

    const result = await sendEntriesToGoogleSheet(
      {
        action: 'addEntries',
        token: 'bk123',
        username: activeUsername,
        sheetUrl: targetSheetUrl,
        sheetTab: targetSheetTab,
        startRow: 18,
        colIndex: 'B',
        colNumber: 'C',
        colPrice: 'D',
        entries,
      },
      webAppUrl
    );

    setLoading(false);

    if (result.ok) {
      setStatusMsg({
        type: 'success',
        text: `ສົ່ງຍອດລວມ ${totalAllNonBanned.toLocaleString()} ກີບ ເຂົ້າຊີດ (${targetSheetTab}) ຂອງ ${activeUsername} ແລ້ວ ✓`,
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: 'ຜິດພາດ: ' + (result.error || 'ບໍ່ສາມາດສົ່ງຍອດລວມໄດ້'),
      });
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md mb-6 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              ສົ່ງຂໍ້ມູນເຂົ້າ Google Sheet
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-medium px-2 py-0.5 rounded-md border border-indigo-500/20">
                ສະເພາະ {activeUsername}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              ກົດສົ່ງຍອດລວມ ຫຼື ສົ່ງລາຍການດຽວເຂົ້າ Google Sheet ສ່ວນຕົວທັນທີ
            </p>
          </div>
        </div>

        {targetSheetUrl && (
          <a
            href={targetSheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>ເປີດ Google Sheet ຂອງຂ້ອຍ</span>
          </a>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-12 gap-3.5 items-center">
        {/* Send Total Button */}
        <div className="md:col-span-6">
          <button
            onClick={handleSendTotalSummary}
            disabled={loading}
            className="w-full relative group overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-200" />
            )}
            <span>
              ສົ່ງຍອດລວມ ({totalAllNonBanned.toLocaleString()} ກີບ) ເຂົ້າ {targetSheetTab}
            </span>
          </button>
        </div>

        {/* Quick Single Line Input */}
        <div className="md:col-span-6 flex items-center gap-2">
          <input
            type="text"
            value={quickLine}
            onChange={(e) => setQuickLine(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickSend()}
            placeholder="ພິມ 1 ລາຍການ ເຊັ່ນ: 11,51,91=20"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          <button
            onClick={handleQuickSend}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shrink-0 flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>ສົ່ງ</span>
          </button>
        </div>
      </div>

      {/* Status Feedback */}
      {statusMsg && (
        <div
          className={`mt-3.5 p-3 rounded-xl text-xs flex items-center gap-2.5 transition-all shadow-sm ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-200'
              : statusMsg.type === 'error'
              ? 'bg-rose-950/80 border border-rose-500/30 text-rose-200'
              : 'bg-indigo-950/80 border border-indigo-500/30 text-indigo-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}
    </div>
  );
};
