from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .parser import parse_draft_text, parse_sql_ddl, generate_sql_ddl


class HealthCheckView(APIView):
    def get(self, request):
        return Response({"status": "ok", "service": "text2erd-backend"})


class ParseDraftView(APIView):
    """
    Parses shorthand table draft text into structured diagram AST.
    """
    def post(self, request):
        text = request.data.get("text", "")
        if not isinstance(text, str):
            return Response({"error": "'text' must be a string."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = parse_draft_text(text)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to parse draft: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class ImportSqlView(APIView):
    """
    Parses raw SQL DDL into structured diagram AST.
    """
    def post(self, request):
        sql = request.data.get("sql", "")
        if not isinstance(sql, str):
            return Response({"error": "'sql' must be a string."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = parse_sql_ddl(sql)
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

        try:
            sql_output = generate_sql_ddl(tables, relationships, dialect)
            return Response({"sql": sql_output, "dialect": dialect}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to generate SQL: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
