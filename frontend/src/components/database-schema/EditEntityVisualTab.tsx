import { Plus, Trash2, Key, Link2 } from 'lucide-react';
import { type SchemaColumn } from '../../services/databaseSchemaApi';

interface EditEntityVisualTabProps {
  name: string;
  onNameChange: (name: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  columns: SchemaColumn[];
  isDoc: boolean;
  isDark: boolean;
  handleAddColumn: () => void;
  handleRemoveColumn: (idx: number) => void;
  handleUpdateColumn: (idx: number, patch: Partial<SchemaColumn>) => void;
}

export function EditEntityVisualTab({
  name,
  onNameChange,
  description,
  setDescription,
  columns,
  isDoc,
  isDark,
  handleAddColumn,
  handleRemoveColumn,
  handleUpdateColumn,
}: EditEntityVisualTabProps) {
  return (
        <div className="p-5 space-y-4 overflow-y-auto flex-1 no-scrollbar">
          <div className="space-y-3">
            <div>
              <label
                className={`text-[11px] font-semibold uppercase tracking-wider block mb-1 ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                {isDoc ? 'Collection Name' : 'Table Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  onNameChange(e.target.value);
                }}
                className={`w-full px-3 py-1.5 rounded-xl border text-sm font-semibold focus:outline-none ${
                  isDark
                    ? 'bg-[#08090B] border-[#242321] text-[#F5F3EF] focus:border-[#FFC900]'
                    : 'bg-white border-[#E8E1D5] text-[#171717] focus:border-[#D9A300]'
                }`}
              />
            </div>

            <div>
              <label
                className={`text-[11px] font-semibold uppercase tracking-wider block mb-1 ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Entity description..."
                className={`w-full px-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                  isDark
                    ? 'bg-[#08090B] border-[#242321] text-[#F5F3EF] focus:border-[#FFC900]'
                    : 'bg-white border-[#E8E1D5] text-[#171717] focus:border-[#D9A300]'
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                {isDoc ? 'Document Fields' : 'Table Columns'} ({columns.length})
              </label>
              <button
                type="button"
                onClick={handleAddColumn}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#242321] bg-[#18191D] text-[#FFC900] hover:bg-[#242321]'
                    : 'border-[#E8E1D5] bg-[#F7F3EA] text-[#D9A300] hover:bg-stone-200'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto no-scrollbar">
              {columns.map((col, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex flex-wrap items-center gap-2 text-xs ${
                    isDark
                      ? 'bg-[#18191D] border-[#242321]'
                      : 'bg-[#FAF8F5] border-[#E8E1D5]'
                  }`}
                >
                  <input
                    type="text"
                    value={col.name}
                    placeholder="column_name"
                    onChange={(e) => handleUpdateColumn(idx, { name: e.target.value })}
                    className={`flex-1 min-w-[110px] px-2.5 py-1 rounded-lg border font-mono text-xs focus:outline-none ${
                      isDark
                        ? 'bg-[#08090B] border-[#242321] text-[#F5F3EF] focus:border-[#FFC900]'
                        : 'bg-white border-[#E8E1D5] text-[#171717] focus:border-[#D9A300]'
                    }`}
                  />

                  <input
                    type="text"
                    value={col.data_type}
                    placeholder="type"
                    onChange={(e) => handleUpdateColumn(idx, { data_type: e.target.value })}
                    className={`w-28 px-2 py-1 rounded-lg border font-mono text-xs focus:outline-none ${
                      isDark
                        ? 'bg-[#08090B] border-[#242321] text-[#A6A4A0] focus:border-[#FFC900]'
                        : 'bg-white border-[#E8E1D5] text-[#6B665E] focus:border-[#D9A300]'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => handleUpdateColumn(idx, { is_primary: !col.is_primary })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                      col.is_primary
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : isDark
                        ? 'bg-[#08090B] border-[#242321] text-[#A6A4A0]'
                        : 'bg-white border-[#E8E1D5] text-[#6B665E]'
                    }`}
                  >
                    <Key className="w-2.5 h-2.5" />
                    PK
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateColumn(idx, { is_foreign: !col.is_foreign })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                      col.is_foreign
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                        : isDark
                        ? 'bg-[#08090B] border-[#242321] text-[#A6A4A0]'
                        : 'bg-white border-[#E8E1D5] text-[#6B665E]'
                    }`}
                  >
                    <Link2 className="w-2.5 h-2.5" />
                    FK
                  </button>

                  {col.is_foreign && (
                    <input
                      type="text"
                      value={col.references || ''}
                      placeholder="target.id"
                      onChange={(e) => handleUpdateColumn(idx, { references: e.target.value })}
                      className={`w-24 px-2 py-0.5 rounded border text-[10px] font-mono focus:outline-none ${
                        isDark
                          ? 'bg-[#08090B] border-[#242321] text-sky-400'
                          : 'bg-white border-[#E8E1D5] text-sky-700'
                      }`}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveColumn(idx)}
                    className="p-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
  );
}
