import React from 'react';
import { UserAccount, UserSession } from '../types';
import { Shield, User, LogOut, FileText, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface HeaderProps {
  session: UserSession | null;
  currentUserAccount?: UserAccount | null;
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onToggleGuide: () => void;
  ticketTime: string;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  currentUserAccount,
  onOpenAdmin,
  onOpenLogin,
  onLogout,
  onToggleGuide,
  ticketTime,
}) => {
  return (
    <header className="relative border-b border-slate-800 bg-slate-900/60 rounded-2xl p-4 sm:p-5 mb-6 backdrop-blur-md shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-[0_0_20px_rgba(99,102,241,0.5)] shrink-0">
            L
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-widest text-indigo-300 uppercase bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                Terminal v2.5 · Lao Lottery
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span className="text-[10px] font-mono font-medium text-emerald-400">System Active</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              ຕູ້ຄິດໄລ່ຫວຍ <span className="text-indigo-400 font-serif italic">&amp; ຈັດການຍອດສົ່ງ</span>
            </h1>

            <p className="text-xs text-slate-400 mt-0.5 max-w-xl leading-relaxed">
              ຄິດໄລ່ຍອດເລກ, ຫັກເລກຫ້າມ, ຄິດຄອມມິຊັນ ແລະ ສົ່ງຂໍ້ມູນເຂົ້າ Google Sheet ສ່ວນຕົວຂອງແຕ່ລະຢູເຊີ
            </p>
          </div>
        </div>

        {/* User Status & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
          {/* Ticket Clock */}
          <div className="text-xs font-mono text-indigo-300 bg-slate-950/80 border border-indigo-500/30 px-3 py-1.5 rounded-xl shadow-inner flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{ticketTime}</span>
          </div>

          {/* Syntax Guide Button */}
          <button
            onClick={onToggleGuide}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            title="ເບິ່ງຄຳແນະນຳການປ້ອນລາຍການ"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>ຄຳແນະນຳ Syntax</span>
          </button>

          {/* User Account / Admin Badge */}
          {session ? (
            <div className="flex items-center gap-2 bg-slate-950/80 border border-indigo-500/30 rounded-xl p-1 pl-3">
              <div className="flex items-center gap-1.5 text-xs">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-100 font-semibold">{session.username}</span>
                {session.username === 'bk' && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded border border-indigo-500/30">
                    Admin
                  </span>
                )}
              </div>

              <div className="h-4 w-px bg-slate-800 mx-0.5" />

              <button
                onClick={onOpenAdmin}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 rounded-lg transition-colors"
                title="ຈັດການຜູ້ໃຊ້ (Admin)"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 rounded-lg transition-colors"
                title="ອອກຈາກລະບົບ"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] active:scale-95 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>ເຂົ້າສູ່ລະບົບ / Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Google Sheet Indicator bar */}
      {session && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Google Sheet ປາຍທາງ:
            </span>
            <span className="bg-slate-950 px-2.5 py-0.5 rounded-lg text-emerald-400 border border-slate-800 font-mono text-[11px] truncate max-w-xs sm:max-w-md">
              {currentUserAccount?.sheetUrl || 'https://docs.google.com/spreadsheets/...'}
            </span>
            <span className="text-slate-400">({currentUserAccount?.sheetTab || 'No1.'})</span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            ສົ່ງຂໍ້ມູນໂດຍ: <span className="font-semibold text-indigo-300">{session.username}</span>
          </div>
        </div>
      )}
    </header>
  );
};
