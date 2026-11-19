import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Database, Key, Link2, Hash, Pencil, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { SchemaColumn } from '../../services/databaseSchemaApi';

export interface TableNodeData {
  name: string;
  description?: string;
  columns: SchemaColumn[];
  schemaType?: string;
  dbEngine?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const TableNode = memo(({ data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeData = data as unknown as TableNodeData;
  const columns = nodeData.columns || [];

  return (
    <div
      className={`w-80 rounded-2xl border transition-all shadow-md overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif] ${
        selected
          ? isDark
            ? 'border-[#FFC900] ring-2 ring-[#FFC900]/30 shadow-xl'
            : 'border-[#D9A300] ring-2 ring-[#D9A300]/30 shadow-lg'
          : isDark
          ? 'border-[#242321] bg-[#111215] hover:border-[#FFC900]/40'
          : 'border-[#E8E1D5] bg-white hover:border-[#D9A300]/40'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-3 !h-3 !border-2 !cursor-pointer ${
          isDark
            ? '!bg-[#FFC900] !border-[#08090B]'
            : '!bg-[#D9A300] !border-white'
        }`}
      />

      <div
        className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
          isDark
            ? 'bg-[#18191D] border-[#242321]'
            : 'bg-[#F7F3EA] border-[#E8E1D5]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-[#08090B] border-[#242321] text-[#FFC900]'
                : 'bg-white border-[#E8E1D5] text-[#D9A300]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
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
              {nodeData.dbEngine || 'SQL Table'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
              isDark
                ? 'bg-[#08090B] text-[#A6A4A0] border-[#242321]'
                : 'bg-white text-[#6B665E] border-[#E8E1D5]'
            }`}
          >
            {columns.length} cols
          </span>
          {nodeData.onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onEdit?.();
              }}
              title="Edit Table"
              className={`p-1 rounded-md border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#242321] text-[#A6A4A0] hover:text-[#FFC900] hover:bg-[#242321]'
                  : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#D9A300] hover:bg-white'
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
              title="Delete Table"
              className={`p-1 rounded-md border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#242321] text-[#A6A4A0] hover:text-rose-400 hover:bg-[#242321]'
                  : 'border-[#E8E1D5] text-[#6B665E] hover:text-rose-600 hover:bg-white'
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
        {columns.map((col, idx) => (
          <div
            key={idx}
            className={`px-3.5 py-2 flex items-center justify-between text-xs transition-colors ${
              isDark
                ? 'hover:bg-white/[0.02]'
                : 'hover:bg-black/[0.02]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {col.is_primary ? (
                <span
                  title="Primary Key"
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    isDark
                      ? 'bg-[#FFC900]/15 text-[#FFC900] border border-[#FFC900]/30'
                      : 'bg-[#D9A300]/15 text-[#D9A300] border border-[#D9A300]/30'
                  }`}
                >
                  <Key className="w-2.5 h-2.5" />
                  PK
                </span>
              ) : col.is_foreign ? (
                <span
                  title={`Foreign Key -> ${col.references || ''}`}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30"
                >
                  <Link2 className="w-2.5 h-2.5" />
                  FK
                </span>
              ) : (
                <Hash className="w-3 h-3 opacity-30 shrink-0" />
              )}

              <span
                className={`font-mono text-xs truncate ${
                  col.is_primary
                    ? isDark
                      ? 'text-[#F5F3EF] font-bold'
                      : 'text-[#171717] font-bold'
                    : isDark
                    ? 'text-[#F5F3EF]'
                    : 'text-[#171717]'
                }`}
              >
                {col.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pl-2">
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                  isDark
                    ? 'bg-[#08090B] text-[#A6A4A0] border-[#242321]'
                    : 'bg-[#F7F3EA] text-[#6B665E] border-[#E8E1D5]'
                }`}
              >
                {col.data_type}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={`!w-3 !h-3 !border-2 !cursor-pointer ${
          isDark
            ? '!bg-[#FFC900] !border-[#08090B]'
            : '!bg-[#D9A300] !border-white'
        }`}
      />
    </div>
  );
});
