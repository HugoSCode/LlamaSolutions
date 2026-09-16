# LlamaSolutions

A team chatbot for class and lab use. It is a **Next.js** app based on the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template, with **Neon** (Postgres) + **Auth.js** for cloud-saved chats.

This GitHub page is **only the source code**. Teachers can use a **public Vercel URL** (cloud models via [Vercel AI Gateway](https://vercel.com/ai-gateway)). Classmates can also run it locally on campus Wi‑Fi with **LM Studio**.

| How you open it | Model backend |
| --- | --- |
| Public Vercel URL (browser, any network) | Vercel AI Gateway — no LM Studio |
| [http://localhost:3000](http://localhost:3000) after `pnpm dev` | LM Studio (school server or your laptop) |

---

## What is on `main` now

After you sign in, you get:

- **Voice in / out** — microphone dictation into the composer, and speak-back of the latest assistant reply
- **Model picker + connection status** — header shows the current model and a **green** / **red** status dot (AI Gateway on Vercel, LM Studio for local `pnpm dev`)
- **Export** — download the current chat as Markdown (`.md`) or JSON (`.json`)
- **Sidebar** — **New chat**, rename a chat (`…` → **Rename**), **Delete All Chats**
- **Local incognito vs Cloud sync** — header toggle
  - **Cloud sync** (default): chats are written to Neon
  - **Local incognito**: chats stay in this browser (IndexedDB); the server still talks to the model but **skips Neon writes**
- **Live web search** — news, stock prices, weather, and Google-style lookups via [Serper](https://serper.dev) (needs `SERPER_API_KEY`)

---

## Public Vercel deploy (teachers / shared URL)

Vercel cannot reach the school LM Studio host (`10.118.0.111`) or a classmate’s laptop. The hosted app therefore uses **cloud chat models through Vercel AI Gateway**. Local `pnpm dev` without a Gateway key still uses LM Studio.

### Project settings

1. Import this GitHub repository in [Vercel](https://vercel.com).
2. Set **Root Directory** to `chatbot` (the Next.js app is not at the repo root).
3. Framework: **Next.js** (Vercel should detect this from `chatbot/`).

### Environment variables

Set these in the Vercel project (do **not** commit real values):

| Variable | Required | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | Yes | Random 32+ character secret. Generate at https://generate-secret.vercel.app/32 |
| `POSTGRES_URL` | Yes | Neon (or Vercel Postgres) connection string |
| `SERPER_API_KEY` | Yes for live search | Free key from https://serper.dev |
| AI Gateway auth | Yes for chat | On Vercel this is **OIDC** — you do not paste a key. Optional `AI_GATEWAY_API_KEY` is only for non-Vercel hosts. |

You do **not** need `LMSTUDIO_*` on Vercel. Leave `AI_GATEWAY_API_KEY` unset on Vercel unless you are debugging off-platform.

A Vercel account **credit card may still be required** to unlock AI Gateway free credits, even though OIDC is automatic. If chat returns an “activate AI Gateway / add a credit card” error, add a card at the [Vercel AI Gateway](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card) billing prompt.

After deploy, open the `*.vercel.app` URL, sign in (guest / Auth.js), pick a cloud model, and chat. The status dot should be **green** for AI Gateway (it will not probe LM Studio).

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

`.env.example` documents Neon, Auth.js, LM Studio, Serper, and optional AI Gateway variables. **Do not commit `.env.local`.** Do not paste real passwords, connection strings, or API keys into Slack, email, or this README.

If you already have a teammate’s working `.env.local`, copy that file locally instead of inventing values.

For **local LM Studio**, leave `AI_GATEWAY_API_KEY` empty. A real Gateway key (or running on Vercel) switches the app to cloud models.

### Live web search (Serper)

The chatbot can look up **latest news**, a **stock price**, **weather** (Open-Meteo, or Serper when you ask in natural language), and general **website / Google-style search**.

1. Create a free account at [https://serper.dev](https://serper.dev) and copy the API key from the dashboard.
2. In `chatbot/.env.local` (or the Vercel env UI), set:

```bash
SERPER_API_KEY=paste_your_key_here
```

3. Restart `pnpm dev` (or `npx.cmd --yes pnpm@10.32.1 dev`) so Next.js picks up the new env var.

If the key is missing, chat still works; the search tools return a plain-English error telling you to set `SERPER_API_KEY`. They do not crash the app.

Try these prompts after sign-in:

- `What's the latest news about NVIDIA?`
- `AAPL stock price`
- `weather in Dunedin`
- `what's on https://www.otago.ac.nz`

Search results include titles, snippets, and links. The model should call tools instead of inventing live facts.

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

- **Green (local)** — the app can reach LM Studio (`GET /api/lmstudio` succeeded). You can send messages.
- **Green (Vercel)** — AI Gateway is the active backend. The hosted site does **not** probe the school LM Studio IP.
- **Red** — the local model is not reachable. Chat will fail until you fix the URL, campus network, or local LM Studio. This should not stay red on the public Vercel URL.

The GitHub website cannot talk to `10.118.0.111`. Local LM Studio use requires `pnpm dev` (or the `npx.cmd` equivalent) **on a machine that is on campus Wi‑Fi** (or on a machine that can reach that IP). The Vercel URL does not have that restriction.

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
9. **Live search** — ask for NVIDIA news, `AAPL stock price`, or weather in Dunedin. You should see a search/news tool card with titles, snippets, and links (or a message to set `SERPER_API_KEY` if the key is missing).

---

## Speech (mic + speak-back)

- Works on **`http://localhost`** or **HTTPS** (including the Vercel URL). A random LAN IP over plain HTTP often blocks the microphone.
- Use **Chrome** or **Edge**. Allow the microphone when the browser asks.
- The mic is dictation only; you still click send.

---

## Optional: database migrate

If the UI loads but cloud chats error on first save, from `chatbot/` run:

```bash
npx.cmd --yes pnpm@10.32.1 db:migrate
```

(or `pnpm db:migrate` if Corepack/pnpm already works). You still need a valid `POSTGRES_URL` in `.env.local` — take it from `.env.example` or your teammate, **not** from this README. Vercel production builds already run `db:migrate` via `pnpm build`.

---

## Project layout

| Path | What it is |
| --- | --- |
| [`README.md`](./README.md) | **This file** — classmate / teammate setup + Vercel deploy + feature guide |
| [`chatbot/`](./chatbot/) | Next.js app (run commands here; set this as the Vercel Root Directory) |
| [`chatbot/README.md`](./chatbot/README.md) | Upstream Vercel template notes (not the getting-started guide) |
| [`chatbot/.env.example`](./chatbot/.env.example) | Env variable names and placeholders — copy to `.env.local` |

---

## Extra (not required for class)

Some teammates expose a home LM Studio with a Cloudflare named tunnel (`trycloudflare.com`). That is optional. For school labs, prefer `10.118.0.111` on campus Wi‑Fi. For a URL that works off campus, use the Vercel deploy above.
