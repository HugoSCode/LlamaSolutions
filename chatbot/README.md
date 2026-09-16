# Vercel AI Chatbot (template notes)

**LlamaSolutions classmates:** start at the **[repository README](../README.md)** for what this project is, how to run it on a school lab PC with LM Studio, and how to deploy `chatbot/` to Vercel for a public teacher URL. This folder is the Next.js app (`pnpm dev` / `npx.cmd --yes pnpm@10.32.1 dev` from here).

Do not treat this file as the project getting-started guide. Env vars, school vs home LM Studio URLs, and product features are documented only in the root README so the two files do not drift.

---

This directory is based on the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template (Next.js, NextAuth / Auth.js, Drizzle, Neon, shadcn/ui). Upstream template docs:

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Drizzle Documentation](https://orm.drizzle.team)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

Template-only scripts (from this folder): `pnpm dev`, `pnpm build`, `pnpm db:migrate`, `pnpm test`.

- **Local class use:** follow the root README LM Studio path (`pnpm dev` / `npx.cmd --yes pnpm@10.32.1 dev`).
- **Public teachers’ URL:** deploy this folder to Vercel (Root Directory `chatbot`, Framework Next.js) with `AUTH_SECRET`, `POSTGRES_URL`, `SERPER_API_KEY`, and AI Gateway OIDC. Details are in the root README.

