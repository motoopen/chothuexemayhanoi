# Article Factory Lite

Incoming drafts live here temporarily and are excluded from GitHub Pages.

- Writer: external Mistral session.
- Queue: 2–10 Markdown drafts per push; recommended 6.
- Publisher: `.github/workflows/article-factory.yml`.
- Source of truth: `_seo/article-matrix-300.json`.
- PASS drafts move to `_posts/` and their Matrix row becomes `published`.
- Failed drafts stay in `_factory/incoming/` and appear in `last-run.json` for repair.

Use `docs/MISTRAL-WRITER.md` as the writer contract.
