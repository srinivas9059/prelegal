# Prelegal frontend: Mutual NDA creator

Next.js app that lets a user fill in a form and see a completed Common Paper
Mutual NDA (cover page + standard terms) update live. The result can be
downloaded as Markdown or saved as PDF via the browser's print dialog.

## Run

```bash
cd frontend
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

## How it works

- `app/page.tsx` reads `../templates/Mutual-NDA-coverpage.md` and
  `../templates/Mutual-NDA.md` (the repo-root templates, CC BY 4.0).
- `lib/nda.ts` builds the document: it generates the cover page from the form
  values and fills the Standard Terms. Governing Law and Jurisdiction are
  substituted into the terms; other cover-page references stay as bold defined
  terms. User input is Markdown-escaped.
- `app/NdaCreator.tsx` is the form and live preview.
