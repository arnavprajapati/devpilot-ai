import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { FileCode2, Key, Link2, Braces, Layers, Pencil, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { SchemaColumn } from '../../services/databaseSchemaApi';

export interface DocumentNodeData {
  name: string;
  description?: string;
  columns: SchemaColumn[];
  schemaType?: string;
  dbEngine?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const DocumentNode = memo(({ data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeData = data as unknown as DocumentNodeData;
  const fields = nodeData.columns || [];

  return (
    <div
      className={`w-80 rounded-2xl border transition-all shadow-md overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif] ${
        selected
          ? isDark
            ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-xl'
            : 'border-emerald-600 ring-2 ring-emerald-600/30 shadow-lg'
          : isDark
          ? 'border-[#242321] bg-[#111215] hover:border-emerald-500/40'
          : 'border-[#E8E1D5] bg-white hover:border-emerald-600/40'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !cursor-pointer !bg-emerald-500 !border-[#08090B]"
      />

      <div
        className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
          isDark
            ? 'bg-[#18191D] border-[#242321]'
            : 'bg-[#F2F8F4] border-[#D5E5DA]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-[#08090B] border-[#242321] text-emerald-400'
                : 'bg-white border-[#D5E5DA] text-emerald-600'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4
              className={`text-sm font-bold tracking-tight truncate ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              {nodeData.name}
            </h4>
            <span
              className={`text-[10px] font-medium block truncate ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              {nodeData.dbEngine || 'MongoDB Collection'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
              isDark
                ? 'bg-[#08090B] text-emerald-400 border-[#242321]'
                : 'bg-white text-emerald-700 border-[#D5E5DA]'
            }`}
          >
            {fields.length} fields
          </span>
          {nodeData.onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onEdit?.();
              }}
              title="Edit Collection"
              className={`p-1 rounded-md border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#242321] text-[#A6A4A0] hover:text-emerald-400 hover:bg-[#242321]'
                  : 'border-[#D5E5DA] text-[#6B665E] hover:text-emerald-600 hover:bg-white'
              }`}
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {nodeData.onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onDelete?.();
              }}
              title="Delete Collection"
              className={`p-1 rounded-md border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#242321] text-[#A6A4A0] hover:text-rose-400 hover:bg-[#242321]'
                  : 'border-[#D5E5DA] text-[#6B665E] hover:text-rose-600 hover:bg-white'
              }`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {nodeData.description && (
        <div
          className={`px-4 py-2 text-xs border-b ${
            isDark
              ? 'border-[#242321] bg-[#141518] text-[#A6A4A0]'
              : 'border-[#E8E1D5] bg-[#FAF8F5] text-[#6B665E]'
          }`}
        >
          {nodeData.description}
        </div>
      )}

      <div className="divide-y divide-inherit">
        {fields.map((field, idx) => {
          const isId = field.name === '_id' || field.is_primary;
          const isArray = field.data_type.toLowerCase().includes('array') || field.data_type.includes('[');
          const isObject = field.data_type.toLowerCase().includes('object') || field.data_type.toLowerCase().includes('embed');

          return (
            <div
              key={idx}
              className={`px-3.5 py-2 flex items-center justify-between text-xs transition-colors ${
                isDark
                  ? 'hover:bg-white/[0.02]'
                  : 'hover:bg-black/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isId ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Key className="w-2.5 h-2.5" />
                    ID
                  </span>
                ) : field.is_foreign || field.references ? (
                  <span
                    title={`Ref: ${field.references || ''}`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30"
                  >
                    <Link2 className="w-2.5 h-2.5" />
                    REF
                  </span>
                ) : isObject ? (
                  <Braces className="w-3 h-3 text-purple-400 shrink-0" />
                ) : isArray ? (
                  <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shrink-0 ml-1 mr-1" />
                )}

                <span
                  className={`font-mono text-xs truncate ${
                    isId
                      ? isDark
                        ? 'text-[#F5F3EF] font-bold'
                        : 'text-[#171717] font-bold'
                      : isDark
                      ? 'text-[#F5F3EF]'
                      : 'text-[#171717]'
                  }`}
                >
                  {field.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                    isDark
                      ? 'bg-[#08090B] text-emerald-400/80 border-[#242321]'
                      : 'bg-[#F2F8F4] text-emerald-700 border-[#D5E5DA]'
                  }`}
                >
                  {field.data_type}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2 !cursor-pointer !bg-emerald-500 !border-[#08090B]"
      />
    </div>
  );
});
