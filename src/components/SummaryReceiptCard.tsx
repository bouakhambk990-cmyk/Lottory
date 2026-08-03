import React, { useState } from 'react';
import { formatKip } from '../utils/lotteryParser';
import { Copy, Check, Printer, Ticket, Percent, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface SummaryReceiptCardProps {
  totalAll: number;
  totalBanned: number;
  commissionPct: number;
  onCommissionChange: (val: number) => void;
  ticketTime: string;
  activeUsername: string;
}

export const SummaryReceiptCard: React.FC<SummaryReceiptCardProps> = ({
  totalAll,
  totalBanned,
  commissionPct,
  onCommissionChange,
  ticketTime,
  activeUsername,
}) => {
  const [copied, setCopied] = useState(false);

  const totalReceive = totalAll * (commissionPct / 100);
  const totalSend = totalAll - totalReceive;

  const receiptText = `📜 ໃບສະຫລຸບຍອດຄິດເລກ (${activeUsername || 'ທົ່ວໄປ'})
⏱ ເວລາ: ${ticketTime}
----------------------------------
💵 ຍອດລວມ (ບໍ່ລວມເລກຫ້າມ): ${formatKip(totalAll)} ກີບ
✂️ ຍອດຕັດອອກ (ເລກຫ້າມ): ${formatKip(totalBanned)} ກີບ
📊 ຄອມມິຊັນ (${commissionPct}%): ${formatKip(totalReceive)} ກີບ
📤 ຍອດສົ່ງຂຶ້ນ: ${formatKip(totalSend)} ກີບ
----------------------------------`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(receiptText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = receiptText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
      {/* Decorative top pattern */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500" />

      <div>
        {/* Ticket Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-mono tracking-widest text-indigo-300 font-bold uppercase">
              ໃບສະຫລຸບຍອດຄິດເລກ
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
            {ticketTime}
          </span>
        </div>

        {/* Hero Totals List */}
        <div className="space-y-3 font-mono">
          {/* Total All */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-indigo-500/30 rounded-xl">
            <span className="text-xs text-slate-300 font-sans font-medium">
              ຍອດລວມ (ບໍ່ລວມເລກຫ້າມ):
            </span>
            <span className="text-lg font-bold text-indigo-300">
              {formatKip(totalAll)} <span className="text-xs text-indigo-400 font-normal">ກີບ</span>
            </span>
          </div>

          {/* Banned Total */}
          <div className="flex items-center justify-between p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl">
            <span className="text-xs text-rose-300 font-sans">ຍອດຕັດອອກ (ເລກຫ້າມ):</span>
            <span className="text-sm font-bold text-rose-400">
              {formatKip(totalBanned)} <span className="text-xs font-normal">ກີບ</span>
            </span>
          </div>

          {/* Commission Row */}
          <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
            <span className="text-slate-300 font-sans flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-indigo-400" />
              % ທີ່ໄດ້ (ຄອມມິຊັນ):
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionPct}
                onChange={(e) => onCommissionChange(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-900 border border-slate-700 text-right text-indigo-300 px-2 py-0.5 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <span className="text-slate-400">%</span>
            </div>
          </div>

          {/* Total Receive (Take) */}
          <div className="flex items-center justify-between p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl">
            <span className="text-xs text-emerald-300 font-sans flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              ຍອດຮັບ (ຄອມມິຊັນ):
            </span>
            <span className="text-sm font-bold text-emerald-400">
              {formatKip(totalReceive)} <span className="text-xs font-normal">ກີບ</span>
            </span>
          </div>

          {/* Total Send (Give) */}
          <div className="flex items-center justify-between p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl">
            <span className="text-xs text-amber-300 font-sans flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              ຍອດສົ່ງ (ສົ່ງຂຶ້ນ):
            </span>
            <span className="text-sm font-bold text-amber-400">
              {formatKip(totalSend)} <span className="text-xs font-normal">ກີບ</span>
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Action Buttons */}
      <div className="mt-5 pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
        <button
          onClick={handleCopy}
          className={`w-full sm:flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-3.5 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-md ${
            copied
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500/50 text-white shadow-[0_4px_20px_-4px_rgba(79,70,229,0.5)]'
          }`}
          title="ກັອບປີ້ຂໍ້ຄວາມສະຫລຸບໄວ້ສົ່ງເຂົ້າ WhatsApp, Line, FB"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-white animate-bounce" />
              <span>ກັອບປີ້ສຳເລັດ! (Copied)</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-indigo-200" />
              <span>ກັອບປີ້ລາຍງານ (Copy to Clipboard)</span>
            </>
          )}
        </button>

        <button
          onClick={handlePrint}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 py-2.5 px-4 rounded-xl border border-slate-700 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span>ພິມ (Print)</span>
        </button>
      </div>
    </div>
  );
};
