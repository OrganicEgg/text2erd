from django.test import TestCase, override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from .parser import parse_draft_text, parse_sql_ddl, generate_sql_ddl


class ParserUnitTests(TestCase):
    def test_parse_draft_text(self):
        draft = """
        users
          id int pk
          name varchar(100) not null
          email varchar(255) unique

        posts
          id int pk
          author_id int -> users.id
          title varchar(200)
          content text
        """
        result = parse_draft_text(draft)
        tables = result["tables"]
        rels = result["relationships"]

        self.assertEqual(len(tables), 2)
        tbl_names = [t["name"] for t in tables]
        self.assertIn("users", tbl_names)
        self.assertIn("posts", tbl_names)

        # Check relationships
        self.assertEqual(len(rels), 1)
        self.assertEqual(rels[0]["source_table"], "posts")
        self.assertEqual(rels[0]["source_column"], "author_id")
        self.assertEqual(rels[0]["target_table"], "users")
        self.assertEqual(rels[0]["target_column"], "id")

        # Check column flags
        users_table = next(t for t in tables if t["name"] == "users")
        id_col = next(c for c in users_table["columns"] if c["name"] == "id")
        self.assertTrue(id_col["is_pk"])
        self.assertFalse(id_col["is_nullable"])

        email_col = next(c for c in users_table["columns"] if c["name"] == "email")
        self.assertTrue(email_col["is_unique"])

    def test_parse_sql_ddl(self):
        sql = """
        CREATE TABLE categories (
            id INT PRIMARY KEY,
            title VARCHAR(50) NOT NULL
        );

        CREATE TABLE products (
            id INT PRIMARY KEY,
            cat_id INT,
            name VARCHAR(100) NOT NULL,
            FOREIGN KEY (cat_id) REFERENCES categories(id)
        );
        """
        result = parse_sql_ddl(sql)
        tables = result["tables"]
        rels = result["relationships"]

        self.assertEqual(len(tables), 2)
        self.assertEqual(len(rels), 1)
        self.assertEqual(rels[0]["source_table"], "products")
        self.assertEqual(rels[0]["source_column"], "cat_id")
        self.assertEqual(rels[0]["target_table"], "categories")
        self.assertEqual(rels[0]["target_column"], "id")

    def test_generate_sql_ddl(self):
        tables = [
            {
                "id": "users",
                "name": "users",
                "columns": [
                    {"name": "id", "type": "int", "is_pk": True, "is_nullable": False, "is_unique": False},
                    {"name": "username", "type": "varchar(50)", "is_pk": False, "is_nullable": False, "is_unique": True}
                ]
            },
            {
                "id": "posts",
                "name": "posts",
                "columns": [
                    {"name": "id", "type": "int", "is_pk": True, "is_nullable": False, "is_unique": False},
                    {"name": "user_id", "type": "int", "is_pk": False, "is_nullable": False, "is_unique": False}
                ]
            }
        ]
        relationships = [
            {
                "id": "rel1",
                "source_table": "posts",
                "source_column": "user_id",
                "target_table": "users",
                "target_column": "id"
            }
        ]

        # Test postgres
        sql_pg = generate_sql_ddl(tables, relationships, "postgres")
        self.assertIn('CREATE TABLE "users"', sql_pg)
        self.assertIn('ALTER TABLE "posts" ADD CONSTRAINT "fk_posts_user_id"', sql_pg)

        # Test sqlite
        sql_sqlite = generate_sql_ddl(tables, relationships, "sqlite")
        self.assertIn('CREATE TABLE "users"', sql_sqlite)
        self.assertIn('FOREIGN KEY ("user_id") REFERENCES "users"("id")', sql_sqlite)


class ApiEndpointsTestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_health_check(self):
        resp = self.client.get('/api/health/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.json().get("status"), "ok")
        self.assertIn("limits", resp.json())

    def test_parse_draft_api(self):
        payload = {"text": "users\n  id int pk\n"}
        resp = self.client.post('/api/parse-draft/', payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(len(data["tables"]), 1)
        self.assertEqual(data["tables"][0]["name"], "users")

    def test_import_sql_api(self):
        payload = {"sql": "CREATE TABLE items (id INT PRIMARY KEY);"}
        resp = self.client.post('/api/import-sql/', payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(len(data["tables"]), 1)
        self.assertEqual(data["tables"][0]["name"], "items")

    def test_import_sql_file_upload(self):
        sql_file = SimpleUploadedFile(
            "schema.sql",
            b"CREATE TABLE orders (id INT PRIMARY KEY, total DECIMAL(10,2));",
            content_type="application/sql",
        )
        resp = self.client.post('/api/import-sql/', {"file": sql_file}, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(len(data["tables"]), 1)
        self.assertEqual(data["tables"][0]["name"], "orders")

    @override_settings(MAX_IMPORT_SQL_BYTES=1024)
    def test_import_sql_exceeds_size_limit(self):
        large_sql = "CREATE TABLE t (id INT PRIMARY KEY);\n" * 50
        resp = self.client.post('/api/import-sql/', {"sql": large_sql}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        self.assertIn("exceeds maximum", resp.json().get("error", ""))

    @override_settings(MAX_IMPORT_SQL_BYTES=1024)
    def test_import_sql_file_exceeds_size_limit(self):
        large_file = SimpleUploadedFile(
            "huge.sql",
            b"CREATE TABLE t (id INT PRIMARY KEY);\n" * 50,
            content_type="application/sql",
        )
        resp = self.client.post('/api/import-sql/', {"file": large_file}, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

    @override_settings(MAX_DRAFT_TEXT_BYTES=1024)
    def test_parse_draft_exceeds_size_limit(self):
        large_draft = "users\n  id int pk\n\n" * 100
        resp = self.client.post('/api/parse-draft/', {"text": large_draft}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

    @override_settings(MAX_TABLES_LIMIT=2)
    def test_max_tables_limit_enforced(self):
        draft = "t1\n  id int pk\nt2\n  id int pk\nt3\n  id int pk\n"
        resp = self.client.post('/api/parse-draft/', {"text": draft}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        self.assertIn("maximum limit of 2 tables", resp.json().get("error", ""))

    def test_export_sql_api(self):
        payload = {
            "tables": [{"name": "accounts", "columns": [{"name": "id", "type": "int", "is_pk": True}]}],
            "relationships": [],
            "dialect": "postgres"
        }
        resp = self.client.post('/api/export-sql/', payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('CREATE TABLE "accounts"', resp.json()["sql"])

    @override_settings(MAX_TABLES_LIMIT=1)
    def test_export_sql_exceeds_max_tables_limit(self):
        payload = {
            "tables": [
                {"name": "t1", "columns": [{"name": "id", "type": "int", "is_pk": True}]},
                {"name": "t2", "columns": [{"name": "id", "type": "int", "is_pk": True}]},
            ],
            "relationships": [],
            "dialect": "postgres",
        }
        resp = self.client.post('/api/export-sql/', payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        self.assertIn("Cannot export more than 1 tables", resp.json().get("error", ""))

    def test_invalid_payload_types_rejected(self):
        resp_draft = self.client.post('/api/parse-draft/', {"text": ["not-a-string"]}, format='json')
        self.assertEqual(resp_draft.status_code, status.HTTP_400_BAD_REQUEST)

        resp_sql = self.client.post('/api/import-sql/', {"sql": 12345}, format='json')
        self.assertEqual(resp_sql.status_code, status.HTTP_400_BAD_REQUEST)

        resp_export = self.client.post('/api/export-sql/', {"tables": "invalid", "relationships": []}, format='json')
        self.assertEqual(resp_export.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_utf8_sql_file_rejected(self):
        bad_file = SimpleUploadedFile(
            "binary.sql",
            b"\xff\xfe\x00\x00invalid-utf8",
            content_type="application/sql",
        )
        resp = self.client.post('/api/import-sql/', {"file": bad_file}, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("UTF-8", resp.json().get("error", ""))

    def test_rate_limiting_enforced_on_api_endpoints(self):
        from unittest.mock import patch
        from rest_framework.throttling import AnonRateThrottle

        cache.clear()
        payload = {"text": "users\n  id int pk\n"}
        with patch.dict(AnonRateThrottle.THROTTLE_RATES, {"anon": "2/min"}):
            r1 = self.client.post('/api/parse-draft/', payload, format='json')
            r2 = self.client.post('/api/parse-draft/', payload, format='json')
            r3 = self.client.post('/api/parse-draft/', payload, format='json')
            self.assertEqual(r1.status_code, status.HTTP_200_OK)
            self.assertEqual(r2.status_code, status.HTTP_200_OK)
            self.assertEqual(r3.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

            # Health check endpoint is exempt from rate throttling
            health_resp = self.client.get('/api/health/')
            self.assertEqual(health_resp.status_code, status.HTTP_200_OK)

    @override_settings(SECURE_CONTENT_TYPE_NOSNIFF=True, X_FRAME_OPTIONS='DENY')
    def test_security_headers_present(self):
        resp = self.client.get('/api/health/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(resp.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(resp.headers.get("Cross-Origin-Opener-Policy"), "same-origin")

