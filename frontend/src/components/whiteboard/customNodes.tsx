import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import {
  Calendar,
  CheckCircle2,
  GitBranch,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface CustomNodeData {
  title: string;
  description?: string;
  duration?: string;
  order?: number;
  nodeType: 'phase' | 'milestone' | 'task' | 'decision';
  phaseId?: number;
  milestoneId?: number;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

export const PhaseNode = memo(({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeData = data as unknown as CustomNodeData;

  return (
    <div
      className={`w-72 rounded-2xl border transition-all shadow-md overflow-hidden cursor-pointer select-none ${
        selected
          ? isDark
            ? 'border-[#FFC900] ring-2 ring-[#FFC900]/30 shadow-xl'
            : 'border-[#D9A300] ring-2 ring-[#D9A300]/30 shadow-lg'
          : isDark
          ? 'border-[#242321] bg-[#18191D] hover:border-[#FFC900]/40'
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
      <div className={`h-1.5 ${isDark ? 'bg-[#FFC900]' : 'bg-[#D9A300]'}`} />

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
              isDark
                ? 'bg-[#FFC900] text-[#08090B]'
                : 'bg-[#D9A300] text-white'
            }`}
          >
            Phase {nodeData.order ? `0${nodeData.order}` : ''}
          </span>
          {nodeData.duration && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                isDark
                  ? 'bg-[#08090B] text-[#A6A4A0] border-[#242321]'
                  : 'bg-stone-100 text-stone-600 border-[#E8E1D5]'
              }`}
            >
              <Calendar className="w-3 h-3 opacity-60" />
              {nodeData.duration}
            </span>
          )}
        </div>

        <h4
          className={`text-xs font-bold line-clamp-2 leading-snug ${
            isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
          }`}
        >
          {nodeData.title}
        </h4>

        {nodeData.description && (
          <p
            className={`text-[11px] line-clamp-2 leading-relaxed ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            {nodeData.description}
          </p>
        )}

        <div
          className={`pt-2 border-t flex items-center justify-end gap-1 ${
            isDark ? 'border-[#242321]' : 'border-stone-100'
          }`}
        >
          {nodeData.onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onEdit?.(id);
              }}
              title="Edit Node"
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                  : 'text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
              }`}
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          {nodeData.onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onDelete?.(id);
              }}
              title="Delete Node"
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#A6A4A0] hover:text-rose-400 hover:bg-rose-950/20'
                  : 'text-[#6B665E] hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
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

export const MilestoneNode = memo(({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeData = data as unknown as CustomNodeData;

  return (
    <div
      className={`w-64 rounded-2xl border transition-all shadow-xs overflow-hidden cursor-pointer select-none ${
        selected
          ? isDark
            ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-lg'
            : 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
          : isDark
          ? 'border-[#242321] bg-[#18191D] hover:border-[#FFC900]/40'
          : 'border-[#E8E1D5] bg-white hover:border-[#D9A300]/40'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white !cursor-pointer"
      />
      <div className="h-1 bg-emerald-500" />

      <div className="p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-emerald-500">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Milestone {nodeData.order ? `0${nodeData.order}` : ''}
          </span>
        </div>

        <h5
          className={`text-xs font-bold line-clamp-2 leading-snug ${
            isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
          }`}
        >
          {nodeData.title}
        </h5>

        {nodeData.description && (
          <p
            className={`text-[11px] line-clamp-2 leading-relaxed ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            {nodeData.description}
          </p>
        )}

        <div
          className={`pt-2 border-t flex items-center justify-end gap-1 ${
            isDark ? 'border-[#242321]' : 'border-stone-100'
          }`}
        >
          {nodeData.onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onEdit?.(id);
              }}
              title="Edit Milestone"
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                  : 'text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
              }`}
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          {nodeData.onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onDelete?.(id);
              }}
              title="Delete Milestone"
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#A6A4A0] hover:text-rose-400 hover:bg-rose-950/20'
                  : 'text-[#6B665E] hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white !cursor-pointer"
      />
    </div>
  );
});

export const TaskNode = memo(({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeData = data as unknown as CustomNodeData;

  return (
    <div
      className={`w-60 rounded-xl border transition-all shadow-xs overflow-hidden cursor-pointer select-none ${
        selected
          ? isDark
            ? 'border-[#FFC900] bg-[#18191D] ring-2 ring-[#FFC900]/20 shadow-md'
            : 'border-[#D9A300] bg-white ring-2 ring-[#D9A300]/20 shadow-md'
          : isDark
          ? 'border-[#242321] bg-[#18191D] hover:border-[#FFC900]/40'
          : 'border-[#E8E1D5] bg-[#F7F3EA]/90 hover:border-[#D9A300]/40 hover:bg-white'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-2.5 !h-2.5 !border-2 !cursor-pointer ${
          isDark
            ? '!bg-[#A6A4A0] !border-[#08090B]'
            : '!bg-stone-500 !border-white'
        }`}
      />

      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`w-4 h-4 rounded-md text-[9px] font-bold flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-[#08090B] text-[#FFC900] border-[#242321]'
                : 'bg-white text-[#D9A300] border-[#E8E1D5]'
            }`}
          >
            {nodeData.order || 1}
          </span>
          <div className="flex items-center gap-0.5">
            {nodeData.onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nodeData.onEdit?.(id);
                }}
                className={`p-1 transition-colors cursor-pointer ${
                  isDark
                    ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                    : 'text-[#6B665E] hover:text-[#171717]'
                }`}
                title="Edit Task"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            )}
            {nodeData.onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nodeData.onDelete?.(id);
                }}
                className={`p-1 transition-colors cursor-pointer ${
                  isDark
                    ? 'text-[#A6A4A0] hover:text-rose-400'
                    : 'text-[#6B665E] hover:text-red-600'
                }`}
                title="Delete Task"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        <h6
          className={`text-[11px] font-bold line-clamp-2 leading-snug ${
            isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
          }`}
        >
          {nodeData.title}
        </h6>

        {nodeData.description && (
          <p
            className={`text-[10px] line-clamp-2 leading-relaxed ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            {nodeData.description}
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={`!w-2.5 !h-2.5 !border-2 !cursor-pointer ${
          isDark
            ? '!bg-[#FFC900] !border-[#08090B]'
            : '!bg-[#D9A300] !border-white'
        }`}
      />
    </div>
  );
});

export const DecisionNode = memo(({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeData = data as unknown as CustomNodeData;

  return (
    <div
      className={`w-60 rounded-2xl border-2 border-dashed transition-all shadow-xs overflow-hidden cursor-pointer select-none ${
        selected
          ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md'
          : isDark
          ? 'border-purple-500/40 bg-[#18191D] hover:border-purple-400'
          : 'border-purple-300 bg-white hover:border-purple-500'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !cursor-pointer"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-purple-500 !border-2 !border-white !cursor-pointer"
      />

      <div className="p-3.5 space-y-2 text-center">
        <div
          className={`inline-flex p-1.5 rounded-xl mx-auto ${
            isDark ? 'bg-purple-950/40 text-purple-300' : 'bg-purple-100 text-purple-700'
          }`}
        >
          <GitBranch className="w-4 h-4" />
        </div>

        <h6
          className={`text-xs font-bold line-clamp-2 ${
            isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
          }`}
        >
          {nodeData.title}
        </h6>

        {nodeData.description && (
          <p
            className={`text-[10px] line-clamp-2 leading-relaxed ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            {nodeData.description}
          </p>
        )}

        <div
          className={`pt-2 border-t flex items-center justify-center gap-2 ${
            isDark ? 'border-[#242321]' : 'border-purple-100'
          }`}
        >
          {nodeData.onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onEdit?.(id);
              }}
              title="Edit Decision Gate"
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                  : 'text-[#6B665E] hover:text-black hover:bg-purple-100'
              }`}
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          {nodeData.onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onDelete?.(id);
              }}
              title="Delete Decision Gate"
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#A6A4A0] hover:text-rose-400 hover:bg-rose-950/20'
                  : 'text-[#6B665E] hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !cursor-pointer"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-purple-500 !border-2 !border-white !cursor-pointer"
      />
    </div>
  );
});

export const nodeTypes = {
  phaseNode: PhaseNode,
  milestoneNode: MilestoneNode,
  taskNode: TaskNode,
  decisionNode: DecisionNode,
};
