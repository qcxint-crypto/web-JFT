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

This website lives in the `website/` folder inside the full scraper project.

Recommended Vercel setup:

- If the GitHub repo keeps the `website/` folder, set `Root Directory` to `website`
- If this folder is published as the repository root, use the repository root directly

## Notes

- Quiz data is loaded from `output/all_questions.json`
- Static media is served through `/api/images/*` and `/api/audio/*`
- The backend scraper project is intentionally kept outside this deployable website package
