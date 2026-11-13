from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .parser import parse_draft_text, parse_sql_ddl, generate_sql_ddl


class HealthCheckView(APIView):
    throttle_classes = []

    def get(self, request):
        return Response({
            "status": "ok",
            "service": "text2erd-backend",
            "limits": {
                "max_sql_bytes": getattr(settings, "MAX_IMPORT_SQL_BYTES", 500 * 1024),
                "max_draft_bytes": getattr(settings, "MAX_DRAFT_TEXT_BYTES", 200 * 1024),
                "max_tables": getattr(settings, "MAX_TABLES_LIMIT", 150),
            },
        })


class ParseDraftView(APIView):
    """
    Parses shorthand table draft text into structured diagram AST.
    """
    def post(self, request):
        text = request.data.get("text", "")
        if not isinstance(text, str):
            return Response({"error": "'text' must be a string."}, status=status.HTTP_400_BAD_REQUEST)

        max_bytes = getattr(settings, "MAX_DRAFT_TEXT_BYTES", 200 * 1024)
        byte_len = len(text.encode("utf-8"))
        if byte_len > max_bytes:
            max_kb = max_bytes // 1024
            return Response(
                {"error": f"Draft text exceeds maximum allowed size of {max_kb} KB."},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        try:
            result = parse_draft_text(text)
            max_tables = getattr(settings, "MAX_TABLES_LIMIT", 150)
            if len(result.get("tables", [])) > max_tables:
                return Response(
                    {"error": f"Schema exceeds the maximum limit of {max_tables} tables ({len(result['tables'])} found)."},
                    status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to parse draft: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class ImportSqlView(APIView):
    """
    Parses raw SQL DDL (via JSON string or uploaded .sql file) into structured diagram AST.
    """
    def post(self, request):
        max_bytes = getattr(settings, "MAX_IMPORT_SQL_BYTES", 500 * 1024)
        max_kb = max_bytes // 1024

        uploaded_file = request.FILES.get("file")
        if uploaded_file is not None:
            if uploaded_file.size > max_bytes:
                return Response(
                    {"error": f"Uploaded file ({uploaded_file.size // 1024} KB) exceeds maximum limit of {max_kb} KB."},
                    status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                )
            try:
                sql = uploaded_file.read().decode("utf-8")
            except UnicodeDecodeError:
                return Response(
                    {"error": "Uploaded file must be a valid UTF-8 encoded text or .sql file."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            sql = request.data.get("sql", "")
            if not isinstance(sql, str):
                return Response({"error": "'sql' must be a string."}, status=status.HTTP_400_BAD_REQUEST)

            byte_len = len(sql.encode("utf-8"))
            if byte_len > max_bytes:
                return Response(
                    {"error": f"SQL input ({byte_len // 1024} KB) exceeds maximum allowed size of {max_kb} KB."},
                    status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                )

        try:
            result = parse_sql_ddl(sql)
            max_tables = getattr(settings, "MAX_TABLES_LIMIT", 150)
            if len(result.get("tables", [])) > max_tables:
                return Response(
                    {"error": f"Imported SQL contains {len(result['tables'])} tables, exceeding the limit of {max_tables} tables."},
                    status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to parse SQL: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class ExportSqlView(APIView):
    """
    Converts diagram AST (tables & relationships) into formatted SQL DDL.
    """
    def post(self, request):
        tables = request.data.get("tables", [])
        relationships = request.data.get("relationships", [])
        dialect = request.data.get("dialect", "postgres")

        if not isinstance(tables, list) or not isinstance(relationships, list):
            return Response({"error": "'tables' and 'relationships' must be lists."}, status=status.HTTP_400_BAD_REQUEST)

        max_tables = getattr(settings, "MAX_TABLES_LIMIT", 150)
        if len(tables) > max_tables:
            return Response(
                {"error": f"Cannot export more than {max_tables} tables at once."},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        try:
            sql_output = generate_sql_ddl(tables, relationships, dialect)
            return Response({"sql": sql_output, "dialect": dialect}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to generate SQL: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
