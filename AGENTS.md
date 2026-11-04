# Research blog editorial workflow

This is an Astro static site. Jekyll source and tooling have been removed. Do not push generated files over a source branch.

- Korean posts: `content/ko/posts/YYYY-MM-DD-slug.md`.
- Published English posts: `content/en/posts/`.
- Prepare translations with `pnpm content prepare <slug>`, then write the English draft to `.review/<slug>/translation.md` using the instructions in `prompt.md`.
- Preserve technical meaning, fenced code, equations, citations, image paths, and links. Translate titles and subtitles. Flag uncertainties separately.
- Do not run `approve` or update review hashes unless the user explicitly confirms they have reviewed that translation and asks to approve it. Generating a draft is not approval.
- Existing `legacy` translations are archived versions, not newly approved content. Do not silently upgrade their review status.
- CV source: `src/data/cv.json`. Update both languages together; do not invent employment, degree completion, dates, or publications. Set `lastReviewed` and revise `copy.*.cvArchiveNote` in the site JSON only when the user confirms the CV is current.
- CV sections use a `type` and an `items` array of structured entry objects. Keep translations within each entry’s text fields (`school: {ko, en}`); dates, years and URLs are shared. Do not reintroduce a Markdown `body`. Dates use `YYYY.MM`, and `to: null` preserves an open end in the archived record.
- All site copy, navigation, resource paths, profile and GA4 ID: `src/data/site.json`. Article bodies and CV entries have their own content files. Keep analytics inactive when no real measurement ID is supplied. Do not add comments.
- Custom resources belong under `public/resources/`. Refer to files as `/resources/...` in Markdown and site JSON; omit `public` from URLs. Leave `resources.profileImage` empty to hide the photo. Preserve old article Markdown; the renderer maps archived `/assets/` image paths to `/resources/` without changing approval hashes.
- Run `pnpm test` and `pnpm build` after behavior changes. Build excludes pending and stale English translations while keeping Korean originals public.
