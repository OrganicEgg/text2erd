import { describe, it, expect } from 'vitest';
import {
  parseDraftTextClient,
  generateSqlDdlClient,
  parseSqlDdlClient,
  generateMermaidErDiagram,
  generatePrismaSchema,
  generateDbmlSchema,
  encodeDraftToHash,
  decodeDraftFromHash,
} from '../clientParser';
import { syncTableColorInDraft } from '../tableColors';
import type { Table, Relationship } from '../../types/erd';

describe('clientParser', () => {
  describe('parseDraftTextClient', () => {
    it('parses tables and columns with primary keys and data types', () => {
      const draft = `
users
  id int pk
  username varchar(100) unique not null
  email varchar(255) not null
`;
      const result = parseDraftTextClient(draft);
      expect(result.tables).toHaveLength(1);
      const users = result.tables[0];
      expect(users.name).toBe('users');
      expect(users.columns).toHaveLength(3);

      expect(users.columns[0]).toEqual({
        name: 'id',
        type: 'int',
        is_pk: true,
        is_unique: false,
        is_nullable: false,
        is_fk: false,
      });

      expect(users.columns[1].is_unique).toBe(true);
      expect(users.columns[1].is_nullable).toBe(false);
    });

    it('parses inline relationships and marks foreign keys', () => {
      const draft = `
users
  id int pk

posts
  id int pk
  user_id int -> users.id
  title varchar(200)
`;
      const result = parseDraftTextClient(draft);
      expect(result.tables).toHaveLength(2);
      expect(result.relationships).toHaveLength(1);

      const rel = result.relationships[0];
      expect(rel.source_table).toBe('posts');
      expect(rel.source_column).toBe('user_id');
      expect(rel.target_table).toBe('users');
      expect(rel.target_column).toBe('id');

      const posts = result.tables.find((t) => t.name === 'posts');
      const userIdCol = posts?.columns.find((c) => c.name === 'user_id');
      expect(userIdCol?.is_fk).toBe(true);
    });

    it('parses standalone relationship lines', () => {
      const draft = `
authors
  id int pk

books
  id int pk
  author_id int

books.author_id -> authors.id
`;
      const result = parseDraftTextClient(draft);
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].source_table).toBe('books');
      expect(result.relationships[0].target_table).toBe('authors');
    });
  });

  describe('generateSqlDdlClient', () => {
    const mockTables: Table[] = [
      {
        id: 'users',
        name: 'users',
        columns: [
          { name: 'id', type: 'int', is_pk: true, is_unique: false, is_nullable: false, is_fk: false },
          { name: 'email', type: 'varchar(255)', is_pk: false, is_unique: true, is_nullable: false, is_fk: false },
        ],
      },
      {
        id: 'posts',
        name: 'posts',
        columns: [
          { name: 'id', type: 'int', is_pk: true, is_unique: false, is_nullable: false, is_fk: false },
          { name: 'user_id', type: 'int', is_pk: false, is_unique: false, is_nullable: false, is_fk: true },
        ],
      },
    ];

    const mockRels: Relationship[] = [
      {
        id: 'rel_posts_user_id_users_id',
        source_table: 'posts',
        source_column: 'user_id',
        target_table: 'users',
        target_column: 'id',
        type: 'one_to_many',
      },
    ];

    it('generates valid PostgreSQL DDL with ALTER TABLE constraints', () => {
      const sql = generateSqlDdlClient(mockTables, mockRels, 'postgres');
      expect(sql).toContain('CREATE TABLE "users"');
      expect(sql).toContain('PRIMARY KEY ("id")');
      expect(sql).toContain('CREATE TABLE "posts"');
      expect(sql).toContain('ALTER TABLE "posts" ADD CONSTRAINT "fk_posts_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;');
    });

    it('generates valid MySQL DDL with backtick quotes', () => {
      const sql = generateSqlDdlClient(mockTables, mockRels, 'mysql');
      expect(sql).toContain('CREATE TABLE `users`');
      expect(sql).toContain('`email` VARCHAR(255) NOT NULL UNIQUE');
      expect(sql).toContain('ALTER TABLE `posts` ADD CONSTRAINT `fk_posts_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)');
    });

    it('generates SQLite DDL with inline FOREIGN KEY definitions', () => {
      const sql = generateSqlDdlClient(mockTables, mockRels, 'sqlite');
      expect(sql).toContain('CREATE TABLE "posts"');
      expect(sql).toContain('FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE');
      expect(sql).not.toContain('ALTER TABLE');
    });
  });

  describe('parseSqlDdlClient', () => {
    it('parses CREATE TABLE statements into diagram tables and relationships', () => {
      const sql = `
CREATE TABLE users (
    id INT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE orders (
    id INT PRIMARY KEY,
    user_id INT,
    total DECIMAL(10, 2),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
`;
      const result = parseSqlDdlClient(sql);
      expect(result.tables).toHaveLength(2);
      expect(result.tables.map((t) => t.name)).toContain('users');
      expect(result.tables.map((t) => t.name)).toContain('orders');

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].source_table).toBe('orders');
      expect(result.relationships[0].source_column).toBe('user_id');
      expect(result.relationships[0].target_table).toBe('users');
      expect(result.relationships[0].target_column).toBe('id');
    });
  });

  describe('generateMermaidErDiagram', () => {
    it('generates valid Mermaid erDiagram syntax with relationships and columns', () => {
      const tables: Table[] = [
        {
          id: 'users',
          name: 'users',
          columns: [
            { name: 'id', type: 'int', is_pk: true, is_fk: false, is_unique: false, is_nullable: false },
            { name: 'email', type: 'varchar(255)', is_pk: false, is_fk: false, is_unique: true, is_nullable: false },
          ],
        },
        {
          id: 'posts',
          name: 'posts',
          columns: [
            { name: 'id', type: 'int', is_pk: true, is_fk: false, is_unique: false, is_nullable: false },
            { name: 'user_id', type: 'int', is_pk: false, is_fk: true, is_unique: false, is_nullable: false },
          ],
        },
      ];

      const relationships: Relationship[] = [
        {
          id: 'rel1',
          source_table: 'posts',
          source_column: 'user_id',
          target_table: 'users',
          target_column: 'id',
        },
      ];

      const mermaid = generateMermaidErDiagram(tables, relationships);
      expect(mermaid).toContain('erDiagram');
      expect(mermaid).toContain('users ||--o{ posts : "user_id -> id"');
      expect(mermaid).toContain('users {');
      expect(mermaid).toContain('int id PK');
      expect(mermaid).toContain('varchar_255_ email UK');
      expect(mermaid).toContain('posts {');
      expect(mermaid).toContain('int user_id FK');
    });
  });

  describe('encodeDraftToHash and decodeDraftFromHash', () => {
    it('round-trips draft schema text accurately through URL-safe hash', () => {
      const text = `users\n  id int pk\n  email varchar unique\n\nposts\n  id int pk\n  user_id int -> users.id`;
      const encoded = encodeDraftToHash(text);
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');

      const decoded = decodeDraftFromHash(encoded);
      expect(decoded).toBe(text);
    });
  });

  describe('Table color coding & syncTableColorInDraft', () => {
    it('parses [color: ...] and [headercolor: ...] tags on table headers', () => {
      const draft = `
users [color: blue]
  id int pk

invoices [amber]
  id uuid pk

Table audit_logs [headercolor: #e11d48] {
  id int pk
}
`;
      const result = parseDraftTextClient(draft);
      expect(result.tables).toHaveLength(3);
      expect(result.tables[0].color).toBe('blue');
      expect(result.tables[1].color).toBe('amber');
      expect(result.tables[2].color).toBe('rose');
    });

    it('syncs table color tags two-way in shorthand draft text', () => {
      const initial = `users\n  id int pk\n\nposts\n  id int pk`;
      const colored = syncTableColorInDraft(initial, 'users', 'blue');
      expect(colored).toContain('users [color: blue]');

      const updated = syncTableColorInDraft(colored, 'users', 'rose');
      expect(updated).toContain('users [color: rose]');
      expect(updated).not.toContain('blue');

      const reset = syncTableColorInDraft(updated, 'users', 'emerald');
      expect(reset).toBe(initial);
    });
  });

  describe('generatePrismaSchema', () => {
    it('generates valid Prisma schema with models, @@map, and disambiguated multi-FK relations', () => {
      const draft = `
wallets
  id uuid pk
  balance decimal(18,4) not null

order_items
  order_id int pk
  product_id int pk

transactions
  id uuid pk
  sender_wallet_id uuid not null -> wallets.id
  recipient_wallet_id uuid not null -> wallets.id
  created_at timestamp not null
`;
      const { tables, relationships } = parseDraftTextClient(draft);
      const prisma = generatePrismaSchema(tables, relationships);

      expect(prisma).toContain('datasource db {');
      expect(prisma).toContain('generator client {');
      expect(prisma).toContain('model Wallets {');
      expect(prisma).toContain('id String @id @default(uuid()) @db.Uuid');
      expect(prisma).toContain('@@map("wallets")');
      expect(prisma).toContain('@@id([order_id, product_id])');
      expect(prisma).toContain('@relation("transactions_sender_wallet_id_to_wallets"');
      expect(prisma).toContain('@relation("transactions_recipient_wallet_id_to_wallets"');
      expect(prisma).toContain('@default(now())');
    });
  });

  describe('generateDbmlSchema', () => {
    it('generates valid DBML with headercolor, column constraints, composite PKs, and Refs', () => {
      const tables: Table[] = [
        {
          id: 'users',
          name: 'users',
          color: 'blue',
          columns: [
            { name: 'id', type: 'int', is_pk: true, is_nullable: false, is_unique: false },
            { name: 'email', type: 'varchar(255)', is_pk: false, is_nullable: false, is_unique: true },
          ],
        },
        {
          id: 'posts',
          name: 'posts',
          columns: [
            { name: 'id', type: 'int', is_pk: true, is_nullable: false, is_unique: false },
            { name: 'user_id', type: 'int', is_pk: false, is_nullable: false, is_unique: false, is_fk: true },
          ],
        },
      ];
      const relationships: Relationship[] = [
        {
          id: 'rel1',
          source_table: 'posts',
          source_column: 'user_id',
          target_table: 'users',
          target_column: 'id',
        },
      ];

      const dbml = generateDbmlSchema(tables, relationships);
      expect(dbml).toContain('Table users [headercolor: #0284c7] {');
      expect(dbml).toContain('id int [pk]');
      expect(dbml).toContain('email varchar(255) [unique, not null]');
      expect(dbml).toContain('Ref: posts.user_id > users.id [delete: cascade]');
    });
  });
});
