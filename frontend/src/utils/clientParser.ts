import type { Table, Relationship, DiagramData, Column, TableColorKey } from '../types/erd';
import { getTableColorTheme, normalizeTableColor } from './tableColors';

function extractTableHeaderColor(bracketContent?: string): TableColorKey | undefined {
  if (!bracketContent) return undefined;
  const attrMatch = bracketContent.match(/(?:headercolor|color)\s*:\s*([#a-zA-Z0-9_]+)/i);
  if (attrMatch) {
    return normalizeTableColor(attrMatch[1]);
  }
  return normalizeTableColor(bracketContent.trim());
}

export function parseDraftTextClient(text: string): DiagramData {
  const tables: Record<string, Table> = {};
  const relationships: Relationship[] = [];
  let currentTable: string | null = null;

  const lines = text.trim().split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith('--')) {
      continue;
    }

    // Check standalone relationship: e.g. "posts.user_id -> users.id"
    const relMatch = line.match(
      /^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*(?:->|-<|--|references)\s*([a-zA-Z0-9_]+)(?:\.|\()([a-zA-Z0-9_]+)\)?$/i
    );
    if (relMatch) {
      const [, srcTbl, srcCol, tgtTbl, tgtCol] = relMatch;
      relationships.push({
        id: `rel_${srcTbl}_${srcCol}_${tgtTbl}_${tgtCol}`,
        source_table: srcTbl,
        source_column: srcCol,
        target_table: tgtTbl,
        target_column: tgtCol,
        type: 'one_to_many',
      });
      continue;
    }

    const tableMatch = line.match(
      /^(?:table\s+)?([a-zA-Z0-9_]+)(?:\s*\[([^\]]+)\])?\s*[:{]?$/i
    );
    const isIndented = rawLine.length - rawLine.trimStart().length > 0;
    const tokens = line.split(/\s+/);
    const parsedColor = tableMatch ? extractTableHeaderColor(tableMatch[2]) : undefined;

    if (
      (tableMatch &&
        (!isIndented || line.toLowerCase().startsWith('table ') || Boolean(parsedColor))) ||
      (tokens.length === 1 && !line.endsWith('}'))
    ) {
      const tblName = tableMatch ? tableMatch[1] : tokens[0].replace(/[:{]/g, '');
      if (!['}', '{'].includes(tblName.toLowerCase())) {
        currentTable = tblName;
        if (!tables[currentTable]) {
          tables[currentTable] = {
            id: currentTable,
            name: currentTable,
            columns: [],
            ...(parsedColor ? { color: parsedColor } : {}),
          };
        } else if (parsedColor) {
          tables[currentTable].color = parsedColor;
        }
        continue;
      }
    }

    if (line === '}') {
      currentTable = null;
      continue;
    }

    if (currentTable) {
      let workingLine = line;
      let inlineRel: [string, string] | null = null;

      const inlineRelMatch = workingLine.match(
        /(?:->|-<|references)\s*([a-zA-Z0-9_]+)(?:\.|\()([a-zA-Z0-9_]+)\)?/i
      );
      if (inlineRelMatch) {
        inlineRel = [inlineRelMatch[1], inlineRelMatch[2]];
        workingLine =
          workingLine.slice(0, inlineRelMatch.index) +
          ' ' +
          workingLine.slice(inlineRelMatch.index! + inlineRelMatch[0].length);
        workingLine = workingLine.trim();
      }

      const parts = workingLine.split(/\s+/);
      if (!parts.length || !parts[0]) continue;

      const colName = parts[0].replace(/[`"']/g, '');
      let colType = 'varchar(255)';
      let isPk = false;
      let isUnique = false;
      let isNullable = true;
      const isFk = Boolean(inlineRel);

      let rest = parts.slice(1).join(' ').toLowerCase();

      if (/\b(pk|primary\s+key)\b/i.test(rest)) {
        isPk = true;
        isNullable = false;
        rest = rest.replace(/\b(pk|primary\s+key)\b/gi, '').trim();
      }

      if (/\bunique\b/i.test(rest)) {
        isUnique = true;
        rest = rest.replace(/\bunique\b/gi, '').trim();
      }

      if (/\bnot\s+null\b/i.test(rest)) {
        isNullable = false;
        rest = rest.replace(/\bnot\s+null\b/gi, '').trim();
      } else if (/\bnull\b/i.test(rest)) {
        isNullable = true;
        rest = rest.replace(/\bnull\b/gi, '').trim();
      }

      const typeParts = rest.split(/\s+/).filter(Boolean);
      if (typeParts.length > 0) {
        colType = typeParts[0];
      } else if (parts.length > 1 && !isPk && !isUnique && isNullable) {
        colType = parts[1];
      }

      const colData: Column = {
        name: colName,
        type: colType,
        is_pk: isPk,
        is_unique: isUnique,
        is_nullable: isNullable,
        is_fk: isFk,
      };

      tables[currentTable].columns.push(colData);

      if (inlineRel) {
        const [tgtTbl, tgtCol] = inlineRel;
        relationships.push({
          id: `rel_${currentTable}_${colName}_${tgtTbl}_${tgtCol}`,
          source_table: currentTable,
          source_column: colName,
          target_table: tgtTbl,
          target_column: tgtCol,
          type: 'one_to_many',
        });
      }
    }
  }

  // Update is_fk flag on columns
  for (const rel of relationships) {
    const sTbl = tables[rel.source_table];
    if (sTbl) {
      const col = sTbl.columns.find((c) => c.name === rel.source_column);
      if (col) col.is_fk = true;
    }
  }

  return {
    tables: Object.values(tables),
    relationships,
  };
}

export function generateSqlDdlClient(
  tables: Table[],
  relationships: Relationship[],
  dialect: 'postgres' | 'mysql' | 'sqlite' = 'postgres'
): string {
  const lines: string[] = [];
  const quote = dialect === 'mysql' ? '`' : '"';

  lines.push(`-- =============================================`);
  lines.push(`-- Database Schema (${dialect.toUpperCase()} DDL)`);
  lines.push(`-- Generated by Text2ERD`);
  lines.push(`-- =============================================\n`);

  const relsBySrc: Record<string, Relationship[]> = {};
  for (const rel of relationships) {
    if (!relsBySrc[rel.source_table]) relsBySrc[rel.source_table] = [];
    relsBySrc[rel.source_table].push(rel);
  }

  for (const tbl of tables) {
    lines.push(`CREATE TABLE ${quote}${tbl.name}${quote} (`);
    const colDefs: string[] = [];
    const pks: string[] = [];

    for (const col of tbl.columns) {
      const colModifiers: string[] = [];
      if (col.is_pk) pks.push(col.name);
      if (!col.is_nullable && !col.is_pk) colModifiers.push('NOT NULL');
      if (col.is_unique) colModifiers.push('UNIQUE');

      const modStr = colModifiers.length ? ` ${colModifiers.join(' ')}` : '';
      colDefs.push(`    ${quote}${col.name}${quote} ${col.type.toUpperCase()}${modStr}`);
    }

    if (pks.length) {
      const pkList = pks.map((p) => `${quote}${p}${quote}`).join(', ');
      colDefs.push(`    PRIMARY KEY (${pkList})`);
    }

    if (dialect === 'sqlite') {
      for (const rel of relsBySrc[tbl.name] || []) {
        colDefs.push(
          `    FOREIGN KEY (${quote}${rel.source_column}${quote}) REFERENCES ${quote}${rel.target_table}${quote}(${quote}${rel.target_column}${quote}) ON DELETE CASCADE`
        );
      }
    }

    lines.push(colDefs.join(',\n'));
    lines.push(');\n');
  }

  if (dialect !== 'sqlite') {
    for (const rel of relationships) {
      const constraintName = `fk_${rel.source_table}_${rel.source_column}`;
      lines.push(
        `ALTER TABLE ${quote}${rel.source_table}${quote} ADD CONSTRAINT ${quote}${constraintName}${quote} FOREIGN KEY (${quote}${rel.source_column}${quote}) REFERENCES ${quote}${rel.target_table}${quote}(${quote}${rel.target_column}${quote}) ON DELETE CASCADE;`
      );
    }
  }

  return lines.join('\n').trim() + '\n';
}

export function generateMermaidErDiagram(
  tables: Table[],
  relationships: Relationship[]
): string {
  const lines: string[] = ['erDiagram'];

  for (const rel of relationships) {
    const sTable = rel.source_table.replace(/[^a-zA-Z0-9_]/g, '_');
    const tTable = rel.target_table.replace(/[^a-zA-Z0-9_]/g, '_');
    lines.push(`    ${tTable} ||--o{ ${sTable} : "${rel.source_column} -> ${rel.target_column}"`);
  }

  for (const tbl of tables) {
    const safeTbl = tbl.name.replace(/[^a-zA-Z0-9_]/g, '_');
    lines.push(`    ${safeTbl} {`);
    for (const col of tbl.columns) {
      const safeType = (col.type || 'string').replace(/[^a-zA-Z0-9_]/g, '_');
      const safeCol = col.name.replace(/[^a-zA-Z0-9_]/g, '_');
      const badges: string[] = [];
      if (col.is_pk) badges.push('PK');
      if (col.is_fk) badges.push('FK');
      if (col.is_unique && !col.is_pk) badges.push('UK');
      const badgeStr = badges.length ? ` ${badges.join(',')}` : '';
      lines.push(`        ${safeType} ${safeCol}${badgeStr}`);
    }
    lines.push(`    }`);
  }

  return lines.join('\n').trim() + '\n';
}

function toPascalCase(raw: string): string {
  const words = raw
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return 'Model';
  const joined = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  return /^[0-9]/.test(joined) ? `Model${joined}` : joined;
}

function toCamelCase(raw: string): string {
  const pascal = toPascalCase(raw);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function mapSqlTypeToPrisma(rawType: string): {
  scalar: string;
  dbAttr?: string;
  isAutoInt?: boolean;
  isUuid?: boolean;
} {
  const t = (rawType || 'varchar').trim().toLowerCase();
  if (t === 'serial' || t === 'smallserial') {
    return { scalar: 'Int', isAutoInt: true };
  }
  if (t === 'bigserial') {
    return { scalar: 'BigInt', isAutoInt: true };
  }
  if (/^(int|integer|smallint|tinyint|mediumint|int2|int4)\b/.test(t)) {
    return { scalar: 'Int' };
  }
  if (/^(bigint|int8)\b/.test(t)) {
    return { scalar: 'BigInt' };
  }
  if (/^(decimal|numeric|money)/.test(t)) {
    return { scalar: 'Decimal' };
  }
  if (/^(float|double|real)/.test(t)) {
    return { scalar: 'Float' };
  }
  if (/^(bool|boolean)\b/.test(t)) {
    return { scalar: 'Boolean' };
  }
  if (/^uuid\b/.test(t)) {
    return { scalar: 'String', dbAttr: '@db.Uuid', isUuid: true };
  }
  if (/^(timestamp|timestamptz|datetime|date|time)/.test(t)) {
    return { scalar: 'DateTime' };
  }
  if (/^(json|jsonb)\b/.test(t)) {
    return { scalar: 'Json' };
  }
  return { scalar: 'String' };
}

export function generatePrismaSchema(
  tables: Table[],
  relationships: Relationship[]
): string {
  const lines: string[] = [
    '// =============================================',
    '// Prisma Schema',
    '// Generated by Text2ERD',
    '// =============================================',
    '',
    'datasource db {',
    '  provider = "postgresql"',
    '  url      = env("DATABASE_URL")',
    '}',
    '',
    'generator client {',
    '  provider = "prisma-client-js"',
    '}',
    '',
  ];

  const tableMap = new Map<string, Table>();
  const modelNames = new Map<string, string>();
  const usedModelNames = new Set<string>();

  for (const tbl of tables) {
    tableMap.set(tbl.name, tbl);
    let candidate = toPascalCase(tbl.name);
    let suffix = 2;
    while (usedModelNames.has(candidate)) {
      candidate = `${toPascalCase(tbl.name)}${suffix++}`;
    }
    usedModelNames.add(candidate);
    modelNames.set(tbl.name, candidate);
  }

  // Only emit relationships where both source and target tables exist
  const validRels = relationships.filter(
    (r) => tableMap.has(r.source_table) && tableMap.has(r.target_table)
  );

  // Count relations per unordered table pair to disambiguate multiple FKs
  const pairCounts = new Map<string, number>();
  for (const rel of validRels) {
    const pairKey = [rel.source_table, rel.target_table].sort().join('::');
    pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
  }

  for (const tbl of tables) {
    const modelName = modelNames.get(tbl.name) || toPascalCase(tbl.name);
    lines.push(`model ${modelName} {`);

    const pks = tbl.columns.filter((c) => c.is_pk).map((c) => c.name);
    const hasCompositePk = pks.length > 1;
    const usedFields = new Set<string>(tbl.columns.map((c) => c.name));

    for (const col of tbl.columns) {
      const mapped = mapSqlTypeToPrisma(col.type);
      const isOptional = Boolean(col.is_nullable) && !col.is_pk;
      const typeToken = `${mapped.scalar}${isOptional ? '?' : ''}`;
      const attrs: string[] = [];

      if (col.is_pk && !hasCompositePk) {
        attrs.push('@id');
        if (mapped.isUuid) {
          attrs.push('@default(uuid())');
        } else if (mapped.isAutoInt || mapped.scalar === 'Int' || mapped.scalar === 'BigInt') {
          attrs.push('@default(autoincrement())');
        }
      }

      if (col.is_unique && !col.is_pk) {
        attrs.push('@unique');
      }

      if (mapped.scalar === 'DateTime' && col.name.toLowerCase() === 'created_at') {
        attrs.push('@default(now())');
      }

      if (mapped.dbAttr) {
        attrs.push(mapped.dbAttr);
      }

      const attrSuffix = attrs.length ? ` ${attrs.join(' ')}` : '';
      lines.push(`  ${col.name} ${typeToken}${attrSuffix}`);
    }

    // Outgoing FK relation fields (this model holds source_column)
    const outgoing = validRels.filter((r) => r.source_table === tbl.name);
    for (const rel of outgoing) {
      const targetModel = modelNames.get(rel.target_table) || toPascalCase(rel.target_table);
      const srcColObj = tbl.columns.find((c) => c.name === rel.source_column);
      const isOptionalRel = srcColObj ? Boolean(srcColObj.is_nullable) && !srcColObj.is_pk : false;
      const pairKey = [rel.source_table, rel.target_table].sort().join('::');
      const needsName =
        (pairCounts.get(pairKey) || 0) > 1 || rel.source_table === rel.target_table;
      const relName = `${rel.source_table}_${rel.source_column}_to_${rel.target_table}`;

      let fieldBase = needsName
        ? toCamelCase(`${rel.source_column.replace(/_id$/i, '')}_${rel.target_table}`)
        : toCamelCase(rel.target_table);
      if (!fieldBase || usedFields.has(fieldBase)) {
        fieldBase = toCamelCase(`${rel.target_table}_${rel.source_column}`);
      }
      let fieldName = fieldBase;
      let idx = 2;
      while (usedFields.has(fieldName)) {
        fieldName = `${fieldBase}${idx++}`;
      }
      usedFields.add(fieldName);

      const nameArg = needsName ? `"${relName}", ` : '';
      lines.push(
        `  ${fieldName} ${targetModel}${isOptionalRel ? '?' : ''} @relation(${nameArg}fields: [${rel.source_column}], references: [${rel.target_column}], onDelete: Cascade)`
      );
    }

    // Incoming inverse relation list fields (other models reference this model)
    const incoming = validRels.filter((r) => r.target_table === tbl.name);
    for (const rel of incoming) {
      const sourceModel = modelNames.get(rel.source_table) || toPascalCase(rel.source_table);
      const pairKey = [rel.source_table, rel.target_table].sort().join('::');
      const needsName =
        (pairCounts.get(pairKey) || 0) > 1 || rel.source_table === rel.target_table;
      const relName = `${rel.source_table}_${rel.source_column}_to_${rel.target_table}`;

      let fieldBase = needsName
        ? toCamelCase(`${rel.source_table}_${rel.source_column}`)
        : toCamelCase(rel.source_table);
      if (!fieldBase || usedFields.has(fieldBase)) {
        fieldBase = toCamelCase(`${rel.source_table}_list`);
      }
      let fieldName = fieldBase;
      let idx = 2;
      while (usedFields.has(fieldName)) {
        fieldName = `${fieldBase}${idx++}`;
      }
      usedFields.add(fieldName);

      const relAttr = needsName ? ` @relation("${relName}")` : '';
      lines.push(`  ${fieldName} ${sourceModel}[]${relAttr}`);
    }

    if (hasCompositePk) {
      lines.push('');
      lines.push(`  @@id([${pks.join(', ')}])`);
    }

    if (modelName !== tbl.name) {
      lines.push(`  @@map("${tbl.name}")`);
    }

    lines.push('}');
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

export function generateDbmlSchema(
  tables: Table[],
  relationships: Relationship[]
): string {
  const lines: string[] = [
    '// =============================================',
    '// Database Schema (DBML)',
    '// Generated by Text2ERD',
    '// =============================================',
    '',
  ];

  for (const tbl of tables) {
    const headerSetting = tbl.color
      ? ` [headercolor: ${getTableColorTheme(tbl.color).hex}]`
      : '';
    lines.push(`Table ${tbl.name}${headerSetting} {`);

    const pks = tbl.columns.filter((c) => c.is_pk).map((c) => c.name);
    const hasCompositePk = pks.length > 1;

    for (const col of tbl.columns) {
      const settings: string[] = [];
      if (col.is_pk && !hasCompositePk) {
        settings.push('pk');
      }
      if (col.is_unique && !col.is_pk) {
        settings.push('unique');
      }
      if (!col.is_nullable && !col.is_pk) {
        settings.push('not null');
      }
      const settingStr = settings.length ? ` [${settings.join(', ')}]` : '';
      lines.push(`  ${col.name} ${col.type || 'varchar(255)'}${settingStr}`);
    }

    if (hasCompositePk) {
      lines.push('');
      lines.push('  Indexes {');
      lines.push(`    (${pks.join(', ')}) [pk]`);
      lines.push('  }');
    }

    lines.push('}');
    lines.push('');
  }

  for (const rel of relationships) {
    lines.push(
      `Ref: ${rel.source_table}.${rel.source_column} > ${rel.target_table}.${rel.target_column} [delete: cascade]`
    );
  }

  return lines.join('\n').trim() + '\n';
}

export function encodeDraftToHash(text: string): string {
  try {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return encodeURIComponent(text);
  }
}

export function decodeDraftFromHash(hashStr: string): string | null {
  try {
    let base64 = hashStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    try {
      return decodeURIComponent(hashStr);
    } catch {
      return null;
    }
  }
}

export function parseSqlDdlClient(sql: string): DiagramData {
  const tables: Record<string, Table> = {};
  const relationships: Relationship[] = [];

  // Match CREATE TABLE [IF NOT EXISTS] table_name ( ... )
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`"']?([a-zA-Z0-9_]+)[`"']?\.)?[`"']?([a-zA-Z0-9_]+)[`"']?\s*\(([\s\S]*?)\);/gi;
  let match: RegExpExecArray | null;

  while ((match = createTableRegex.exec(sql)) !== null) {
    const tableName = match[2] || match[1];
    const body = match[3];

    const currentTable: Table = {
      id: tableName,
      name: tableName,
      columns: [],
    };

    // Split column definitions by comma not inside parentheses
    const lines = body.split(/,(?![^(]*\))/);

    for (const rawItem of lines) {
      const item = rawItem.trim();
      if (!item) continue;

      // Table-level PRIMARY KEY (col1, col2)
      const pkMatch = item.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        const pkCols = pkMatch[1].split(',').map((c) => c.replace(/[`"'\s]/g, ''));
        for (const pkCol of pkCols) {
          const col = currentTable.columns.find((c) => c.name === pkCol);
          if (col) {
            col.is_pk = true;
            col.is_nullable = false;
          }
        }
        continue;
      }

      // Table-level FOREIGN KEY (col) REFERENCES other_table(other_col)
      const fkMatch = item.match(
        /^(?:CONSTRAINT\s+[`"']?[a-zA-Z0-9_]+[`"']?\s+)?FOREIGN\s+KEY\s*\([`"']?([a-zA-Z0-9_]+)[`"']?\)\s*REFERENCES\s+[`"']?([a-zA-Z0-9_]+)[`"']?\s*\([`"']?([a-zA-Z0-9_]+)[`"']?\)/i
      );
      if (fkMatch) {
        const [, srcCol, tgtTbl, tgtCol] = fkMatch;
        const existingCol = currentTable.columns.find((c) => c.name === srcCol);
        if (existingCol) existingCol.is_fk = true;

        relationships.push({
          id: `rel_${tableName}_${srcCol}_${tgtTbl}_${tgtCol}`,
          source_table: tableName,
          source_column: srcCol,
          target_table: tgtTbl,
          target_column: tgtCol,
          type: 'one_to_many',
        });
        continue;
      }

      // Column definition: col_name type [modifiers]
      const colTokens = item.split(/\s+/);
      if (colTokens.length < 2) continue;

      const colName = colTokens[0].replace(/[`"']/g, '');
      const colType = colTokens[1].toLowerCase();
      const rest = item.toLowerCase();

      const isPk = /\b(primary\s+key)\b/i.test(rest);
      const isUnique = /\bunique\b/i.test(rest);
      const isNullable = !/\bnot\s+null\b/i.test(rest) && !isPk;

      // Check inline references
      const inlineFkMatch = item.match(
        /REFERENCES\s+[`"']?([a-zA-Z0-9_]+)[`"']?\s*\([`"']?([a-zA-Z0-9_]+)[`"']?\)/i
      );
      const isFk = Boolean(inlineFkMatch);

      currentTable.columns.push({
        name: colName,
        type: colType,
        is_pk: isPk,
        is_unique: isUnique,
        is_nullable: isNullable,
        is_fk: isFk,
      });

      if (inlineFkMatch) {
        const [, tgtTbl, tgtCol] = inlineFkMatch;
        relationships.push({
          id: `rel_${tableName}_${colName}_${tgtTbl}_${tgtCol}`,
          source_table: tableName,
          source_column: colName,
          target_table: tgtTbl,
          target_column: tgtCol,
          type: 'one_to_many',
        });
      }
    }

    tables[tableName] = currentTable;
  }

  // Also parse standalone ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ...
  const alterFkRegex = /ALTER\s+TABLE\s+[`"']?([a-zA-Z0-9_]+)[`"']?\s+ADD\s+(?:CONSTRAINT\s+[`"']?[a-zA-Z0-9_]+[`"']?\s+)?FOREIGN\s+KEY\s*\([`"']?([a-zA-Z0-9_]+)[`"']?\)\s*REFERENCES\s+[`"']?([a-zA-Z0-9_]+)[`"']?\s*\([`"']?([a-zA-Z0-9_]+)[`"']?\)/gi;
  let alterMatch: RegExpExecArray | null;

  while ((alterMatch = alterFkRegex.exec(sql)) !== null) {
    const [, srcTbl, srcCol, tgtTbl, tgtCol] = alterMatch;
    if (tables[srcTbl]) {
      const col = tables[srcTbl].columns.find((c) => c.name === srcCol);
      if (col) col.is_fk = true;
    }
    relationships.push({
      id: `rel_${srcTbl}_${srcCol}_${tgtTbl}_${tgtCol}`,
      source_table: srcTbl,
      source_column: srcCol,
      target_table: tgtTbl,
      target_column: tgtCol,
      type: 'one_to_many',
    });
  }

  return {
    tables: Object.values(tables),
    relationships,
  };
}
