import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  Shield,
  X,
  Plus,
  Trash2,
  Lock,
  Copy,
  Check,
  FileCode,
  ExternalLink,
  Users,
  Code2,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  onAddOrUpdateUser: (user: UserAccount) => void;
  onDeleteUser: (username: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  users,
  onAddOrUpdateUser,
  onDeleteUser,
}) => {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'gas'>('users');

  // New/edit user form state
  const [formUsername, setFormUsername] = useState('');
  const [formSheetUrl, setFormSheetUrl] = useState('');
  const [formSheetTab, setFormSheetTab] = useState('No1.');
  const [formExpiry, setFormExpiry] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [copiedGas, setCopiedGas] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '1234') {
      setUnlocked(true);
      setPwError('');
    } else {
      setPwError('ລະຫັດ Admin ບໍ່ຖືກຕ້ອງ (ລະຫັດເລີ່ມຕົ້ນແມ່ນ 1234)');
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim()) return;

    onAddOrUpdateUser({
      username: formUsername.trim().toLowerCase(),
      sheetUrl: formSheetUrl.trim() || 'https://docs.google.com/spreadsheets/...',
      sheetTab: formSheetTab.trim() || 'No1.',
      expiry: formExpiry ? new Date(formExpiry).toISOString() : null,
      notes: formNotes.trim(),
      createdAt: new Date().toISOString(),
    });

    // Reset form
    setFormUsername('');
    setFormSheetUrl('');
    setFormSheetTab('No1.');
    setFormExpiry('');
    setFormNotes('');
  };

  const handleEditUserClick = (u: UserAccount) => {
    setFormUsername(u.username);
    setFormSheetUrl(u.sheetUrl || '');
    setFormSheetTab(u.sheetTab || 'No1.');
    setFormExpiry(u.expiry ? u.expiry.slice(0, 16) : '');
    setFormNotes(u.notes || '');
  };

  const gasScriptCode = `// ========================================================
// GOOGLE APPS SCRIPT: MULTI-USER LAO LOTTERY ROUTER
// ວາງໂຄ້ດນີ້ໃສ່ Google Apps Script ຂອງ Google Sheet ຫຼັກ (Admin)
// ========================================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "addEntries") {
      var username = data.username || "Guest";
      var userSheetUrl = data.sheetUrl; // Google Sheet URL ຂອງຢູເຊີ
      var sheetTabName = data.sheetTab || "No1.";
      var entries = data.entries || [];

      // ເປີດ Google Sheet ປາຍທາງ (ຖ້າມີ URL ຂອງຢູເຊີ ໃຫ້ໃຊ້ຂອງຢູເຊີ, ຖ້າບໍ່ມີໃຫ້ໃຊ້ຊີດປັດຈຸບັນ)
      var targetSpreadsheet;
      if (userSheetUrl && userSheetUrl.indexOf("http") === 0) {
        targetSpreadsheet = SpreadsheetApp.openByUrl(userSheetUrl);
      } else {
        targetSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      }

      var sheet = targetSpreadsheet.getSheetByName(sheetTabName) || targetSpreadsheet.getSheets()[0];
      
      // ຊອກຫາແຖວຕໍ່ໄປທີ່ຫວ່າງ (ເລີ່ມຕົ້ນແຖວ 18)
      var startRow = data.startRow || 18;
      var lastRow = Math.max(sheet.getLastRow() + 1, startRow);

      for (var i = 0; i < entries.length; i++) {
        var num = entries[i].number;
        var price = entries[i].price;

        // ບັນທຶກລາຍການ (ຄໍ B = ລຳດັບ, C = ເລກ, D = ລາຄາ)
        sheet.getRange("B" + (lastRow + i)).setValue(lastRow + i - startRow + 1);
        sheet.getRange("C" + (lastRow + i)).setValue(num);
        sheet.getRange("D" + (lastRow + i)).setValue(price);
      }

      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        written: entries.length,
        user: username,
        sheet: targetSpreadsheet.getName()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Invalid Action" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyGasCode = () => {
    navigator.clipboard.writeText(gasScriptCode);
    setCopiedGas(true);
    setTimeout(() => setCopiedGas(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              ຈັດການລະບົບຜູ້ໃຊ້ &amp; Google Sheet (Admin Panel)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!unlocked ? (
          /* Password Unlock Screen */
          <div className="p-8 text-center max-w-md mx-auto space-y-4 my-auto">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              ກະລຸນາພິມລະຫັດ Admin ເພື່ອເຂົ້າຈັດການ
            </h3>
            <p className="text-xs text-slate-400">
              ລະຫັດ Admin ເລີ່ມຕົ້ນແມ່ນ <code className="text-indigo-300 font-mono">1234</code>
            </p>

            <form onSubmit={handleUnlock} className="space-y-3">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="ລະຫັດ Admin..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
              />
              {pwError && <p className="text-xs text-rose-400">{pwError}</p>}
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)]"
              >
                ປົດລັອກ / Unlock
              </button>
            </form>
          </div>
        ) : (
          /* Main Admin Panel Interface */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Sub-tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950 px-6 pt-3 gap-2">
              <button
                onClick={() => setActiveSubTab('users')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-t-xl transition-colors cursor-pointer ${
                  activeSubTab === 'users'
                    ? 'bg-slate-900 text-indigo-300 border-t-2 border-indigo-500'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>ຈັດການລາຍຊື່ຜູ້ໃຊ້ ({users.length})</span>
              </button>

              <button
                onClick={() => setActiveSubTab('gas')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-t-xl transition-colors cursor-pointer ${
                  activeSubTab === 'gas'
                    ? 'bg-slate-900 text-indigo-300 border-t-2 border-indigo-500'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>ໂຄ້ດ Google Apps Script ຫຼັກ</span>
              </button>
            </div>

            {/* Tab 1: Manage Users */}
            {activeSubTab === 'users' && (
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* Form to add or edit user */}
                <form
                  onSubmit={handleSaveUser}
                  className="bg-slate-950 border border-slate-800 p-4.5 rounded-2xl space-y-3.5"
                >
                  <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-400" />
                    ເພີ່ມ / ກຳນົດ Google Sheet ໃຫ້ຢູເຊີ:
                  </h4>

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-slate-400 mb-1">ຊື່ຜູ້ໃຊ້ (Username):</label>
                      <input
                        type="text"
                        required
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        placeholder="ເຊັ່ນ: fon, noy, sone"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">ຊື່ແທັບຊີດ (Tab Name):</label>
                      <input
                        type="text"
                        value={formSheetTab}
                        onChange={(e) => setFormSheetTab(e.target.value)}
                        placeholder="No1."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">
                        Google Sheet URL ສ່ວນຕົວຂອງຢູເຊີນີ້:
                      </label>
                      <input
                        type="text"
                        value={formSheetUrl}
                        onChange={(e) => setFormSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/FON_SHEET_ID/edit"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">ໝົດເວລາ (ກຳນົດອາຍຸ):</label>
                      <input
                        type="datetime-local"
                        value={formExpiry}
                        onChange={(e) => setFormExpiry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">ໝາຍເຫດ:</label>
                      <input
                        type="text"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="ໝາຍເຫດ..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                  >
                    ບັນທຶກຂໍ້ມູນຜູ້ໃຊ້ &amp; Google Sheet ປາຍທາງ
                  </button>
                </form>

                {/* Users List Table */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="p-3.5 border-b border-slate-800 font-bold text-slate-300">
                    ລາຍຊື່ຜູ້ໃຊ້ທີ່ໄດ້ຮັບສິດ ({users.length}):
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono">
                      <thead className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <tr>
                          <th className="p-3">ຊື່ຜູ້ໃຊ້</th>
                          <th className="p-3">Google Sheet ປາຍທາງ</th>
                          <th className="p-3">ໝົດເວລາ</th>
                          <th className="p-3 text-right">ຈັດການ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        {users.map((u) => {
                          const isExpired = u.expiry && new Date(u.expiry).getTime() < Date.now();
                          return (
                            <tr key={u.username} className="hover:bg-slate-900/50">
                              <td className="p-3 font-bold text-indigo-300">
                                {u.username}
                                {u.username === 'bk' && (
                                  <span className="ml-1 text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                                    Admin
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-300 max-w-xs truncate">
                                {u.sheetUrl ? (
                                  <a
                                    href={u.sheetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-400 hover:underline flex items-center gap-1 truncate"
                                  >
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{u.sheetUrl}</span>
                                  </a>
                                ) : (
                                  <span className="text-slate-500">ຊີດເລີ່ມຕົ້ນ</span>
                                )}
                              </td>
                              <td className="p-3">
                                {isExpired ? (
                                  <span className="text-rose-400">ໝົດເວລາ</span>
                                ) : u.expiry ? (
                                  <span className="text-emerald-400">
                                    {new Date(u.expiry).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">ບໍ່ມີໝົດອາຍຸ</span>
                                )}
                              </td>
                              <td className="p-3 text-right space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditUserClick(u)}
                                  className="text-indigo-300 hover:text-white px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-700 transition-colors"
                                >
                                  ແກ້ໄຂ
                                </button>
                                {u.username !== 'bk' && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteUser(u.username)}
                                    className="text-rose-400 hover:text-rose-300 px-2 py-1 bg-slate-900 rounded-lg border border-slate-700 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Apps Script Code */}
            {activeSubTab === 'gas' && (
              <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 text-indigo-200">
                  <strong>ວິທີຕັ້ງຄ່າ:</strong> Admin ກັອບປີ້ໂຄ້ດຂ້າງລຸ່ມນີ້ໄປວາງໃສ່{' '}
                  <code className="text-indigo-300 font-mono">Extensions &gt; Apps Script</code> ໃນ Google
                  Sheet ຫຼັກ ແລ້ວກົດ Deploy As Web App (Anyone HAS access). ລະບົບຈະແຍກສົ່ງຂໍ້ມູນເຂົ້າ Google Sheet ສ່ວນຕົວຂອງແຕ່ລະຢູເຊີອັດຕະໂນມັດ!
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                    <span className="font-mono text-slate-400 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-emerald-400" />
                      Google Apps Script Router Code
                    </span>
                    <button
                      onClick={copyGasCode}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-xl transition-all shadow cursor-pointer"
                    >
                      {copiedGas ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedGas ? 'ກັອບປີ້ແລ້ວ!' : 'ກັອບປີ້ໂຄ້ດ'}</span>
                    </button>
                  </div>

                  <pre className="text-[11px] font-mono text-emerald-300/90 overflow-x-auto p-3 bg-slate-900/80 rounded-xl leading-relaxed max-h-72">
                    {gasScriptCode}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
