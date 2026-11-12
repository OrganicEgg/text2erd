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

- **⚡ Instant Shorthand Drafting**: Write intuitive table definitions without boilerplate:
  ```text
  users
    id int pk
    email varchar(255) unique not null
    name varchar(100)
    created_at timestamp

  posts
    id int pk
    user_id int -> users.id
    title varchar(200) not null
    content text
  ```
- **🖱️ Interactive Drag & Drop Canvas**: Powered by `@xyflow/react` (React Flow). Drag tables anywhere on an infinite dot-grid canvas.
- **🔗 Visual Column-to-Column Linking**: Drag a connection line directly from `posts.user_id` to `users.id` to establish foreign key constraints visually.
- **🛠️ Direct Canvas Editing**: Click to rename tables inline, add new columns with types and primary key toggles, or delete tables.
- **🪄 1-Click Auto-Layout**: Integrated `dagre` algorithm to automatically untangle and arrange complex diagrams neatly.
- **📥 SQL DDL Import**: Already have an existing SQL dump? Paste standard `CREATE TABLE` and `ALTER TABLE` statements to instantly generate the visual diagram.
- **📤 Dialect-Specific SQL Export**: Formats clean, production-ready DDL for **PostgreSQL**, **MySQL**, and **SQLite**.
- **📋 Starter Templates**: 1-click presets for *E-Commerce*, *Blog & Social*, and *Project Management*.

---

## 🏗️ Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, `@xyflow/react` (React Flow v12), `dagre`, `lucide-react`.
- **Backend**: Python 3.11+, Django 5.2, Django REST Framework, `sqlparse`, `django-cors-headers`.
- **Stateless Design**: The backend runs purely in-memory (`DATABASES = :memory:`). No user data or schema is ever saved to disk.

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

---

## 💛 Support & Donations (100% Optional)

Text2ERD is **100% free and open-source under the MIT License**. 

There are no premium paywalls or hidden fees. If this tool saved you time or helped you design your database faster, feel free to show some love:

- ⭐ **Star this repository on GitHub**
- ☕ **[Buy Me a Coffee](https://www.buymeacoffee.com/)** *(Optional, never required!)*

---

## 📄 License

Distributed under the [MIT License](LICENSE). Free for personal and commercial use.
