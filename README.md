# Tuda Backend

Backend service for the Tuda mobile application.

## Stack

* Python 3.13
* FastAPI
* PostgreSQL
* SQLAlchemy
* Alembic
* Docker

## Local Development

### 1. Create environment file

Create `.env` from `.env.example`.

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/tuda
```

### 2. Create virtual environment

```bash
py -3.13 -m venv .venv
```

Activate it:

```bash
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run migrations

```bash
alembic upgrade head
```

### 5. Start server

```bash
uvicorn app.main:app --reload
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

## Docker

Build and start containers:

```bash
docker compose up --build
```

Stop containers:

```bash
docker compose down
```

Run migrations inside container:

```bash
docker compose exec backend alembic upgrade head
```
