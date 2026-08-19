# AAV Gestoría

Source for the [AAV Gestoría](https://aavgestoria.es/) website — a small business site for a gestoría (administrative/tax advisory) in Spain, published in Spanish and Russian.

The published site is **100% static HTML**. Pages are generated locally from Jinja2 templates and JSON content files, then the generated HTML is committed and served as-is — there's no runtime dependency on Python or Jinja2 in production.

## Structure

```
build.py           Static site generator (reads templates/ + content/, writes HTML to repo root and ru/)
templates/          Jinja2 templates (base.html + one per page type)
content/
  shared.json       Content shared across languages (nav labels, footer, contact info, etc.)
  es.json           Spanish page content
  ru.json           Russian page content
css/                Stylesheet
js/                 Client-side script
img/                Site images (favicons, logo, founder photo)
assets/             Source assets (originals, PDFs) — assets/processed/ holds optimized/derived versions used by img/
files/               Downloadable files linked from the site (e.g. PDFs)
*.html, ru/*.html    Generated output — Spanish pages at the repo root, Russian pages under ru/
```

## Building the site

Generated HTML pages are checked into the repo, so you only need to run the builder after editing a template or content file.

```bash
pip install jinja2
python3 build.py
```

This renders every page listed in `PAGES` (in `build.py`) for both `es` and `ru`, writing output to the paths declared there (e.g. `index.html` / `ru/index.html`), and prints the list of files written.

## Editing content

- **Text/copy**: edit `content/es.json` and `content/ru.json` (and `content/shared.json` for strings common to both languages), then rebuild.
- **Layout/markup**: edit the relevant file in `templates/`, then rebuild.
- **Styling**: edit `css/style.css` directly (not generated).

After rebuilding, commit both the source changes (templates/content) and the regenerated HTML output.
