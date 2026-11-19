import { useState } from 'react';
import { X, Copy, Check, Download, Code2, Database } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ExportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sqlDdl: string;
  nosqlCode: string;
  schemaType: 'table' | 'document';
  projectName: string;
}

export function ExportCodeModal({
  isOpen,
  onClose,
  sqlDdl,
  nosqlCode,
  schemaType,
  projectName,
}: ExportCodeModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'sql' | 'nosql'>(
    schemaType === 'document' ? 'nosql' : 'sql'
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeToShow = activeTab === 'sql' ? (sqlDdl || '-- No SQL script generated') : (nosqlCode || '// No Mongoose schema generated');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeToShow);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const handleDownload = () => {
    const filename = activeTab === 'sql' ? `${projectName.toLowerCase().replace(/\s+/g, '_')}_schema.sql` : `${projectName.toLowerCase().replace(/\s+/g, '_')}_schema.ts`;
    const blob = new Blob([codeToShow], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
          isDark
            ? 'border-[#242321] bg-[#111215]'
            : 'border-[#E8E1D5] bg-white'
        }`}
      >
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
            isDark
              ? 'bg-[#18191D] border-[#242321]'
              : 'bg-[#F7F3EA] border-[#E8E1D5]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                isDark
                  ? 'bg-[#08090B] border-[#242321] text-[#FFC900]'
                  : 'bg-white border-[#E8E1D5] text-[#D9A300]'
              }`}
            >
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3
                className={`text-base font-bold tracking-tight ${
                  isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                }`}
              >
                Export Database Architecture
              </h3>
              <p
                className={`text-xs ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                Copy or download ready-to-use database migration scripts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`px-6 py-2.5 border-b flex items-center justify-between gap-3 text-xs ${
            isDark
              ? 'border-[#242321] bg-[#141518]'
              : 'border-[#E8E1D5] bg-[#FAF8F5]'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('sql')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'sql'
                  ? isDark
                    ? 'bg-[#FFC900] text-[#08090B] font-bold shadow-xs'
                    : 'bg-[#D9A300] text-white font-bold shadow-xs'
                  : isDark
                  ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                  : 'text-[#6B665E] hover:text-[#171717]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQL DDL</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('nosql')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'nosql'
                  ? isDark
                    ? 'bg-[#FFC900] text-[#08090B] font-bold shadow-xs'
                    : 'bg-[#D9A300] text-white font-bold shadow-xs'
                  : isDark
                  ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                  : 'text-[#6B665E] hover:text-[#171717]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Mongoose / TypeScript</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                  : isDark
                  ? 'border-[#242321] bg-[#18191D] text-[#F5F3EF] hover:border-[#FFC900]'
                  : 'border-[#E8E1D5] bg-white text-[#171717] hover:border-[#D9A300]'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'border-[#242321] bg-[#18191D] text-[#F5F3EF] hover:border-[#FFC900]'
                  : 'border-[#E8E1D5] bg-white text-[#171717] hover:border-[#D9A300]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-[#08090B]">
          <pre className="font-mono text-xs text-[#E6E4DF] leading-relaxed whitespace-pre-wrap select-all">
            {codeToShow}
          </pre>
        </div>
      </div>
    </div>
  );
}
