import { useState, useCallback, type MutableRefObject } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface UseWhiteboardClipboardProps {
  nodesRef: MutableRefObject<Node[]>;
  edgesRef: MutableRefObject<Edge[]>;
  setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  pushHistory: (nodes: Node[], edges: Edge[]) => void;
  setHasUnsavedChanges: (val: boolean) => void;
  handleEditNode: (nodeId: string) => void;
  handleDeleteNode: (nodeId: string) => void;
}

export function useWhiteboardClipboard({
  nodesRef,
  edgesRef,
  setNodes,
  setEdges,
  pushHistory,
  setHasUnsavedChanges,
  handleEditNode,
  handleDeleteNode,
}: UseWhiteboardClipboardProps) {
  const [clipboard, setClipboard] = useState<{ nodes: Node[]; isCut?: boolean } | null>(null);

  const handleCopy = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    setClipboard({ nodes: JSON.parse(JSON.stringify(selected)), isCut: false });
  }, [nodesRef]);

  const handleCut = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    pushHistory(nodesRef.current, edgesRef.current);
    setClipboard({ nodes: JSON.parse(JSON.stringify(selected)), isCut: true });
    const selectedIds = new Set(selected.map((n) => n.id));
    setNodes((nds) => nds.filter((n) => !selectedIds.has(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
    setHasUnsavedChanges(true);
  }, [pushHistory, nodesRef, edgesRef, setNodes, setEdges, setHasUnsavedChanges]);

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
    setClipboard(null);
  }, [clipboard, pushHistory, nodesRef, edgesRef, handleEditNode, handleDeleteNode, setNodes, setHasUnsavedChanges]);

  return {
    clipboard,
    handleCopy,
    handleCut,
    handlePaste,
  };
}
