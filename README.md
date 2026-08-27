### Stack

```text
Frontend: Next.js / Vercel Chatbot
DB ORM:   Drizzle
Database: PostgreSQL (Neon)
Auth:     Auth.js
AI:       LM Studio (future)
```

```
```

# Local Development Setup — Vercel Chatbot + Neon + LMStudio

This project uses the **Vercel Chatbot** template as the frontend/application framework. The long-term goal is to connect it to a self-hosted LLM through **LM Studio**.

For now, this guide covers getting the chatbot running locally and connecting its PostgreSQL database through **Neon**.

---

## 1. Prerequisites

You should have:

- Node.js installed
- pnpm installed
- A Neon account

## 2. Use pnpm, Not npm

The Vercel Chatbot project uses pnpm.

From the project directory:

```powershell
pnpm install
```
Then:

```powershell
pnpm install
```

### Windows Corepack issue

```from powershell as administrator
corepack enable
```
```
corepack prepare pnpm@10.32.1 --activate
```

## 3. Environment Variables

Create:

```text
.env.local
```

You should be able to just copy the .env.example file but here's info about each field

in the root of the project:

```text
D:\LlamaSolutions\chatbot\.env.local
```

The file should contain:

```env
# Auth.js
AUTH_SECRET=YOUR_RANDOM_SECRET # link to generate: https://generate-secret.vercel.app/32

# PostgreSQL / Neon
POSTGRES_URL=YOUR_NEON_POSTGRES_CONNECTION_STRING  # Find it here: https://console.neon.tech/app/projects/solitary-dust-07252132 | Click on llamasolutions project (recent one) and click connect

# Vercel AI Gateway
# Not needed while replacing the AI backend with LM Studio
AI_GATEWAY_API_KEY=

# Vercel Blob
# Only required if using Blob functionality
BLOB_READ_WRITE_TOKEN=

# Redis
# Only required if using Redis functionality
REDIS_URL=

LMSTUDIO_BASE_URL=http://127.0.0.1:1234/v1
LMSTUDIO_API_KEY="Anything"    //Models don't need a key by default on lmstudio
LMSTUDIO_MODEL="smollm2-135m-instruct"  //Change this to the id of locally running model
```

### AUTH_SECRET

Generate a random secret.

Click the link provided to generate a secret and paste it in

# 4. PostgreSQL: Use Neon

For this project, **Neon is the best balance of ease and long-term scalability**.
---
# 6. Get the Neon Connection String

In the Neon dashboard, click **Connect**.

Copy the PostgreSQL connection string:

Example:

```text
postgresql://username:password@ep-example-123456.region.aws.neon.tech/neondb?sslmode=require
```


Do not share this publicly.

Add it to `.env.local`:

```env
POSTGRES_URL=postgresql://username:password@ep-example-123456.region.aws.neon.tech/neondb?sslmode=require
```

❌ Do NOT use local Postgres unless intentionally running it:

```env
POSTGRES_URL=postgresql://localhost:5432/database
```

---

# LMStudio setup
<img width="2384" height="602" alt="image" src="https://github.com/user-attachments/assets/3c1ae4b5-efdb-4b2f-a0a3-7b562794c3be" />

- Ensure Server status is running
**In .env.local:**
- LMSTUDIO_MODEL (This example is using: smollm2-135m-instruct)
- LMSTUDIO_BASE_URL: http://127.0.0.1:1234 (local model) or http://10.118.0.111:1234 (Remote server model)- currently only works when on the Otago polytechnic network

# 7.Database Migrations

The chatbot requires database tables before it can function.

Run:

```powershell
pnpm db:migrate
```

It will create the required schema in Neon.

A successful run completes without connection errors.

---

# 8. Start the Development Server

After setup:

```powershell
pnpm dev
```

Open:

```text
http://localhost:3000
```

---

# 9. Current Architecture

```text
┌──────────────────────────┐
│      Web Browser         │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│ Vercel Chatbot / Next.js │
└────────────┬─────────────┘
             │
       ┌─────┴─────┐
       │           │
       v           v
    Auth.js     Drizzle
                   │
                   v
              PostgreSQL
                   │
                   v
                  Neon
```

---

# 10. LM Studio (Future Step)

Later, the AI backend will be replaced with **LM Studio**.

```text
┌──────────────────────────┐
│      Web Browser         │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│ Vercel Chatbot / Next.js │
└────────────┬─────────────┘
             │
       ┌─────┴──────┐
       │            │
       v            v
    Drizzle      AI SDK
       │            │
       v            v
     Neon       LM Studio
                Local LLM
```


---

# Quick Reference

### Start project

```powershell
cd D:\LlamaSolutions\chatbot
pnpm install
pnpm dev
```

### Migrate database

```powershell
pnpm db:migrate
```

### Environment file

```env
AUTH_SECRET=YOUR_RANDOM_SECRET
POSTGRES_URL=YOUR_NEON_CONNECTION_STRING

AI_GATEWAY_API_KEY=
BLOB_READ_WRITE_TOKEN=
REDIS_URL=
```



