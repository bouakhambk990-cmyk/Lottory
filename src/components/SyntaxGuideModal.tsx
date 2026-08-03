import React from 'react';
import { X, Copy, Check, HelpCircle, Code, Lightbulb } from 'lucide-react';

interface SyntaxGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExample: (exampleText: string) => void;
}

export const SyntaxGuideModal: React.FC<SyntaxGuideModalProps> = ({
  isOpen,
  onClose,
  onApplyExample,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const exampleSnippet = `11,51,91= 20
12.52.92 : 15
34 44 54 = 1ລ້ານ
07 47 87:20*10
889-89=20 (ບົນ-ລ່າງ)
39,79,38,78,339,379 ຮູ20
ບລ

37 77 03 43 83=20
ຫລັກ 8 7 3 = 10

14 54 94 38 78 07
ຫລັກ 6=5
ຫລັກ 0,1,2,4,5=2`;

  const handleCopy = () => {
    navigator.clipboard.writeText(exampleSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              ຄຳແນະນຳຮູບແບບການປ້ອນລາຍການ (Syntax Guide)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed">
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 text-indigo-200 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong>ຮູບແບບພື້ນຖານ:</strong> ໜຶ່ງແຖວ = ໜຶ່ງລາຍການ. ຄັ່ນເລກດ້ວຍ{' '}
              <code className="text-indigo-300 font-mono">, . - ; /</code> ຫຼືວັກ. ຄັ່ນລາຄາດ້ວຍ{' '}
              <code className="text-indigo-300 font-mono">: = ຮູ ຮູ້ ຮູລະ</code>.
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5 text-xs">
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <h3 className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-400" /> 1. ການຄິດໄລ່ລາຄາ:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>
                  ລາຄາເປົ່າໆ = ພັນ (ເຊັ່ນ <code className="text-indigo-300">: 5</code> = 5,000)
                </li>
                <li>
                  <code className="text-indigo-300">ລ້ານ</code> = ລ້ານ ·{' '}
                  <code className="text-indigo-300">ແສນ</code> = ແສນ
                </li>
                <li>
                  ຕໍ່ທ້າຍດ້ວຍ <code className="text-indigo-300">฿</code> ຫຼື{' '}
                  <code className="text-indigo-300">ບາດ</code> = ນັບເປັນມູນຄ່າຈິງ ບໍ່ຄູນພັນ
                </li>
                <li>
                  <code className="text-indigo-300">20*10</code> = ແຍກ 2 ລາຄາໃນຊຸດດຽວ
                </li>
              </ul>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <h3 className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-400" /> 2. ບົນ-ລ່າງ (ບລ):
              </h3>
              <p className="text-slate-300">
                ໃສ່ <code className="text-indigo-300">ບລ</code> ຫຼື{' '}
                <code className="text-indigo-300">ບົນ-ລ່າງ</code> ໃນແຖວ (ຫຼືແຖວແຍກຕໍ່ທ້າຍ)
                ເພື່ອຄູນ 2 ສະເພາະຊຸດເລກ 2 ໂຕ.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5 sm:col-span-2">
              <h3 className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-400" /> 3. ຫລັກ (ຫຼັກ) - ເລກ 3 ໂຕ:
              </h3>
              <p className="text-slate-300">
                ໃສ່ຫລັງແຖວຊຸດເລກ 2 ໂຕ ເພື່ອເອົາເລກທີ່ລະບຸໄປ &quot;ຕໍ່ໜ້າ&quot; ຊຸດເລກນັ້ນ ໃຫ້ກາຍເປັນເລກ 3
                ໂຕ ໃນລາຄາໃໝ່.
                <br />
                ຕົວຢ່າງ: <code className="text-indigo-300 font-mono">ຫລັກ 8 7 3 = 10</code> ຈາກຊຸດ{' '}
                <code className="text-indigo-300 font-mono">14 24</code> ຈະໄດ້{' '}
                <code className="text-indigo-300 font-mono">814 824 714 724 314 324</code> ລາຄາ 10.
              </p>
            </div>
          </div>

          {/* Code Sample Area */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
              <span>ຕົວຢ່າງຊຸດຂໍ້ມູນເລກ</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 hover:text-indigo-300 cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>{copied ? 'ກັອບປີ້ແລ້ວ' : 'ກັອບປີ້'}</span>
                </button>
              </div>
            </div>
            <pre className="text-xs font-mono text-indigo-300/90 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-40 p-1">
              {exampleSnippet}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onApplyExample(exampleSnippet);
              onClose();
            }}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] cursor-pointer"
          >
            ນຳໃຊ້ຕົວຢ່າງນີ້ໃສ່ຊ່ອງປ້ອນຂໍ້ມູນ
          </button>
          <button
            onClick={onClose}
            className="text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            ປິດ
          </button>
        </div>
      </div>
    </div>
  );
};
