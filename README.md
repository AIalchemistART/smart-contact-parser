# Smart Contact Parser

AI-powered tool to extract structured contacts from unstructured text, business cards, and handwritten notes. Exports to GoHighLevel-compatible CSV.

## Features

- **AI Smart Paste** - Paste messy text, get structured contacts
- **Vision Support** - Upload photos of business cards or handwritten notes
- **Batch Mode** - Process multi-page Word documents in chunks
- **Special Instructions** - Per-parse instructions for edge cases
- **Parsing Rules** - Persistent rules that train the AI on your preferences
- **Confidence Scores** - See how certain the AI is about each field
- **GHL-Ready CSV** - Export matches GoHighLevel import format with proper notes handling
- **BYOK** - Bring your own OpenAI API key (stored locally, never sent to servers)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Go to the **Settings** tab and enter your OpenAI API key
2. Paste contact text or upload an image
3. Click **Parse with AI**
4. Review, edit, and export to CSV

## Recommended Workflow (Large Documents)

If you have a large Word document (hundreds or thousands of pages):

1. **Start with ~10 pages** - Paste a small sample and review the AI output
2. **Dial in your rules** - Add parsing rules and special instructions until output is ~90% accurate
3. **Batch process** - Paste 10-20 pages per batch, contacts accumulate in the results panel
4. **Export once** - When done, export a single CSV for GoHighLevel import

## CSV Format

The exported CSV uses GoHighLevel-compatible columns:

| Column | Description |
|--------|-------------|
| First Name | Contact first name |
| Last Name | Contact last name |
| Email | Email address |
| Phone | Primary phone |
| Mobile | Mobile phone |
| Company | Company name |
| Job Title | Job title / role |
| Address | Street address |
| City | City |
| State | State |
| Zip | Zip/postal code |
| Website | Website URL |
| Source | Lead source |
| Tags | Comma-separated tags |
| Notes | Pipe-separated notes with optional date prefixes |

## Tech Stack

- Next.js 16 + TypeScript
- Tailwind CSS + shadcn/ui
- OpenAI GPT-4o (text + vision)
- No database - all state is client-side (localStorage for settings)

## Deployment

Deploy to Vercel, Netlify, or any platform that supports Next.js:

```bash
npm run build
```

No environment variables required on the server - the OpenAI API key is provided by the user in-browser.

## Privacy

- Your OpenAI API key is stored in your browser's localStorage only
- Contact data is processed client-side and via direct OpenAI API calls
- Nothing is stored on the server
