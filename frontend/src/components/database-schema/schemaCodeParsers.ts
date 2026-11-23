import { type SchemaColumn } from '../../services/databaseSchemaApi';

export const generateCodeFromFields = (tableName: string, cols: SchemaColumn[], schemaType: 'table' | 'document'): string => {
  if (schemaType === 'table') {
    const colDefs = cols.map((c) => {
      let def = `  ${c.name} ${c.data_type}`;
      if (c.is_primary) def += ' PRIMARY KEY';
      if (!c.is_nullable && !c.is_primary) def += ' NOT NULL';
      if (c.is_unique && !c.is_primary) def += ' UNIQUE';
      if (c.is_foreign && c.references) def += ` REFERENCES ${c.references}`;
      return def;
    });
    return `CREATE TABLE ${tableName || 'untitled_table'} (\n${colDefs.join(',\n')}\n);`;
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
};
export const parseSqlCode = (sql: string): { tableName?: string; columns: SchemaColumn[] } => {
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

export const parseNoSqlCode = (rawCode: string): { tableName?: string; columns: SchemaColumn[] } => {
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

