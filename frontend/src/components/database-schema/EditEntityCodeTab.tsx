import { FileCode, Copy, Check, AlertCircle, Sparkles } from 'lucide-react';

interface EditEntityCodeTabProps {
  codeText: string;
  setCodeText: (text: string) => void;
  isDoc: boolean;
  isDark: boolean;
  parseError: string | null;
  parseSuccess: string | null;
  handleParseCode: () => boolean;
  copied: boolean;
  handleCopyCode: () => void;
}

export function EditEntityCodeTab({
  codeText,
  setCodeText,
  isDoc,
  isDark,
  parseError,
  parseSuccess,
  handleParseCode,
  copied,
  handleCopyCode,
}: EditEntityCodeTabProps) {
  return (
        <div className="p-5 space-y-3 overflow-y-auto flex-1 no-scrollbar flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-emerald-500" />
              <span
                className={`text-xs font-semibold ${
                  isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                }`}
              >
                {isDoc ? 'MongoDB JSON Schema Code' : 'SQL DDL Definition'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#242321] bg-[#18191D] text-[#A6A4A0] hover:text-[#F5F3EF]'
                    : 'border-[#E8E1D5] bg-[#F7F3EA] text-[#6B665E] hover:text-[#171717]'
                }`}
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleParseCode}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
                    : 'bg-[#D9A300] text-white hover:brightness-105'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Parse</span>
              </button>
            </div>
          </div>

          {parseError && (
            <div
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                isDark
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {parseSuccess && (
            <div
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{parseSuccess}</span>
            </div>
          )}

          <div className="flex-1 min-h-[260px] flex flex-col">
            <textarea
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              placeholder={
                isDoc
                  ? '{\n  "_id": "ObjectId",\n  "name": "String",\n  "created_at": "Date"\n}'
                  : 'CREATE TABLE table_name (\n  id UUID PRIMARY KEY,\n  name VARCHAR(255) NOT NULL\n);'
              }
              className={`w-full flex-1 p-3.5 rounded-xl border font-mono text-xs leading-relaxed focus:outline-none resize-none ${
                isDark
                  ? 'bg-[#08090B] border-[#242321] text-emerald-400 focus:border-[#FFC900]'
                  : 'bg-[#F9F7F2] border-[#E8E1D5] text-emerald-800 focus:border-[#D9A300]'
              }`}
            />
          </div>
        </div>
  );
}
