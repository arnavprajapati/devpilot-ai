import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Check,
  Code2,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { databaseSchemaApi, type SchemaColumn, type SchemaRelationship } from '../../services/databaseSchemaApi';
import {
  parseSqlCode,
  parseNoSqlCode,
} from './schemaCodeParsers';
import { EditEntityVisualTab } from './EditEntityVisualTab';
import { EditEntityCodeTab } from './EditEntityCodeTab';
import { EditEntityPromptTab } from './EditEntityPromptTab';

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
        <EditEntityVisualTab
          name={name}
          onNameChange={(val) => {
            setName(val);
            setCodeText(generateCodeFromFields(val, columns, entity.schemaType));
          }}
          description={description}
          setDescription={setDescription}
          columns={columns}
          isDoc={isDoc}
          isDark={isDark}
          handleAddColumn={handleAddColumn}
          handleRemoveColumn={handleRemoveColumn}
          handleUpdateColumn={handleUpdateColumn}
        />
      ) : activeTab === 'code' ? (
        <EditEntityCodeTab
          codeText={codeText}
          setCodeText={setCodeText}
          isDoc={isDoc}
          isDark={isDark}
          parseError={parseError}
          parseSuccess={parseSuccess}
          handleParseCode={handleParseCode}
          copied={copied}
          handleCopyCode={handleCopyCode}
        />
      ) : (
        <EditEntityPromptTab
          chatMessages={chatMessages}
          isAiGenerating={isAiGenerating}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          handleGenerateFromAi={handleGenerateFromAi}
          chatEndRef={chatEndRef}
          isDark={isDark}
          isDoc={isDoc}
          renderFormattedMessage={renderFormattedMessage}
        />
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
