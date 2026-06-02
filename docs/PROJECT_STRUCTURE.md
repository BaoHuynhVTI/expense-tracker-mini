# Expense Tracker Mini — Cấu trúc dự án & cổng dịch vụ

Tài liệu tham chiếu: thư mục, port, biến môi trường, API và route UI.

---

## Tổng quan

| Thành phần | Công nghệ |
|------------|-----------|
| Backend | Django 5 + DRF + SimpleJWT + Gunicorn (Docker) |
| Frontend | React 18 + Vite 6 + SCSS + Recharts |
| Database | PostgreSQL |
| Deploy | Docker Compose tại thư mục gốc dự án |

**Hai môi trường:**

- **Local:** Postgres trên máy, `runserver` + `npm run dev` — không bắt buộc Docker.
- **Production:** `docker compose` trên server (EC2, …).

---

## Cấu trúc thư mục

```text
expense-tracker-mini/
├── docker-compose.yml          # Compose gốc: db + backend + frontend
├── .gitignore
├── README.md
├── docs/
│   └── PROJECT_STRUCTURE.md    # File này
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── entrypoint.sh           # Chờ DB → migrate → Gunicorn
│   ├── .dockerignore
│   ├── .gitattributes          # entrypoint.sh LF
│   ├── .env.example            # Mẫu LOCAL (copy → .env)
│   ├── .env.docker.example     # Mẫu Docker/production
│   ├── .env                    # Local thật (gitignore)
│   ├── .env.docker             # Production thật trên server (gitignore)
│   │
│   ├── config/                 # Django project
│   │   ├── settings.py
│   │   ├── settings_sqlite_test.py
│   │   ├── urls.py             # /admin/, /api/auth/, /api/
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── accounts/               # Đăng ký, đăng nhập, JWT
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── tests.py
│   │
│   └── expenses/               # API nghiệp vụ chính
│       ├── models.py           # Category, Wallet, Expense, Income, Debt, Credit, …
│       ├── views.py
│       ├── serializers.py
│       ├── urls.py
│       ├── utils.py
│       ├── admin.py
│       ├── tests.py
│       └── migrations/
│           ├── 0001_initial.py
│           ├── 0002_debt_debtpayment_incomesource_income.py
│           └── 0003_credit.py
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js          # Dev server port 5173
    ├── Dockerfile              # Build Vite → nginx
    ├── nginx.conf              # SPA fallback
    ├── .dockerignore
    ├── .env.example            # Mẫu LOCAL
    ├── .env.docker.example     # Gợi ý VITE_API_BASE_URL khi build Docker
    ├── .env                    # Local (gitignore)
    ├── dist/                   # Build output (gitignore)
    │
    └── src/
        ├── main.jsx
        ├── route.jsx           # React Router
        ├── global.scss
        ├── _variables.scss
        ├── reset.scss
        ├── context/
        │   └── AuthContext.jsx
        ├── utils/
        │   ├── api.js          # Gọi API + JWT
        │   ├── format.js
        │   ├── errors.js
        │   ├── usePagination.js
        │   └── useMinLoading.js
        ├── components/         # UI tái sử dụng
        │   ├── Header/
        │   ├── DefaultLayout/
        │   ├── Loading/
        │   ├── SummaryCards/
        │   ├── MonthlyChart/
        │   ├── ExpenseForm/, ExpenseList/
        │   ├── IncomeForm/, IncomeList/
        │   ├── DebtForm/, DebtList/, RepayForm/
        │   ├── CreditList/, CreditChargeForm/, CreditPayForm/, CreditCardList/
        │   ├── WalletList/
        │   ├── Modal/, ConfirmDialog/, Pagination/, …
        │   └── …
        └── view/               # Trang (page + hook)
            ├── Authentication/
            ├── Dashboard/
            ├── Expenses/
            ├── Income/
            ├── Debts/
            ├── Credit/
            └── Settings/
```

**Không commit / không đóng gói vào image:** `.venv/`, `node_modules/`, `*.env`, `.env.docker`, `dist/`.

---

## Cổng (ports) & URL

### Local development

| Dịch vụ | Host port | URL truy cập | Ghi chú |
|---------|-----------|--------------|---------|
| PostgreSQL | **5432** | `localhost:5432` | Cài trên máy; data giữ khi reboot |
| Django API | **8000** | http://localhost:8000/api/ | `python manage.py runserver` |
| Django Admin | **8000** | http://localhost:8000/admin/ | |
| Vite (frontend) | **5173** | http://localhost:5173 | `npm run dev` |
| Health check | **8000** | http://localhost:8000/api/health/ | Không cần JWT |

**Frontend → API (local):** `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**Backend (local):** `backend/.env` — `DB_HOST=localhost`, `CORS_ALLOWED_ORIGINS=http://localhost:5173`.

---

### Docker / Production (`docker compose`)

| Service Compose | Container port | Publish ra host | URL từ trình duyệt |
|-----------------|----------------|-----------------|-------------------|
| `db` | 5432 | *(không publish)* | Chỉ mạng Docker nội bộ |
| `backend` | 8000 | **8000** | http://&lt;host&gt;:8000/api/ |
| `frontend` | 80 | **8080** | http://&lt;host&gt;:8080 |

**Biến build frontend:** bắt buộc trong `frontend/.env.docker` (copy từ `.env.docker.example` trên server). Docker build copy file này → `.env.production` cho Vite. Không có fallback localhost trong code.

```env
VITE_API_BASE_URL=http://<HOST>:8000/api
```

Sau khi đổi URL phải `docker compose build frontend --no-cache` rồi `up -d`.

**Backend Docker:** `backend/.env.docker` — `DB_HOST=db` (tên service), `POSTGRES_*` đồng bộ với `DB_*`.

Chạy từ thư mục gốc:

```bash
cd expense-tracker-mini
docker compose up --build -d
```

---

### Sơ đồ port (Docker)

```text
Browser
   │  :8080
   ▼
[ frontend nginx :80 ]
   │
   │  API calls (VITE_API_BASE_URL, từ browser)
   ▼
[ backend Gunicorn :8000 ] ──► [ db PostgreSQL :5432 ]
         ▲                           (volume: pgdata)
         └── DB_HOST=db
```

---

## File môi trường

| File | Môi trường | Commit? |
|------|------------|---------|
| `backend/.env` | Local Django | Không |
| `backend/.env.example` | Mẫu local | Có |
| `backend/.env.docker` | Docker backend + Postgres | Không |
| `backend/.env.docker.example` | Mẫu production | Có |
| `frontend/.env` | Local Vite | Không |
| `frontend/.env.example` | Mẫu local | Có |
| `frontend/.env.docker.example` | Gợi ý URL API khi build | Có |
| `frontend/.env.docker` | `VITE_API_BASE_URL` khi `docker compose build` | Không |

---

## API (prefix `/api/`)

### Auth — `/api/auth/`

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/auth/register/` | Đăng ký |
| POST | `/api/auth/login/` | Đăng nhập → JWT |
| POST | `/api/auth/token/refresh/` | Làm mới token |
| GET | `/api/auth/me/` | User hiện tại (JWT) |

### Expenses app — `/api/`

| Nhóm | Path |
|------|------|
| Health | `GET /api/health/` |
| Categories | `/api/categories/` |
| Income sources | `/api/income-sources/` |
| Wallets | `/api/wallets/` |
| Credits | `/api/credits/`, `/api/credits/activity/` |
| Credit charges / payments | `/api/credit-charges/`, `/api/credit-payments/` |
| Expenses | `/api/expenses/` |
| Incomes | `/api/incomes/` |
| Debts / repayments | `/api/debts/`, `/api/debt-payments/` |
| Summary & stats | `/api/summary/`, `/api/stats/monthly/` |

Hầu hết endpoint cần header: `Authorization: Bearer <access_token>`.

---

## Route UI (React Router)

| Path | Trang |
|------|--------|
| `/` | Dashboard |
| `/expenses` | Chi tiêu (ví / thẻ) |
| `/income` | Thu nhập |
| `/debts` | Nợ |
| `/credit` | Thẻ tín dụng |
| `/settings` | Ví, thẻ, danh mục, nguồn thu |
| `/login` | Đăng nhập / đăng ký |

---

## Docker Compose services

| Service | Image / build | Volume | Restart |
|---------|---------------|--------|---------|
| `db` | `postgres:16-alpine` | `pgdata` | unless-stopped |
| `backend` | `build: ./backend` | — | unless-stopped |
| `frontend` | `build: ./frontend` | — | unless-stopped |

**Entrypoint backend:** đợi Postgres → `migrate --noinput` → Gunicorn (mặc định 2 workers).

---

## Lệnh thường dùng

### Local

```bash
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

### Production (Docker)

```bash
cd expense-tracker-mini
cp backend/.env.docker.example backend/.env.docker
# Chỉnh secret + ALLOWED_HOSTS + CORS + (root) VITE_API_BASE_URL
docker compose up --build -d
docker compose logs -f backend
```

---

## Ghi chú nghiệp vụ (thu / chi)

| Hành động | Tính vào **Spending**? |
|-----------|------------------------|
| Chi ví (`Expense`) | Có |
| Charge thẻ (`CreditCharge`) | Có |
| Trả bill thẻ (`CreditPayment`) | Không (chuyển tiền ví → giảm nợ thẻ) |

`GET /api/summary/` và `GET /api/stats/monthly/` dùng quy tắc trên.

---

*Tài liệu cập nhật theo cấu trúc repo hiện tại. Khi thêm CI/CD (`.github/workflows/`), bổ sung mục Deploy trong file này hoặc `docs/DEPLOY.md`.*
