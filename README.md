# Smart Contact Parser

A Next.js app that turns unstructured contact text and images into structured records, then exports a CSV that matches the GoHighLevel import columns.

You bring an OpenAI API key. The parser at `/tool` calls OpenAI from the browser. Parsed contacts stay in memory for the page session. The API key and parsing rules are saved in the browser's `localStorage`.

## Features

- **Paste parsing.** Paste one contact, or turn on Batch Mode to extract every contact in a larger paste.
- **Images.** Attach photos of business cards, handwritten notes, or screenshots (up to 20 MB each). They are sent to the model as high-detail images.
- **File batch.** Drop a `.txt`, `.md`, `.csv`, or `.tsv` file. The tool splits the text into about 4,000, 8,000, or 12,000 characters (8,000 by default), preferring a blank line or newline near each boundary, then parses every chunk. You can pause, resume, or cancel. Word documents are not read directly; save them as plain text first.
- **Special instructions.** Optional notes for a single paste, or instructions applied to every file-batch chunk.
- **Parsing rules.** Persistent rules stored locally and included in every request. Settings can load a built-in set of recommended rules.
- **Confidence.** Each filled field can be marked high, medium, or low.
- **Opportunity fields.** The model can fill GoHighLevel opportunity name, pipeline, stage, value, status, and lost reason when the source text supports it.
- **Review and edit.** Edit or remove contacts before export. A token total for the session is shown on the results panel.
- **Find More.** After a Paste parse, re-scan that same input for contacts the first pass missed.
- **Find Missing Notes.** After a Paste parse, send the original text back and append notes that were left out. These two actions use the last Paste submission only. A File Batch run does not enable them.
- **GoHighLevel CSV.** Export uses the official import columns. Job title, address, and website are folded into the Notes cell. The file is UTF-8 with a BOM, named `contacts-export-YYYY-MM-DD.csv`.

## Tech stack

- [Next.js](https://nextjs.org/) 16.1 (App Router) and React 19
- TypeScript
- Tailwind CSS 4 and [shadcn/ui](https://ui.shadcn.com/) (New York style)
- React Compiler (`reactCompiler: true` in `next.config.ts`)
- OpenAI HTTP API via `fetch`: `gpt-5.1-codex-mini` on the Responses API, then `gpt-4o` on Chat Completions if that call fails
- No database

The `openai` npm package is listed in `package.json` and is not imported. Parsing uses `fetch` in `src/lib/parse-client.ts`.

## Run it

Next.js 16 needs Node.js 20.9 or newer. This repo uses npm (`package-lock.json`).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The parser is at [http://localhost:3000/tool](http://localhost:3000/tool). A static donate page is at `/donate.html`.

1. Open the **Settings** tab, paste an OpenAI API key, and save it.
2. On **Paste**, add text and/or images, optionally add special instructions, and click **Parse with AI**. Or use **File Batch** for a text file.
3. Review and edit the contacts, then **Export CSV**.

Other scripts:

```bash
npm run lint
npm run build
npm start
```

## CSV columns

Export headers, in order:

| Column | What is written |
| --- | --- |
| Contact ID | Always blank |
| Phone | Primary phone |
| Email | Email |
| First Name | First name |
| Last Name | Last name |
| Business Name | Company |
| Opportunity ID | Always blank |
| Opportunity name | Inferred opportunity label |
| Pipeline | Inferred pipeline |
| Stage | Inferred stage |
| Opportunity Value | Inferred amount |
| Source | Lead source |
| Opportunity Owner | Always blank |
| Opportunity Followers | Always blank |
| Status | `open`, `won`, `lost`, or `abandoned` when inferred |
| Lost Reason | Filled when status is lost or abandoned |
| Additional Email | Secondary email |
| Additional Phone | Secondary phone |
| Notes | See below |
| Tags | Comma-separated tags |

GoHighLevel import accepts one notes cell per contact. Notes are joined with ` | `. A dated note is prefixed like `[2026-01-15] `. Before the free-form notes, the exporter adds `Job Title: …`, `Address: …` (street, city, state, and zip), and `Website: …` when those fields are set, because they have no columns of their own.

## Privacy

On the tool page, the API key and contact text or images go from the browser straight to `https://api.openai.com`. They are not written to a database by this app.

Stored in `localStorage`:

- `scp_openai_key` — the API key
- `scp_preferences` — parsing rules

Parsed contacts are React state. Reloading `/tool` clears them.

`src/app/api/parse/route.ts` is still in the repo. The UI does not call it. If something posted to it, that route would forward the API key and input to OpenAI `gpt-4o` through the Next.js server. It does not read the key from an environment variable and it does not save the request.

No server environment variables are required to run the app.

## Deployment

Production build:

```bash
npm run build
npm start
```

`netlify.toml` sets the build command to `npm run build` and adds `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` headers. There is no `vercel.json`. Any host that runs a Next.js 16 app can serve it.

## Status

Version **0.1.0** in `package.json`. `"private": true` means this package is not published to npm.

The landing page (`/`), parser (`/tool`), and donate page are implemented as described above. There is no test suite. The UI is dark only (`<html class="dark">`).

## License

[MIT](LICENSE). Copyright 2025–2026 Matthew Walker (AI Alchemist).
