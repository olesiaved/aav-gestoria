#!/usr/bin/env python3
"""
Static site builder for AAV Gestoría.

Renders templates/*.html (Jinja2) against content/es.json + content/ru.json
into plain static HTML files at the paths listed in PAGES below. The
published site is 100% static output — this script is only a local
authoring convenience, not a runtime dependency.

Usage:
    python3 build.py
"""
import json
import posixpath
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = Path(__file__).parent
TEMPLATES_DIR = ROOT / "templates"
CONTENT_DIR = ROOT / "content"

# key -> {"template": ..., "es": <root-relative output path>, "ru": <root-relative output path>}
PAGES = {
    "home":             {"template": "home.html",     "es": "index.html",                    "ru": "ru/index.html"},
    "services":         {"template": "services.html",  "es": "servicios-y-tarifas.html",       "ru": "ru/uslugi-i-tarify.html"},
    "about":            {"template": "about.html",     "es": "sobre-mi.html",                  "ru": "ru/o-nas.html"},
    "contact":          {"template": "contact.html",   "es": "contacto.html",                  "ru": "ru/kontakty.html"},
    "legal_aviso":      {"template": "legal.html",     "es": "aviso-legal.html",               "ru": "ru/yuridicheskaya-informacion.html"},
    "legal_privacidad": {"template": "legal.html",     "es": "politica-de-privacidad.html",    "ru": "ru/politika-konfidencialnosti.html"},
    "legal_cookies":    {"template": "legal.html",     "es": "politica-de-cookies.html",       "ru": "ru/politika-cookie.html"},
}

# Nav bar order (subset of PAGES keys)
NAV_ORDER = ["home", "services", "about", "contact"]

SITE_BASE = "https://aavgestoria.es/"


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def abs_url(root_path):
    """Root-relative output path -> absolute canonical URL."""
    if root_path == "index.html":
        return SITE_BASE
    if root_path == "ru/index.html":
        return SITE_BASE + "ru/"
    return SITE_BASE + root_path


def make_url_for(current_root_path):
    def url_for(key, lang=None):
        target_lang = lang or current_lang_of(current_root_path)
        target_root_path = PAGES[key][target_lang]
        cur_dir = posixpath.dirname(current_root_path) or "."
        return posixpath.relpath(target_root_path, cur_dir)
    return url_for


def make_asset(current_root_path):
    def asset(rel_path):
        cur_dir = posixpath.dirname(current_root_path) or "."
        return posixpath.relpath(rel_path, cur_dir)
    return asset


def current_lang_of(root_path):
    return "ru" if root_path.startswith("ru/") else "es"


def build():
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
    )

    shared = load_json(CONTENT_DIR / "shared.json")
    content_by_lang = {
        "es": load_json(CONTENT_DIR / "es.json"),
        "ru": load_json(CONTENT_DIR / "ru.json"),
    }

    written = []
    for page_key, cfg in PAGES.items():
        template = env.get_template(cfg["template"])
        for lang in ("es", "ru"):
            root_path = cfg[lang]
            content = content_by_lang[lang]
            page = content["pages"][page_key]

            html = template.render(
                lang=lang,
                page_key=page_key,
                nav_pages=NAV_ORDER,
                content=content,
                shared=shared,
                page=page,
                url_for=make_url_for(root_path),
                asset=make_asset(root_path),
                canonical_url=abs_url(root_path),
                hreflang_es=abs_url(cfg["es"]),
                hreflang_ru=abs_url(cfg["ru"]),
            )

            out_path = ROOT / root_path
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_text(html, encoding="utf-8")
            written.append(root_path)

    print(f"Built {len(written)} pages:")
    for p in written:
        print(" -", p)


if __name__ == "__main__":
    build()
