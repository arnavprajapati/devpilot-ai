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
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div
      className={`w-72 rounded-2xl bg-white border transition-all shadow-md overflow-hidden cursor-pointer select-none ${
        selected
          ? 'border-black ring-2 ring-black/20 shadow-lg'
          : 'border-zinc-200/90 hover:border-zinc-300'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-zinc-800 !border-2 !border-white !cursor-pointer"
      />
      <div className="h-1.5 bg-gradient-to-r from-[#FF4055] to-[#FF8A1C]" />

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-black text-white text-[10px] font-black uppercase tracking-wider">
            Phase {nodeData.order ? `0${nodeData.order}` : ''}
          </span>
          {nodeData.duration && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
              <Calendar className="w-3 h-3 text-zinc-400" />
              {nodeData.duration}
            </span>
          )}
        </div>

        <h4 className="text-xs font-bold text-zinc-950 line-clamp-2 leading-snug">
          {nodeData.title}
        </h4>

        {nodeData.description && (
          <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
            {nodeData.description}
          </p>
        )}

        <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-1">
          {nodeData.onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onEdit?.(id);
              }}
              title="Edit Node"
              className="p-1 rounded-md text-zinc-600 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
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
              className="p-1 rounded-md text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-black !border-2 !border-white !cursor-pointer"
      />
    </div>
  );
});

export const MilestoneNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div
      className={`w-64 rounded-2xl bg-white border transition-all shadow-sm overflow-hidden cursor-pointer select-none ${
        selected
          ? 'border-[#FF4055] ring-2 ring-[#FF4055]/20 shadow-md'
          : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-zinc-700 !border-2 !border-white !cursor-pointer"
      />
      <div className="h-1 bg-emerald-500" />

      <div className="p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Milestone {nodeData.order ? `0${nodeData.order}` : ''}
          </span>
        </div>

        <h5 className="text-xs font-bold text-zinc-900 line-clamp-2 leading-snug">
          {nodeData.title}
        </h5>

        {nodeData.description && (
          <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
            {nodeData.description}
          </p>
        )}

        <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-1">
          {nodeData.onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onEdit?.(id);
              }}
              title="Edit Milestone"
              className="p-1 rounded-md text-zinc-600 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
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
              className="p-1 rounded-md text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-600 !border-2 !border-white !cursor-pointer"
      />
    </div>
  );
});

export const TaskNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div
      className={`w-60 rounded-xl bg-zinc-50/90 border transition-all shadow-2xs overflow-hidden cursor-pointer select-none ${
        selected
          ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-md'
          : 'border-zinc-200/90 hover:border-zinc-300 hover:bg-white'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-zinc-600 !border-2 !border-white !cursor-pointer"
      />

      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="w-4 h-4 rounded-md bg-zinc-200/80 text-zinc-700 text-[9px] font-bold flex items-center justify-center shrink-0">
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
                className="p-1 text-zinc-600 hover:text-black cursor-pointer"
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
                className="p-1 text-zinc-600 hover:text-red-600 cursor-pointer"
                title="Delete Task"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        <h6 className="text-[11px] font-bold text-zinc-900 line-clamp-2 leading-snug">
          {nodeData.title}
        </h6>

        {nodeData.description && (
          <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
            {nodeData.description}
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-blue-600 !border-2 !border-white !cursor-pointer"
      />
    </div>
  );
});

export const DecisionNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div
      className={`w-60 rounded-2xl bg-white border-2 border-dashed transition-all shadow-sm overflow-hidden cursor-pointer select-none ${
        selected
          ? 'border-purple-600 bg-purple-50/20 ring-2 ring-purple-500/20 shadow-md'
          : 'border-purple-300 hover:border-purple-500'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-600 !border-2 !border-white !cursor-pointer"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-purple-600 !border-2 !border-white !cursor-pointer"
      />

      <div className="p-3.5 space-y-2 text-center">
        <div className="inline-flex p-1.5 rounded-xl bg-purple-100 text-purple-700 mx-auto">
          <GitBranch className="w-4 h-4" />
        </div>

        <h6 className="text-xs font-bold text-zinc-900 line-clamp-2">
          {nodeData.title}
        </h6>

        {nodeData.description && (
          <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
            {nodeData.description}
          </p>
        )}

        <div className="pt-2 border-t border-purple-100 flex items-center justify-center gap-2">
          {nodeData.onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onEdit?.(id);
              }}
              title="Edit Decision Gate"
              className="p-1 rounded-md text-zinc-600 hover:text-black hover:bg-purple-100 transition-colors cursor-pointer"
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
              className="p-1 rounded-md text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-600 !border-2 !border-white !cursor-pointer"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-purple-600 !border-2 !border-white !cursor-pointer"
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
