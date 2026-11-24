import re
from typing import Dict, List, Any, Optional, Tuple
import sqlparse
from sqlparse.sql import IdentifierList, Identifier, Function, Parenthesis
from sqlparse.tokens import Keyword, DML, DDL


COLOR_ALIASES: Dict[str, str] = {
    "emerald": "emerald",
    "green": "emerald",
    "#16a34a": "emerald",
    "#10b981": "emerald",
    "blue": "blue",
    "sky": "blue",
    "#0284c7": "blue",
    "#2563eb": "blue",
    "#3b82f6": "blue",
    "indigo": "indigo",
    "violet": "indigo",
    "purple": "indigo",
    "#4f46e5": "indigo",
    "#6366f1": "indigo",
    "cyan": "cyan",
    "teal": "cyan",
    "#0891b2": "cyan",
    "#0d9488": "cyan",
    "amber": "amber",
    "yellow": "amber",
    "gold": "amber",
    "#d97706": "amber",
    "#f59e0b": "amber",
    "orange": "orange",
    "#ea580c": "orange",
    "#f97316": "orange",
    "rose": "rose",
    "red": "rose",
    "pink": "rose",
    "#e11d48": "rose",
    "#ef4444": "rose",
    "slate": "slate",
    "gray": "slate",
    "grey": "slate",
    "#475569": "slate",
    "#64748b": "slate",
}

COLOR_HEX_MAP: Dict[str, str] = {
    "emerald": "#16a34a",
    "blue": "#0284c7",
    "indigo": "#4f46e5",
    "cyan": "#0891b2",
    "amber": "#d97706",
    "orange": "#ea580c",
    "rose": "#e11d48",
    "slate": "#475569",
}


def _extract_table_color(bracket_content: Optional[str]) -> Optional[str]:
    if not bracket_content:
        return None
    attr_match = re.search(r"(?:headercolor|color)\s*:\s*([#a-zA-Z0-9_]+)", bracket_content, re.IGNORECASE)
    candidate = attr_match.group(1) if attr_match else bracket_content.strip()
    return COLOR_ALIASES.get(candidate.strip().lower())


def parse_draft_text(text: str) -> Dict[str, Any]:
    """
    Parses intuitive drafting text into structured tables and relationships.
    Supports formats like:
      users [color: blue]
        id int pk
        email varchar(255) unique
        name varchar(100)
        created_at timestamp

      posts
        id int pk
        user_id int -> users.id
        title varchar(200)
        content text

      # standalone relationships also supported:
      comments.post_id -> posts.id
    """
    tables: Dict[str, Dict[str, Any]] = {}
    relationships: List[Dict[str, Any]] = []
    current_table: Optional[str] = None

    lines = text.strip().split("\n")

    for raw_line in lines:
        line = raw_line.strip()

        # Skip empty lines and comments
        if not line or line.startswith("#") or line.startswith("//") or line.startswith("--"):
            continue

        # Check for standalone relationship: e.g. "posts.user_id -> users.id" or "posts.user_id references users(id)"
        rel_match = re.match(
            r"^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*(?:->|-<|--|references)\s*([a-zA-Z0-9_]+)(?:\.|\()([a-zA-Z0-9_]+)\)?$",
            line,
            re.IGNORECASE,
        )
        if rel_match:
            src_tbl, src_col, tgt_tbl, tgt_col = rel_match.groups()
            rel_id = f"rel_{src_tbl}_{src_col}_{tgt_tbl}_{tgt_col}"
            relationships.append({
                "id": rel_id,
                "source_table": src_tbl,
                "source_column": src_col,
                "target_table": tgt_tbl,
                "target_column": tgt_col,
                "type": "one_to_many"
            })
            continue

        # Check if line indicates a table definition:
        # e.g. "users", "users [color: blue]", "Table users {", "users:"
        table_match = re.match(
            r"^(?:table\s+)?([a-zA-Z0-9_]+)(?:\s*\[([^\]]+)\])?\s*[:{]?$",
            line,
            re.IGNORECASE,
        )
        # It's a table header if it matches and either has no indentation in raw_line or starts with "table "
        is_indented = len(raw_line) - len(raw_line.lstrip()) > 0
        
        # If it looks like a single word without data type, begins with "Table ", or has a valid [color] tag
        tokens = line.split()
        parsed_color = _extract_table_color(table_match.group(2)) if table_match else None
        if (table_match and (not is_indented or line.lower().startswith("table ") or parsed_color is not None)) or (len(tokens) == 1 and not line.endswith("}")):
            tbl_name = table_match.group(1) if table_match else tokens[0].rstrip(":{")
            if tbl_name.lower() not in ("}", "{"):
                current_table = tbl_name
                if current_table not in tables:
                    tbl_entry: Dict[str, Any] = {
                        "id": current_table,
                        "name": current_table,
                        "columns": []
                    }
                    if parsed_color:
                        tbl_entry["color"] = parsed_color
                    tables[current_table] = tbl_entry
                elif parsed_color:
                    tables[current_table]["color"] = parsed_color
                continue

        if line == "}":
            current_table = None
            continue

        # Otherwise, if we have an active table, parse column
        if current_table:
            # Column syntax: name type [pk|primary key] [unique] [null|not null] [-> target.col]
            # Check for inline relationship: "-> target.col" or "references target(col)"
            inline_rel = None
            inline_rel_match = re.search(
                r"(?:->|-<|references)\s*([a-zA-Z0-9_]+)(?:\.|\()([a-zA-Z0-9_]+)\)?",
                line,
                re.IGNORECASE,
            )
            if inline_rel_match:
                tgt_tbl, tgt_col = inline_rel_match.groups()
                inline_rel = (tgt_tbl, tgt_col)
                # Remove relationship part from line for column attribute parsing
                line = line[:inline_rel_match.start()].strip() + " " + line[inline_rel_match.end():].strip()
                line = line.strip()

            parts = line.split()
            if not parts:
                continue

            col_name = parts[0].strip("`, \"'")
            # If line is just "id" without type, default to "integer" or "varchar"
            col_type = "varchar(255)"
            is_pk = False
            is_unique = False
            is_nullable = True
            is_fk = bool(inline_rel)

            rest = " ".join(parts[1:]).lower()
            
            # Extract primary key
            if re.search(r"\b(pk|primary\s+key)\b", rest):
                is_pk = True
                is_nullable = False
                rest = re.sub(r"\b(pk|primary\s+key)\b", "", rest).strip()

            # Extract unique
            if re.search(r"\bunique\b", rest):
                is_unique = True
                rest = re.sub(r"\bunique\b", "", rest).strip()

            # Extract not null
            if re.search(r"\bnot\s+null\b", rest):
                is_nullable = False
                rest = re.sub(r"\bnot\s+null\b", "", rest).strip()
            elif re.search(r"\bnull\b", rest):
                is_nullable = True
                rest = re.sub(r"\bnull\b", "", rest).strip()

            # First remaining token is the data type if present
            type_parts = rest.split()
            if type_parts:
                col_type = type_parts[0]
            elif len(parts) > 1 and not (is_pk or is_unique or is_nullable is False):
                col_type = parts[1]

            col_data = {
                "name": col_name,
                "type": col_type,
                "is_pk": is_pk,
                "is_unique": is_unique,
                "is_nullable": is_nullable,
                "is_fk": is_fk
            }
            tables[current_table]["columns"].append(col_data)

            if inline_rel:
                tgt_tbl, tgt_col = inline_rel
                rel_id = f"rel_{current_table}_{col_name}_{tgt_tbl}_{tgt_col}"
                relationships.append({
                    "id": rel_id,
                    "source_table": current_table,
                    "source_column": col_name,
                    "target_table": tgt_tbl,
                    "target_column": tgt_col,
                    "type": "one_to_many"
                })

    # Mark FK on columns if relationship points to them
    table_dict = {t["id"]: t for t in tables.values()}
    for rel in relationships:
        s_tbl = table_dict.get(rel["source_table"])
        if s_tbl:
            for col in s_tbl["columns"]:
                if col["name"] == rel["source_column"]:
                    col["is_fk"] = True

    return {
        "tables": list(tables.values()),
        "relationships": relationships
    }


def parse_sql_ddl(sql_text: str) -> Dict[str, Any]:
    """
    Parses SQL DDL (CREATE TABLE and ALTER TABLE statements) into tables and relationships.
    Uses sqlparse + regex parsing for maximum robustness.
    """
    tables: Dict[str, Dict[str, Any]] = {}
    relationships: List[Dict[str, Any]] = []

    # Clean comments
    cleaned_sql = sqlparse.format(sql_text, strip_comments=True)
    statements = sqlparse.split(cleaned_sql)

    for stmt in statements:
        stmt_str = stmt.strip()
        if not stmt_str:
            continue

        # 1. Check for CREATE TABLE
        create_match = re.search(
            r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`\"']?([a-zA-Z0-9_]+)[`\"']?\.)?[`\"']?([a-zA-Z0-9_]+)[`\"']?\s*\((.*)\)[^)]*$",
            stmt_str,
            re.IGNORECASE | re.DOTALL,
        )

        if create_match:
            schema_name, table_name, body = create_match.groups()
            tbl_id = table_name
            if tbl_id not in tables:
                tables[tbl_id] = {
                    "id": tbl_id,
                    "name": tbl_id,
                    "columns": []
                }

            # Split body by commas that are not inside parentheses
            column_defs = split_sql_definitions(body)
            table_pks = set()

            for col_def in column_defs:
                col_def = col_def.strip()
                if not col_def:
                    continue

                # Table-level PRIMARY KEY (col1, col2)
                pk_table_match = re.match(r"(?:CONSTRAINT\s+[`\"']?[a-zA-Z0-9_]+[`\"']?\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)", col_def, re.IGNORECASE)
                if pk_table_match:
                    for pk_col in pk_table_match.group(1).split(","):
                        table_pks.add(pk_col.strip("`, \"'"))
                    continue

                # Table-level FOREIGN KEY (col) REFERENCES other_table(other_col)
                fk_table_match = re.match(
                    r"(?:CONSTRAINT\s+[`\"']?[a-zA-Z0-9_]+[`\"']?\s+)?FOREIGN\s+KEY\s*\(([`\"']?[a-zA-Z0-9_]+[`\"']?)\)\s*REFERENCES\s*(?:[`\"']?[a-zA-Z0-9_]+[`\"']?\.)?[`\"']?([a-zA-Z0-9_]+)[`\"']?\s*\(([`\"']?[a-zA-Z0-9_]+)[`\"']?\)",
                    col_def,
                    re.IGNORECASE,
                )
                if fk_table_match:
                    src_col, tgt_tbl, tgt_col = fk_table_match.groups()
                    src_col = src_col.strip("`, \"'")
                    tgt_tbl = tgt_tbl.strip("`, \"'")
                    tgt_col = tgt_col.strip("`, \"'")
                    rel_id = f"rel_{tbl_id}_{src_col}_{tgt_tbl}_{tgt_col}"
                    relationships.append({
                        "id": rel_id,
                        "source_table": tbl_id,
                        "source_column": src_col,
                        "target_table": tgt_tbl,
                        "target_column": tgt_col,
                        "type": "one_to_many"
                    })
                    continue

                # Regular Column Definition
                # e.g.: id INT NOT NULL AUTO_INCREMENT PRIMARY KEY
                # e.g.: user_id INT REFERENCES users(id)
                col_tokens = col_def.split()
                if not col_tokens:
                    continue

                col_name = col_tokens[0].strip("`, \"'")
                col_type = col_tokens[1] if len(col_tokens) > 1 else "varchar"
                rest = " ".join(col_tokens[2:]).lower() if len(col_tokens) > 2 else ""

                is_pk = "primary key" in rest or "primary key" in col_type.lower()
                is_unique = "unique" in rest
                is_nullable = "not null" not in rest
                is_fk = False

                # Inline REFERENCES
                inline_ref_match = re.search(
                    r"REFERENCES\s*(?:[`\"']?[a-zA-Z0-9_]+[`\"']?\.)?[`\"']?([a-zA-Z0-9_]+)[`\"']?\s*\(([`\"']?[a-zA-Z0-9_]+)[`\"']?\)",
                    col_def,
                    re.IGNORECASE,
                )
                if inline_ref_match:
                    tgt_tbl, tgt_col = inline_ref_match.groups()
                    tgt_tbl = tgt_tbl.strip("`, \"'")
                    tgt_col = tgt_col.strip("`, \"'")
                    is_fk = True
                    rel_id = f"rel_{tbl_id}_{col_name}_{tgt_tbl}_{tgt_col}"
                    relationships.append({
                        "id": rel_id,
                        "source_table": tbl_id,
                        "source_column": col_name,
                        "target_table": tgt_tbl,
                        "target_column": tgt_col,
                        "type": "one_to_many"
                    })

                tables[tbl_id]["columns"].append({
                    "name": col_name,
                    "type": col_type,
                    "is_pk": is_pk,
                    "is_unique": is_unique,
                    "is_nullable": is_nullable,
                    "is_fk": is_fk
                })

            # Apply table-level PKs
            for col in tables[tbl_id]["columns"]:
                if col["name"] in table_pks:
                    col["is_pk"] = True
                    col["is_nullable"] = False

        # 2. Check for ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY
        alter_match = re.search(
            r"ALTER\s+TABLE\s+(?:[`\"']?[a-zA-Z0-9_]+[`\"']?\.)?[`\"']?([a-zA-Z0-9_]+)[`\"']?\s+ADD\s+(?:CONSTRAINT\s+[`\"']?[a-zA-Z0-9_]+[`\"']?\s+)?FOREIGN\s+KEY\s*\(([`\"']?[a-zA-Z0-9_]+)[`\"']?\)\s*REFERENCES\s*(?:[`\"']?[a-zA-Z0-9_]+[`\"']?\.)?[`\"']?([a-zA-Z0-9_]+)[`\"']?\s*\(([`\"']?[a-zA-Z0-9_]+)[`\"']?\)",
            stmt_str,
            re.IGNORECASE,
        )
        if alter_match:
            src_tbl, src_col, tgt_tbl, tgt_col = alter_match.groups()
            src_tbl = src_tbl.strip("`, \"'")
            src_col = src_col.strip("`, \"'")
            tgt_tbl = tgt_tbl.strip("`, \"'")
            tgt_col = tgt_col.strip("`, \"'")
            rel_id = f"rel_{src_tbl}_{src_col}_{tgt_tbl}_{tgt_col}"
            relationships.append({
                "id": rel_id,
                "source_table": src_tbl,
                "source_column": src_col,
                "target_table": tgt_tbl,
                "target_column": tgt_col,
                "type": "one_to_many"
            })

    # Ensure is_fk flag on columns
    table_dict = {t["id"]: t for t in tables.values()}
    for rel in relationships:
        s_tbl = table_dict.get(rel["source_table"])
        if s_tbl:
            for col in s_tbl["columns"]:
                if col["name"] == rel["source_column"]:
                    col["is_fk"] = True

    return {
        "tables": list(tables.values()),
        "relationships": relationships
    }


def split_sql_definitions(text: str) -> List[str]:
    """Splits SQL comma-separated column/constraint definitions, respecting parentheses."""
    results = []
    current = []
    depth = 0
    in_quotes = False
    quote_char = None

    for char in text:
        if char in ("'", '"', '`'):
            if not in_quotes:
                in_quotes = True
                quote_char = char
            elif char == quote_char:
                in_quotes = False
                quote_char = None
            current.append(char)
        elif char == '(' and not in_quotes:
            depth += 1
            current.append(char)
        elif char == ')' and not in_quotes:
            depth -= 1
            current.append(char)
        elif char == ',' and depth == 0 and not in_quotes:
            results.append("".join(current).strip())
            current = []
        else:
            current.append(char)

    if current:
        trailing = "".join(current).strip()
        if trailing:
            results.append(trailing)

    return results


def generate_sql_ddl(tables: List[Dict[str, Any]], relationships: List[Dict[str, Any]], dialect: str = "postgres") -> str:
    """
    Generates standard formatted SQL DDL from diagram tables and relationships.
    Dialects supported: 'postgres', 'mysql', 'sqlite'
    """
    dialect = dialect.lower()
    sql_lines: List[str] = []
    
    quote = '"' if dialect in ("postgres", "sqlite") else '`'
    
    # Map types to dialect equivalents if needed
    type_mappings = {
        "postgres": {
            "int": "INTEGER",
            "integer": "INTEGER",
            "bigint": "BIGINT",
            "varchar": "VARCHAR(255)",
            "text": "TEXT",
            "boolean": "BOOLEAN",
            "bool": "BOOLEAN",
            "timestamp": "TIMESTAMPTZ",
            "datetime": "TIMESTAMPTZ",
            "uuid": "UUID",
            "json": "JSONB",
            "float": "REAL",
            "double": "DOUBLE PRECISION"
        },
        "mysql": {
            "int": "INT",
            "integer": "INT",
            "bigint": "BIGINT",
            "varchar": "VARCHAR(255)",
            "text": "TEXT",
            "boolean": "TINYINT(1)",
            "bool": "TINYINT(1)",
            "timestamp": "TIMESTAMP",
            "datetime": "DATETIME",
            "uuid": "VARCHAR(36)",
            "json": "JSON",
            "float": "FLOAT",
            "double": "DOUBLE"
        },
        "sqlite": {
            "int": "INTEGER",
            "integer": "INTEGER",
            "bigint": "INTEGER",
            "varchar": "TEXT",
            "text": "TEXT",
            "boolean": "INTEGER",
            "bool": "INTEGER",
            "timestamp": "TEXT",
            "datetime": "TEXT",
            "uuid": "TEXT",
            "json": "TEXT",
            "float": "REAL",
            "double": "REAL"
        }
    }.get(dialect, {})

    # Index relationships by source table
    rels_by_src: Dict[str, List[Dict[str, Any]]] = {}
    for rel in relationships:
        src = rel.get("source_table")
        if src not in rels_by_src:
            rels_by_src[src] = []
        rels_by_src[src].append(rel)

    sql_lines.append(f"-- =============================================")
    sql_lines.append(f"-- Database Schema ({dialect.upper()} DDL)")
    sql_lines.append(f"-- Generated by Text-to-ERD")
    sql_lines.append(f"-- =============================================\n")

    for tbl in tables:
        tbl_name = tbl.get("name") or tbl.get("id")
        sql_lines.append(f"CREATE TABLE {quote}{tbl_name}{quote} (")
        
        col_defs = []
        pks = []
        
        for col in tbl.get("columns", []):
            c_name = col.get("name")
            raw_type = col.get("type", "VARCHAR(255)").strip()
            c_type = type_mappings.get(raw_type.lower(), raw_type.upper())

            modifiers = []
            if col.get("is_pk"):
                pks.append(c_name)
            if not col.get("is_nullable", True) and not col.get("is_pk"):
                modifiers.append("NOT NULL")
            if col.get("is_unique"):
                modifiers.append("UNIQUE")

            mod_str = (" " + " ".join(modifiers)) if modifiers else ""
            col_defs.append(f"    {quote}{c_name}{quote} {c_type}{mod_str}")

        # Primary Key constraint
        if pks:
            pk_list = ", ".join(f"{quote}{pk}{quote}" for pk in pks)
            col_defs.append(f"    PRIMARY KEY ({pk_list})")

        # Foreign keys for SQLite must be declared inside CREATE TABLE
        if dialect == "sqlite":
            for rel in rels_by_src.get(tbl_name, []):
                s_col = rel["source_column"]
                t_tbl = rel["target_table"]
                t_col = rel["target_column"]
                col_defs.append(f"    FOREIGN KEY ({quote}{s_col}{quote}) REFERENCES {quote}{t_tbl}{quote}({quote}{t_col}{quote}) ON DELETE CASCADE")

        sql_lines.append(",\n".join(col_defs))
        sql_lines.append(");\n")

    # For Postgres and MySQL, output ALTER TABLE statements for foreign keys
    if dialect in ("postgres", "mysql"):
        for rel in relationships:
            s_tbl = rel.get("source_table")
            s_col = rel.get("source_column")
            t_tbl = rel.get("target_table")
            t_col = rel.get("target_column")
            constraint_name = f"fk_{s_tbl}_{s_col}"
            sql_lines.append(
                f"ALTER TABLE {quote}{s_tbl}{quote} ADD CONSTRAINT {quote}{constraint_name}{quote} "
                f"FOREIGN KEY ({quote}{s_col}{quote}) REFERENCES {quote}{t_tbl}{quote}({quote}{t_col}{quote}) "
                f"ON DELETE CASCADE;"
            )

    return "\n".join(sql_lines).strip() + "\n"


def _to_pascal_case(raw: str) -> str:
    words = [w for w in re.sub(r"[^a-zA-Z0-9]+", " ", raw).strip().split() if w]
    if not words:
        return "Model"
    joined = "".join(w[0].upper() + w[1:] for w in words)
    return f"Model{joined}" if joined[0].isdigit() else joined


def _to_camel_case(raw: str) -> str:
    pascal = _to_pascal_case(raw)
    return pascal[0].lower() + pascal[1:]


def _map_sql_to_prisma(raw_type: str) -> Tuple[str, Optional[str], bool, bool]:
    t = (raw_type or "varchar").strip().lower()
    if t in ("serial", "smallserial"):
        return ("Int", None, True, False)
    if t == "bigserial":
        return ("BigInt", None, True, False)
    if re.match(r"^(int|integer|smallint|tinyint|mediumint|int2|int4)\b", t):
        return ("Int", None, False, False)
    if re.match(r"^(bigint|int8)\b", t):
        return ("BigInt", None, False, False)
    if re.match(r"^(decimal|numeric|money)", t):
        return ("Decimal", None, False, False)
    if re.match(r"^(float|double|real)", t):
        return ("Float", None, False, False)
    if re.match(r"^(bool|boolean)\b", t):
        return ("Boolean", None, False, False)
    if re.match(r"^uuid\b", t):
        return ("String", "@db.Uuid", False, True)
    if re.match(r"^(timestamp|timestamptz|datetime|date|time)", t):
        return ("DateTime", None, False, False)
    if re.match(r"^(json|jsonb)\b", t):
        return ("Json", None, False, False)
    return ("String", None, False, False)


def generate_prisma_schema(tables: List[Dict[str, Any]], relationships: List[Dict[str, Any]]) -> str:
    lines: List[str] = [
        "// =============================================",
        "// Prisma Schema",
        "// Generated by Text2ERD",
        "// =============================================",
        "",
        "datasource db {",
        '  provider = "postgresql"',
        '  url      = env("DATABASE_URL")',
        "}",
        "",
        "generator client {",
        '  provider = "prisma-client-js"',
        "}",
        "",
    ]

    table_map: Dict[str, Dict[str, Any]] = {}
    model_names: Dict[str, str] = {}
    used_models = set()

    for tbl in tables:
        t_name = tbl.get("name") or tbl.get("id") or "table"
        table_map[t_name] = tbl
        base_model = _to_pascal_case(t_name)
        candidate = base_model
        idx = 2
        while candidate in used_models:
            candidate = f"{base_model}{idx}"
            idx += 1
        used_models.add(candidate)
        model_names[t_name] = candidate

    valid_rels = [
        r for r in relationships
        if r.get("source_table") in table_map and r.get("target_table") in table_map
    ]

    pair_counts: Dict[str, int] = {}
    for rel in valid_rels:
        pair_key = "::".join(sorted([rel["source_table"], rel["target_table"]]))
        pair_counts[pair_key] = pair_counts.get(pair_key, 0) + 1

    for tbl in tables:
        t_name = tbl.get("name") or tbl.get("id") or "table"
        model_name = model_names[t_name]
        lines.append(f"model {model_name} {{")

        cols = tbl.get("columns", [])
        pks = [c["name"] for c in cols if c.get("is_pk")]
        has_composite_pk = len(pks) > 1
        used_fields = {c["name"] for c in cols}

        for col in cols:
            c_name = col.get("name", "col")
            scalar, db_attr, is_auto_int, is_uuid = _map_sql_to_prisma(col.get("type", "varchar"))
            is_pk = bool(col.get("is_pk"))
            is_nullable = bool(col.get("is_nullable", True)) and not is_pk
            type_token = f"{scalar}{'?' if is_nullable else ''}"
            attrs: List[str] = []

            if is_pk and not has_composite_pk:
                attrs.append("@id")
                if is_uuid:
                    attrs.append("@default(uuid())")
                elif is_auto_int or scalar in ("Int", "BigInt"):
                    attrs.append("@default(autoincrement())")

            if col.get("is_unique") and not is_pk:
                attrs.append("@unique")

            if scalar == "DateTime" and c_name.lower() == "created_at":
                attrs.append("@default(now())")

            if db_attr:
                attrs.append(db_attr)

            attr_str = (" " + " ".join(attrs)) if attrs else ""
            lines.append(f"  {c_name} {type_token}{attr_str}")

        outgoing = [r for r in valid_rels if r["source_table"] == t_name]
        for rel in outgoing:
            tgt_tbl = rel["target_table"]
            src_col = rel["source_column"]
            tgt_col = rel["target_column"]
            target_model = model_names[tgt_tbl]
            src_col_obj = next((c for c in cols if c.get("name") == src_col), None)
            is_opt_rel = bool(src_col_obj.get("is_nullable", True)) and not bool(src_col_obj.get("is_pk")) if src_col_obj else False
            pair_key = "::".join(sorted([t_name, tgt_tbl]))
            needs_name = pair_counts.get(pair_key, 0) > 1 or t_name == tgt_tbl
            rel_name = f"{t_name}_{src_col}_to_{tgt_tbl}"

            stripped_col = re.sub(r"_id$", "", src_col, flags=re.IGNORECASE)
            field_base = _to_camel_case(f"{stripped_col}_{tgt_tbl}") if needs_name else _to_camel_case(tgt_tbl)
            if not field_base or field_base in used_fields:
                field_base = _to_camel_case(f"{tgt_tbl}_{src_col}")
            field_name = field_base
            idx = 2
            while field_name in used_fields:
                field_name = f"{field_base}{idx}"
                idx += 1
            used_fields.add(field_name)

            name_arg = f'"{rel_name}", ' if needs_name else ""
            opt_mark = "?" if is_opt_rel else ""
            lines.append(
                f"  {field_name} {target_model}{opt_mark} @relation({name_arg}fields: [{src_col}], references: [{tgt_col}], onDelete: Cascade)"
            )

        incoming = [r for r in valid_rels if r["target_table"] == t_name]
        for rel in incoming:
            src_tbl = rel["source_table"]
            src_col = rel["source_column"]
            source_model = model_names[src_tbl]
            pair_key = "::".join(sorted([src_tbl, t_name]))
            needs_name = pair_counts.get(pair_key, 0) > 1 or src_tbl == t_name
            rel_name = f"{src_tbl}_{src_col}_to_{t_name}"

            field_base = _to_camel_case(f"{src_tbl}_{src_col}") if needs_name else _to_camel_case(src_tbl)
            if not field_base or field_base in used_fields:
                field_base = _to_camel_case(f"{src_tbl}_list")
            field_name = field_base
            idx = 2
            while field_name in used_fields:
                field_name = f"{field_base}{idx}"
                idx += 1
            used_fields.add(field_name)

            rel_attr = f' @relation("{rel_name}")' if needs_name else ""
            lines.append(f"  {field_name} {source_model}[]{rel_attr}")

        if has_composite_pk:
            lines.append("")
            lines.append(f"  @@id([{', '.join(pks)}])")

        if model_name != t_name:
            lines.append(f'  @@map("{t_name}")')

        lines.append("}")
        lines.append("")

    return "\n".join(lines).strip() + "\n"


def generate_dbml_schema(tables: List[Dict[str, Any]], relationships: List[Dict[str, Any]]) -> str:
    lines: List[str] = [
        "// =============================================",
        "// Database Schema (DBML)",
        "// Generated by Text2ERD",
        "// =============================================",
        "",
    ]

    for tbl in tables:
        t_name = tbl.get("name") or tbl.get("id") or "table"
        raw_color = tbl.get("color")
        normalized_color = COLOR_ALIASES.get(str(raw_color).lower()) if raw_color else None
        header_setting = f" [headercolor: {COLOR_HEX_MAP[normalized_color]}]" if normalized_color in COLOR_HEX_MAP else ""
        lines.append(f"Table {t_name}{header_setting} {{")

        cols = tbl.get("columns", [])
        pks = [c["name"] for c in cols if c.get("is_pk")]
        has_composite_pk = len(pks) > 1

        for col in cols:
            c_name = col.get("name", "col")
            c_type = col.get("type") or "varchar(255)"
            is_pk = bool(col.get("is_pk"))
            settings: List[str] = []
            if is_pk and not has_composite_pk:
                settings.append("pk")
            if col.get("is_unique") and not is_pk:
                settings.append("unique")
            if not col.get("is_nullable", True) and not is_pk:
                settings.append("not null")
            setting_str = f" [{', '.join(settings)}]" if settings else ""
            lines.append(f"  {c_name} {c_type}{setting_str}")

        if has_composite_pk:
            lines.append("")
            lines.append("  Indexes {")
            lines.append(f"    ({', '.join(pks)}) [pk]")
            lines.append("  }")

        lines.append("}")
        lines.append("")

    for rel in relationships:
        lines.append(
            f"Ref: {rel.get('source_table')}.{rel.get('source_column')} > {rel.get('target_table')}.{rel.get('target_column')} [delete: cascade]"
        )

    return "\n".join(lines).strip() + "\n"
