# LlamaSolutions

A team chatbot for class and lab use. It is a **Next.js** app based on the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template, with **Neon** (Postgres) + **Auth.js** for cloud-saved chats, and **LM Studio** for local / school-hosted models.

This GitHub page is **only the source code**. Opening the repository in a browser is **not** the app. You must run it locally (usually on campus Wi‑Fi) so your machine can reach the school LM Studio server.

| App (after you start it) | Not the app |
| --- | --- |
| [http://localhost:3000](http://localhost:3000) | This GitHub README / repo page |

---

## What is on `main` now

After you sign in, you get:

- **Voice in / out** — microphone dictation into the composer, and speak-back of the latest assistant reply
- **Model picker + connection status** — header shows the current model and a **green** / **red** status dot
- **Export** — download the current chat as Markdown (`.md`) or JSON (`.json`)
- **Sidebar** — **New chat**, rename a chat (`…` → **Rename**), **Delete All Chats**
- **Local incognito vs Cloud sync** — header toggle
  - **Cloud sync** (default): chats are written to Neon
  - **Local incognito**: chats stay in this browser (IndexedDB); the server still talks to LM Studio but **skips Neon writes**

---

## Run from zero (school lab PC)

Windows + VS Code is fine. Commands below use PowerShell or Command Prompt.

### 1. Clone and open the app folder

```bash
git clone https://github.com/siqiwang-53/LlamaSolutions.git
cd LlamaSolutions/chatbot
```

The Next.js app lives in **`chatbot/`**, not the repo root.

### 2. Environment file (no secrets in this README)

```bash
copy .env.example .env.local
```

On macOS / Linux:

```bash
cp .env.example .env.local
```

`.env.example` already documents the Neon, Auth.js, and LM Studio variables. **Do not commit `.env.local`.** Do not paste real passwords or connection strings into Slack, email, or this README.

If you already have a teammate’s working `.env.local`, copy that file locally instead of inventing values.

### 3. Point LM Studio at the right host

| Where you are | `LMSTUDIO_BASE_URL` | Notes |
| --- | --- | --- |
| **School / campus Wi‑Fi** | `http://10.118.0.111:1234/v1` | Shared lab server. **Do not** use `127.0.0.1` unless **you** started LM Studio on **this** PC. |
| **Home** | `http://127.0.0.1:1234/v1` | You must start **LM Studio** on your own machine, load a model, and turn on the local server. |

The checked-in `.env.example` already uses the school URL. At home, edit `.env.local` only.

### 4. Install and start

From `chatbot/`:

```bash
corepack enable
corepack prepare pnpm@10.32.1 --activate
pnpm install
pnpm dev
```

**Windows + another drive (for example `D:\`) and `corepack enable` fails with `EPERM`:** skip Corepack and use:

```bat
npx.cmd --yes pnpm@10.32.1 install
npx.cmd --yes pnpm@10.32.1 dev
```

Then open **[http://localhost:3000](http://localhost:3000)**.

### 5. Read the status dot before you chat

- **Green** — the app can reach LM Studio (`GET /api/lmstudio` succeeded). You can send messages.
- **Red** — the model is not reachable. Chat will fail until you fix the URL, campus network, or local LM Studio.

The GitHub website cannot talk to `10.118.0.111`. You have to run `pnpm dev` (or the `npx.cmd` equivalent) **on a machine that is on campus Wi‑Fi** (or on a machine that can reach that IP).

---

## Try each feature

1. **Sign in** with the guest / Auth.js flow the template already uses.
2. **Type or dictate** a message. The **mic** fills the input; it does **not** auto-send. Press **Send** yourself.
3. **Speak-back** — use the speaker control on the latest assistant message (Chrome / Edge).
4. **Model picker** — change the selected model in the header; watch the green / red dot.
5. **Export** — header **Export** → Markdown or JSON.
6. **Rename** — sidebar chat row → **`…`** → **Rename**.
7. **New chat / Delete all** — sidebar **New chat**, or **Delete All Chats** (with confirm).
8. **Local incognito** — switch the header toggle. New replies stay in this browser and are **not** written to Neon. **Cloud sync** writes chats to the database again.

---

## Speech (mic + speak-back)

- Works on **`http://localhost`** or **HTTPS**. A random LAN IP over plain HTTP often blocks the microphone.
- Use **Chrome** or **Edge**. Allow the microphone when the browser asks.
- The mic is dictation only; you still click send.

---

## Optional: database migrate

If the UI loads but cloud chats error on first save, from `chatbot/` run:

```bash
npx.cmd --yes pnpm@10.32.1 db:migrate
```

(or `pnpm db:migrate` if Corepack/pnpm already works). You still need a valid `POSTGRES_URL` in `.env.local` — take it from `.env.example` or your teammate, **not** from this README.

---

## Project layout

| Path | What it is |
| --- | --- |
| [`README.md`](./README.md) | **This file** — classmate / teammate setup + feature guide |
| [`chatbot/`](./chatbot/) | Next.js app (run commands here) |
| [`chatbot/README.md`](./chatbot/README.md) | Upstream Vercel template notes (not the getting-started guide) |
| [`chatbot/.env.example`](./chatbot/.env.example) | Env variable names and placeholders — copy to `.env.local` |

---

## Extra (not required for class)

Some teammates expose a home LM Studio with a Cloudflare named tunnel (`trycloudflare.com`). That is optional. For school labs, prefer `10.118.0.111` on campus Wi‑Fi.
