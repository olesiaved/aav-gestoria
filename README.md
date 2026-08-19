# AAV Gestoría

Site source for AAV Gestoría — Spanish pages plus a Russian version under `ru/`.

## Structure

- `templates/` — Jinja2 templates
- `content/` — page content (JSON)
- `build.py` — renders templates + content into the static HTML pages at the repo root
- `css/`, `js/`, `img/`, `files/` — static assets

## Build

```bash
python build.py
```
