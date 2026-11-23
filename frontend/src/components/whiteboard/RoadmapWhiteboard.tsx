import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { whiteboardApi } from '../../services/whiteboardApi';
import type { WhiteboardNode, WhiteboardEdge } from '../../services/whiteboardApi';
import type { Roadmap } from '../../services/roadmapApi';
import { nodeTypes } from './customNodes';
import { WhiteboardHeader } from './WhiteboardHeader';
import { WhiteboardCursorStyles } from './WhiteboardCursorStyles';
import { useWhiteboardHistory } from './useWhiteboardHistory';
import { useWhiteboardClipboard } from './useWhiteboardClipboard';
import { EditNodeModal } from './EditNodeModal';
import { ResetLayoutModal } from './ResetLayoutModal';
import { useTheme } from '../../context/ThemeContext';

interface RoadmapWhiteboardProps {
  projectId: number;
  roadmap: Roadmap;
  onCanvasClick?: () => void;
}

export function RoadmapWhiteboard({ projectId, roadmap, onCanvasClick }: RoadmapWhiteboardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<number | 'all'>(
    roadmap.phases[0]?.id ?? 'all'
  );
  const [editingNode, setEditingNode] = useState<{ id: string; title: string; description: string } | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);


  const dragStartSnapshot = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const reactFlowInstance = useRef<any>(null);

  const {
    history,
    setHistory,
    redoStack,
    setRedoStack,
    pushHistory,
    handleUndo,
    handleRedo,
  } = useWhiteboardHistory({
    nodesRef,
    edgesRef,
    setNodes,
    setEdges,
    setHasUnsavedChanges,
  });

  const handleEditNode = useCallback((nodeId: string) => {
    setNodes((currentNodes) => {
      const target = currentNodes.find((n) => n.id === nodeId);
      if (target) {
        setEditingNode({
          id: target.id,
          title: (target.data?.title as string) || (target.data?.label as string) || '',
          description: (target.data?.description as string) || '',
        });
      }
      return currentNodes;
    });
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    pushHistory(nodesRef.current, edgesRef.current);
    setNodes((currentNodes) => currentNodes.filter((n) => n.id !== nodeId));
    setEdges((currentEdges) =>
      currentEdges.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
    setHasUnsavedChanges(true);
  }, [pushHistory, setNodes, setEdges]);

  const attachNodeCallbacks = useCallback(
    (rawNodes: any[]) => {
      return rawNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
        },
      }));
    },
    [handleEditNode, handleDeleteNode]
  );

  useEffect(() => {
    let isCancelled = false;

    const loadWhiteboard = async () => {
      setIsLoading(true);
      try {
        const res = await whiteboardApi.getWhiteboard(projectId);
        if (!isCancelled && res.data?.whiteboard) {
          const fetchedNodes = attachNodeCallbacks(res.data.whiteboard.nodes || []);
          const fetchedEdges = (res.data.whiteboard.edges || []).map((e: any) => ({
            ...e,
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
          }));
          setNodes(fetchedNodes);
          setEdges(fetchedEdges);
          setHistory([]);
          setRedoStack([]);
          setHasUnsavedChanges(false);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadWhiteboard();

    return () => {
      isCancelled = true;
    };
  }, [projectId, attachNodeCallbacks, setNodes, setEdges]);



  const { handleCopy, handleCut, handlePaste } = useWhiteboardClipboard({
    nodesRef,
    edgesRef,
    setNodes,
    setEdges,
    pushHistory,
    setHasUnsavedChanges,
    handleEditNode,
    handleDeleteNode,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (
        (isCtrlOrCmd && e.key.toLowerCase() === 'y') ||
        (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCut();
      } else if (isCtrlOrCmd && (e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        handlePaste();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleCopy, handleCut, handlePaste]);

  const onConnect = useCallback(
    (params: Connection) => {
      pushHistory(nodesRef.current, edgesRef.current);
      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setHasUnsavedChanges(true);
    },
    [pushHistory, setEdges]
  );

  const onNodeDragStart = useCallback(() => {
    dragStartSnapshot.current = { nodes: nodesRef.current, edges: edgesRef.current };
  }, []);

  const onNodeDragStop = useCallback(() => {
    if (dragStartSnapshot.current) {
      pushHistory(dragStartSnapshot.current.nodes, dragStartSnapshot.current.edges);
      dragStartSnapshot.current = null;
    }
    setHasUnsavedChanges(true);
  }, [pushHistory]);

  const handleNodesChangeWrapped = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      if (changes.some((c: any) => c.type === 'remove')) {
        setHasUnsavedChanges(true);
      }
    },
    [onNodesChange]
  );

  const handleEdgesChangeWrapped = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      if (changes.some((c: any) => c.type === 'remove')) {
        setHasUnsavedChanges(true);
      }
    },
    [onEdgesChange]
  );

  const handleSave = async () => {
    setIsSaving(true);
    const nodesToSave = nodesRef.current.map((n) => {
      const { onEdit, onDelete, ...restData } = n.data || {};
      return {
        ...n,
        data: restData,
      };
    }) as WhiteboardNode[];

    const res = await whiteboardApi.updateWhiteboard(projectId, {
      nodes: nodesToSave,
      edges: edgesRef.current as WhiteboardEdge[],
      viewport: reactFlowInstance.current?.getViewport?.(),
    });

    if (res.data?.whiteboard) {
      setHasUnsavedChanges(false);
    }
    setIsSaving(false);
  };

  const handleResetLayout = async () => {
    setIsSaving(true);
    setConfirmResetOpen(false);
    pushHistory(nodesRef.current, edgesRef.current);
    const res = await whiteboardApi.resetWhiteboard(projectId);
    if (res.data?.whiteboard) {
      const resetNodes = attachNodeCallbacks(res.data.whiteboard.nodes || []);
      const resetEdges = (res.data.whiteboard.edges || []).map((e: any) => ({
        ...e,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      }));
      setNodes(resetNodes);
      setEdges(resetEdges);
      setHasUnsavedChanges(false);
      reactFlowInstance.current?.fitView?.({ padding: 0.2, duration: 400 });
    }
    setIsSaving(false);
  };

  const handleAddNode = (type: 'task' | 'milestone' | 'decision' | 'phase') => {
    pushHistory(nodesRef.current, edgesRef.current);
    const id = `${type}-${Date.now()}`;
    const center = reactFlowInstance.current?.screenToFlowPosition
      ? reactFlowInstance.current.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        })
      : { x: 300, y: 250 };

    let nodeType = 'taskNode';
    let defaultTitle = 'New Engineering Task';
    let defaultDescription = 'Define implementation details and technical deliverables.';

    if (type === 'milestone') {
      nodeType = 'milestoneNode';
      defaultTitle = 'New Milestone Deliverable';
      defaultDescription = 'Key technical milestone for project deliverables.';
    } else if (type === 'decision') {
      nodeType = 'decisionNode';
      defaultTitle = 'QA & Architecture Review Gate';
      defaultDescription = 'Review tests, benchmarks, and security before proceeding.';
    } else if (type === 'phase') {
      nodeType = 'phaseNode';
      defaultTitle = 'New Development Phase';
      defaultDescription = 'Next development stage in the engineering execution plan.';
    }

    const newNode: Node = {
      id,
      type: nodeType,
      position: { x: center.x, y: center.y },
      data: {
        title: defaultTitle,
        label: defaultTitle,
        description: defaultDescription,
        nodeType: type,
        onEdit: handleEditNode,
        onDelete: handleDeleteNode,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
  };

  const handleSaveNodeEdit = () => {
    if (!editingNode) return;
    pushHistory(nodesRef.current, edgesRef.current);
    setNodes((currentNodes) =>
      currentNodes.map((n) => {
        if (n.id === editingNode.id) {
          return {
            ...n,
            data: {
              ...n.data,
              title: editingNode.title,
              label: editingNode.title,
              description: editingNode.description,
            },
          };
        }
        return n;
      })
    );
    setEditingNode(null);
    setHasUnsavedChanges(true);
  };

  const visibleNodes = useMemo(() => {
    if (selectedPhaseFilter === 'all') {
      return nodes;
    }
    return nodes.filter((n) => {
      const pId = n.data?.phaseId;
      if (!pId) return true;
      return pId === selectedPhaseFilter;
    });
  }, [nodes, selectedPhaseFilter]);

  const visibleNodeIds = useMemo(() => {
    return new Set(visibleNodes.map((n) => n.id));
  }, [visibleNodes]);

  const visibleEdges = useMemo(() => {
    if (selectedPhaseFilter === 'all') {
      return edges;
    }
    return edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [edges, selectedPhaseFilter, visibleNodeIds]);

  return (
    <div className={`whiteboard-canvas w-full h-full flex flex-col overflow-hidden relative ${isDark ? 'bg-[#08090B]' : 'bg-[#F7F3EA]'}`}>
      <WhiteboardCursorStyles />

      <WhiteboardHeader
        roadmap={roadmap}
        selectedPhaseFilter={selectedPhaseFilter}
        onSelectPhaseFilter={(filter) => {
          setSelectedPhaseFilter(filter);
          setTimeout(() => reactFlowInstance.current?.fitView?.({ padding: 0.2 }), 50);
        }}
        hasUnsavedChanges={hasUnsavedChanges}
        historyLength={history.length}
        redoStackLength={redoStack.length}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onAddNode={handleAddNode}
        onOpenReset={() => setConfirmResetOpen(true)}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <div className="flex-1 w-full h-full relative">
        {isLoading ? (
          <div
            className={`w-full h-full flex flex-col items-center justify-center ${
              isDark ? 'bg-[#08090B] text-[#A6A4A0]' : 'bg-[#F7F3EA] text-[#6B665E]'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full border-2 animate-spin mb-3 ${
                isDark
                  ? 'border-[#242321] border-t-[#FFC900]'
                  : 'border-[#E8E1D5] border-t-[#D9A300]'
              }`}
            />
            <p className="text-xs font-medium">Rendering Interactive Whiteboard...</p>
          </div>
        ) : (
          <ReactFlow
            nodes={visibleNodes}
            edges={visibleEdges}
            onPaneClick={onCanvasClick}
            onNodesChange={handleNodesChangeWrapped}
            onEdgesChange={handleEdgesChangeWrapped}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onInit={(instance) => {
              reactFlowInstance.current = instance;
              setTimeout(() => instance.fitView({ padding: 0.2 }), 100);
            }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              style: { stroke: isDark ? '#A6A4A0' : '#8C857B', strokeWidth: 2 },
            }}
            fitView
            minZoom={0.15}
            maxZoom={2.5}
            className={isDark ? 'bg-[#08090B]' : 'bg-[#F7F3EA]'}
          >
            <Background color={isDark ? '#242321' : '#E8E1D5'} gap={20} size={1.2} />
            <Controls
              className={
                isDark
                  ? '!bg-[#18191D] !border-[#242321] !text-[#F5F3EF] fill-[#F5F3EF] !shadow-lg !rounded-xl overflow-hidden cursor-pointer'
                  : '!bg-white !border-[#E8E1D5] !text-[#171717] fill-[#171717] !shadow-xs !rounded-xl overflow-hidden cursor-pointer'
              }
            />
            <MiniMap
              nodeStrokeColor={isDark ? '#343330' : '#cbd5e1'}
              nodeColor={isDark ? '#18191D' : '#f4f4f5'}
              maskColor={isDark ? 'rgba(8, 9, 11, 0.75)' : 'rgba(247, 243, 234, 0.75)'}
              className={`!rounded-xl hidden sm:block ${
                isDark ? '!bg-[#08090B] !border-[#242321] !shadow-lg' : '!bg-white !border-[#E8E1D5] !shadow-xs'
              }`}
            />
          </ReactFlow>
        )}
      </div>

      <EditNodeModal
        node={editingNode}
        onClose={() => setEditingNode(null)}
        onChangeTitle={(title) => editingNode && setEditingNode({ ...editingNode, title })}
        onChangeDescription={(description) =>
          editingNode && setEditingNode({ ...editingNode, description })
        }
        onSave={handleSaveNodeEdit}
      />

      <ResetLayoutModal
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleResetLayout}
      />
    </div>
  );
}
