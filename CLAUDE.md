# QuranApp — Claude Instructions

## Changelog Rule

After every non-trivial code change, add an entry to the changelog in `src/screens/AboutScreen.tsx`.

- Find the most recent date block at the top of the changelog list.
- If today's date matches that block's date, add a bullet to it.
- If today's date is different, create a new date block above it with today's date in Turkish format (e.g. "29 Haziran 2026").
- Keep each bullet short (one line), user-facing language in Turkish — what the user sees or gains, not implementation details.
