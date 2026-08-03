import React, { useState } from 'react';
import { UserAccount } from '../types';
import { UserCheck, X, Sparkles, KeyRound } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  onLoginSuccess: (username: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  onLoginSuccess,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const uname = usernameInput.trim().toLowerCase();
    if (!uname) {
      setErrorMsg('ກະລຸນາພິມຊື່ຜູ້ໃຊ້');
      return;
    }

    const found = users.find((u) => u.username.toLowerCase() === uname);
    if (!found) {
      setErrorMsg(`ບໍ່ພົບຊື່ຜູ້ໃຊ້ "${uname}" ໃນລະບົບ (ກະລຸນາຕິດຕໍ່ Admin bk)`);
      return;
    }

    if (found.expiry && new Date(found.expiry).getTime() < Date.now()) {
      setErrorMsg(`ຊື່ຜູ້ໃຊ້ "${uname}" ໝົດເວລາໃຊ້ງານແລ້ວ`);
      return;
    }

    onLoginSuccess(found.username);
    setUsernameInput('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3.5">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <UserCheck className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-white">ເຂົ້າສູ່ລະບົບຜູ້ໃຊ້</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            ພິມຊື່ຜູ້ໃຊ້ຂອງທ່ານ (ເຊັ່ນ <code className="text-indigo-300 font-mono">bk</code>,{' '}
            <code className="text-indigo-300 font-mono">fon</code>,{' '}
            <code className="text-indigo-300 font-mono">noy</code>) ເພື່ອເຊື່ອມຕໍ່ກັບ Google Sheet
            ສ່ວນຕົວ
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="ຊື່ຜູ້ໃຊ້ (Username)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-indigo-200" />
              <span>ເຂົ້າສູ່ລະບົບ / Login</span>
            </button>
          </form>

          {/* Quick User Selector Pills */}
          <div className="pt-3 border-t border-slate-800 text-left">
            <p className="text-[11px] text-slate-500 mb-2">ເລືອກຊື່ຜູ້ໃຊ້ຕົວຢ່າງ:</p>
            <div className="flex flex-wrap gap-1.5">
              {users.map((u) => (
                <button
                  key={u.username}
                  onClick={() => {
                    setUsernameInput(u.username);
                    setErrorMsg('');
                  }}
                  className="text-[11px] font-mono bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {u.username} {u.username === 'bk' ? '(Admin)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
