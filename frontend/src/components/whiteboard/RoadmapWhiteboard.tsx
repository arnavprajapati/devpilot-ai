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
import { EditNodeModal } from './EditNodeModal';
import { ResetLayoutModal } from './ResetLayoutModal';

interface RoadmapWhiteboardProps {
  projectId: number;
  roadmap: Roadmap;
}

export function RoadmapWhiteboard({ projectId, roadmap }: RoadmapWhiteboardProps) {
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

  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [clipboard, setClipboard] = useState<{ nodes: Node[]; isCut?: boolean } | null>(null);
  const dragStartSnapshot = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const reactFlowInstance = useRef<any>(null);

  const pushHistory = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    setHistory((prev) => [...prev.slice(-30), { nodes: currentNodes, edges: currentEdges }]);
    setRedoStack([]);
  }, []);

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

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, { nodes: nodesRef.current, edges: edgesRef.current }]);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setHasUnsavedChanges(true);
  }, [history, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, { nodes: nodesRef.current, edges: edgesRef.current }]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setNodes(next.nodes);
    setEdges(next.edges);
    setHasUnsavedChanges(true);
  }, [redoStack, setNodes, setEdges]);

  const handleCopy = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    setClipboard({ nodes: JSON.parse(JSON.stringify(selected)), isCut: false });
  }, []);

  const handleCut = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    pushHistory(nodesRef.current, edgesRef.current);
    setClipboard({ nodes: JSON.parse(JSON.stringify(selected)), isCut: true });
    const selectedIds = new Set(selected.map((n) => n.id));
    setNodes((nds) => nds.filter((n) => !selectedIds.has(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
    setHasUnsavedChanges(true);
  }, [pushHistory, setNodes, setEdges]);

  const handlePaste = useCallback(() => {
    if (!clipboard || clipboard.nodes.length === 0) return;
    pushHistory(nodesRef.current, edgesRef.current);
    const newNodes: Node[] = clipboard.nodes.map((node, idx) => {
      const newId = `${node.data?.nodeType || 'node'}-${Date.now()}-${idx}`;
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 30,
          y: node.position.y + 30,
        },
        selected: true,
        data: {
          ...node.data,
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
        },
      };
    });
    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]);
    setHasUnsavedChanges(true);
  }, [clipboard, pushHistory, handleEditNode, handleDeleteNode, setNodes]);

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
    <div className="whiteboard-canvas w-full h-full flex flex-col bg-white overflow-hidden relative">
      <style>{`
        .whiteboard-canvas,
        .whiteboard-canvas .react-flow,
        .whiteboard-canvas .react-flow__pane,
        .whiteboard-canvas .react-flow__viewport {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23000000' stroke='%23ffffff' stroke-width='1.5'%3E%3Cpolygon points='2,2 2,19 7,14 11,21 13.5,19.5 9.5,12.5 16,12.5'/%3E%3C/svg%3E") 2 2, default !important;
        }
        .whiteboard-canvas .react-flow__pane.dragging,
        .whiteboard-canvas .react-flow__pane:active {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23000000' stroke='%23ffffff' stroke-width='1.5'%3E%3Cpath d='M10 2a1 1 0 0 1 1 1v5a1 1 0 0 1 2 0V4a1 1 0 0 1 2 0v5a1 1 0 0 1 2 0V6a1 1 0 0 1 2 0v8a6 6 0 0 1-6 6H9a6 6 0 0 1-5.6-3.8L2.2 14a1 1 0 0 1 1.6-1.2L6 15V3a1 1 0 0 1 2-1h2z'/%3E%3C/svg%3E") 10 10, grabbing !important;
        }
        .whiteboard-canvas .react-flow__node,
        .whiteboard-canvas .react-flow__node *,
        .whiteboard-canvas .react-flow__handle,
        .whiteboard-canvas .react-flow__handle *,
        .whiteboard-canvas button,
        .whiteboard-canvas button * {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23000000' stroke='%23ffffff' stroke-width='1.5'%3E%3Cpath d='M8 1a1 1 0 0 1 1 1v8h1V4a1 1 0 0 1 2 0v7h1V6a1 1 0 0 1 2 0v5h1V8a1 1 0 0 1 2 0v7a6 6 0 0 1-6 6H9a6 6 0 0 1-5.6-3.8L2.2 14a1 1 0 0 1 1.6-1.2L6 15V2a1 1 0 0 1 2-1z'/%3E%3C/svg%3E") 8 1, pointer !important;
        }
        .whiteboard-canvas input,
        .whiteboard-canvas textarea {
          cursor: text !important;
          caret-color: #000000 !important;
        }
      `}</style>

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
          <div className="w-full h-full flex flex-col items-center justify-center bg-white text-zinc-500">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-black animate-spin mb-3" />
            <p className="text-xs font-medium">Rendering Interactive Whiteboard...</p>
          </div>
        ) : (
          <ReactFlow
            nodes={visibleNodes}
            edges={visibleEdges}
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
              style: { stroke: '#71717a', strokeWidth: 2 },
            }}
            fitView
            minZoom={0.15}
            maxZoom={2.5}
            className="bg-zinc-50/60"
          >
            <Background color="#e4e4e7" gap={20} size={1} />
            <Controls className="!bg-white !border-zinc-200 !text-zinc-700 fill-zinc-700 !shadow-sm !rounded-xl overflow-hidden cursor-pointer" />
            <MiniMap
              nodeStrokeColor="#cbd5e1"
              nodeColor="#f4f4f5"
              maskColor="rgba(255, 255, 255, 0.7)"
              className="!bg-white !border-zinc-200 !rounded-xl !shadow-sm hidden sm:block"
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
