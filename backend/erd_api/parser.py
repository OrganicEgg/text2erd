import re
from typing import Dict, List, Any, Optional, Tuple
import sqlparse
from sqlparse.sql import IdentifierList, Identifier, Function, Parenthesis
from sqlparse.tokens import Keyword, DML, DDL


def parse_draft_text(text: str) -> Dict[str, Any]:
    """
    Parses intuitive drafting text into structured tables and relationships.
    Supports formats like:
      users
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
        # e.g. "users", "Table users", "Table users {", "users:"
        table_match = re.match(r"^(?:table\s+)?([a-zA-Z0-9_]+)\s*[:{]?$", line, re.IGNORECASE)
        # It's a table header if it matches and either has no indentation in raw_line or starts with "table "
        is_indented = len(raw_line) - len(raw_line.lstrip()) > 0
        
        # If it looks like a single word without data type, or begins with "Table "
        tokens = line.split()
        if (table_match and (not is_indented or line.lower().startswith("table "))) or (len(tokens) == 1 and not line.endswith("}")):
            tbl_name = table_match.group(1) if table_match else tokens[0].rstrip(":{")
            if tbl_name.lower() not in ("}", "{"):
                current_table = tbl_name
                if current_table not in tables:
                    tables[current_table] = {
                        "id": current_table,
                        "name": current_table,
                        "columns": []
                    }
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
