import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Key,
  Link2,
  Check,
  Code2,
  LayoutGrid,
  FileCode,
  Sparkles,
  AlertCircle,
  Copy,
  Send,
  Bot,
  User,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { databaseSchemaApi, type SchemaColumn, type SchemaRelationship } from '../../services/databaseSchemaApi';

export interface EditableEntity {
  id: string;
  name: string;
  description: string;
  schemaType: 'table' | 'document';
  columns: SchemaColumn[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  generatedResult?: {
    name: string;
    description: string;
    columns: SchemaColumn[];
  };
  newEntities?: EditableEntity[];
  relationships?: SchemaRelationship[];
}

function renderFormattedMessage(text: string, isDark: boolean, isUser: boolean = false) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, lIdx) => {
        if (!line.trim()) {
          return <div key={lIdx} className="h-1.5" />;
        }

        const tokens = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

        return (
          <p key={lIdx} className="leading-relaxed">
            {tokens.map((token, tIdx) => {
              if (token.startsWith('**') && token.endsWith('**')) {
                const boldContent = token.slice(2, -2);
                return (
                  <strong
                    key={tIdx}
                    className={`font-bold ${
                      isUser
                        ? isDark
                          ? 'text-[#08090B] underline'
                          : 'text-white underline'
                        : isDark
                        ? 'text-[#FFC900]'
                        : 'text-[#B48200]'
                    }`}
                  >
                    {boldContent}
                  </strong>
                );
              }
              if (token.startsWith('`') && token.endsWith('`')) {
                const codeContent = token.slice(1, -1);
                return (
                  <code
                    key={tIdx}
                    className={`font-mono text-xs px-1.5 py-0.5 rounded border mx-0.5 font-semibold ${
                      isUser
                        ? isDark
                          ? 'bg-black/20 border-black/30 text-[#08090B]'
                          : 'bg-white/20 border-white/30 text-white'
                        : isDark
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    }`}
                  >
                    {codeContent}
                  </code>
                );
              }
              return token;
            })}
          </p>
        );
      })}
    </div>
  );
}

interface EditEntityModalProps {
  entity: EditableEntity | null;
  projectId: number;
  dbEngine?: string;
  onClose: () => void;
  onSave: (
    updated: EditableEntity,
    newEntities?: EditableEntity[],
    relationships?: SchemaRelationship[]
  ) => void;
}

export function EditEntityModal({
  entity,
  projectId,
  dbEngine,
  onClose,
  onSave,
}: EditEntityModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'prompt'>('visual');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState<SchemaColumn[]>([]);
  const [codeText, setCodeText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedResult, setAiGeneratedResult] = useState<{
    name: string;
    description: string;
    columns: SchemaColumn[];
  } | null>(null);
  const [newEntitiesResult, setNewEntitiesResult] = useState<EditableEntity[]>([]);
  const [relationshipsResult, setRelationshipsResult] = useState<SchemaRelationship[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const generateCodeFromFields = useCallback(
    (tableName: string, cols: SchemaColumn[], schemaType: 'table' | 'document') => {
      if (schemaType === 'table') {
        const lines = cols.map((c) => {
          let line = `  ${c.name} ${c.data_type || 'VARCHAR(255)'}`;
          if (c.is_primary) line += ' PRIMARY KEY';
          if (!c.is_nullable && !c.is_primary) line += ' NOT NULL';
          if (c.is_unique) line += ' UNIQUE';
          if (c.is_foreign && c.references) line += ` REFERENCES ${c.references}`;
          return line;
        });
        return `CREATE TABLE ${tableName || 'table_name'} (\n${lines.join(',\n')}\n);`;
      } else {
        const obj: Record<string, any> = {};
        cols.forEach((c) => {
          if (c.is_primary) {
            obj[c.name] = 'ObjectId';
          } else {
            obj[c.name] = c.data_type || 'String';
          }
        });
        return JSON.stringify(obj, null, 2);
      }
    },
    []
  );

  useEffect(() => {
    if (entity) {
      setName(entity.name || '');
      setDescription(entity.description || '');
      const initialCols = JSON.parse(JSON.stringify(entity.columns || []));
      setColumns(initialCols);
      setCodeText(generateCodeFromFields(entity.name, initialCols, entity.schemaType));
      setActiveTab('visual');
      setParseError(null);
      setParseSuccess(null);
      setAiPrompt('');
      setAiGeneratedResult(null);
      setNewEntitiesResult([]);
      setRelationshipsResult([]);
      setChatMessages([]);
    }
  }, [entity, generateCodeFromFields]);

  useEffect(() => {
    if (activeTab === 'prompt') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiGenerating, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!entity) return null;

  const handleAddColumn = () => {
    const isDoc = entity.schemaType === 'document';
    setColumns((prev) => {
      const updated = [
        ...prev,
        {
          name: `col_${prev.length + 1}`,
          data_type: isDoc ? 'String' : 'VARCHAR(255)',
          is_primary: false,
          is_foreign: false,
          references: '',
          is_nullable: true,
        },
      ];
      setCodeText(generateCodeFromFields(name, updated, entity.schemaType));
      return updated;
    });
  };

  const handleRemoveColumn = (idx: number) => {
    setColumns((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      setCodeText(generateCodeFromFields(name, updated, entity.schemaType));
      return updated;
    });
  };

  const handleUpdateColumn = (idx: number, patch: Partial<SchemaColumn>) => {
    setColumns((prev) => {
      const updated = prev.map((col, i) => (i === idx ? { ...col, ...patch } : col));
      setCodeText(generateCodeFromFields(name, updated, entity.schemaType));
      return updated;
    });
  };

  const parseSqlCode = (sql: string): { tableName?: string; columns: SchemaColumn[] } => {
    const nameMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["'`]?\w+["'`]?\.)?["'`]?(\w+)["']?/i);
    const parsedName = nameMatch ? nameMatch[1] : undefined;

    const bodyMatch = sql.match(/\(([\s\S]+)\)(?:\s*;|\s*$)/);
    if (!bodyMatch) {
      throw new Error('Could not find column definitions inside parentheses `(...)`.');
    }

    const rawBody = bodyMatch[1];
    const lines = rawBody.split(/,(?![^(]*\))/);
    const parsedCols: SchemaColumn[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (/^(?:CONSTRAINT|PRIMARY\s+KEY\s*\(|FOREIGN\s+KEY\s*\(|UNIQUE\s*\(|KEY\s*\()/i.test(line)) {
        continue;
      }

      const tokens = line.split(/\s+/);
      if (tokens.length < 2) continue;

      const colName = tokens[0].replace(/["'`]/g, '');
      const dataType = tokens[1].replace(/,/g, '');

      const isPrimary = /PRIMARY\s+KEY/i.test(line);
      const isUnique = /UNIQUE/i.test(line);
      const isNullable = !/NOT\s+NULL/i.test(line) && !isPrimary;
      const refMatch = line.match(/REFERENCES\s+([\w\.\(\)]+)/i);
      const isForeign = Boolean(refMatch);
      const references = refMatch ? refMatch[1].replace(/[\(\)]/g, '') : '';

      parsedCols.push({
        name: colName,
        data_type: dataType,
        is_primary: isPrimary,
        is_unique: isUnique,
        is_nullable: isNullable,
        is_foreign: isForeign,
        references,
      });
    }

    if (parsedCols.length === 0) {
      throw new Error('No valid columns parsed from SQL.');
    }

    return { tableName: parsedName, columns: parsedCols };
  };

  const parseNoSqlCode = (rawCode: string): { tableName?: string; columns: SchemaColumn[] } => {
    const clean = rawCode.trim();

    try {
      const obj = JSON.parse(clean);
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        const parsedCols: SchemaColumn[] = Object.entries(obj).map(([key, val]) => {
          const typeStr =
            typeof val === 'string'
              ? val
              : typeof val === 'object' && val !== null && 'type' in val
              ? String((val as { type: unknown }).type)
              : 'String';
          return {
            name: key,
            data_type: typeStr,
            is_primary: key === '_id',
            is_foreign: false,
            references: '',
            is_nullable: key !== '_id',
          };
        });
        return { columns: parsedCols };
      }
    } catch {
      const pairs = clean.match(/(\w+)\s*:\s*(?:\{[^}]*type\s*:\s*(\w+)[^}]*\}|'([^']+)'|"([^"]+)"|(\w+))/g);
      if (pairs && pairs.length > 0) {
        const parsedCols: SchemaColumn[] = pairs.map((pair) => {
          const [rawKey, ...rest] = pair.split(':');
          const key = rawKey.trim();
          const valStr = rest.join(':').replace(/[{}"'\s]/g, '');
          return {
            name: key,
            data_type: valStr.replace(/^type:/, '') || 'String',
            is_primary: key === '_id',
            is_foreign: false,
            references: '',
            is_nullable: key !== '_id',
          };
        });
        return { columns: parsedCols };
      }
    }

    throw new Error('Invalid JSON or Mongoose schema syntax.');
  };

  const handleParseCode = (): boolean => {
    setParseError(null);
    setParseSuccess(null);
    try {
      if (entity.schemaType === 'table') {
        const res = parseSqlCode(codeText);
        if (res.tableName) {
          setName(res.tableName);
        }
        setColumns(res.columns);
        setParseSuccess(`Parsed ${res.columns.length} columns successfully from SQL.`);
      } else {
        const res = parseNoSqlCode(codeText);
        if (res.tableName) {
          setName(res.tableName);
        }
        setColumns(res.columns);
        setParseSuccess(`Parsed ${res.columns.length} fields successfully from NoSQL code.`);
      }
      return true;
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse code.');
      return false;
    }
  };

  const handleSwitchTab = (tab: 'visual' | 'code' | 'prompt') => {
    if (tab === 'code') {
      setCodeText(generateCodeFromFields(name, columns, entity.schemaType));
    } else if (activeTab === 'code' && tab === 'visual') {
      handleParseCode();
    }
    setActiveTab(tab);
    setParseError(null);
    setParseSuccess(null);
  };

  const handleGenerateFromAi = async () => {
    const promptToSend = aiPrompt.trim();
    if (!promptToSend || isAiGenerating) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setAiPrompt('');
    setIsAiGenerating(true);

    const res = await databaseSchemaApi.generateEntityFromPrompt(projectId, {
      prompt: promptToSend,
      schema_type: entity.schemaType,
      db_engine: dbEngine,
      current_entity: {
        name,
        description,
        columns,
      },
    });

    if (res.data?.entity) {
      const generated = {
        name: res.data.entity.name || name,
        description: res.data.entity.description || description,
        columns: res.data.entity.columns || [],
      };
      setAiGeneratedResult(generated);
      setName(generated.name);
      setDescription(generated.description);
      setColumns(generated.columns);
      setCodeText(generateCodeFromFields(generated.name, generated.columns, entity.schemaType));

      let mappedNew: EditableEntity[] = [];
      if (res.data.new_entities && res.data.new_entities.length > 0) {
        mappedNew = res.data.new_entities.map((ne, idx) => ({
          id: `new-${ne.name}-${idx}`,
          name: ne.name,
          description: ne.description || '',
          schemaType: entity.schemaType,
          columns: ne.columns || [],
        }));
        setNewEntitiesResult(mappedNew);
      } else {
        setNewEntitiesResult([]);
      }

      const rels = res.data.relationships || [];
      setRelationshipsResult(rels);

      let summary = res.data.explanation || `Updated ${generated.name} schema successfully.`;
      if (!res.data.explanation && mappedNew.length > 0) {
        summary = `Updated ${generated.name} and architected connected table ${mappedNew.map((m) => m.name).join(', ')}.`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: summary,
        generatedResult: generated,
        newEntities: mappedNew,
        relationships: rels,
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } else {
      const errText =
        typeof res.error === 'object' && res.error?.error
          ? String(res.error.error)
          : 'Failed to generate entity with AI. Please try again.';
      const aiErrMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: errText,
      };
      setChatMessages((prev) => [...prev, aiErrMsg]);
    }
    setIsAiGenerating(false);
  };

  const handleSave = () => {
    let finalName = name.trim() || entity.name;
    let finalDesc = description.trim();
    let finalCols = columns;

    if (activeTab === 'prompt' && aiGeneratedResult) {
      finalName = aiGeneratedResult.name.trim() || finalName;
      finalDesc = aiGeneratedResult.description.trim() || finalDesc;
      finalCols = aiGeneratedResult.columns;
    } else if (activeTab === 'code') {
      try {
        if (entity.schemaType === 'table') {
          const res = parseSqlCode(codeText);
          if (res.tableName) finalName = res.tableName;
          finalCols = res.columns;
        } else {
          const res = parseNoSqlCode(codeText);
          if (res.tableName) finalName = res.tableName;
          finalCols = res.columns;
        }
      } catch (err: any) {
        setParseError(err.message || 'Syntax error in code. Please fix before saving.');
        return;
      }
    }

    onSave(
      {
        ...entity,
        name: finalName,
        description: finalDesc,
        columns: finalCols,
      },
      newEntitiesResult,
      relationshipsResult
    );
    onClose();
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const isDoc = entity.schemaType === 'document';

  return (
    <aside
      className={`absolute top-0 right-0 bottom-0 w-full sm:w-[540px] md:w-[600px] z-30 border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 font-['Plus_Jakarta_Sans',sans-serif] ${
        isDark
          ? 'border-[#242321] bg-[#111215] text-[#F5F3EF]'
          : 'border-[#E8E1D5] bg-white text-[#171717]'
      }`}
    >
      <div
        className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-[#242321] bg-[#18191D]' : 'border-[#E8E1D5] bg-[#F7F3EA]'
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={`text-sm font-bold tracking-tight truncate ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              Edit {isDoc ? 'Collection' : 'Table'}: {name || entity.name}
            </h4>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                isDark
                  ? 'border-[#242321] bg-[#08090B] text-[#A6A4A0]'
                  : 'border-[#E8E1D5] bg-white text-[#6B665E]'
              }`}
            >
              {isDoc ? 'MongoDB' : 'SQL'}
            </span>
          </div>
          <p
            className={`text-xs mt-0.5 truncate ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            Visual Form, Code Mode, or AI Copilot Prompt
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center p-0.5 rounded-xl border ${
              isDark ? 'border-[#242321] bg-[#08090B]' : 'border-[#E8E1D5] bg-white'
            }`}
          >
            <button
              type="button"
              onClick={() => handleSwitchTab('visual')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'visual'
                  ? isDark
                    ? 'bg-[#FFC900] text-[#08090B] font-bold shadow-xs'
                    : 'bg-[#D9A300] text-white font-bold shadow-xs'
                  : isDark
                  ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                  : 'text-[#6B665E] hover:text-[#171717]'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Visual</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('code')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'code'
                  ? isDark
                    ? 'bg-[#FFC900] text-[#08090B] font-bold shadow-xs'
                    : 'bg-[#D9A300] text-white font-bold shadow-xs'
                  : isDark
                  ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                  : 'text-[#6B665E] hover:text-[#171717]'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Code</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('prompt')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'prompt'
                  ? isDark
                    ? 'bg-[#FFC900] text-[#08090B] font-bold shadow-xs'
                    : 'bg-[#D9A300] text-white font-bold shadow-xs'
                  : isDark
                  ? 'text-[#A6A4A0] hover:text-[#FFC900]'
                  : 'text-[#6B665E] hover:text-[#D9A300]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>AI Prompt</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:bg-stone-200'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {activeTab === 'visual' ? (
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
                  setName(e.target.value);
                  setCodeText(generateCodeFromFields(e.target.value, columns, entity.schemaType));
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
      ) : activeTab === 'code' ? (
        <div className="p-5 space-y-3 overflow-y-auto flex-1 no-scrollbar flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-emerald-500" />
              <span
                className={`text-xs font-semibold ${
                  isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                }`}
              >
                {isDoc ? 'MongoDB JSON Schema Code' : 'SQL DDL Definition'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#242321] bg-[#18191D] text-[#A6A4A0] hover:text-[#F5F3EF]'
                    : 'border-[#E8E1D5] bg-[#F7F3EA] text-[#6B665E] hover:text-[#171717]'
                }`}
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleParseCode}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
                    : 'bg-[#D9A300] text-white hover:brightness-105'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Parse</span>
              </button>
            </div>
          </div>

          {parseError && (
            <div
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                isDark
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {parseSuccess && (
            <div
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{parseSuccess}</span>
            </div>
          )}

          <div className="flex-1 min-h-[260px] flex flex-col">
            <textarea
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              placeholder={
                isDoc
                  ? '{\n  "_id": "ObjectId",\n  "name": "String",\n  "created_at": "Date"\n}'
                  : 'CREATE TABLE table_name (\n  id UUID PRIMARY KEY,\n  name VARCHAR(255) NOT NULL\n);'
              }
              className={`w-full flex-1 p-3.5 rounded-xl border font-mono text-xs leading-relaxed focus:outline-none resize-none ${
                isDark
                  ? 'bg-[#08090B] border-[#242321] text-emerald-400 focus:border-[#FFC900]'
                  : 'bg-[#F9F7F2] border-[#E8E1D5] text-emerald-800 focus:border-[#D9A300]'
              }`}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
            {chatMessages.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xs ${
                    isDark
                      ? 'bg-[#18191D] border-[#242321] text-[#FFC900]'
                      : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
                  }`}
                >
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h4
                    className={`text-base sm:text-lg font-bold tracking-tight ${
                      isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                    }`}
                  >
                    Schema AI Copilot
                  </h4>
                  <p
                    className={`text-sm sm:text-[15px] leading-relaxed ${
                      isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                    }`}
                  >
                    Describe any schema changes, add new columns, or ask to create and link new tables.
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                    isDark
                      ? 'bg-[#08090B] border-[#242321] text-[#A6A4A0]'
                      : 'bg-[#FAF8F5] border-[#E8E1D5] text-[#6B665E]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>AI Copilot • Real-time</span>
                </span>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                        isDark
                          ? 'bg-[#18191D] border-[#242321] text-[#FFC900]'
                          : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`space-y-3 ${
                      msg.sender === 'user'
                        ? 'max-w-[85%]'
                        : 'max-w-[92%] sm:max-w-[90%] flex-1'
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm sm:text-[15px] leading-relaxed font-medium shadow-xs ${
                        msg.sender === 'user'
                          ? isDark
                            ? 'bg-[#FFC900] text-[#08090B] rounded-tr-xs'
                            : 'bg-[#D9A300] text-white rounded-tr-xs'
                          : isDark
                          ? 'bg-[#18191D] border border-[#242321] text-[#F5F3EF] rounded-tl-xs'
                          : 'bg-[#FAF8F5] border border-[#E8E1D5] text-[#171717] rounded-tl-xs'
                      }`}
                    >
                      {renderFormattedMessage(msg.text, isDark, msg.sender === 'user')}
                    </div>

                    {msg.generatedResult && (
                      <div
                        className={`p-4 rounded-2xl border space-y-3 ${
                          isDark
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-emerald-300 bg-emerald-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5
                              className={`text-sm sm:text-base font-bold ${
                                isDark ? 'text-emerald-400' : 'text-emerald-800'
                              }`}
                            >
                              {msg.generatedResult.name}
                            </h5>
                            {msg.generatedResult.description && (
                              <p
                                className={`text-xs sm:text-sm mt-0.5 ${
                                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                }`}
                              >
                                {msg.generatedResult.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500">
                            {msg.generatedResult.columns.length} fields
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar">
                          {msg.generatedResult.columns.map((c, idx) => (
                            <div
                              key={idx}
                              className={`px-3 py-2 rounded-xl border text-xs sm:text-sm flex items-center justify-between transition-colors ${
                                isDark
                                  ? 'border-[#242321] bg-[#18191D]'
                                  : 'border-[#E8E1D5] bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {c.is_primary && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                    PK
                                  </span>
                                )}
                                {c.is_foreign && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                    FK
                                  </span>
                                )}
                                <span className="font-mono font-medium text-xs sm:text-sm">
                                  {c.name}
                                </span>
                              </div>
                              <span className="font-mono text-xs sm:text-sm text-emerald-500 font-semibold">
                                {c.data_type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.newEntities && msg.newEntities.length > 0 && (
                      <div className="space-y-3">
                        <span
                          className={`text-xs sm:text-sm font-bold uppercase tracking-wider block ${
                            isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                          }`}
                        >
                          ✨ New Connected {isDoc ? 'Collection' : 'Table'}:
                        </span>
                        {msg.newEntities.map((newEnt, nIdx) => (
                          <div
                            key={nIdx}
                            className={`p-4 rounded-2xl border space-y-3 ${
                              isDark
                                ? 'border-amber-500/30 bg-amber-500/5'
                                : 'border-amber-300 bg-amber-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5
                                  className={`text-sm sm:text-base font-bold ${
                                    isDark ? 'text-amber-400' : 'text-amber-800'
                                  }`}
                                >
                                  {newEnt.name}
                                </h5>
                                {newEnt.description && (
                                  <p
                                    className={`text-xs sm:text-sm mt-0.5 ${
                                      isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                    }`}
                                  >
                                    {newEnt.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                Auto-connect
                              </span>
                            </div>

                            <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
                              {newEnt.columns.map((c, cIdx) => (
                                <div
                                  key={cIdx}
                                  className={`px-3 py-2 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${
                                    isDark
                                      ? 'border-[#242321] bg-[#18191D]'
                                      : 'border-[#E8E1D5] bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 font-mono text-xs sm:text-sm">
                                    {c.is_foreign && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                        FK
                                      </span>
                                    )}
                                    <span>{c.name}</span>
                                  </div>
                                  <span className="font-mono text-xs sm:text-sm opacity-75">
                                    {c.data_type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.relationships && msg.relationships.length > 0 && (
                      <div
                        className={`p-3.5 rounded-2xl border flex flex-col gap-2 ${
                          isDark
                            ? 'border-sky-500/30 bg-sky-500/5'
                            : 'border-sky-300 bg-sky-50/50'
                        }`}
                      >
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            isDark ? 'text-sky-400' : 'text-sky-700'
                          }`}
                        >
                          🔗 Auto-Connection Links:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.relationships.map((rel, rIdx) => (
                            <span
                              key={rIdx}
                              className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono"
                            >
                              <Link2 className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {rel.source_table} ──({rel.relationship_type || '1:N'}{rel.foreign_key_column ? ` via ${rel.foreign_key_column}` : ''})──&gt; {rel.target_table}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                        isDark
                          ? 'bg-[#FFC900]/20 border-[#FFC900]/40 text-[#FFC900]'
                          : 'bg-[#D9A300]/20 border-[#D9A300]/40 text-[#D9A300]'
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isAiGenerating && (
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isDark
                      ? 'bg-[#18191D] border-[#242321] text-[#FFC900]'
                      : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
                  }`}
                >
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div
                  className={`px-4 py-2.5 rounded-2xl rounded-tl-xs border text-xs sm:text-sm flex items-center gap-2 ${
                    isDark
                      ? 'bg-[#18191D] border-[#242321] text-[#A6A4A0]'
                      : 'bg-[#FAF8F5] border-[#E8E1D5] text-[#6B665E]'
                  }`}
                >
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>AI is architecting schema...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div
            className={`p-3.5 border-t space-y-2 shrink-0 ${
              isDark ? 'border-[#242321] bg-[#141518]' : 'border-[#E8E1D5] bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateFromAi();
                  }
                }}
                placeholder={
                  isDoc
                    ? 'Ask AI to create, update, or connect tables…'
                    : 'Ask AI to create, update, or connect tables…'
                }
                className={`w-full p-3 rounded-xl border text-sm sm:text-[15px] leading-relaxed resize-none focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#08090B] border-[#242321] text-[#F5F3EF] focus:border-[#FFC900]'
                    : 'bg-white border-[#E8E1D5] text-[#171717] focus:border-[#D9A300]'
                }`}
              />
              <button
                type="button"
                onClick={handleGenerateFromAi}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className={`p-3 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${
                  isDark
                    ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
                    : 'bg-[#D9A300] text-white hover:brightness-105'
                }`}
                title="Send to AI (Enter)"
              >
                {isAiGenerating ? (
                  <div className="w-5 h-5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] px-1 opacity-70">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>DevPilot Intelligence</span>
            </div>
          </div>
        </div>
      )}

      <div
        className={`px-5 py-3 border-t flex items-center justify-end gap-2.5 shrink-0 ${
          isDark ? 'border-[#242321] bg-[#18191D]' : 'border-[#E8E1D5] bg-[#F7F3EA]'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
            isDark
              ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
              : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:bg-stone-200'
          }`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
            isDark
              ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
              : 'bg-[#D9A300] text-white hover:brightness-105'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>Update Entity</span>
        </button>
      </div>
    </aside>
  );
}
