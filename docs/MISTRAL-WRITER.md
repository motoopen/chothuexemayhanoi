# Mistral Writer — Motoopen 300

This is a **single-writer, event-driven** factory. Mistral writes drafts; GitHub Actions validates and publishes them.

## Canonical loop

1. Fetch fresh `main`.
2. Run:
   ```
   python3 scripts/article_factory.py status
   python3 scripts/article_factory.py next --limit 6
   ```
3. If `next` reports existing incoming drafts, **repair those first**. Do not take new rows.
4. For every returned row, write exactly one file:
   ```
   _factory/incoming/NNN.md
   ```
   using:
   ```yaml
   ---
   matrix_id: N
   description: "Unique 60–180 character meta description."
   ---
   ```
   Then write the Markdown body. **Do not add H1**; the site layout supplies H1.
5. Follow the row's `unique_angle`, `must_cover`, `internal_links_to`, `validation_required`, and taxonomy.
6. Use at least one internal link in this form:
   ```
   [Anchor]({{ '/path.html' | relative_url }})
   ```
7. For legal/licence/manufacturer-policy rows, add a `## Nguồn` section with current source URLs.
8. Run scoped local QA before push:
   ```
   python3 scripts/article_factory.py check _factory/incoming/*.md
   ```
9. Commit/push **2–10 incoming drafts** to `main`. Do not write directly into `_posts/`. Do not edit Matrix status manually.
10. Wait for **Article Factory Lite**. Then fetch fresh `main` and read `_factory/last-run.json`.
11. If `recoverable` is non-empty, fix only those incoming files and push again.
12. If clean, run `next --limit 6` and continue immediately.

## Stop conditions

Continue until all 300 matrix rows are published, the session/tool limit ends, or a genuine system-level blocker occurs.

Minor content/QA errors: fix silently and continue.
Major workflow/repository errors: stop and report the exact error; do not modify factory scripts, workflows, UI, taxonomy, or Matrix structure.

## Lightweight QA contract

The hot loop intentionally stays light:
- >= 650 useful Vietnamese words
- >= 2 H2 sections
- no H1 in body
- meta description 60–180 chars
- no placeholder/foreign-script corruption
- no duplicate body
- at least one Jekyll internal link
- legal/manufacturer topics need a source section

Full SEO/site audit is **not** run after every queue. ChatGPT audits/fixes the site separately.
