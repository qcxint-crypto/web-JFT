# QCXINT JFT + Kanji Lab

Interactive JFT and Kanji study web app built with Next.js.

## Included

- Randomized JFT session flow:
  - `Moji Goi`
  - `Kaiwa / Hyougen`
  - `Choukai`
  - `Dokkai`
- Enhanced Kanji quiz with full answer feedback
- Local image and audio serving through Next.js API routes
- Data stored inside:
  - `output/`
  - `images/`
  - `audio/`

## Local Development

```bash
npm install
npm run dev
```

## Production Deploy

This directory is designed to be published directly to GitHub and deployed by Vercel.

If this project is deployed from the repository root, make sure the repository contains this folder's contents at the root level.

## Notes

- Quiz data is loaded from `output/all_questions.json`
- Static media is served through `/api/images/*` and `/api/audio/*`
- The backend scraper project is intentionally kept outside this deployable website package
