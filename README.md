# ⚡ Text2ERD

> **Draft database tables in plain text. Watch them turn into an interactive, draggable Entity-Relationship Diagram. Link relationships with a click, export clean SQL, and walk away. No accounts, no paywalls, zero friction.**

[![Live Demo](https://img.shields.io/badge/Demo-text2erd.vercel.app-emerald.svg)](https://text2erd.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg)](https://tailwindcss.com/)
[![Buy Me A Coffee](https://img.shields.io/badge/Donate-Buy%20Me%20A%20Coffee-yellow.svg)](https://www.buymeacoffee.com/)

**🌐 Live Web App & Marketing Page:** [https://text2erd.vercel.app](https://text2erd.vercel.app)

---

## 🎯 Why Text2ERD?

Most online database visualizers force you through a grueling funnel:
- ❌ *"Sign up with your work email"*
- ❌ *"Free tier limited to 10 tables"*
- ❌ *"Pay \$15/month to export SQL or invite a teammate"*
- ❌ *"Only one-way code-to-diagram (cannot edit or connect on the visual canvas)"*

**Text2ERD is built with a simple philosophy:**
1. **No Login Required**: Open the app and start typing immediately.
2. **No Strings Attached**: No telemetry tracking your schema, no email spam, no cloud lock-in.
3. **True Two-Way Editing**: Type shorthand notes in the editor **or** drag handles and click `+ Add Column` directly on the visual table cards.
4. **1-Click SQL Export**: PostgreSQL, MySQL, and SQLite. Copy to clipboard or download `.sql`.
5. **Completely Ephemeral**: Close the tab and your session resets. Your schemas never touch a persistent server database.

---

## ✨ Features

- **⚡ Instant Shorthand Drafting & Color Coding**: Write intuitive table definitions with optional `[color: ...]` domain tags:
  ```text
  users [color: blue]
    id int pk
    email varchar(255) unique not null
    name varchar(100)
    created_at timestamp

  posts [color: amber]
    id int pk
    user_id int -> users.id
    title varchar(200) not null
    content text
  ```
- **🖱️ Interactive Drag & Drop Canvas**: Powered by `@xyflow/react` (React Flow v12). Drag tables anywhere on an infinite dot-grid canvas, or freeze layout with **Canvas Lock**.
- **🎨 Table Color Coding**: Pick from 8 curated color palettes directly on table cards (with automatic two-way sync to shorthand draft, `#draft` share links, DBML `headercolor`, and MiniMap).
- **🔍 Quick Search & Table Filter (`Cmd+K` / `Ctrl+K`)**: Instant command palette to search tables, columns, and data types, filter by color group, and auto-focus + highlight target tables on the canvas.
- **🖼️ High-Res PNG & Vector SVG Export**: Capture crisp 2x/3x Retina `.png` or scalable `.svg` diagram snapshots (with Light, Clean White, or Transparent backgrounds) for PRs, RFCs, and docs.
- **📤 Multi-Format Schema Export**: Export clean **PostgreSQL**, **MySQL**, **SQLite**, **Prisma** (`schema.prisma`), **DBML** (`schema.dbml`), and **Mermaid ERD** (`erDiagram`).
- **🔗 Visual Column-to-Column Linking**: Drag a connection line directly from `posts.user_id` to `users.id` to establish foreign key constraints visually.
- **🛠️ Direct Canvas Editing**: Click to rename tables inline, add new columns with types and primary key toggles, or delete tables.
- **🪄 1-Click Auto-Layout**: Integrated `dagre` algorithm to automatically untangle and arrange complex diagrams neatly.
- **📥 SQL DDL File & Text Import**: Upload `.sql` / `.ddl` files via drag-and-drop or paste standard `CREATE TABLE` and `ALTER TABLE` statements (with built-in 500 KB file size and 150-table guardrails).
- **📱 Mobile-Responsive Studio**: Seamless segmented switcher between the **Draft Editor** and **Diagram Canvas** on phones and tablets.
- **📋 Starter Templates**: 1-click presets for *E-Commerce*, *Blog & Social*, *Project Management*, *SaaS & Billing*, and *FinTech & Ledger*.

---

## 🏗️ Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, `@xyflow/react` (React Flow v12), `dagre`, `html-to-image`, `@fortawesome/react-fontawesome`.
- **Backend**: Python 3.11+, Django 5.2, Django REST Framework, `sqlparse`, `django-cors-headers` (with 100% client-side parser & exporter fallback for zero-backend static hosting on Vercel).
- **Stateless & Protected Design**: The backend runs purely in-memory (`DATABASES = :memory:`) with IP-based rate limiting (`AnonRateThrottle`) and payload/table size caps to protect public deployments.

---

## 🚀 Quickstart (Run Locally)

### Prerequisites
- Node.js 18+
- Python 3.10+

### 1. Clone the repository
```bash
git clone git@github.com:OrganicEgg/text2erd.git
cd text2erd
```

### 2. Start the Backend API (Django DRF)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8000
```

### 3. Start the Frontend (React 19 + Vite)
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🌐 Deployment

### Deploying Frontend to Vercel / Netlify
The frontend is a standard Vite application:
```bash
cd frontend
npm run build
```
Point Vercel or Netlify root directory to `frontend` with build command `npm run build` and output directory `dist`.

### Deploying Backend to Render / Fly.io / Railway
Set the start command to:
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

Supported environment variables for production hardening:
- `DJANGO_SECRET_KEY`: Production secret key
- `DJANGO_DEBUG`: Set to `False` in production
- `DJANGO_ALLOWED_HOSTS`: Comma-separated allowed hostnames (e.g. `api.text2erd.com`)
- `CORS_ALLOWED_ORIGINS`: Comma-separated frontend origins (e.g. `https://text2erd.vercel.app`)
- `API_THROTTLE_RATE`: Rate limit per IP (default: `60/min`)
- `MAX_IMPORT_SQL_BYTES`: Max SQL import size in bytes (default: `512000` / 500 KB)
- `MAX_DRAFT_TEXT_BYTES`: Max shorthand draft size in bytes (default: `204800` / 200 KB)
- `MAX_TABLES_LIMIT`: Max tables per diagram (default: `150`)

---

## 💛 Support & Donations (100% Optional)

Text2ERD is **100% free and open-source under the MIT License**. 

There are no premium paywalls or hidden fees. If this tool saved you time or helped you design your database faster, feel free to show some love:

- ⭐ **Star this repository on GitHub**
- ☕ **[Buy Me a Coffee](https://www.buymeacoffee.com/)** *(Optional, never required!)*

---

## 📄 License

Distributed under the [MIT License](LICENSE). Free for personal and commercial use.
