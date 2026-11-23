function renderInlineTokens(text: string, isDark: boolean, isUser: boolean = false, inTable: boolean = false) {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return tokens.map((token, tIdx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      const boldContent = token.slice(2, -2);
      return (
        <strong
          key={tIdx}
          className={`font-semibold ${
            isUser
              ? 'text-white'
              : inTable
              ? isDark
                ? 'text-amber-300'
                : 'text-stone-950 font-bold'
              : isDark
              ? 'text-amber-300'
              : 'text-stone-950'
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
          className={`font-mono text-xs px-1.5 py-0.5 rounded border mx-0.5 font-medium ${
            isUser
              ? isDark
                ? 'bg-black/20 text-[#08090B] border-black/30'
                : 'bg-white/20 text-white border-white/30'
              : isDark
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {codeContent}
        </code>
      );
    }
    return (
      <span
        key={tIdx}
        className={
          isUser
            ? isDark
              ? 'text-black font-medium'
              : 'text-white'
            : isDark
            ? 'text-stone-200'
            : 'text-stone-900'
        }
      >
        {token}
      </span>
    );
  });
}

type ListItem = {
  text: string;
  num?: number;
  subItems?: string[];
};

type MessageBlock =
  | { type: 'heading'; level: number; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: ListItem[]; ordered: boolean }
  | { type: 'paragraph'; content: string }
  | { type: 'space' };

function parseMessageBlocks(text: string): MessageBlock[] {
  const lines = text.split('\n');
  const blocks: MessageBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      blocks.push({ type: 'space' });
      i++;
      continue;
    }

    if (trimmed.startsWith('#')) {
      const level = (trimmed.match(/^#+/) || ['#'])[0].length;
      const content = trimmed.replace(/^#+\s*/, '');
      blocks.push({ type: 'heading', level, content });
      i++;
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.includes('|', 1)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parsedRows = tableLines.map((tl) => {
          const stripped = tl.replace(/^\|/, '').replace(/\|$/, '');
          return stripped.split('|').map((c) => c.trim());
        });
        const headers = parsedRows[0];
        const isSeparator = parsedRows[1].every((cell) => /^:?-+:?$/.test(cell.replace(/\s+/g, '')));
        const rows = isSeparator ? parsedRows.slice(2) : parsedRows.slice(1);
        blocks.push({ type: 'table', headers, rows });
        continue;
      } else {
        blocks.push({ type: 'paragraph', content: tableLines[0] });
        continue;
      }
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const items: ListItem[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push({ text: lines[i].trim().replace(/^[-*•]\s+/, '') });
        i++;
      }
      blocks.push({ type: 'list', items, ordered: false });
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      const items: ListItem[] = [];
      while (i < lines.length) {
        const lineTrimmed = lines[i].trim();
        if (!lineTrimmed) {
          let nextNonEmpty = i + 1;
          while (nextNonEmpty < lines.length && !lines[nextNonEmpty].trim()) {
            nextNonEmpty++;
          }
          if (
            nextNonEmpty < lines.length &&
            (/^\d+\.\s+/.test(lines[nextNonEmpty].trim()) || /^[-*•]\s+/.test(lines[nextNonEmpty].trim()))
          ) {
            i = nextNonEmpty;
            continue;
          } else {
            break;
          }
        }
        const currentNumMatch = lineTrimmed.match(/^(\d+)\.\s+(.*)/);
        if (currentNumMatch) {
          const itemNum = parseInt(currentNumMatch[1], 10);
          const itemText = currentNumMatch[2];
          i++;
          const subItems: string[] = [];
          while (i < lines.length) {
            const subTrimmed = lines[i].trim();
            if (!subTrimmed) {
              let nextSub = i + 1;
              while (nextSub < lines.length && !lines[nextSub].trim()) {
                nextSub++;
              }
              if (nextSub < lines.length && /^[-*•]\s+/.test(lines[nextSub].trim())) {
                i = nextSub;
                continue;
              } else if (nextSub < lines.length && /^\d+\.\s+/.test(lines[nextSub].trim())) {
                i = nextSub;
                break;
              } else {
                break;
              }
            }
            if (/^[-*•]\s+/.test(subTrimmed)) {
              subItems.push(subTrimmed.replace(/^[-*•]\s+/, ''));
              i++;
            } else {
              break;
            }
          }
          items.push({ text: itemText, num: itemNum, subItems });
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', items, ordered: true });
      continue;
    }

    blocks.push({ type: 'paragraph', content: rawLine });
    i++;
  }

  const mergedBlocks: MessageBlock[] = [];
  for (const block of blocks) {
    if (block.type === 'list' && block.ordered && mergedBlocks.length > 0) {
      let spaceCount = 0;
      let checkIdx = mergedBlocks.length - 1;
      while (checkIdx >= 0 && mergedBlocks[checkIdx].type === 'space') {
        spaceCount++;
        checkIdx--;
      }
      if (checkIdx >= 0 && mergedBlocks[checkIdx].type === 'list' && (mergedBlocks[checkIdx] as any).ordered) {
        mergedBlocks.splice(checkIdx + 1, spaceCount);
        const prevList = mergedBlocks[checkIdx] as { type: 'list'; items: ListItem[]; ordered: boolean };
        prevList.items.push(...block.items);
        continue;
      }
    }
    mergedBlocks.push(block);
  }

  return mergedBlocks;
}

export function renderFormattedMessage(text: string, isDark: boolean, isUser: boolean = false) {
  if (!text) return null;
  const blocks = parseMessageBlocks(text);

  return (
    <div className="space-y-2">
      {blocks.map((block, bIdx) => {
        if (block.type === 'space') {
          return <div key={bIdx} className="h-1" />;
        }

        if (block.type === 'heading') {
          return (
            <div
              key={bIdx}
              className={`flex items-center gap-2 pt-2.5 pb-0.5 font-bold text-[14px] ${
                isDark ? 'text-white' : 'text-stone-950'
              }`}
            >
              <span className="w-1.5 h-3.5 bg-[#FFC900] rounded-full inline-block shrink-0"></span>
              <span className={isDark ? 'text-white font-bold' : 'text-stone-950 font-bold'}>
                {renderInlineTokens(block.content, isDark, isUser)}
              </span>
            </div>
          );
        }

        if (block.type === 'table') {
          return (
            <div
              key={bIdx}
              className={`my-3 overflow-x-auto rounded-xl border ${
                isDark ? 'border-stone-800 bg-[#121214]' : 'border-stone-200 bg-white'
              } shadow-xs`}
            >
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark
                        ? 'border-stone-800 bg-stone-900/80 text-stone-200'
                        : 'border-stone-200 bg-stone-50/90 text-stone-700'
                    }`}
                  >
                    {block.headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-3 py-2 font-semibold text-xs tracking-tight whitespace-nowrap"
                      >
                        {renderInlineTokens(h, isDark, isUser, true)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-stone-800/60' : 'divide-stone-100'}`}>
                  {block.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-stone-800/20' : 'hover:bg-stone-50/60'
                      }`}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-3 py-2 text-xs align-top leading-relaxed ${
                            isDark ? 'text-stone-300' : 'text-stone-800'
                          }`}
                        >
                          {renderInlineTokens(cell, isDark, isUser, true)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <div key={bIdx} className="space-y-2 pl-1 my-1.5">
              {block.items.map((item, itemIdx) => (
                <div key={itemIdx} className="space-y-1">
                  <div className="flex items-start gap-2 text-[13.5px] leading-relaxed">
                    {block.ordered ? (
                      <span className="font-mono text-xs font-semibold text-[#FFC900] mt-0.5 shrink-0">
                        {itemIdx + 1}.
                      </span>
                    ) : (
                      <span className="text-[#FFC900] font-bold text-xs mt-1 shrink-0">•</span>
                    )}
                    <div className={`flex-1 ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>
                      {renderInlineTokens(item.text, isDark, isUser)}
                    </div>
                  </div>
                  {item.subItems && item.subItems.length > 0 && (
                    <div className="pl-4 space-y-1 my-1 border-l-2 border-stone-200/40 dark:border-stone-800/60 ml-2">
                      {item.subItems.map((sub, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 text-[13px] leading-relaxed">
                          <span className="text-[#FFC900] font-bold text-xs mt-0.5 shrink-0">•</span>
                          <div className={`flex-1 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                            {renderInlineTokens(sub, isDark, isUser)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }

        return (
          <p
            key={bIdx}
            className={`leading-relaxed text-[13.5px] sm:text-[14px] ${
              isDark ? 'text-stone-200' : 'text-stone-900'
            }`}
          >
            {renderInlineTokens(block.content, isDark, isUser)}
          </p>
        );
      })}
    </div>
  );
}

