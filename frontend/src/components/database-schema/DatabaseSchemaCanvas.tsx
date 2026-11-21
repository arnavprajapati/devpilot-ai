import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Database, Sparkles, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Project } from '../../services/projectsApi';
import { databaseSchemaApi, type DatabaseSchema, type SchemaRelationship } from '../../services/databaseSchemaApi';
import { TableNode } from './TableNode';
import { DocumentNode } from './DocumentNode';
import { DatabaseSchemaHeader } from './DatabaseSchemaHeader';
import { ExportCodeModal } from './ExportCodeModal';
import { EditEntityModal, type EditableEntity } from './EditEntityModal';

interface DatabaseSchemaCanvasProps {
  project: Project;
  onRegisterRegenerate?: (fn: () => void) => void;
  onGeneratingChange?: (generating: boolean) => void;
  onCanvasClick?: () => void;
}

export function DatabaseSchemaCanvas({
  project,
  onRegisterRegenerate,
  onGeneratingChange,
  onCanvasClick,
}: DatabaseSchemaCanvasProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const reactFlowInstance = useRef<any>(null);
  const dragStartSnapshot = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

  const schemaCache = useRef<Record<'table' | 'document', DatabaseSchema | null>>({
    table: null,
    document: null,
  });

  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [clipboard, setClipboard] = useState<{ nodes: Node[]; isCut: boolean } | null>(null);
  const [editingEntity, setEditingEntity] = useState<EditableEntity | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  const nodeTypes = useMemo(
    () => ({
      tableNode: TableNode,
      documentNode: DocumentNode,
    }),
    []
  );

  const pushHistory = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    setHistory((prev) => [...prev.slice(-25), { nodes: currentNodes, edges: currentEdges }]);
    setRedoStack([]);
  }, []);

  const handleOpenEditForNode = useCallback(
    (target: Node | string) => {
      const id = typeof target === 'string' ? target : target.id;
      const latest = nodesRef.current.find((n) => n.id === id) || (typeof target === 'object' ? target : null);
      if (!latest) return;
      setEditingEntity({
        id: latest.id,
        name: String(latest.data?.name || ''),
        description: String(latest.data?.description || ''),
        schemaType: (latest.data?.schemaType || schema?.schema_type || 'table') as 'table' | 'document',
        columns: latest.data?.columns ? JSON.parse(JSON.stringify(latest.data.columns)) : [],
      });
    },
    [schema?.schema_type]
  );

  const handleDeleteNode = useCallback((nodeId: string) => {
    pushHistory(nodesRef.current, edgesRef.current);
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setHasUnsavedChanges(true);
  }, [pushHistory, setNodes, setEdges]);

  const attachNodeHandlers = useCallback(
    (rawNodes: Node[]): Node[] => {
      return rawNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onEdit: () => handleOpenEditForNode(n.id),
          onDelete: () => handleDeleteNode(n.id),
        },
      }));
    },
    [handleOpenEditForNode, handleDeleteNode]
  );

  const loadSchema = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await databaseSchemaApi.getSchema(project.id);
    if (res.data?.exists && res.data.schema) {
      setSchema(res.data.schema);
      const readyNodes = attachNodeHandlers(res.data.schema.nodes || []);
      setNodes(readyNodes);
      setEdges(res.data.schema.edges || []);
      setHasUnsavedChanges(false);
      setHistory([]);
      setRedoStack([]);
      schemaCache.current[res.data.schema.schema_type as 'table' | 'document'] = res.data.schema;
      setTimeout(() => {
        reactFlowInstance.current?.fitView?.({ padding: 0.2 });
      }, 80);
    } else {
      setSchema(null);
      setNodes([]);
      setEdges([]);
    }
    setIsLoading(false);
  }, [project.id, setNodes, setEdges, attachNodeHandlers]);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  const handleGenerate = async (typeOverride?: 'table' | 'document') => {
    setIsGenerating(true);
    setError(null);
    const targetType = typeOverride || schema?.schema_type || 'table';
    const res = await databaseSchemaApi.generateSchema(project.id, targetType);
    if (res.data?.schema) {
      setSchema(res.data.schema);
      const readyNodes = attachNodeHandlers(res.data.schema.nodes || []);
      setNodes(readyNodes);
      setEdges(res.data.schema.edges || []);
      setHasUnsavedChanges(false);
      setHistory([]);
      setRedoStack([]);
      schemaCache.current[res.data.schema.schema_type as 'table' | 'document'] = res.data.schema;
      setTimeout(() => {
        reactFlowInstance.current?.fitView?.({ padding: 0.2 });
      }, 80);
    } else {
      setError(
        typeof res.error === 'object' && res.error?.error
          ? String(res.error.error)
          : 'Failed to generate database schema. Please try again.'
      );
    }
    setIsGenerating(false);
  };

  const handleSwitchType = async (targetType: 'table' | 'document') => {
    if (schema && schema.schema_type === targetType) return;
    if (schema) {
      schemaCache.current[schema.schema_type as 'table' | 'document'] = {
        ...schema,
        nodes: nodesRef.current,
        edges: edgesRef.current,
      };
    }
    const cached = schemaCache.current[targetType];
    if (cached) {
      setSchema(cached);
      const readyNodes = attachNodeHandlers(cached.nodes || []);
      setNodes(readyNodes);
      setEdges(cached.edges || []);
      setHasUnsavedChanges(false);
      setHistory([]);
      setRedoStack([]);
      setTimeout(() => {
        reactFlowInstance.current?.fitView?.({ padding: 0.2 });
      }, 80);
      return;
    }

    setIsLoading(true);
    const dbRes = await databaseSchemaApi.getSchema(project.id, targetType);
    if (dbRes.data?.exists && dbRes.data.schema) {
      setSchema(dbRes.data.schema);
      const readyNodes = attachNodeHandlers(dbRes.data.schema.nodes || []);
      setNodes(readyNodes);
      setEdges(dbRes.data.schema.edges || []);
      setHasUnsavedChanges(false);
      setHistory([]);
      setRedoStack([]);
      schemaCache.current[targetType] = dbRes.data.schema;
      setIsLoading(false);
      setTimeout(() => {
        reactFlowInstance.current?.fitView?.({ padding: 0.2 });
      }, 80);
      return;
    }
    setIsLoading(false);

    await handleGenerate(targetType);
  };

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
    const isDoc = schema?.schema_type === 'document';
    const newNodes: Node[] = clipboard.nodes.map((node, idx) => {
      const baseName = node.data?.name || (isDoc ? 'collection' : 'table');
      const newName = `${baseName}_copy_${Math.floor(Math.random() * 900 + 100)}`;
      const newNodeId = `db-${newName}-${idx}`;

      const rawNode: Node = {
        ...node,
        id: newNodeId,
        position: {
          x: node.position.x + 30,
          y: node.position.y + 30,
        },
        selected: true,
        data: {
          ...node.data,
          name: newName,
        },
      };

      return {
        ...rawNode,
        data: {
          ...rawNode.data,
          onEdit: () => handleOpenEditForNode(newNodeId),
          onDelete: () => handleDeleteNode(newNodeId),
        },
      };
    });

    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]);
    setHasUnsavedChanges(true);
  }, [clipboard, pushHistory, schema?.schema_type, handleOpenEditForNode, handleDeleteNode, setNodes]);

  const handleDeleteSelected = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    pushHistory(nodesRef.current, edgesRef.current);
    const selectedIds = new Set(selected.map((n) => n.id));
    setNodes((nds) => nds.filter((n) => !selectedIds.has(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
    setHasUnsavedChanges(true);
  }, [pushHistory, setNodes, setEdges]);

  const handleEditSelected = useCallback(() => {
    const selected = nodesRef.current.find((n) => n.selected);
    if (selected) {
      handleOpenEditForNode(selected.id);
    }
  }, [handleOpenEditForNode]);

  const handleSaveEntityEdit = useCallback(
    (
      updated: EditableEntity,
      newEntities: EditableEntity[] = [],
      relationships: SchemaRelationship[] = []
    ) => {
      pushHistory(nodesRef.current, edgesRef.current);

      const targetId = updated.id;
      const primaryNode = nodesRef.current.find((n) => n.id === targetId);
      const baseX = primaryNode ? primaryNode.position.x : 200;
      const baseY = primaryNode ? primaryNode.position.y : 200;

      const updatedNodes = nodesRef.current.map((n) => {
        if (n.id === targetId) {
          return {
            ...n,
            data: {
              ...n.data,
              name: updated.name,
              description: updated.description,
              columns: [...updated.columns],
              onEdit: () => handleOpenEditForNode(targetId),
              onDelete: () => handleDeleteNode(targetId),
            },
          };
        }
        return n;
      });

      const isDoc = schema?.schema_type === 'document';
      const nodeType = isDoc ? 'documentNode' : 'tableNode';
      const addedNodes: Node[] = [];

      newEntities.forEach((newEnt, idx) => {
        const newNodeId = `db-${newEnt.name}-${Date.now()}-${idx}`;
        const posX = baseX + 380;
        const posY = baseY + idx * 240;

        const newNode: Node = {
          id: newNodeId,
          type: nodeType,
          position: { x: posX, y: posY },
          data: {
            name: newEnt.name,
            description: newEnt.description,
            columns: newEnt.columns,
            dbEngine: schema?.db_engine,
            schemaType: schema?.schema_type,
            onEdit: () => handleOpenEditForNode(newNodeId),
            onDelete: () => handleDeleteNode(newNodeId),
          },
        };
        addedNodes.push(newNode);
      });

      const allMergedNodes = [...updatedNodes, ...addedNodes];
      const newEdges: Edge[] = [];

      relationships.forEach((rel, idx) => {
        const sourceNode = allMergedNodes.find(
          (n) =>
            n.id === rel.source_table ||
            (n.data?.name && String(n.data.name).toLowerCase() === rel.source_table.toLowerCase())
        );
        const targetNode = allMergedNodes.find(
          (n) =>
            n.id === rel.target_table ||
            (n.data?.name && String(n.data.name).toLowerCase() === rel.target_table.toLowerCase())
        );

        if (sourceNode && targetNode && sourceNode.id !== targetNode.id) {
          const edgeId = `e-${sourceNode.id}-${targetNode.id}-${Date.now()}-${idx}`;
          const labelText = rel.relationship_type || (rel.foreign_key_column ? `FK: ${rel.foreign_key_column}` : '1:N');
          newEdges.push({
            id: edgeId,
            source: sourceNode.id,
            target: targetNode.id,
            type: 'smoothstep',
            animated: true,
            label: labelText,
            style: { stroke: isDark ? '#FFC900' : '#D9A300', strokeWidth: 2 },
          });
        }
      });

      setNodes(allMergedNodes);
      if (newEdges.length > 0) {
        setEdges((eds) => [...eds, ...newEdges]);
      }
      setEditingEntity(null);
      setHasUnsavedChanges(true);
    },
    [pushHistory, setNodes, setEdges, handleOpenEditForNode, handleDeleteNode, schema, isDark]
  );

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
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleCopy, handleCut, handlePaste, handleDeleteSelected]);

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
      if (changes.some((c: any) => c.type === 'remove' || c.type === 'position')) {
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

  const onConnect = useCallback(
    (connection: Connection) => {
      pushHistory(nodesRef.current, edgesRef.current);
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
            label: '1:N',
          },
          eds
        )
      );
      setHasUnsavedChanges(true);
    },
    [pushHistory, setEdges]
  );

  const handleSave = async () => {
    if (!schema) return;
    setIsSaving(true);
    setError(null);
    const cleanedNodes = nodesRef.current.map((n) => {
      const { onEdit, onDelete, ...restData } = n.data || {};
      return {
        ...n,
        data: restData,
      };
    });
    const res = await databaseSchemaApi.saveSchema(project.id, {
      nodes: cleanedNodes,
      edges: edgesRef.current,
    });
    if (res.data?.schema) {
      setSchema(res.data.schema);
      setHasUnsavedChanges(false);
      schemaCache.current[res.data.schema.schema_type as 'table' | 'document'] = res.data.schema;
    } else {
      setError('Failed to save database schema.');
    }
    setIsSaving(false);
  };

  const handleResetLayout = async () => {
    if (!schema) return;
    setIsLoading(true);
    setError(null);
    const res = await databaseSchemaApi.resetSchema(project.id);
    if (res.data?.schema) {
      setSchema(res.data.schema);
      const readyNodes = attachNodeHandlers(res.data.schema.nodes || []);
      setNodes(readyNodes);
      setEdges(res.data.schema.edges || []);
      setHasUnsavedChanges(false);
      setHistory([]);
      setRedoStack([]);
      setTimeout(() => {
        reactFlowInstance.current?.fitView?.({ padding: 0.2 });
      }, 80);
    }
    setIsLoading(false);
  };

  const handleAddEntity = () => {
    pushHistory(nodesRef.current, edgesRef.current);
    const isDoc = schema?.schema_type === 'document';
    const idNum = nodes.length + 1;
    const entityName = isDoc ? `collection_${idNum}` : `table_${idNum}`;
    const newNodeId = `db-${entityName}`;

    const rawNode: Node = {
      id: newNodeId,
      type: isDoc ? 'documentNode' : 'tableNode',
      position: {
        x: 100 + (nodes.length % 3) * 60,
        y: 100 + Math.floor(nodes.length / 3) * 80,
      },
      data: {
        name: entityName,
        description: 'Custom entity added by user',
        schemaType: isDoc ? 'document' : 'table',
        dbEngine: schema?.db_engine || (isDoc ? 'MongoDB' : 'PostgreSQL'),
        columns: isDoc
          ? [
              { name: '_id', data_type: 'ObjectId', is_primary: true },
              { name: 'name', data_type: 'String' },
              { name: 'created_at', data_type: 'Date' },
            ]
          : [
              { name: 'id', data_type: 'UUID', is_primary: true },
              { name: 'name', data_type: 'VARCHAR(255)' },
              { name: 'created_at', data_type: 'TIMESTAMP' },
            ],
      },
    };

    const newNode: Node = {
      ...rawNode,
      data: {
        ...rawNode.data,
        onEdit: () => handleOpenEditForNode(newNodeId),
        onDelete: () => handleDeleteNode(newNodeId),
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    onRegisterRegenerate?.(() => {
      if (schema) {
        handleGenerate(schema.schema_type);
      } else {
        handleGenerate();
      }
    });
  }, [onRegisterRegenerate, schema]);

  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  const hasSelection = useMemo(() => nodes.some((n) => n.selected), [nodes]);
  const canPaste = Boolean(clipboard && clipboard.nodes.length > 0);

  return (
    <div className="w-full h-full flex-1 flex flex-col relative font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden">
      {schema && (
        <DatabaseSchemaHeader
          schemaType={schema.schema_type}
          dbEngine={schema.db_engine}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          historyLength={history.length}
          redoStackLength={redoStack.length}
          hasSelection={hasSelection}
          canPaste={canPaste}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onEditSelected={handleEditSelected}
          onDeleteSelected={handleDeleteSelected}
          onSwitchType={handleSwitchType}
          onAddEntity={handleAddEntity}
          onOpenExport={() => setIsExportOpen(true)}
          onResetLayout={handleResetLayout}
          onSave={handleSave}
        />
      )}

      {error && (
        <div
          className={`mx-6 mt-4 p-4 rounded-xl border flex items-center justify-between text-xs ${
            isDark
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 w-full h-full relative flex flex-col overflow-hidden">
        {isLoading || isGenerating ? (
          <div
            className={`flex-1 flex flex-col items-center justify-center p-12 text-center ${
              isDark ? 'bg-[#08090B]' : 'bg-[#F7F3EA]'
            }`}
          >
            <div
              className={`w-12 h-12 border-2 animate-spin mb-5 ${
                isDark
                  ? 'border-[#242321] border-t-[#FFC900]'
                  : 'border-[#E8E1D5] border-t-[#D9A300]'
              }`}
            />
            <h4
              className={`text-xl font-bold mb-2 tracking-tight ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              {isGenerating ? 'Designing Schema' : 'Loading Schema'}
            </h4>
            <p
              className={`text-sm max-w-sm leading-relaxed ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              {isGenerating
                ? 'Creating tables and relationships...'
                : 'Opening database canvas...'}
            </p>
          </div>
        ) : schema ? (
          <div className="w-full h-full flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onPaneClick={onCanvasClick}
              onNodesChange={handleNodesChangeWrapped}
              onEdgesChange={handleEdgesChangeWrapped}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={onNodeDragStop}
              onNodeDoubleClick={(_, node) => handleOpenEditForNode(node.id)}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onInit={(instance) => {
                reactFlowInstance.current = instance;
                setTimeout(() => instance.fitView({ padding: 0.2 }), 80);
              }}
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
                style: { stroke: isDark ? '#A6A4A0' : '#8C857B', strokeWidth: 2 },
              }}
              fitView
              minZoom={0.15}
              maxZoom={2.5}
              className={isDark ? 'bg-[#08090B]' : 'bg-[#F7F3EA]'}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1.5}
                color={isDark ? '#242321' : '#E8E1D5'}
              />
              <Controls
                className={`!border !rounded-xl !overflow-hidden !shadow-md ${
                  isDark
                    ? '!bg-[#18191D] !border-[#242321] [&>button]:!border-[#242321] [&>button]:!bg-[#18191D] [&>button]:!fill-[#F5F3EF]'
                    : '!bg-white !border-[#E8E1D5] [&>button]:!border-[#E8E1D5] [&>button]:!bg-white [&>button]:!fill-[#171717]'
                }`}
              />
              <MiniMap
                nodeColor={isDark ? '#FFC900' : '#D9A300'}
                maskColor={isDark ? 'rgba(8, 9, 11, 0.7)' : 'rgba(247, 243, 234, 0.7)'}
                className={`!border !rounded-xl !overflow-hidden ${
                  isDark
                    ? '!bg-[#111215] !border-[#242321]'
                    : '!bg-white !border-[#E8E1D5]'
                }`}
              />
            </ReactFlow>
          </div>
        ) : (
          <div
            className={`flex-1 flex flex-col items-center justify-center p-12 text-center ${
              isDark ? 'bg-[#08090B]' : 'bg-[#F7F3EA]'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 shadow-xs ${
                isDark
                  ? 'bg-[#18191D] border-[#242321] text-[#FFC900]'
                  : 'bg-white border-[#E8E1D5] text-[#D9A300]'
              }`}
            >
              <Database className="w-7 h-7" />
            </div>

            <h4
              className={`text-xl font-bold mb-2 tracking-tight ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              No Database Schema Yet
            </h4>

            <p
              className={`text-sm max-w-sm leading-relaxed mb-6 ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              Generate SQL tables or NoSQL collections for {project.name}.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleGenerate('table')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer ${
                  isDark
                    ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
                    : 'bg-[#D9A300] text-white hover:brightness-105'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>SQL Tables</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerate('document')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'border-[#242321] bg-[#18191D] text-[#F5F3EF] hover:border-[#FFC900]'
                    : 'border-[#E8E1D5] bg-white text-[#171717] hover:border-[#D9A300]'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-500" />
                <span>NoSQL Collections</span>
              </button>
            </div>
          </div>
        )}

        {editingEntity && (
          <EditEntityModal
            entity={editingEntity}
            projectId={project.id}
            dbEngine={schema?.db_engine}
            onClose={() => setEditingEntity(null)}
            onSave={handleSaveEntityEdit}
          />
        )}
      </div>

      <ExportCodeModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        sqlDdl={schema?.sql_ddl || ''}
        nosqlCode={schema?.nosql_code || ''}
        schemaType={schema?.schema_type || 'table'}
        projectName={project.name}
      />
    </div>
  );
}
