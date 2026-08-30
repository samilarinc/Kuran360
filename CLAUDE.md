# QuranApp — Claude Instructions

## Localization

All user-facing text lives in `src/locales/tr.json` (source of truth) and `src/locales/en.json` (English translation) — loaded via `src/i18n.ts` (react-i18next). Don't hardcode UI strings in components; add a key to both locale files and read it with `t()`.

## Changelog Rule

After every non-trivial code change, add an entry to the changelog: `about.updates` in `src/locales/tr.json`, plus a translated English entry in the same array in `src/locales/en.json`.

- Find the most recent date block at the top of the `about.updates` array.
- If today's date matches that block's date, add a bullet to it (in both locale files).
- If today's date is different, create a new date block above it with today's date — Turkish format in `tr.json` (e.g. "29 Haziran 2026"), matching English format in `en.json` (e.g. "June 29, 2026").
- Keep each bullet short (one line), user-facing language — what the user sees or gains, not implementation details.
- Use common styles as much as possible. Inform user if you need to create a new style type. If this style may be used by other components in the future, suggest adding it as a common style.
