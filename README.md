# Messy Action — Terminal Archive & Field Notes

Searchable, illustrated archive of **"100 Days of Messy Action"** by [@gracebrodeur](https://www.instagram.com/gracebrodeur/).

Live: deployed on **Railway** (see `railway.json`). Auto-updates daily via the pipeline.

## What's here

- `index.html` — single-page mobile-first UI: swipeable episode cards, weekly field-note summaries,
  full transcripts, chapter markers, instant transcript search. Loads `database.json` + `infographics/manifest.json`
  at runtime, so new episodes appear automatically on every deploy.
- `database.json` — machine-readable archive: per-episode transcript, segments, curated key message, quote, tag.
- `infographics/` — AI-generated 9:16 field-note illustrations: one per episode + one weekly summary.
- `start.sh` / `railway.json` — Railway static-site config (RAILPACK, `python3 -m http.server`).
- `.gitignore` — keeps deploy artifacts out of version control.

## Data shape

```json
{
  "series": "...", "creator": "...", "url": "...",
  "episodes": [{
    "ep": 0, "date": "2026-08-06", "shortcode": "...",
    "title": "...", "duration_s": 84.3,
    "key_message": "...", "quote": "...", "tag": "procrastination",
    "transcript": "...", "segments": [{"t": "...", "text": "..."}]
  }]
}
```

## Regenerating site assets

The daily pipeline (`~/Downloads/MessyAction/daily_pipeline.sh`) handles:
watch → download → transcribe → rebuild `database.json` → generate infographics →
sync `database.json` + `infographics/` here. Just commit and push, or re-run `railway up`.
