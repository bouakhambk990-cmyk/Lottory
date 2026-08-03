import React, { useState } from 'react';
import { BetRow, SummaryGroup } from '../types';
import { formatKip } from '../utils/lotteryParser';
import { Search, Filter, Hash, AlertOctagon } from 'lucide-react';

interface TablesViewProps {
  rows: BetRow[];
}

export const TablesView: React.FC<TablesViewProps> = ({ rows }) => {
  const [activeTab, setActiveTab] = useState<'grouped' | 'raw'>('grouped');
  const [searchTerm, setSearchTerm] = useState('');
  const [digitFilter, setDigitFilter] = useState<'all' | '2digit' | '3digit' | 'banned'>('all');

  // Compute grouped numbers
  const groups: Record<string, SummaryGroup> = {};
  const groupOrder: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!groups[r.number]) {
      groups[r.number] = {
        number: r.number,
        occurrences: 0,
        subtotal: 0,
        banned: r.banned,
      };
      groupOrder.push(r.number);
    }
    groups[r.number].occurrences += r.occurrences;
    groups[r.number].subtotal += r.subtotal;
  }

  groupOrder.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  });

  // Filtering for grouped table
  const filteredGroupNumbers = groupOrder.filter((num) => {
    const gr = groups[num];
    if (searchTerm && !num.includes(searchTerm.trim())) return false;
    if (digitFilter === '2digit' && num.length !== 2) return false;
    if (digitFilter === '3digit' && num.length !== 3) return false;
    if (digitFilter === 'banned' && !gr.banned) return false;
    return true;
  });

  // Filtering for raw table
  const filteredRawRows = rows.filter((r) => {
    if (searchTerm && !r.number.includes(searchTerm.trim())) return false;
    if (digitFilter === '2digit' && r.number.length !== 2) return false;
    if (digitFilter === '3digit' && r.number.length !== 3) return false;
    if (digitFilter === 'banned' && !r.banned) return false;
    return true;
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md mt-6">
      {/* Top Controls: Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('grouped')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'grouped'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ລາຍລະອຽດແຕ່ລະເລກ (ລວມແລ້ວ)
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'raw'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ລາຍລະອຽດແຕ່ລະແຖວ (ດິບ)
          </button>
        </div>

        {/* Search & Digit Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາເລກ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono w-28 sm:w-36"
            />
          </div>

          {/* Category filter buttons */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <button
              onClick={() => setDigitFilter('all')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                digitFilter === 'all'
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              ທັງໝົດ
            </button>
            <button
              onClick={() => setDigitFilter('2digit')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                digitFilter === '2digit'
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              2 ໂຕ
            </button>
            <button
              onClick={() => setDigitFilter('3digit')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                digitFilter === '3digit'
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              3 ໂຕ
            </button>
            <button
              onClick={() => setDigitFilter('banned')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                digitFilter === 'banned'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              ເລກຫ້າມ
            </button>
          </div>
        </div>
      </div>

      {/* Tables Content */}
      <div className="overflow-x-auto">
        {activeTab === 'grouped' ? (
          filteredGroupNumbers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              ບໍ່ພົບຂໍ້ມູນເລກທີ່ກົງກັບເງື່ອນໄຂ
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 px-3">ເລກ</th>
                  <th className="py-2.5 px-3 text-right">ຈຳນວນຄັ້ງ</th>
                  <th className="py-2.5 px-3 text-right">ລວມເງິນ (ກີບ)</th>
                  <th className="py-2.5 px-3 text-center">ສະຖານະ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredGroupNumbers.map((num) => {
                  const gr = groups[num];
                  return (
                    <tr
                      key={num}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        gr.banned ? 'text-rose-400 bg-rose-950/20' : 'text-slate-200'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold flex items-center gap-2">
                        <span
                          className={`min-w-7 h-7 px-1.5 rounded-lg flex items-center justify-center text-[11px] font-extrabold ${
                            gr.banned
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : num.length === 2
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {num}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">{gr.occurrences}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-indigo-300">
                        {formatKip(gr.subtotal)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {gr.banned ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-0.5 rounded-full font-medium">
                            <AlertOctagon className="w-3 h-3" /> ຫ້າມ
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full font-medium">
                            ປົກກະຕິ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : filteredRawRows.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            ບໍ່ພົບຂໍ້ມູນແຖວດິບທີ່ກົງກັບເງື່ອນໄຂ
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">ແຖວ</th>
                <th className="py-2.5 px-3">ເລກ</th>
                <th className="py-2.5 px-3 text-right">ລາຄາ/ຄັ້ງ</th>
                <th className="py-2.5 px-3 text-right">ຄັ້ງ</th>
                <th className="py-2.5 px-3 text-right">ລວມ</th>
                <th className="py-2.5 px-3 text-center">ສະຖານະ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredRawRows.map((r, i) => (
                <tr
                  key={i}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    r.banned ? 'text-rose-400 bg-rose-950/20' : 'text-slate-200'
                  }`}
                >
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">#{r.lineNo}</td>
                  <td className="py-2.5 px-3 font-bold text-indigo-300">{r.number}</td>
                  <td className="py-2.5 px-3 text-right">{formatKip(r.unitValue)}</td>
                  <td className="py-2.5 px-3 text-right">{r.occurrences}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-indigo-300">
                    {formatKip(r.subtotal)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans">
                    {r.banned ? (
                      <span className="text-[10px] text-rose-300 bg-rose-950 border border-rose-800 px-2.5 py-0.5 rounded-full font-medium">
                        ຫ້າມ
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full font-medium">
                        ປົກກະຕິ
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
