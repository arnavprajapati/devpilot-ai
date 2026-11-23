import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import {
  Calendar,
  CheckCircle2,
  GitBranch,
  Edit2,
  Trash2,
  CheckSquare,
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
      className={`w-72 rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden cursor-pointer select-none ${
        selected
          ? isDark
            ? 'border-[#FFC900] ring-2 ring-[#FFC900]/30 shadow-xl'
            : 'border-[#D9A300] ring-2 ring-[#D9A300]/30 shadow-lg'
          : isDark
          ? 'border-[#242321] bg-[#18191D] hover:border-[#FFC900]/40 hover:shadow-md'
          : 'border-[#E5DFD5] bg-white hover:border-[#D9A300]/50 hover:shadow-md'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-3.5 !h-3.5 !border-2 !cursor-pointer !shadow-sm hover:!scale-125 !transition-transform ${
          isDark
            ? '!bg-[#FFC900] !border-[#08090B]'
            : '!bg-[#D9A300] !border-white'
        }`}
      />
      <div className={`h-1.5 ${isDark ? 'bg-[#FFC900]' : 'bg-[#D9A300]'}`} />

      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
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
                  : 'bg-stone-50 text-stone-600 border-[#E5DFD5]'
              }`}
            >
              <Calendar className="w-3 h-3 opacity-60" />
              {nodeData.duration}
            </span>
          )}
        </div>

        <h4
          className={`text-xs font-bold line-clamp-2 leading-snug tracking-tight ${
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
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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
        className={`!w-3.5 !h-3.5 !border-2 !cursor-pointer !shadow-sm hover:!scale-125 !transition-transform ${
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
      className={`w-68 rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden cursor-pointer select-none ${
        selected
          ? isDark
            ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-xl'
            : 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-lg'
          : isDark
          ? 'border-[#242321] bg-[#18191D] hover:border-emerald-500/40 hover:shadow-md'
          : 'border-[#E5DFD5] bg-white hover:border-emerald-500/50 hover:shadow-md'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-white dark:!border-[#18191D] !cursor-pointer !shadow-sm hover:!scale-125 !transition-transform"
      />
      <div className="h-1 bg-emerald-500" />

      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                isDark
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Milestone {nodeData.order ? `0${nodeData.order}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
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

        <h5
          className={`text-xs font-bold line-clamp-2 leading-snug tracking-tight ${
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
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-white dark:!border-[#18191D] !cursor-pointer !shadow-sm hover:!scale-125 !transition-transform"
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
      className={`w-68 rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden cursor-pointer select-none ${
        selected
          ? isDark
            ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-xl'
            : 'border-amber-500 ring-2 ring-amber-500/20 shadow-lg'
          : isDark
          ? 'border-[#242321] bg-[#18191D] hover:border-amber-400/50 hover:shadow-md'
          : 'border-[#E5DFD5] bg-white hover:border-amber-500/50 hover:shadow-md'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !border-white dark:!border-[#18191D] !bg-amber-500 !shadow-sm hover:!scale-125 !transition-transform !cursor-pointer"
      />
      <div className={`h-1 ${isDark ? 'bg-amber-400' : 'bg-amber-500'}`} />

      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                isDark
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              Task {nodeData.order ? `0${nodeData.order}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            {nodeData.onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nodeData.onEdit?.(id);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                    : 'text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
                }`}
                title="Edit Task"
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
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'text-[#A6A4A0] hover:text-rose-400 hover:bg-rose-950/20'
                    : 'text-[#6B665E] hover:text-rose-600 hover:bg-rose-50'
                }`}
                title="Delete Task"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <h6
          className={`text-xs font-bold line-clamp-2 leading-snug tracking-tight ${
            isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
          }`}
        >
          {nodeData.title}
        </h6>

        {nodeData.description && (
          <p
            className={`text-[11px] line-clamp-2 leading-relaxed ${
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
        className="!w-3 !h-3 !border-2 !border-white dark:!border-[#18191D] !bg-amber-500 !shadow-sm hover:!scale-125 !transition-transform !cursor-pointer"
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
      className={`w-68 rounded-2xl border-2 border-dashed transition-all duration-200 shadow-sm overflow-hidden cursor-pointer select-none ${
        selected
          ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xl'
          : isDark
          ? 'border-purple-500/40 bg-[#18191D] hover:border-purple-400 hover:shadow-md'
          : 'border-purple-300 bg-white hover:border-purple-500 hover:shadow-md'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-purple-500 !border-2 !border-white dark:!border-[#18191D] !cursor-pointer !shadow-sm hover:!scale-125 !transition-transform"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white dark:!border-[#18191D] !cursor-pointer !shadow-sm hover:!scale-125 !transition-transform"
      />

      <div className="p-3.5 space-y-2 text-center">
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex p-1.5 rounded-xl ${
              isDark ? 'bg-purple-950/40 text-purple-300' : 'bg-purple-100 text-purple-700'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-0.5">
            {nodeData.onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nodeData.onEdit?.(id);
                }}
                title="Edit Decision Gate"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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

        <h6
          className={`text-xs font-bold line-clamp-2 tracking-tight ${
            isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
          }`}
        >
          {nodeData.title}
        </h6>

        {nodeData.description && (
          <p
            className={`text-[11px] line-clamp-2 leading-relaxed ${
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
        className="!w-3.5 !h-3.5 !bg-purple-500 !border-2 !border-white dark:!border-[#18191D] !cursor-pointer !shadow-sm hover:!scale-125 !transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white dark:!border-[#18191D] !cursor-pointer !shadow-sm hover:!scale-125 !transition-transform"
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
