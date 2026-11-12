from django.test import TestCase
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
        self.client = APIClient()

    def test_health_check(self):
        resp = self.client.get('/api/health/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.json().get("status"), "ok")

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

    def test_export_sql_api(self):
        payload = {
            "tables": [{"name": "accounts", "columns": [{"name": "id", "type": "int", "is_pk": True}]}],
            "relationships": [],
            "dialect": "postgres"
        }
        resp = self.client.post('/api/export-sql/', payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('CREATE TABLE "accounts"', resp.json()["sql"])
