import React, { useState } from 'react';
import {
  RotateCcw,
  Trash2,
  AlertTriangle,
  FileCode,
  Percent,
  Ban,
  Calculator,
  HelpCircle,
} from 'lucide-react';

interface BetEntryPanelProps {
  betText: string;
  onBetTextChange: (val: string) => void;
  bannedText: string;
  onBannedTextChange: (val: string) => void;
  commissionPct: number;
  onCommissionPctChange: (val: number) => void;
  onCalculate: () => void;
  onClear: () => void;
  onLoadSample: () => void;
  onOpenGuide: () => void;
  warnings: string[];
}

export const BetEntryPanel: React.FC<BetEntryPanelProps> = ({
  betText,
  onBetTextChange,
  bannedText,
  onBannedTextChange,
  commissionPct,
  onCommissionPctChange,
  onCalculate,
  onClear,
  onLoadSample,
  onOpenGuide,
  warnings,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearClick = () => {
    if (!betText.trim()) return;
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md flex flex-col justify-between">
      <div>
        {/* Panel Title & Header Controls */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">
              ຂໍ້ມູນລາຍການແທງ (ຊ່ອງປ້ອນຂໍ້ມູນ)
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenGuide}
              className="text-xs text-indigo-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="ເບິ່ງຄຳແນະນຳ"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">ຄຳແນະນຳ</span>
            </button>

            <button
              onClick={onLoadSample}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="ໂຫລດຊຸດເລກຕົວຢ່າງ"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>ຕົວຢ່າງ</span>
            </button>

            <button
              onClick={handleClearClick}
              disabled={!betText.trim()}
              className={`text-xs px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer border ${
                confirmClear
                  ? 'bg-rose-600 text-white border-rose-500 animate-bounce'
                  : 'text-slate-300 hover:text-rose-300 bg-slate-800/80 hover:bg-rose-950/40 border-slate-700 hover:border-rose-800'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title="ລ້າງຂໍ້ມູນເລກ"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{confirmClear ? 'ກົດອີກຄັ້ງເພື່ອລ້າງ' : 'ລ້າງ'}</span>
            </button>
          </div>
        </div>

        {/* Textarea for numbers & prices */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            ລາຍການເລກ + ລາຄາ (ພິມຊຸດເລກ ແລະ ລາຄາຢູ່ໃສກໍ່ໄດ້):
          </label>
          <textarea
            value={betText}
            onChange={(e) => onBetTextChange(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder={`ພິມລາຍການເລກຢູ່ ນີ້... \nຕົວຢ່າງ:\n11,51,91= 20\n12.52.92 : 15\n34 44 54 = 1ລ້ານ\n07 47 87:20*10\n889-89=20 (ບົນ-ລ່າງ)\nຫລັກ 8 7 3 = 10`}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-y leading-relaxed"
          />
        </div>

        {/* Banned Numbers & Commission Percentage Inputs */}
        <div className="grid sm:grid-cols-2 gap-3.5 mb-4">
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <Ban className="w-3.5 h-3.5 text-rose-400" />
              <span>ເລກທີ່ຕ້ອງຫ້າມ (ຄັ່ນດ້ວຍ , . ວັກ):</span>
            </label>
            <input
              type="text"
              value={bannedText}
              onChange={(e) => onBannedTextChange(e.target.value)}
              placeholder="ຕົວຢ່າງ: 89, 47, 578"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono text-rose-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-indigo-400" />
              <span>% ທີ່ໄດ້ (ຄອມມິຊັນ):</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionPct}
                onChange={(e) => onCommissionPctChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors pr-8"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-400">%</span>
            </div>
          </div>
        </div>

        {/* Primary Calculation Trigger Button */}
        <button
          onClick={onCalculate}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
        >
          <Calculator className="w-4 h-4 text-indigo-200" />
          <span>ຄິດໄລ່ຍອດທັງໝົດ</span>
        </button>

        {/* Parsing Warnings Box */}
        {warnings.length > 0 && (
          <div className="mt-4 p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl text-xs text-rose-200 space-y-1 max-h-32 overflow-y-auto">
            <div className="font-semibold text-rose-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>ຄຳເຕືອນການປ້ອນຂໍ້ມູນ ({warnings.length}):</span>
            </div>
            {warnings.map((w, idx) => (
              <div key={idx} className="pl-4 font-mono text-[11px]">
                • {w}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
