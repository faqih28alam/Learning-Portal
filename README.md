# 🎓 Learning Portal — AI-Powered Essay Scoring

An intelligent web application that automatically scores essay answers using **semantic similarity**. Teachers create questions with answer keys, students submit answers, and an NLP microservice instantly grades responses based on meaning — not just keyword matching.

---

## ✨ Features

- 📝 **Teachers** create essay questions with reference answer keys
- 🎓 **Students** submit answers and receive instant AI-powered scores
- 🧠 **Semantic scoring** via sentence embeddings — understands meaning, not just words
- 📊 **Teacher dashboard** shows all submissions with score statistics per question
- 🔐 **JWT authentication** with role-based access control (teacher / student)
- ⚡ **Sub-second scoring** using pretrained MiniLM model (~80ms per inference)

---

## 🏗️ Project Structure

```
learning-portal/
├── docker-compose.yml          # Orchestrates all 3 services
├── .env                        # Environment variables (see setup)
│
├── backend/                    # Go REST API
│   ├── Dockerfile
│   ├── main.go
│   ├── go.mod
│   ├── config/
│   │   └── db.go               # PostgreSQL connection + retry
│   ├── handlers/
│   │   ├── auth.go             # Register, Login, Me
│   │   └── question.go         # Question CRUD, Submit, Submissions
│   ├── middleware/
│   │   └── jwt.go              # JWT generation + auth/role guards
│   ├── models/
│   │   ├── user.go             # User entity (teacher | student)
│   │   ├── question.go         # Question entity
│   │   └── submission.go       # Submission entity with score
│   ├── routes/
│   │   └── routes.go           # All API route definitions
│   └── utils/
│       └── response.go         # Validation error helper
│
├── nlp-service/                # Python NLP microservice
│   ├── Dockerfile
│   ├── main.py                 # FastAPI app + /score endpoint
│   └── requirements.txt
│
└── frontend/                   # Next.js web app
    ├── Dockerfile
    ├── next.config.js
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx             # Redirects to /login
    │   ├── login/page.tsx
    │   ├── register/page.tsx
    │   ├── questions/
    │   │   ├── page.tsx         # Student: question list
    │   │   └── [id]/page.tsx    # Student: answer form + score
    │   └── dashboard/
    │       ├── page.tsx         # Teacher: manage questions
    │       └── questions/[id]/submissions/page.tsx
    ├── components/
    │   ├── NavBar.tsx
    │   ├── ScoreBadge.tsx       # Animated score ring
    │   ├── Skeleton.tsx         # Loading skeleton components
    │   └── Toast.tsx            # Success/error notifications
    └── lib/
        ├── api.ts               # Axios instance + all API calls
        └── auth.ts              # JWT session helpers
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** (App Router) | React framework with SSR |
| **TypeScript** | Type safety across components |
| **Tailwind CSS** | Utility-first styling |
| **Axios** | HTTP client with JWT interceptors |

### Backend
| Technology | Purpose |
|------------|---------|
| **Go 1.21** | High-performance REST API |
| **Gin** | HTTP web framework |
| **GORM** | ORM for PostgreSQL |
| **golang-jwt** | JWT generation & validation |
| **bcrypt** | Password hashing |

### NLP Microservice
| Technology | Purpose |
|------------|---------|
| **Python 3.11** | Runtime |
| **FastAPI** | Lightweight API framework |
| **Sentence Transformers** | Sentence embedding library |
| **all-MiniLM-L6-v2** | Pretrained semantic similarity model |
| **scikit-learn** | Cosine similarity computation |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **PostgreSQL 16** | Relational database |
| **Docker + Docker Compose** | Containerized multi-service setup |

---

## 🔄 Architecture

```
Browser (Next.js :3000)
        │
        │ REST API calls
        ▼
Go API — Gin (:8080)
        │
        ├── PostgreSQL (:5432)    — stores users, questions, submissions
        │
        └── HTTP POST /score
                │
                ▼
        Python NLP Service (:5000)
                │
                ▼
        all-MiniLM-L6-v2
        Cosine Similarity (0.0 – 1.0)
```

### Scoring Flow

```
Student submits answer
        │
Go loads question.answer_key from DB
        │
Go POST → Python /score { answer_key, student_answer }
        │
Python encodes both texts → sentence embeddings
        │
cosine_similarity(embedding_A, embedding_B) → 0.0–1.0
        │
Go saves Submission(score) to DB
        │
Frontend displays animated score ring
```

---

## ⚙️ Prerequisites

Make sure the following are installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Git](https://git-scm.com/)

For local development without Docker:
- [Go 1.21+](https://go.dev/dl/)
- [Node.js 20+](https://nodejs.org/)
- [Python 3.11+](https://www.python.org/)
- [PostgreSQL 16+](https://www.postgresql.org/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/learning-portal.git
cd learning-portal
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Or create it manually:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=essay_user
DB_PASSWORD=secret123
DB_NAME=essay_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# App
PORT=8080
```

> ⚠️ **Never commit `.env` to version control.** It is already listed in `.gitignore`.

### 3. Run with Docker Compose

```bash
docker compose up --build
```

This will:
1. Start **PostgreSQL** and wait for it to be ready
2. Build and start the **Go API** — auto-migrates the DB schema on boot
3. Build and start the **Python NLP service** — downloads the MiniLM model (~80MB) into the image
4. Build and start the **Next.js frontend**

> 🕐 First build takes **3–5 minutes** (model download + Go/Node dependency install).
> Subsequent builds are fast due to Docker layer caching.

### 4. Open the App

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Go API** | http://localhost:8080 |
| **NLP Service** | http://localhost:5000 |

---

## 🧪 Verify Services Are Running

```bash
# Go backend
curl http://localhost:8080/health
# → {"status":"ok","service":"essay-backend"}

# Python NLP service
curl http://localhost:5000/health
# → {"status":"ok","model":"all-MiniLM-L6-v2"}

# Test scoring directly
curl -X POST http://localhost:5000/score \
  -H "Content-Type: application/json" \
  -d '{
    "answer_key": "Photosynthesis converts sunlight into glucose using carbon dioxide and water.",
    "student_answer": "Plants use sunlight and CO2 to produce food through photosynthesis."
  }'
# → {"score":0.8412,"score_percent":84.12,"label":"Good"}
```

---

## 👤 Usage

### As a Teacher

1. Go to `http://localhost:3000/register`
2. Register with role **Teacher**
3. You'll be redirected to `/dashboard`
4. Click **+ New Question** to create a question with an answer key
5. Click **Submissions** on any question to view student scores

### As a Student

1. Go to `http://localhost:3000/register`
2. Register with role **Student**
3. You'll be redirected to `/questions`
4. Click a question, write your answer, and click **Submit & Score**
5. View your animated score and past attempts

---

## 📡 API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/v1/auth/register` | Public | Register a new user |
| `POST` | `/api/v1/auth/login` | Public | Login, returns JWT token |
| `GET` | `/api/v1/me` | Any | Get current user profile |

### Questions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/v1/questions` | Any | List all questions |
| `GET` | `/api/v1/questions/:id` | Any | Get single question |
| `POST` | `/api/v1/questions` | Teacher | Create a question |
| `PUT` | `/api/v1/questions/:id` | Teacher | Update own question |
| `DELETE` | `/api/v1/questions/:id` | Teacher | Delete own question |

### Submissions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/v1/questions/:id/submit` | Student | Submit answer → returns score |
| `GET` | `/api/v1/questions/:id/submissions` | Teacher | View all submissions for a question |
| `GET` | `/api/v1/my-submissions` | Student | View own submission history |

### NLP Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/score` | Score `{ answer_key, student_answer }` → `{ score, score_percent, label }` |

---

## 🏃 Local Development (Without Docker)

### Backend

```bash
cd backend
go mod download
go run main.go
```

> Make sure PostgreSQL is running locally and `.env` has `DB_HOST=localhost`.

### NLP Service

```bash
cd nlp-service
pip install -r requirements.txt
uvicorn main:app --reload --port 5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## 🗄️ Database Schema

```sql
users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR NOT NULL,
  email         VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role          VARCHAR(10) NOT NULL,   -- 'teacher' | 'student'
  created_at    TIMESTAMP,
  deleted_at    TIMESTAMP
)

questions (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR NOT NULL,
  body        TEXT NOT NULL,
  answer_key  TEXT NOT NULL,           -- never exposed to students
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMP,
  deleted_at  TIMESTAMP
)

submissions (
  id           SERIAL PRIMARY KEY,
  question_id  INTEGER REFERENCES questions(id),
  student_id   INTEGER REFERENCES users(id),
  answer_text  TEXT NOT NULL,
  score        DECIMAL(5,4),           -- e.g. 0.8412
  submitted_at TIMESTAMP
)
```

> Schema is managed automatically via **GORM AutoMigrate** on backend startup. No manual SQL needed.

---

## 🐛 Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `CORS blocked` in browser | Backend CORS not configured for port 3000 | Check `main.go` CORS `AllowOrigins` includes `http://localhost:3000` |
| `401 Unauthorized` on every request | JWT not attached to requests | Check `lib/api.ts` axios interceptor |
| `403 Forbidden` on submit | Logged in as teacher trying to submit | Use a student account to submit answers |
| `503 Service Unavailable` on score | Python NLP service not running | Run `docker compose ps` and check `essay_nlp` container |
| Backend crashes on startup | PostgreSQL not ready yet | Backend has a 10-retry loop — wait 20s or restart with `docker compose restart backend` |
| Blank answer form for students | SSR `localStorage` issue (fixed) | Ensure you're using the latest `app/questions/[id]/page.tsx` with `mounted` guard |

---

## 📄 License

MIT