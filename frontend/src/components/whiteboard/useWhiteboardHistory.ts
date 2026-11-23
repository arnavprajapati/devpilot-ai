import { useState, useCallback, type MutableRefObject } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface UseWhiteboardHistoryProps {
  nodesRef: MutableRefObject<Node[]>;
  edgesRef: MutableRefObject<Edge[]>;
  setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  setHasUnsavedChanges: (val: boolean) => void;
}

export function useWhiteboardHistory({
  nodesRef,
  edgesRef,
  setNodes,
  setEdges,
  setHasUnsavedChanges,
}: UseWhiteboardHistoryProps) {
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);

  const pushHistory = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    setHistory((prev) => [...prev.slice(-30), { nodes: currentNodes, edges: currentEdges }]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, { nodes: nodesRef.current, edges: edgesRef.current }]);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setHasUnsavedChanges(true);
  }, [history, nodesRef, edgesRef, setNodes, setEdges, setHasUnsavedChanges]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, { nodes: nodesRef.current, edges: edgesRef.current }]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setNodes(next.nodes);
    setEdges(next.edges);
    setHasUnsavedChanges(true);
  }, [redoStack, nodesRef, edgesRef, setNodes, setEdges, setHasUnsavedChanges]);

  return {
    history,
    setHistory,
    redoStack,
    setRedoStack,
    pushHistory,
    handleUndo,
    handleRedo,
  };
}
