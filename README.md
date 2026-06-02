# Expense Tracker Mini

A small full-stack expense tracker. Each user signs up with email + password,
logs in to get a JWT, and can create / view / delete **only their own**
expenses, with a per-user spending summary.

This is **Phase 1 (local app only)**. Docker and CI/CD are intentionally **not**
included yet — they will be added in a later phase.

## Features

- Email/password registration and login (JWT auth).
- Expenses scoped per user (you only ever see and delete your own).
- Create and delete expenses (title, amount, category, date, note).
- Summary: total spent, expense count, totals by category, top category.
- Search expenses by title and filter by category.
- Money formatted as JPY (e.g. `¥1,200`).
- Public health-check endpoint.
- Clean, responsive UI with SCSS.

## Tech Stack

| Layer    | Tech                                                     |
| -------- | -------------------------------------------------------- |
| Backend  | Django, Django REST Framework, SimpleJWT                 |
| Auth     | JWT (`djangorestframework-simplejwt`)                    |
| Frontend | React + Vite (JavaScript, no TypeScript)                 |
| Styling  | SCSS (`sass`)                                            |
| Database | PostgreSQL                                               |

## Project Structure

```
expense-tracker-mini/
├── backend/     # Django + DRF API
└── frontend/    # React + Vite app
```

---

## 1. Set up PostgreSQL (local)

Make sure PostgreSQL is installed and running, then create the database and user.
Using `psql` as a superuser (e.g. `postgres`):

```sql
CREATE DATABASE expense_tracker;
CREATE USER expense_user WITH PASSWORD 'expense_password';
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO expense_user;

-- PostgreSQL 15+: also grant schema privileges so the user can create tables
\c expense_tracker
GRANT ALL ON SCHEMA public TO expense_user;
```

These values match `backend/.env.example`. Adjust if you use different ones.

---

## 2. Run the backend

```bash
cd backend

# Create & activate a virtual environment
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env from the example and edit if needed
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux

# Apply migrations
python manage.py makemigrations
python manage.py migrate

# (optional) create an admin user for /admin/
python manage.py createsuperuser

# Run the dev server
python manage.py runserver
```

Backend runs at `http://localhost:8000`.

> On Windows, if `python` opens the Microsoft Store, use the `py` launcher
> instead (e.g. `py -m venv .venv`, `py manage.py runserver`).

---

## 3. Run the frontend

In a second terminal:

```bash
cd frontend

# Install dependencies (this also installs sass for SCSS)
npm install

# Create your .env from the example
copy .env.example .env         # Windows
# cp .env.example .env         # macOS / Linux

# Start the dev server
npm run dev
```

Frontend runs at `http://localhost:5173` and talks to the API at
`VITE_API_BASE_URL` (default `http://localhost:8000/api`).

---

## Auth API Endpoints

| Method | Endpoint                   | Auth | Body                                   |
| ------ | -------------------------- | ---- | -------------------------------------- |
| POST   | `/api/auth/register/`      | No   | `email`, `password`, `password_confirm`|
| POST   | `/api/auth/login/`         | No   | `email`, `password`                    |
| POST   | `/api/auth/token/refresh/` | No   | `refresh`                              |
| GET    | `/api/auth/me/`            | Yes  | —                                      |

`login` returns `access`, `refresh`, and `user` (`id`, `email`).

## Expense API Endpoints

| Method | Endpoint               | Auth | Notes                                  |
| ------ | ---------------------- | ---- | -------------------------------------- |
| GET    | `/api/expenses/`       | Yes  | Only the current user's expenses       |
| POST   | `/api/expenses/`       | Yes  | `user` is set from the token, not body |
| DELETE | `/api/expenses/<id>/`  | Yes  | Only the owner can delete              |
| GET    | `/api/summary/`        | Yes  | Aggregates for the current user        |
| GET    | `/api/health/`         | No   | Returns `{"status": "ok"}`             |

Expense fields: `title`, `amount` (> 0), `category`
(`food`, `transport`, `study`, `shopping`, `entertainment`, `other`),
`spent_date`, optional `note`.

Summary returns: `total_spent`, `expense_count`, `totals_by_category`,
`top_category`.

---

## Running tests

```bash
cd backend
python manage.py test
```

This runs the `accounts` and `expenses` test suites.

---

## Roadmap

- **Phase 2:** Add `Dockerfile`s for backend and frontend.
- **Phase 3:** Add `docker-compose` for the full local stack (incl. PostgreSQL).
- **Phase 4:** Add CI/CD pipeline.

> Docker and CI/CD are **not** part of this phase — the goal here is a working
> local app first.
