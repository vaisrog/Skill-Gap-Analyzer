# Skill Gap Analyzer & Learning Roadmap

A web-based application for college students to compare their current technical skills against requirements for target career paths and receive personalized learning roadmaps.

---

## Project Structure Overview

```
x:\Skill-Gap-Analyzer\
├── package.json              # Root package.json with convenient runner scripts
├── README.md                 # Project guide and execution instructions
├── backend/                  # Python Flask REST API
│   ├── app.py                # Main Flask entry point & app factory (Port 5000)
│   ├── config.py             # Database & environment configuration
│   ├── database.py           # SQLAlchemy & JWT extension initializations
│   ├── models.py             # Database ORM models (Users, Skills, Careers, etc.)
│   ├── seed.py               # Database initialization & seed script
│   ├── requirements.txt      # Python backend dependencies
│   ├── .env                  # Environment variables (MySQL & JWT secrets)
│   └── routes/               # API blueprints (auth, careers, skills, resources, users)
└── frontend/                 # React + Vite + Tailwind CSS App
    ├── package.json          # Frontend dependencies & scripts
    ├── vite.config.js        # Vite config with API proxy to Flask (Port 5173)
    ├── tailwind.config.js    # Tailwind CSS styling setup
    └── src/                  # React components, pages, context, and styles
```

---

## Quick Start / How to Run

### Option A: From Project Root (`Skill-Gap-Analyzer/`)

#### 1. Start Frontend Dev Server
```bash
npm run dev
# or
npm run dev:frontend
```
App will run at `http://localhost:5173`.

#### 2. Start Backend Flask API
```bash
npm run dev:backend
# or
python backend/app.py
```
Backend API will run at `http://127.0.0.1:5000`.

---

### Option B: Running Directories Separately

#### Running Backend
```bash
cd backend
python -m pip install -r requirements.txt
python migrate.py
python seed.py
python app.py
```

#### Running Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Default Seeded Credentials

- **Student Account**: `student@skillgap.com` / `Student@12345`
- **Admin Account**: `admin@skillgap.com` / `Admin@12345`

---

## Student workflow through Phase 3

After signing in as a student, use the sidebar to complete this flow:

`Profile → My Skills → Choose Career → Career Requirements → Analyze My Skill Gap`

Skills and the selected career are saved in the database. The analysis is recalculated from the latest saved skills and career requirements whenever it is opened or refreshed; no stale score is stored.

The score is an **estimated skill match**, not a guarantee of employment or job qualification. Phase 3 maps existing core requirements to **Critical (5)** and non-core requirements to **Important (3)**, then calculates weighted requirement satisfaction on the 0–5 proficiency scale.

### Relevant API routes

- `GET /api/skills?search=&category=` and `GET /api/skills/categories`
- `GET|POST /api/student-skills`, `PUT|DELETE /api/student-skills/:entryId`
- `GET /api/careers`, `GET /api/careers/:roleId/requirements`
- `GET|PUT /api/users/target-career`
- `GET /api/analysis` — authenticated, current-student-only skill-gap analysis
