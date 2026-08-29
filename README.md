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

## Hosting on AWS (SST)

The site is deployed to AWS via [SST](https://sst.dev) (`sst.config.ts`), which
provisions S3 + CloudFront + an ACM certificate and points them at
`aavgestoria.es`. `infra/build-static.sh` rebuilds the HTML and assembles just
the deployable files (`*.html`, `ru/`, `css/`, `js/`, `img/`, `files/`) into
`dist/`, which is what actually gets uploaded — source-only files
(`templates/`, `content/`, `build.py`) never reach S3.

### One-time setup

1. **AWS account**: install the AWS CLI and configure credentials for an IAM
   user/role with permissions to manage S3, CloudFront, ACM, Route 53, and
   IAM (`aws configure`, or an SSO profile).
2. **DNS**: this project expects the domain's DNS to be hosted on Route 53.
   In the Route 53 console, create a public hosted zone for `aavgestoria.es`,
   then update the domain's nameservers at your registrar (Namecheap,
   GoDaddy, etc.) to the 4 NS records Route 53 gives you. DNS propagation can
   take a few hours; SST/ACM cert validation will wait for it automatically
   on first deploy.
3. **Install deploy tooling**:
   ```bash
   npm install
   ```

### Deploying

```bash
npx sst deploy --stage production
```

This builds the site, uploads it to S3, and updates CloudFront + DNS. The
custom domain (`aavgestoria.es` and `www.aavgestoria.es`) is only attached on
the `production` stage — running `npx sst dev` (no stage flag) spins up a
throwaway preview stage on a `*.sst.dev`-style URL for testing, without
touching the real domain.

To tear down a stage's AWS resources: `npx sst remove --stage <stage>`
(the `production` stage is protected against accidental removal).
